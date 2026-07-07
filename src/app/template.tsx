"use client";

import { motion } from "framer-motion";

/**
 * template.tsx — Transição de página (App Router remonta o template a cada
 * navegação). Fade + leve deslize, no espírito de virada de página de mangá.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
