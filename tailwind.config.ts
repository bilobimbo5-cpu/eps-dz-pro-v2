import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-tajawal)", "Tajawal", "system-ui", "sans-serif"],
      },
      colors: {
        primary: {
          50: "#eefbf3",
          100: "#d6f5e1",
          200: "#afeac8",
          300: "#7bd9a9",
          400: "#45c086",
          500: "#22a56a",
          600: "#158455",
          700: "#126947",
          800: "#12543a",
          900: "#104631",
          950: "#07271b",
        },
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
