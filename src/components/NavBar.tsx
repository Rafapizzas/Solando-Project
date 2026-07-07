"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useProfiles } from "@/lib/profiles";
import { AccountMenu } from "@/components/AccountMenu";

const baseLinks = [
  { href: "/", label: "Início" },
  { href: "/ficha", label: "Fichas" },
  { href: "/mesa", label: "Mesas" },
  { href: "/manual", label: "Manual" },
  { href: "/arquimago", label: "Arquimago" },
  { href: "/comunidade", label: "Comunidade" },
  { href: "/feedback", label: "Mural" },
  { href: "/guia", label: "Guia" },
  { href: "/criar", label: "Forjar" },
];

export function NavBar() {
  const pathname = usePathname();
  const { isAuthenticated, ready } = useAuth();
  const { canMaster } = useProfiles();

  const links = [...baseLinks];
  // "Minhas Mesas" só para perfis com acesso de Mestre.
  if (isAuthenticated && canMaster)
    links.splice(3, 0, { href: "/mestre", label: "Minhas Mesas" });

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-void-950/70 backdrop-blur-md">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-mente-deep via-mente to-sol text-lg font-black text-white shadow-glow animate-pulseGlow">
            ✦
          </span>
          <span className="font-display text-xl font-bold tracking-widest title-gradient">
            SOLANDO
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <ul className="hidden items-center gap-1 sm:flex">
            {links.map((link) => {
              const active =
                link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`relative block rounded-lg px-3 py-2 text-sm font-medium transition ${
                      active ? "text-white" : "text-zinc-400 hover:text-zinc-100"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="navActive"
                        className="absolute inset-0 rounded-lg bg-white/10 shadow-[0_0_18px_-4px_rgba(168,85,247,0.7)] ring-1 ring-mente/40"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                    <span className="relative z-10">{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {ready && isAuthenticated ? (
            <AccountMenu />
          ) : (
            <Link href="/entrar" className="btn-primary ml-1 !px-3 !py-1.5 text-xs">
              Entrar
            </Link>
          )}
        </div>
      </nav>

      {/* Navegação mobile */}
      <ul className="flex items-center gap-1 overflow-x-auto px-4 pb-2 sm:hidden">
        {links.map((link) => {
          const active =
            link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`relative block whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  active ? "text-white" : "text-zinc-400"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="navActiveMobile"
                    className="absolute inset-0 rounded-lg bg-white/10 ring-1 ring-mente/40"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </header>
  );
}
