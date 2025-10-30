/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // HSL-Variablen kommen aus styles/global.scss (siehe Schritt 2)
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "hsl(var(--primary) / 0.05)",
          100: "hsl(var(--primary) / 0.10)",
          200: "hsl(var(--primary) / 0.20)",
          300: "hsl(var(--primary) / 0.30)",
          400: "hsl(var(--primary) / 0.40)",
          500: "hsl(var(--primary) / 0.50)",
          600: "hsl(var(--primary) / 0.60)",
          700: "hsl(var(--primary) / 0.70)",
          800: "hsl(var(--primary) / 0.80)",
          900: "hsl(var(--primary) / 0.90)"
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))"
      }
    }
  },
  plugins: []
};
