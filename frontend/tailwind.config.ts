import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        primary: "#c9a326",
        "background-light": "#f8f7f6",
        "background-dark": "#0a0a0b",
        "navy-deep": "#0f172a",
        surface: "#1a1a1a",
        "surface-accent": "#262626",
        muted: "hsl(var(--muted))",
        destructive: "hsl(var(--destructive))",
        border: "hsl(var(--border))",
      },
      fontFamily: {
        "display": ["Space Grotesk", "sans-serif"],
        "mono": ["JetBrains Mono", "monospace"]
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
export default config;
