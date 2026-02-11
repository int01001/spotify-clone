import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#1DB954",
          dark: "#121212",
          muted: "#181818",
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', "Inter", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        "glow-green": "0 10px 40px rgba(29,185,84,0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
