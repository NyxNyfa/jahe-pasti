import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ginger: {
          50: "#fdf8f6",
          100: "#f2e8e5",
          200: "#eaddd7",
          500: "#c2410c", // Red-orange deep ginger
          600: "#9a3412",
          700: "#7c2d12",
          800: "#602511",
          900: "#431b0e",
        },
      },
    },
  },
  plugins: [],
};

export default config;
