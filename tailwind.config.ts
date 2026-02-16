import type { Config } from "tailwindcss";

const config = {
  // Tailwind disabled - using custom CSS instead
  darkMode: false,
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        primary: "#13ec80",
        "primary-dark": "#0eb561",
        "background-light": "#F5F5F3",
        "background-dark": "#102219",
        "surface-light": "#ffffff",
        "surface-dark": "#1a3326",
        "ai-accent": "#8b5cf6",
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
        "2xl": "2rem",
        full: "9999px",
      },
      boxShadow: {
        soft: "0 2px 10px rgba(0, 0, 0, 0.03)",
        hover: "0 10px 30px rgba(0, 0, 0, 0.08)",
        "inner-border": "inset 0 0 0 1px rgba(0,0,0,0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
