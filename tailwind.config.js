/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#050505",
        accent: "#00A3FF",
        "accent-dim": "#0077CC",
        "glass-border": "rgba(0, 163, 255, 0.2)",
        "glass-bg": "rgba(10, 18, 30, 0.7)",
        "slate-900": "#0A0F1A",
        "slate-800": "#0D1520",
        "slate-700": "#162030",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Geist Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        glass: "0 4px 32px 0 rgba(0, 163, 255, 0.08)",
        "glass-hover": "0 4px 40px 0 rgba(0, 163, 255, 0.18)",
        "accent-glow": "0 0 20px rgba(0, 163, 255, 0.4)",
      },
      backdropBlur: {
        glass: "12px",
      },
      animation: {
        "scan-line": "scanLine 4s linear infinite",
        "pulse-accent": "pulseAccent 2s ease-in-out infinite",
        "terminal-cursor": "terminalCursor 1s step-end infinite",
        "grid-fade": "gridFade 3s ease-in-out infinite alternate",
      },
      keyframes: {
        scanLine: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        pulseAccent: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        terminalCursor: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        gridFade: {
          "0%": { opacity: "0.3" },
          "100%": { opacity: "0.6" },
        },
      },
    },
  },
  plugins: [],
};

