/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0d1726",
        blue: {
          500: "#1677d3",
          600: "#0e67bd",
          700: "#0a549a",
        },
        mist: "#f3f7fb",
        teal: "#97f0e4",
      },
      boxShadow: {
        soft: "0 24px 60px rgba(18, 53, 94, 0.12)",
        card: "0 20px 45px rgba(12, 38, 73, 0.08)",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
