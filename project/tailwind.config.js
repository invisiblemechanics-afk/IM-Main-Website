/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Keep existing primary/secondary for compatibility
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        secondary: {
          50: '#faf7ff',
          100: '#f3ebff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },
        // New premium tokens
        bg: "#FAFAFC",
        surface: "#FFFFFF",
        border: "#E9ECF2",
        text: {
          DEFAULT: "#0E1116",
          muted: "#5B6372",
        },
        accent: {
          DEFAULT: "#7C5CFF",
          weak: "#EFEAFF",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,.04)",
        cardHover: "0 10px 30px rgba(16,24,40,.08)",
      },
      borderRadius: {
        xl2: "1rem", // alias for rounded-2xl
      },
      letterSpacing: {
        tight2: "-0.02em",
      },
    },
  },
  plugins: [],
};
