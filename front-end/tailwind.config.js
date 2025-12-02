/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'SFMono-Regular', 'ui-monospace', 'monospace']
      },
      colors: {
        ink: '#05070c',
        'panel-dark': '#0b1020'
      },
      boxShadow: {
        floating: '0 25px 70px -25px rgba(0,0,0,0.65), 0 10px 30px -20px rgba(59,130,246,0.35)'
      },
      backgroundImage: {
        'noise-soft': 'radial-gradient(circle at 25% 25%, rgba(59,130,246,0.08), transparent 35%), radial-gradient(circle at 80% 10%, rgba(147,51,234,0.06), transparent 32%), radial-gradient(circle at 40% 75%, rgba(16,185,129,0.07), transparent 30%)'
      }
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
