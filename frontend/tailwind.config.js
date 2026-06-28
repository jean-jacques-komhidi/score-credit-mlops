/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
      colors: {
        primary: "#3B82F6",
        success: "#10B981",
        danger: "#EF4444",
        warning: "#F59E0B",
      }
    },
  },
  plugins: [],
}