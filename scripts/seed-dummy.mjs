/**
 * Seeds dummy orders (with poster images) so the admin dashboard can be
 * reviewed with realistic data. Idempotent: re-running replaces prior seed
 * rows (marked by photoKey="seed"). Run: node --env-file=.env scripts/seed-dummy.mjs
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";

const prisma = new PrismaClient({
  adapter: (() => {
    const raw = process.env.DATABASE_URL ?? "";
    const isSupabase = raw.includes("supabase.com");
    const connectionString = isSupabase
      ? raw.replace(/([?&])sslmode=[^&]*/g, "$1").replace(/[?&]$/, "")
      : raw;
    return new PrismaPg({
      connectionString,
      ...(isSupabase ? { ssl: { rejectUnauthorized: false } } : {}),
    });
  })(),
});

const STORAGE = path.join(process.cwd(), ".storage");

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Build a colourful placeholder poster (gradient + title + child + bubbles). */
function posterSvg(name, words, colors) {
  const bubbles = words
    .slice(0, 3)
    .map((w, i) => {
      const y = 470 + i * 150;
      const left = i % 2 === 0;
      const x = left ? 70 : 640;
      const tint = ["#ffffff", "#fff3ec", "#eaf5ff"][i % 3];
      return `<g>
        <rect x="${x}" y="${y}" rx="34" width="330" height="86" fill="${tint}" stroke="#e8dcd2" stroke-width="2"/>
        <text x="${x + 165}" y="${y + 54}" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="34" fill="#5b4a68">„${esc(w.saidAs)}“</text>
      </g>`;
    })
    .join("");

  return `<svg width="1024" height="1536" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${colors.a}"/><stop offset="100%" stop-color="${colors.b}"/>
      </linearGradient>
    </defs>
    <rect width="1024" height="1536" fill="url(#bg)"/>
    <text x="512" y="150" text-anchor="middle" font-family="Georgia, serif" font-weight="800" font-size="66" fill="#4a3b5c">Най-сладките бисери</text>
    <text x="512" y="230" text-anchor="middle" font-family="Georgia, serif" font-weight="800" font-size="60" fill="#c0607a">на ${esc(name)}</text>
    <ellipse cx="512" cy="1240" rx="230" ry="40" fill="#000" opacity="0.06"/>
    <circle cx="512" cy="1000" r="230" fill="${colors.skin}"/>
    <path d="M300 950 q-10 -150 212 -160 q222 10 212 160 q-30 -80 -90 -95 q10 26 4 48 q-40 -56 -126 -56 q-86 0 -126 56 q-6 -22 4 -48 q-60 15 -90 95" fill="${colors.hair}"/>
    <circle cx="450" cy="1000" r="22" fill="#3a2f4a"/><circle cx="574" cy="1000" r="22" fill="#3a2f4a"/>
    <circle cx="420" cy="1055" r="26" fill="${colors.cheek}" opacity="0.6"/><circle cx="604" cy="1055" r="26" fill="${colors.cheek}" opacity="0.6"/>
    <path d="M466 1070 q46 44 92 0" stroke="#8a4a52" stroke-width="12" stroke-linecap="round" fill="none"/>
    ${bubbles}
  </svg>`;
}

async function writePoster(orderId, name, words, colors) {
  const dir = path.join(STORAGE, "orders", orderId);
  await fs.mkdir(dir, { recursive: true });
  const final = await sharp(Buffer.from(posterSvg(name, words, colors))).png().toBuffer();
  await fs.writeFile(path.join(dir, "final.png"), final);

  // watermarked, downscaled preview
  const w = 640;
  const resized = await sharp(final).resize({ width: w }).toBuffer();
  const meta = await sharp(resized).metadata();
  const marks = [];
  for (let y = 60; y < meta.height; y += 170)
    for (let x = -40; x < w; x += 240)
      marks.push(
        `<text x="${x}" y="${y}" font-family="Arial" font-weight="700" font-size="30" fill="#fff" opacity="0.35" transform="rotate(-24 ${x} ${y})">PREVIEW</text>`
      );
  const wm = Buffer.from(`<svg width="${w}" height="${meta.height}" xmlns="http://www.w3.org/2000/svg">${marks.join("")}</svg>`);
  const preview = await sharp(resized).composite([{ input: wm }]).jpeg({ quality: 62 }).toBuffer();
  await fs.writeFile(path.join(dir, "preview.jpg"), preview);

  return {
    finalImage: `orders/${orderId}/final.png`,
    previewImage: `orders/${orderId}/preview.jpg`,
  };
}

const PALETTES = [
  { a: "#ffd6c9", b: "#ffe9b8", skin: "#f4d0a8", hair: "#6b4a2f", cheek: "#f0a0a0" },
  { a: "#bde3ff", b: "#c9f0e0", skin: "#f2c9a0", hair: "#3a2f26", cheek: "#eaa0a0" },
  { a: "#e0d0ff", b: "#d0e8ff", skin: "#e8c098", hair: "#2a2420", cheek: "#e6a0a8" },
  { a: "#ffe0ec", b: "#ffe9c9", skin: "#f4d4b0", hair: "#8a5a34", cheek: "#f2a0a0" },
];

const DUMMIES = [
  { name: "Мила", age: 4, gender: "GIRL", status: "PREVIEW_READY", product: null, words: [{ word: "прахосмукачка", saidAs: "прахумосмачка" }, { word: "вода", saidAs: "аляяяя" }, { word: "паун", saidAs: "апум" }], animals: ["dog", "cat"], style: "fantasy", customer: null },
  { name: "Борис", age: 3, gender: "BOY", status: "CONFIRMED", product: "POSTER_A3", words: [{ word: "паун", saidAs: "апум" }, { word: "немога", saidAs: "гамогаа" }], animals: ["fish", "turtle"], style: "storybook", customer: { customerName: "Ивана Петрова", phone: "0888123456", email: "ivana@example.com", city: "София", courier: "ECONT", deliveryMethod: "OFFICE", courierOffice: "офис Младост 1" } },
  { name: "Ема", age: 5, gender: "GIRL", status: "SHIPPED", product: "PREMIUM", words: [{ word: "откопча", saidAs: "опокоп" }, { word: "косатка", saidAs: "акуку" }], animals: ["rabbit", "bird", "bee"], style: "watercolor", customer: { customerName: "Георги Димитров", phone: "0899765432", email: "georgi@example.com", city: "Пловдив", courier: "SPEEDY", deliveryMethod: "ADDRESS", address: "ул. Гладстон 12, ет.3", trackingNumber: "SP20260724001" } },
  { name: "Виктор", age: 2, gender: "BOY", status: "DELIVERED", product: "POSTER_A4", words: [{ word: "трактор", saidAs: "такту" }], animals: ["dog"], style: "cartoon3d", customer: { customerName: "Мария Колева", phone: "0877111222", email: "maria@example.com", city: "Варна", courier: "ECONT", deliveryMethod: "LOCKER", courierOffice: "Еконтомат Чайка", trackingNumber: "EC1055200334" } },
  { name: "София", age: 6, gender: "GIRL", status: "GENERATING", product: null, words: [{ word: "хеликоптер", saidAs: "хекикоптел" }], animals: ["panda", "owl"], style: "fantasy", customer: null, noImage: true },
  { name: "Никола", age: 3, gender: "BOY", status: "CONFIRMED", product: "DIGITAL", words: [{ word: "спагети", saidAs: "пагети" }, { word: "закуска", saidAs: "закука" }], animals: ["hamster", "snail"], style: "storybook", customer: { customerName: "Петър Стоянов", phone: "0898555666", email: "petar@example.com", city: "Бургас", courier: "ECONT", deliveryMethod: "OFFICE", courierOffice: "офис Център" } },
  { name: "Ния", age: 4, gender: "GIRL", status: "PRINTING", product: "POSTER_A3", words: [{ word: "балон", saidAs: "баон" }, { word: "мляко", saidAs: "мяко" }], animals: ["squirrel", "cat"], style: "watercolor", customer: { customerName: "Елена Тодорова", phone: "0889777888", email: "elena@example.com", city: "Русе", courier: "SPEEDY", deliveryMethod: "LOCKER", courierOffice: "APT Русе Мол" } },
];

async function main() {
  // remove prior seed rows (and stray image folders left behind)
  await prisma.order.deleteMany({ where: { photoKey: "seed" } });

  const PRICES = { DIGITAL: 14.9, POSTER_A4: 24.9, POSTER_A3: 34.9, PREMIUM: 49.9 };

  for (let i = 0; i < DUMMIES.length; i++) {
    const d = DUMMIES[i];
    const order = await prisma.order.create({
      data: {
        status: d.status,
        childName: d.name,
        childAge: d.age,
        childGender: d.gender,
        photoKey: "seed",
        words: d.words,
        animals: d.animals,
        style: d.style,
        productType: d.product ?? null,
        priceEUR: d.product ? PRICES[d.product] : null,
        paymentMethod: "COD",
        ...(d.customer ?? {}),
      },
    });

    if (!d.noImage) {
      const keys = await writePoster(order.id, d.name, d.words, PALETTES[i % PALETTES.length]);
      await prisma.order.update({ where: { id: order.id }, data: keys });
    }
    console.log(`seeded #${order.orderNumber} ${d.name} (${d.status})`);
  }

  await prisma.$disconnect();
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
