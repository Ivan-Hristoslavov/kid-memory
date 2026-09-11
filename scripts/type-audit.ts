/**
 * Two checks this site has already been burned by once each. Both are cheap,
 * both are easy to forget, and both are invisible until a customer sees them.
 *
 * Run: node node_modules/.bin/tsx --tsconfig scripts/tsconfig.json \
 *        scripts/type-audit.ts
 *
 * ── 1. THE BGR TEST ───────────────────────────────────────────────────────
 * Bulgarian Cyrillic is not Russian Cyrillic. д, и, к, л, п, т, ц, ш and щ are
 * drawn differently, and a font delivers the Bulgarian shapes through a `locl`
 * feature under the BGR language system of the `cyrl` script. The browser asks
 * for it because <html lang="bg"> is set; the print renderer has to be told.
 *
 * A font with no `cyrl` script, or with `cyrl` but no BGR, still renders
 * Bulgarian text — in Russian letterforms. Nothing errors. It simply reads as
 * foreign to a Bulgarian, the way a Cyrillic-looking Latin font reads as fake
 * to everyone else. Playfair Display was the site's headline face for months
 * before anyone ran this check.
 *
 * So: every new face gets tested before it ships, and the test is three lines
 * of table lookup rather than a squint at a screenshot.
 *
 * ── 2. THE CONTRAST CHECK ─────────────────────────────────────────────────
 * Every colour in globals.css is oklch, which nothing eyeballs correctly. The
 * numbers below are computed, not judged: OKLCh → OKLab → linear sRGB →
 * WCAG relative luminance → ratio. The conversion was checked against Chrome's
 * own engine on the live site; where they differ, Chrome is right and this is
 * broken.
 */
import fs from "fs";
import path from "path";
import opentype from "opentype.js";

/* ─────────────────────────── THE BGR TEST ─────────────────────────────── */

interface FontVerdict {
  file: string;
  hasCyrillicGlyphs: boolean;
  hasCyrlScript: boolean;
  hasBgrLangSys: boolean;
  /** BGR is declared AND reaches a `locl` lookup — the whole point of it. */
  bgrRunsLocl: boolean;
}

/** A Bulgarian-shaped sample: every letter that differs from the Russian. */
const BG_DISTINCT = "дикłлптцшщ".replace("ł", "");

function testFont(file: string): FontVerdict {
  const buf = fs.readFileSync(file);
  const font = opentype.parse(
    buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
  );

  const hasCyrillicGlyphs = [...BG_DISTINCT].every(
    (ch) => font.charToGlyphIndex(ch) > 0
  );

  const gsub = font.tables.gsub as
    | {
        scripts?: {
          tag: string;
          script: {
            langSysRecords?: { tag: string; langSys: { featureIndexes: number[] } }[];
          };
        }[];
        features?: { tag: string }[];
      }
    | undefined;

  const cyrl = gsub?.scripts?.find((s) => s.tag === "cyrl");
  // The tag is four bytes, so "BGR" is padded — matching on "BGR" alone would
  // silently miss it.
  const bgr = cyrl?.script.langSysRecords?.find((r) => r.tag === "BGR ");
  const bgrRunsLocl =
    !!bgr &&
    bgr.langSys.featureIndexes.some((i) => gsub?.features?.[i]?.tag === "locl");

  return {
    file: path.basename(file),
    hasCyrillicGlyphs,
    hasCyrlScript: !!cyrl,
    hasBgrLangSys: !!bgr,
    bgrRunsLocl,
  };
}

/* ────────────────────────── THE CONTRAST CHECK ────────────────────────── */

type RGB = [number, number, number];

/** OKLCh → linear sRGB, then clipped the way a display clips it. */
function oklchToLinearRGB(L: number, C: number, Hdeg: number): RGB {
  const h = (Hdeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  const lin: RGB = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];

  // An oklch value can land outside sRGB. The screen shows the clipped colour,
  // so the ratio has to be computed on the clipped colour too — clamping the
  // linear value before encoding would give a number nobody can actually see.
  return lin.map((v) => srgbToLinear(clamp01(linearToSrgb(v)))) as RGB;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const linearToSrgb = (v: number) =>
  v <= 0.0031308 ? 12.92 * v : 1.055 * Math.sign(v) * Math.abs(v) ** (1 / 2.4) - 0.055;
const srgbToLinear = (v: number) =>
  v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;

function relativeLuminance([r, g, b]: RGB): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(fg: RGB, bg: RGB): number {
  const a = relativeLuminance(fg);
  const b = relativeLuminance(bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

function toHex(lin: RGB): string {
  return (
    "#" +
    lin
      .map((v) =>
        Math.round(clamp01(linearToSrgb(v)) * 255)
          .toString(16)
          .padStart(2, "0")
      )
      .join("")
  );
}

/**
 * Pulls `--name: oklch(L C H);` out of globals.css, once per block.
 *
 * `:root` and `.dark` declare the same names with different values, so the two
 * blocks are read separately — reading the file as one map would give whichever
 * came last and quietly audit only one theme.
 */
function readTokens(css: string, selector: string): Map<string, RGB> {
  const start = css.indexOf(selector + " {");
  if (start < 0) throw new Error(`no ${selector} block in globals.css`);
  const end = css.indexOf("\n}", start);
  // The fixed grounds live in `@theme inline` rather than in :root, because
  // they deliberately have no dark variant. Reading only the theme block would
  // miss them and print "token missing" for exactly the colours that were
  // added to survive a theme swap.
  const themeEnd = css.indexOf("\n}", css.indexOf("@theme inline {"));
  const block =
    css.slice(css.indexOf("@theme inline {"), themeEnd) + css.slice(start, end);

  const direct = new Map<string, RGB>();
  const alias = new Map<string, string>();
  const re = /--([a-z0-9-]+):\s*(oklch\(([^)]+)\)|var\(--([a-z0-9-]+)\))\s*;/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block))) {
    if (m[4]) {
      alias.set(m[1], m[4]);
      continue;
    }
    const [L, C, H] = m[3].trim().split(/[\s/]+/).map(Number);
    // @theme names a colour --color-ground-dark; :root names it --forest. The
    // prefix is dropped so PAIRS can be written in one vocabulary.
    direct.set(m[1].replace(/^color-/, ""), oklchToLinearRGB(L, C || 0, H || 0));
  }
  // One level of var() indirection is all globals.css uses (--background:
  // var(--ivory)); resolving it here keeps the pairs below readable.
  for (const [name, target] of alias) {
    const v = direct.get(target);
    if (v) direct.set(name, v);
  }
  return direct;
}

/** The pairs that actually carry reading copy, in both themes. */
const PAIRS: [string, string, "text" | "large"][] = [
  ["foreground", "background", "text"],
  ["muted-foreground", "background", "text"],
  ["muted-foreground", "card", "text"],
  ["muted-foreground", "sand", "text"],
  ["muted-foreground", "muted", "text"],
  ["foreground", "sand", "text"],
  ["primary-foreground", "primary", "text"],
  ["secondary-foreground", "secondary", "text"],
  ["accent-foreground", "accent", "text"],
  ["ground-paper", "ground-dark", "text"],
  ["ground-paper", "ground-clay", "text"],
];

/**
 * Combinations that measured below AA and have been removed from the source.
 *
 * These cannot be audited as pairs, because a pair nothing uses would fail the
 * run forever. They are checked the only way that means anything: by looking
 * for the class names again.
 *
 * `bg-forest text-ivory` is the interesting one. Both tokens invert, but in
 * opposite directions — forest LIGHTENS to 0.72 in dark mode while ivory stays
 * near-white — so it reads 13.7:1 in light and 2.16:1 in dark, and nobody who
 * only ever looked at the light theme would see anything wrong. Controls moved
 * to primary/primary-foreground, which swap correctly; brand surfaces and the
 * scrims over photographs moved to the ground tokens, which do not move at all.
 *
 * `bg-clay text-ivory` failed at 3.12:1 and 2.29:1 — below AA in BOTH themes,
 * which is why swapping the theme never revealed it either.
 */
const FORBIDDEN: { classes: [string, string]; use: string }[] = [
  {
    classes: ["bg-forest", "text-ivory"],
    use: "bg-primary/text-primary-foreground for controls, bg-ground-dark/text-ground-paper for brand surfaces",
  },
  {
    classes: ["bg-clay", "text-ivory"],
    use: "bg-ground-clay/text-ground-paper",
  },
];

/** Walks src/ for a forbidden pair appearing on the same element. */
function auditForbidden(): boolean {
  const hits: string[] = [];
  const walk = (dir: string): void => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.tsx?$/.test(e.name)) continue;
      const text = fs.readFileSync(full, "utf8");
      for (const f of FORBIDDEN) {
        // Same className string, not merely the same file — a page may well
        // use bg-forest in one place and text-ivory somewhere unrelated.
        for (const attr of text.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
          const cls = attr[1] ?? attr[2] ?? "";
          if (
            new RegExp(`\\b${f.classes[0]}\\b`).test(cls) &&
            new RegExp(`\\b${f.classes[1]}\\b`).test(cls)
          ) {
            hits.push(
              `    ✗  ${path.relative(process.cwd(), full)} — ` +
                `${f.classes.join(" + ")}; use ${f.use}`
            );
          }
        }
      }
    }
  };
  walk(path.join(process.cwd(), "src"));
  if (hits.length === 0) {
    console.log(
      `    ✓  none of ${FORBIDDEN.length} retired combinations is back in src/`
    );
    return true;
  }
  console.log(hits.join("\n"));
  return false;
}

function auditTheme(tokens: Map<string, RGB>, label: string): boolean {
  let ok = true;
  console.log(`\n  ${label}`);
  for (const [fgName, bgName, size] of PAIRS) {
    const fg = tokens.get(fgName);
    const bg = tokens.get(bgName);
    if (!fg || !bg) {
      console.log(`    ?  ${fgName} on ${bgName} — token missing`);
      continue;
    }
    const ratio = contrast(fg, bg);
    const need = size === "large" ? 3 : 4.5;
    const pass = ratio >= need;
    if (!pass) ok = false;
    console.log(
      `    ${pass ? "✓" : "✗"}  ${ratio.toFixed(2)}:1  (AA needs ${need})  ` +
        `${fgName} ${toHex(fg)} on ${bgName} ${toHex(bg)}`
    );
  }
  return ok;
}

/* ─────────────────────────────── RUN ──────────────────────────────────── */

function main(): void {
  let failed = false;

  const dir = path.join(process.cwd(), "assets", "fonts");
  const files = process.argv.slice(2).length
    ? process.argv.slice(2)
    : fs
        .readdirSync(dir)
        .filter((f) => /\.(ttf|otf)$/i.test(f))
        .map((f) => path.join(dir, f));

  console.log("BGR test — Bulgarian localised letterforms");
  for (const file of files) {
    const v = testFont(file);
    if (!v.hasCyrillicGlyphs) {
      console.log(`  –  ${v.file} — no Cyrillic, not applicable`);
      continue;
    }
    if (v.bgrRunsLocl) {
      console.log(`  ✓  ${v.file} — cyrl/BGR runs locl`);
      continue;
    }
    failed = true;
    const why = !v.hasCyrlScript
      ? "no cyrl script in GSUB"
      : !v.hasBgrLangSys
        ? "cyrl present, no BGR language system"
        : "BGR present but reaches no locl feature";
    console.log(`  ✗  ${v.file} — ${why}; Bulgarian renders as Russian`);
  }

  console.log("\nContrast — WCAG 2.1 AA on the tokens in globals.css");
  const css = fs.readFileSync(
    path.join(process.cwd(), "src", "app", "globals.css"),
    "utf8"
  );
  if (!auditTheme(readTokens(css, ":root"), "light")) failed = true;
  if (!auditTheme(readTokens(css, ".dark"), "dark")) failed = true;

  console.log("\n  retired combinations");
  if (!auditForbidden()) failed = true;

  console.log("");
  process.exit(failed ? 1 : 0);
}

main();
