"use client";

import { motion } from "framer-motion";

/**
 * Smooth fade between routes. Opacity-only on purpose — a transform here would
 * create a containing block and break the sticky site header.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="flex min-h-full flex-1 flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
