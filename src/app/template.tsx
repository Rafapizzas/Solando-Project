"use client";

import { motion } from "framer-motion";

/**
 * template.tsx — Transição de página (App Router remonta o template a cada
 * navegação). Fade + leve deslize, no espírito de virada de página de mangá.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
