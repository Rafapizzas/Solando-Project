"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Compendium } from "./Compendium";

/**
 * Botão flutuante que abre o Manual em um painel lateral, para consulta durante
 * a criação da ficha sem sair da página.
 */
export function ManualDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-ghost fixed bottom-6 right-6 z-40 shadow-glow"
        title="Consultar o manual"
      >
        📖 Manual
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="fixed right-0 top-0 z-50 h-full w-full max-w-4xl overflow-y-auto border-l border-white/10 bg-void-950 p-5 shadow-2xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold title-gradient">
                  Manual
                </h2>
                <button className="btn-ghost !px-3" onClick={() => setOpen(false)}>
                  ✕
                </button>
              </div>
              <Compendium />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
