"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useProfiles } from "@/lib/profiles";
import { ProfilePicker } from "./ProfilePicker";

/**
 * ProfileGate — overlay estilo "Netflix": quando há login mas nenhum perfil
 * ativo, cobre a tela para o usuário escolher (ou criar) um perfil.
 * Não bloqueia visitantes deslogados nem quem já escolheu um perfil.
 */
export function ProfileGate() {
  const { ready: authReady, isAuthenticated } = useAuth();
  const { ready, activeProfile } = useProfiles();

  const show = authReady && ready && isAuthenticated && !activeProfile;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-void-950/95 backdrop-blur-md"
        >
          <div className="w-full max-w-3xl px-6 py-12 text-center">
            <h1 className="mb-2 font-display text-3xl font-black title-gradient">
              Quem vai jogar?
            </h1>
            <p className="mb-8 text-zinc-400">
              Escolha um perfil para esta sessão. Você pode trocar quando quiser.
            </p>
            <ProfilePicker />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
