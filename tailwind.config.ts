import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // OpenLoop palette — calm, modern, works in light & dark.
        ink: {
          DEFAULT: "#0f172a",
          soft: "#1e293b",
        },
        loop: {
          50: "#eef6ff",
          100: "#d9eaff",
          200: "#bcd9ff",
          300: "#8ec1ff",
          400: "#599dff",
          500: "#3478f6",
          600: "#205ce0",
          700: "#1a49b5",
          800: "#1b3f8f",
          900: "#1c3872",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        fab: "0 10px 25px -5px rgba(52, 120, 246, 0.5)",
        card: "0 1px 2px rgba(15,23,42,0.06), 0 4px 12px rgba(15,23,42,0.04)",
      },
      keyframes: {
        "slide-up": {
          "0%": { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.18s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
