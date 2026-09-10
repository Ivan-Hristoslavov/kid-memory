"use server";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { readCharacter, sheetForPrompt } from "@/lib/ai/character";
import { generateStory } from "@/lib/ai/story";
import { adventureById, styleById } from "@/lib/books/catalog";
import { bookInputSchema } from "@/lib/validations";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { consume, dayKey, ipHash } from "@/lib/rate-limit-db";
import { isTestMode } from "@/lib/config";
import { getSettings } from "@/lib/settings";
import { headers } from "next/headers";

export interface CreateBookState {
  error?: string;
  bookId?: string;
}

/**
 * Creates a book and writes its story.
 *
 * Only the TEXT is generated here. It takes about twenty seconds and fits
 * inside a request; the twenty-odd illustrations do not, and they are the
 * expensive half. Splitting them means a parent sees the actual story — the
 * thing most worth rejecting — before anything is drawn, and a story they
 * dislike can be rewritten for pennies instead of pounds.
 *
 * Character sheets are read from the photographs first, because the story
 * prompt spends them: knowing a child has curly dark hair changes what the
 * writer can say about her.
 */
export async function createBook(
  _prev: CreateBookState,
  formData: FormData
): Promise<CreateBookState> {
  const hdrs = await headers();
  const ip = clientIp({ headers: hdrs } as unknown as Request);

  if (!isTestMode()) {
    if (!rateLimit(`book:${ip}`, { limit: 4, windowMs: 60 * 60 * 1000 }).ok) {
      return { error: "Достигна лимита за създаване. Опитай отново след час." };
    }
    // A book costs real money to write and far more to illustrate, so the
    // durable per-visitor cap is tighter than the poster's.
    const perIp = await consume(
      `book:${ipHash(ip)}:${dayKey()}`,
      Number(process.env.BOOK_DAILY_LIMIT_PER_IP || 3),
      24 * 60 * 60 * 1000
    );
    if (!perIp.ok) {
      return {
        error:
          "Достигна дневния лимит за нови приказки. Пиши ни, ако ти трябва още — правим го с удоволствие.",
      };
    }
  }

  const settings = await getSettings();
  if (settings.shopPaused) return { error: settings.shopPausedMessage };

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("book") ?? "{}"));
  } catch {
    return { error: "Данните не можаха да бъдат прочетени. Опитай пак." };
  }

  const parsed = bookInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Провери въведеното." };
  }
  const input = parsed.data;

  if (!adventureById(input.adventure) || !styleById(input.style)) {
    return { error: "Избраното приключение или стил вече не е налично." };
  }

  // Read every face before writing a word. Best-effort per child: a sheet that
  // could not be produced weakens that child's illustrations but must not stop
  // the book — see readCharacter, which never throws.
  const sheets = await Promise.all(
    input.characters.map(async (c) => {
      if (!c.photoKey) return null;
      try {
        return await readCharacter(await storage().get(c.photoKey));
      } catch {
        return null;
      }
    })
  );

  let story;
  try {
    story = await generateStory({
      characters: input.characters.map((c, i) => ({
        name: c.name,
        age: c.age ?? null,
        gender: c.gender ?? null,
        description: c.description ?? null,
        interests: c.interests ?? null,
        favouriteToy: c.favouriteToy ?? null,
        favouriteAnimal: c.favouriteAnimal ?? null,
        appearance: sheetForPrompt(sheets[i]) || null,
      })),
      relationships: input.relationships ?? null,
      adventure: input.adventure,
      customIdea: input.customIdea ?? null,
      ageGroup: input.ageGroup,
      mood: input.mood,
      mustInclude: input.mustInclude,
      dedication: input.dedication ?? null,
    });
  } catch (err) {
    console.error("Story generation failed:", err);
    return {
      error:
        "Историята не се написа. Опитай отново след малко — нищо не е таксувано.",
    };
  }

  const book = await prisma.book.create({
    data: {
      status: "GENERATING",
      adventure: input.adventure,
      customIdea: input.customIdea || null,
      ageGroup: input.ageGroup,
      mood: input.mood,
      mustInclude: input.mustInclude,
      artStyle: input.style,
      relationships: input.relationships || null,
      dedication: input.dedication || null,
      leadEmail: input.leadEmail || null,
      title: story.title,
      subtitle: story.subtitle || null,
      // The raw story is kept so it can be re-split or audited without paying
      // for a second generation.
      story: story as unknown as Prisma.InputJsonValue,
      characters: {
        create: input.characters.map((c, i) => ({
          ordinal: i,
          name: c.name,
          age: c.age ?? null,
          gender: c.gender ?? null,
          description: c.description || null,
          interests: c.interests || null,
          favouriteToy: c.favouriteToy || null,
          favouriteAnimal: c.favouriteAnimal || null,
          photoKey: c.photoKey || null,
          referenceSheet: (sheets[i] ?? undefined) as Prisma.InputJsonValue | undefined,
        })),
      },
      pages: {
        create: [
          { pageNumber: 1, kind: "COVER" as const, imagePrompt: coverPrompt(story.title, input) },
          ...(input.dedication
            ? [{ pageNumber: 2, kind: "DEDICATION" as const, text: input.dedication }]
            : []),
          ...story.pages.map((p, i) => ({
            // Cover, and dedication when present, come before the story.
            pageNumber: i + (input.dedication ? 3 : 2),
            kind: "STORY" as const,
            text: p.text,
            imagePrompt: p.imagePrompt,
          })),
        ],
      },
    },
    select: { id: true },
  });

  return { bookId: book.id };
}

/** The cover has no page text of its own, so its scene is derived. */
function coverPrompt(
  title: string,
  input: { characters: { name: string }[]; adventure: string }
): string {
  const who = input.characters.map((c) => c.name).join(" and ");
  return `Cover illustration for a children's picture book titled "${title}": ${who} together, front and centre, in the world of the story, looking towards the viewer. Leave the upper third calm — the title is set by the app afterwards.`;
}
