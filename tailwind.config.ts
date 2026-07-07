import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base sombria do universo Solando
        void: {
          950: "#07060d",
          900: "#0c0a17",
          800: "#141026",
          700: "#1e1838",
          600: "#2a2150",
        },
        // Espectro MENTE (magia) - roxo/violeta
        mente: {
          DEFAULT: "#a855f7",
          soft: "#c4a3ff",
          deep: "#6d28d9",
        },
        // Espectro CORPO (fisico) - ambar/vermelho
        corpo: {
          DEFAULT: "#f59e0b",
          soft: "#fbbf24",
          deep: "#c2410c",
        },
        // Espectro ALMA - ciano/verde
        alma: {
          DEFAULT: "#22d3ee",
          soft: "#67e8f9",
          deep: "#0e7490",
        },
        // Entropia dourada (assinatura Solando / sol)
        sol: {
          DEFAULT: "#facc15",
          soft: "#fde68a",
          deep: "#a16207",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 24px -4px rgba(168,85,247,0.6)",
        "glow-sol": "0 0 30px -2px rgba(250,204,21,0.55)",
      },
      keyframes: {
        floaty: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        pulseGlow: {
          "0%,100%": { opacity: "1", filter: "brightness(1)" },
          "50%": { opacity: "0.85", filter: "brightness(1.25)" },
        },
        sparkle: {
          "0%,100%": { opacity: "0.2", transform: "scale(0.8)" },
          "50%": { opacity: "1", transform: "scale(1.2)" },
        },
        wiggle: {
          "0%,100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        breathe: {
          "0%,100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.04)" },
        },
        borderFlow: {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        glowRing: {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(168,85,247,0.0)" },
          "50%": { boxShadow: "0 0 22px -2px rgba(168,85,247,0.55)" },
        },
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite",
        shimmer: "shimmer 6s linear infinite",
        pulseGlow: "pulseGlow 3s ease-in-out infinite",
        sparkle: "sparkle 2.4s ease-in-out infinite",
        wiggle: "wiggle 2.5s ease-in-out infinite",
        breathe: "breathe 4s ease-in-out infinite",
        borderFlow: "borderFlow 5s ease-in-out infinite",
        glowRing: "glowRing 3.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
