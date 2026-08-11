import { NextResponse } from "next/server";
import crypto from "crypto";
import sharp from "sharp";
import heicConvert from "heic-convert";
import { storage } from "@/lib/storage";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { consume, dayKey, ipHash } from "@/lib/rate-limit-db";
import {
  ALLOWED_PHOTO_TYPES,
  BLUR_THRESHOLD,
  MAX_PHOTO_BYTES,
  MIN_PHOTO_SIDE,
} from "@/lib/validations";
import { isTestMode } from "@/lib/config";
import { describePhoto, sidecarKey, type PhotoBlocker } from "@/lib/ai/describe-photo";

export const runtime = "nodejs";
// The vision pre-pass adds a round trip to an upload that used to be pure
// image processing. It is capped at 15s inside `describePhoto`, so this only
// has to cover a slow upload plus that call.
export const maxDuration = 60;

/**
 * Why a photo was refused, in the customer's language.
 *
 * Ordered by how decisive the failure is: told about a missing face, nobody
 * needs to also hear the photo was blurry.
 */
const BLOCKER_MESSAGES: Record<PhotoBlocker, string> = {
  NO_FACE:
    "Не открихме лице на снимката. Качи снимка, на която лицето се вижда ясно — то е основата на целия постер.",
  FACE_OBSCURED:
    "Лицето е закрито — от очила, ръка, маска или силна сянка. Трябва ни открито лице, за да уловим приликата.",
  SEVERE_BLUR:
    "Снимката е твърде размазана, за да се различат чертите. Избери по-рязка и приликата ще е много по-добра.",
};

const BLOCKER_ORDER: PhotoBlocker[] = ["NO_FACE", "FACE_OBSCURED", "SEVERE_BLUR"];

/** HEIC/HEIF detection via the ISO-BMFF "ftyp" brand — browsers often send
 *  an empty MIME type for iPhone photos, so the extension alone is not enough. */
function isHeic(buf: Buffer, fileName: string, mimeType: string): boolean {
  if (mimeType === "image/heic" || mimeType === "image/heif") return true;
  if (/\.(heic|heif)$/i.test(fileName)) return true;
  if (buf.length < 12) return false;
  const brand = buf.subarray(8, 12).toString("ascii");
  return (
    buf.subarray(4, 8).toString("ascii") === "ftyp" &&
    ["heic", "heix", "hevc", "heim", "heis", "hevm", "hevs", "mif1", "msf1"].includes(brand)
  );
}

function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // same-origin fetches may omit it
  const host = req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) {
    return NextResponse.json({ error: "Забранена заявка" }, { status: 403 });
  }

  const ip = clientIp(req);
  if (!isTestMode()) {
    if (!rateLimit(`upload:${ip}`, { limit: 20, windowMs: 60 * 60 * 1000 }).ok) {
      return NextResponse.json(
        { error: "Твърде много качвания. Опитай отново по-късно." },
        { status: 429 }
      );
    }
    // Uploads cost storage and bandwidth rather than AI credit, so the ceiling
    // is looser — but it still has to survive a page refresh.
    const perIp = await consume(
      `upload:${ipHash(ip)}:${dayKey()}`,
      Number(process.env.UPLOAD_DAILY_LIMIT_PER_IP || 40),
      24 * 60 * 60 * 1000
    );
    if (!perIp.ok) {
      return NextResponse.json(
        { error: "Твърде много качвания за днес. Опитай утре или ни пиши." },
        { status: 429 }
      );
    }
  }

  const form = await req.formData();
  const file = form.get("photo");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Липсва файл" }, { status: 400 });
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return NextResponse.json({ error: "Файлът е твърде голям (макс. 8 MB)" }, { status: 413 });
  }
  let raw = Buffer.from(await file.arrayBuffer());
  const heic = isHeic(raw, file.name, file.type);

  // Browsers often send HEIC with an empty MIME type — check content, not just type.
  if (file.type && !ALLOWED_PHOTO_TYPES.includes(file.type) && !heic) {
    return NextResponse.json(
      { error: "Позволени формати: JPG, PNG, WEBP, HEIC" },
      { status: 415 }
    );
  }

  // sharp's prebuilt binaries can't decode HEIC — convert iPhone photos first.
  if (heic) {
    try {
      const jpeg = await heicConvert({ buffer: raw, format: "JPEG", quality: 0.9 });
      raw = Buffer.from(jpeg);
    } catch {
      return NextResponse.json(
        { error: "HEIC файлът не можа да бъде прочетен. Опитай с JPG или PNG." },
        { status: 415 }
      );
    }
  }

  // Re-encode through sharp: verifies it is a real image and strips metadata (EXIF/GPS).
  let normalized: Buffer;
  let meta: Awaited<ReturnType<ReturnType<typeof sharp>["metadata"]>>;
  let stats: Awaited<ReturnType<ReturnType<typeof sharp>["stats"]>>;
  try {
    const pipeline = sharp(raw).rotate();
    meta = await pipeline.metadata();
    stats = await pipeline.stats();
    normalized = await pipeline
      .resize({ width: 1600, withoutEnlargement: true })
      .png()
      .toBuffer();
  } catch {
    return NextResponse.json({ error: "Файлът не е валидно изображение" }, { status: 415 });
  }

  // Input quality is the single biggest factor in whether the illustration
  // looks like the actual child. Catching it here costs nothing; catching it
  // after generation costs a paid AI run and a disappointed customer.
  const shortSide = Math.min(meta.width ?? 0, meta.height ?? 0);
  if (shortSide > 0 && shortSide < MIN_PHOTO_SIDE) {
    return NextResponse.json(
      {
        error: `Снимката е твърде малка (${meta.width}×${meta.height}). Трябва поне ${MIN_PHOTO_SIDE} пиксела по късата страна — избери оригинала, не смалено копие от чат.`,
      },
      { status: 422 }
    );
  }

  // Warnings never block: a parent may only have this one photo, and Mixtiles'
  // experience is that rejecting uploads costs far more than a soft nudge.
  const warnings: string[] = [];
  if (typeof stats.sharpness === "number" && stats.sharpness < BLUR_THRESHOLD) {
    warnings.push("Снимката изглежда леко размазана — ако имаш по-рязка, приликата ще е по-добра.");
  }
  const brightness =
    stats.channels.slice(0, 3).reduce((s, c) => s + c.mean, 0) / 3;
  if (brightness < 55) {
    warnings.push("Снимката е доста тъмна. По-светла снимка дава по-добър резултат.");
  } else if (brightness > 225) {
    warnings.push("Снимката е силно преекспонирана — детайлите по лицето може да се загубят.");
  }

  // Everything above measures pixels. This reads faces: it writes down what the
  // subjects actually look like, so the illustration prompt can name their
  // features instead of only pointing at the photo, and it refuses the handful
  // of photos no illustrator could work from. It never throws, and when it
  // cannot run the upload continues exactly as it did before.
  const description = await describePhoto(normalized);

  const blocker = BLOCKER_ORDER.find((b) => description.blockers.includes(b));
  if (blocker) {
    // Refused before the photo is stored: there is nothing to keep, and the
    // customer is about to pick a different file anyway.
    return NextResponse.json({ error: BLOCKER_MESSAGES[blocker] }, { status: 422 });
  }

  const key = `uploads/${crypto.randomUUID()}.png`;
  await storage().put(key, normalized, "image/png");

  // The description travels to generation as a sidecar object beside the photo,
  // never through the browser: it is model-written text that ends up inside our
  // image prompt, so a client-supplied version would be an injection route into
  // our own generation. Written best-effort — a failure here costs a slightly
  // weaker prompt later, not the upload.
  if (description.checked) {
    try {
      await storage().put(
        sidecarKey(key),
        Buffer.from(JSON.stringify(description), "utf8"),
        "application/json"
      );
    } catch (err) {
      console.error("Photo description sidecar failed:", err instanceof Error ? err.message : err);
    }
  }

  // Signed URL so the client can preview the normalized image (HEIC can't
  // be rendered from an object URL in most browsers).
  //
  // Long-lived on purpose. This link is held in the wizard for as long as the
  // customer takes to finish the form — naming everyone, writing the lines,
  // picking a style — and at 30 minutes it expired mid-order, leaving a broken
  // image above "Снимката е готова ✓". The key is an unguessable uuid and the
  // photo is deleted on the usual retention schedule, so outliving the form
  // costs nothing; expiring inside it costs the order.
  const previewUrl = await storage().signedUrl(key, 24 * 60 * 60);

  // `faces` lets the wizard notice "one face, two children named" while the
  // customer is still on the photo step. A count is safe to expose; the
  // description itself is not.
  return NextResponse.json({ key, previewUrl, warnings, faces: description.faces });
}
