/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        ink: "#05070c",
        "panel-dark": "#0b1020",
      },
      boxShadow: {
        floating:
          "0 25px 70px -25px rgba(0,0,0,0.65), 0 10px 30px -20px rgba(59,130,246,0.35)",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
