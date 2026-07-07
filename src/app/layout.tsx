import type { Metadata } from "next";
import { Cinzel, Inter, Zen_Kurenaido } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { AuroraBackground } from "@/components/AuroraBackground";
import { DevSignature } from "@/components/DevSignature";
import { AuthProvider } from "@/lib/auth";

const display = Cinzel({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  variable: "--font-display",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

// Fonte estilo pincel/tinta japonesa (sumi-e) para a assinatura e toques manga.
const ink = Zen_Kurenaido({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-ink",
});

export const metadata: Metadata = {
  title: "Projeto Solando — RPG",
  description:
    "Sistema de RPG completo do universo Solando: fichas, mesas e rolagem de dados ao vivo.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${display.variable} ${body.variable} ${ink.variable}`}
    >
      <body>
        <AuthProvider>
          <AuroraBackground />
          <NavBar />
          <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6">
            {children}
          </main>
          <DevSignature />
        </AuthProvider>
      </body>
    </html>
  );
}
