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
        navy: {
          50: '#f0f4f9',
          100: '#dde6f2',
          200: '#c0d2e7',
          300: '#94b5d7',
          400: '#6293c3',
          500: '#3e75af',
          600: '#2f5d92',
          700: '#274b76',
          800: '#1d3452',
          900: '#0c1a2d',
          950: '#060d17',
        },
        academic: {
          blue: '#1e40af',
          accent: '#2563eb',
          gold: '#b45309',
          emerald: '#047857',
          crimson: '#991b1b',
        }
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
