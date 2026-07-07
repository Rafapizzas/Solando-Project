"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const baseLinks = [
  { href: "/", label: "Início" },
  { href: "/ficha", label: "Fichas" },
  { href: "/mesa", label: "Mesas" },
  { href: "/manual", label: "Manual" },
  { href: "/criar", label: "Forjar" },
];

export function NavBar() {
  const pathname = usePathname();
  const { profile, isAuthenticated, ready } = useAuth();

  const links = [...baseLinks];
  if (isAuthenticated) links.splice(3, 0, { href: "/mestre", label: "Minhas Mesas" });

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
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-white/10 text-white"
                        : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {ready && isAuthenticated && profile ? (
            <Link
              href="/entrar"
              className="ml-1 flex items-center gap-1.5 rounded-full border border-sol/40 bg-sol/10 px-3 py-1.5 text-xs font-semibold text-sol-soft transition hover:brightness-110"
              title="Perfil"
            >
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt="" className="h-5 w-5 rounded-full" />
              ) : (
                <span>🧙</span>
              )}
              <span className="max-w-[110px] truncate">{profile.displayName}</span>
            </Link>
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
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  active ? "bg-white/10 text-white" : "text-zinc-400"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </header>
  );
}
