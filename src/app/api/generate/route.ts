import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { aiProvider, joinNames } from "@/lib/ai/provider";
import { aiCostEUR } from "@/lib/ai/cost";
import { logAdminEvent } from "@/lib/admin-log";
import { sendOwnerAlertEmail } from "@/lib/email/send";
import { composeFinalPoster, composeProtectedPreview } from "@/lib/poster/compose";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { consume, dayKey, ipHash } from "@/lib/rate-limit-db";
import { posterInputSchema } from "@/lib/validations";
import { aiBakesText, isTestMode } from "@/lib/config";
import { getSettings } from "@/lib/settings";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Rejects cross-site browser calls. A missing Origin header is allowed because
 * same-origin fetches omit it — which also means this stops other websites, not
 * scripts. The rate limits below are what stop scripts.
 */
function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) {
    return NextResponse.json({ error: "Забранена заявка" }, { status: 403 });
  }

  const ip = clientIp(req);
  const settings = await getSettings();

  if (!isTestMode()) {
    const who = ipHash(ip);

    // Burst guard, in-memory: cheap and catches a hammering tab instantly.
    if (!rateLimit(`generate:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 }).ok) {
      return NextResponse.json(
        { error: "Достигна лимита за генериране. Опитай отново след час." },
        { status: 429 }
      );
    }

    // Durable per-visitor daily cap. This is the one that actually holds on
    // serverless — refreshing the page cannot reset it, because the counter
    // lives in the database rather than in one instance's memory. It also stops
    // a single abuser from eating the whole global quota and locking out real
    // customers.
    const perIp = await consume(
      `generate:${who}:${dayKey()}`,
      Number(process.env.AI_DAILY_LIMIT_PER_IP || 6),
      24 * 60 * 60 * 1000
    );
    if (!perIp.ok) {
      return NextResponse.json(
        {
          error:
            "Достигна дневния лимит за безплатни превюта. Пиши ни, ако ти трябва още — правим го с удоволствие.",
        },
        { status: 429 }
      );
    }
  }

  // Hard daily cap so a bug, a bot, or an over-eager tester can never drain
  // the AI budget. Counts real generations, and TEST_MODE does not bypass it.
  const dailyCap = settings.aiDailyLimit;
  if (dailyCap > 0) {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const today = await prisma.order.count({ where: { createdAt: { gte: since } } });

    // Warn the owner before the shop silently stops taking orders.
    if (today === Math.floor(dailyCap * 0.8)) {
      void sendOwnerAlertEmail({
        subject: "80% от дневния лимит за генериране",
        body: `Днес са направени ${today} от ${dailyCap} генерации. При достигане на лимита сайтът спира да приема нови превюта.`,
      });
    }

    if (today >= dailyCap) {
      void sendOwnerAlertEmail({
        subject: "Дневният лимит за генериране е достигнат",
        body: `Сайтът спря да приема нови превюта (${today}/${dailyCap}). Вдигни AI_DAILY_LIMIT или изчакай утре.`,
      });
      return NextResponse.json(
        { error: "Днешният лимит за генериране е достигнат. Опитай утре или ни пиши." },
        { status: 429 }
      );
    }
  }

  const body = await req.json().catch(() => null);
  const parsed = posterInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Невалидни данни" },
      { status: 400 }
    );
  }
  const input = parsed.data;

  // Combined display label + flattened words for legacy fields / overlay / emails.
  const combinedName = joinNames(input.children.map((c) => c.name));
  const flatWords = input.children.flatMap((c) => c.words);

  let photo: Buffer;
  try {
    photo = await storage().get(input.photoKey);
  } catch {
    return NextResponse.json({ error: "Снимката не е намерена. Качи я отново." }, { status: 400 });
  }

  let order;
  try {
    order = await prisma.order.create({
      data: {
        status: "GENERATING",
        childName: combinedName,
        childAge: input.children[0].age,
        childGender: input.children[0].gender,
        children: input.children,
        photoKey: input.photoKey,
        leadEmail: input.leadEmail || null,
        words: flatWords,
        animals: input.animals,
        style: input.style,
      },
    });
  } catch (err) {
    console.error("Order create failed:", err);
    return NextResponse.json(
      { error: "Проблем с базата данни. Провери връзката и опитай пак." },
      { status: 500 }
    );
  }

  try {
    const illustration = await aiProvider().generate({
      photo,
      children: input.children,
      animals: input.animals,
      style: input.style,
      quality: settings.aiQuality,
    });

    // gpt-image-1 bakes the text in → use its output as-is.
    // Gemini (Nano Banana) / mock return text-free art → app overlays the
    // Bulgarian title + speech bubbles so the wording is always correct.
    const finalPoster = aiBakesText()
      ? illustration
      : await composeFinalPoster(illustration, {
          childName: combinedName,
          words: flatWords,
        });

    const preview = await composeProtectedPreview(finalPoster);

    const finalKey = `orders/${order.id}/final.png`;
    const previewKey = `orders/${order.id}/preview.jpg`;
    await storage().put(finalKey, finalPoster, "image/png");
    await storage().put(previewKey, preview, "image/jpeg");

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "PREVIEW_READY",
        previewImage: previewKey,
        finalImage: finalKey,
        // Accumulates across regenerations, so the true cost of a fussy order
        // is visible rather than averaged away.
        aiRuns: { increment: 1 },
        aiCostEUR: { increment: aiCostEUR(settings.aiQuality) },
      },
    });

    const previewUrl = await storage().signedUrl(previewKey, 60 * 60);
    // Test mode: also hand back the full, un-watermarked render for inspection.
    const finalUrl = isTestMode() ? await storage().signedUrl(finalKey, 60 * 60) : undefined;
    return NextResponse.json({ orderId: order.id, previewUrl, finalUrl });
  } catch (err) {
    console.error("Generation failed:", err);
    await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });

    // A failure here means a real visitor just hit a dead end. Left in the
    // console it is invisible, so alert the owner and keep a record.
    const reason = err instanceof Error ? err.message : String(err);
    await logAdminEvent({
      orderId: order.id,
      action: "GENERATION_FAILED",
      detail: reason.slice(0, 500),
      actor: "system",
    });
    void sendOwnerAlertEmail({
      subject: `Неуспешно генериране — поръчка №${order.orderNumber}`,
      body: `Генерирането за ${combinedName} се провали.`,
      detail: reason.slice(0, 500),
    });

    // Distinguish "try again" from "this will keep failing until the owner
    // acts" — telling a customer to retry a billing failure is useless.
    const raw = err instanceof Error ? err.message : "";
    const isCredit = /billing_limit|insufficient_quota|billing hard limit|quota/i.test(raw);
    const isAuth = /invalid_api_key|401|unauthorized|not configured/i.test(raw);

    const error = isCredit
      ? "Услугата за рисуване е временно недостъпна. Пиши ни и ще създадем спомена ръчно — извинявай!"
      : isAuth
        ? "Услугата за рисуване не е настроена. Пиши ни и ще го решим веднага."
        : "Генерирането не успя. Опитай отново след малко.";

    return NextResponse.json(
      // In test mode the owner sees the real cause instead of guessing.
      { error, ...(isTestMode() ? { debug: raw.slice(0, 300) } : {}) },
      { status: 500 }
    );
  }
}
