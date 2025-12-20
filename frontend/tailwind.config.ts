import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      backgroundImage: {
        "personality-gradient":
          "radial-gradient(circle at 80% 20%, rgba(237, 51, 51, 0.3), transparent 70%)"
      },
      colors: {
        "brand-dark-primary": "#1A1D21",
        "brand-dark-secondary": "#24272B",
        "brand-dark-tertiary": "#303438",
        "brand-light-primary": "#FFFFFF",
        "brand-light-secondary": "#F7FAFC",
        "brand-light-tertiary": "#E2E8F0",
        "brand-green": "#1ED36A",
        "brand-dark-green": "#1A3A2C",
        "brand-red": "#C63232",
        "brand-text-primary": "#FFFFFF",
        "brand-text-secondary": "#A0AEC0",
        "brand-text-light-primary": "#2D3748",
        "brand-text-light-secondary": "#718096"
      },
      fontFamily: {
        sans: ["Haskoy", "Manrope", "sans-serif"]
      },
      animation: {
        "fade-in": "fade-in 0.8s ease-in-out forwards",
        blob: "blob 7s infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "ping-slow": "ping 3s cubic-bezier(0, 0, 0.2, 1) infinite",
        "progress-bar": "progress 5s linear forwards",
        "spin-slow": "spin 15s linear infinite",
        "spin-slow-reverse": "spin-reverse 15s linear infinite"
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0.5", transform: "scale(1.05)" },
          "100%": { opacity: "1", transform: "scale(1)" }
        },
        "progress": {
          "0%": { width: "0%" },
          "100%": { width: "100%" }
        },
        "spin-reverse": {
          "to": { transform: "rotate(-360deg)" }
        },
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)"
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)"
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)"
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)"
          }
        }
      }
    }
  },
  plugins: []
};

export default config;
