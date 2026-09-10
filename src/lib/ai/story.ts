import "server-only";
import { z } from "zod";
import { STORY_PAGE_COUNT } from "@/lib/books/catalog";
import { buildStoryPrompt, type StoryBrief } from "./book-prompt";

/**
 * Writes the book.
 *
 * A separate call from the illustrations on purpose: the text is cheap, fast
 * and the thing most worth regenerating on its own. A parent who dislikes the
 * story should not have to pay for twenty new pictures to get another one.
 *
 * The model is asked for JSON and the result is validated rather than trusted.
 * These models will occasionally return nineteen pages, or wrap the object in a
 * markdown fence, or number pages from zero — all of which are recoverable, and
 * all of which would corrupt the book silently if the response were simply
 * cast to a type.
 */

const storyPage = z.object({
  pageNumber: z.number().int().min(1),
  text: z.string().min(1).max(2000),
  imagePrompt: z.string().min(1).max(1200),
});

const storySchema = z.object({
  title: z.string().min(1).max(120),
  subtitle: z.string().max(160).default(""),
  pages: z.array(storyPage).min(1),
});

export type Story = z.infer<typeof storySchema>;
export type StoryPage = z.infer<typeof storyPage>;

/** Model used for the text. Overridable, so a cheaper one can be tried. */
const MODEL = () => process.env.BOOK_STORY_MODEL || "gpt-4.1";

/**
 * Strips a markdown fence if the model wrapped the JSON in one.
 *
 * Asking it not to works most of the time, which is precisely the problem —
 * the failure is rare enough to reach production and total when it happens.
 */
function unfence(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  return (fenced ? fenced[1] : raw).trim();
}

export class StoryGenerationError extends Error {}

export async function generateStory(brief: StoryBrief): Promise<Story> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new StoryGenerationError("OPENAI_API_KEY is not configured");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL(),
      // Asking for a JSON object as well as describing the shape in the prompt:
      // the mode guarantees parseable JSON, the prompt guarantees the right
      // keys, and neither alone is sufficient.
      response_format: { type: "json_object" },
      temperature: 0.9,
      messages: [
        {
          role: "system",
          content:
            "You are a Bulgarian children's author. You write warm, specific stories in flawless Bulgarian and you always answer with a single JSON object.",
        },
        { role: "user", content: buildStoryPrompt(brief) },
      ],
    }),
  });

  if (!res.ok) {
    throw new StoryGenerationError(
      `HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`
    );
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = json.choices?.[0]?.message?.content;
  if (!raw) throw new StoryGenerationError("empty response");

  let parsed: unknown;
  try {
    parsed = JSON.parse(unfence(raw));
  } catch {
    throw new StoryGenerationError("response was not valid JSON");
  }

  const result = storySchema.safeParse(parsed);
  if (!result.success) {
    throw new StoryGenerationError(
      `unexpected story shape: ${result.error.issues[0]?.message ?? "unknown"}`
    );
  }

  return normalise(result.data);
}

/**
 * Makes a validated story safe to store.
 *
 * Page numbers are re-derived from position rather than trusted: a model that
 * numbers 1,2,2,4 would otherwise collide on BookPage's [bookId, pageNumber]
 * unique index and fail the whole insert. Length is corrected too — a short
 * story is padded no further than reality allows, and a long one is cut, so the
 * printed page count always matches what the customer was sold.
 */
function normalise(story: Story): Story {
  const pages = story.pages
    .slice(0, STORY_PAGE_COUNT)
    .map((p, i) => ({ ...p, pageNumber: i + 1 }));

  return { ...story, pages };
}

/** True when the model returned fewer pages than the product promises. */
export function isShort(story: Story): boolean {
  return story.pages.length < STORY_PAGE_COUNT;
}
