"use client";

import { motion } from "framer-motion";

export interface ChildVariant {
  skin: string;
  hair: string;
  cheek: string;
  shirt: string;
  /** girls get a top bun + a little longer hair silhouette */
  girl?: boolean;
}

const DEFAULT: ChildVariant = {
  skin: "oklch(0.93 0.045 60)",
  hair: "oklch(0.45 0.07 60)",
  cheek: "oklch(0.85 0.08 20)",
  shirt: "oklch(0.78 0.09 230)",
};

/**
 * Illustrated hero child — a warm, story-book style character drawn in SVG so
 * it stays crisp and on-brand at any size. Accepts a `variant` so the showcase
 * can display several different-looking children.
 */
export function ChildIllustration({ variant }: { variant?: ChildVariant }) {
  const v = { ...DEFAULT, ...variant };
  return (
    <motion.svg
      viewBox="0 0 320 340"
      className="w-full max-w-sm drop-shadow-xl"
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, ease: "easeOut" }}
      role="img"
      aria-label="Илюстрация на щастливо дете"
    >
      <ellipse cx="160" cy="300" rx="130" ry="26" fill="oklch(0.91 0.05 300)" opacity="0.5" />
      {/* body */}
      <path
        d="M100 240 q60 -40 120 0 q10 40 -10 62 q-50 18 -100 0 q-20 -22 -10 -62"
        fill={v.shirt}
      />
      {/* longer hair behind head for girls */}
      {v.girl && (
        <path
          d="M80 150 q0 90 30 120 q-40 -10 -46 -70 q-6 -40 16 -50 M240 150 q0 90 -30 120 q40 -10 46 -70 q6 -40 -16 -50"
          fill={v.hair}
        />
      )}
      {/* head */}
      <circle cx="160" cy="150" r="78" fill={v.skin} />
      {/* hair */}
      <path
        d="M84 140 q-4 -70 76 -74 q80 4 76 74 q-8 -34 -34 -40 q6 10 2 20 q-14 -22 -44 -22 q-30 0 -44 22 q-4 -10 2 -20 q-26 6 -34 40"
        fill={v.hair}
      />
      {/* top bun for girls */}
      {v.girl && <circle cx="160" cy="74" r="16" fill={v.hair} />}
      {/* eyes */}
      <motion.g
        animate={{ scaleY: [1, 1, 0.08, 1, 1] }}
        transition={{ duration: 3.6, times: [0, 0.45, 0.5, 0.55, 1], repeat: Infinity }}
        style={{ transformOrigin: "160px 150px" }}
      >
        <circle cx="132" cy="150" r="9" fill="oklch(0.3 0.05 280)" />
        <circle cx="188" cy="150" r="9" fill="oklch(0.3 0.05 280)" />
        <circle cx="135" cy="147" r="3" fill="white" />
        <circle cx="191" cy="147" r="3" fill="white" />
      </motion.g>
      {/* cheeks */}
      <circle cx="118" cy="172" r="10" fill={v.cheek} opacity="0.7" />
      <circle cx="202" cy="172" r="10" fill={v.cheek} opacity="0.7" />
      {/* smile */}
      <path
        d="M138 184 q22 20 44 0"
        stroke="oklch(0.5 0.1 20)"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* arms hugging a star */}
      <motion.g
        animate={{ rotate: [-3, 3, -3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "160px 250px" }}
      >
        <path
          d="M104 252 q20 26 56 26 q36 0 56 -26"
          stroke={v.skin}
          strokeWidth="22"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M160 226 l9 18 20 3 -14 14 3 20 -18 -9 -18 9 3 -20 -14 -14 20 -3 z"
          fill="oklch(0.88 0.12 90)"
          stroke="oklch(0.75 0.12 85)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </motion.g>
    </motion.svg>
  );
}
