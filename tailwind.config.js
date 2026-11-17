/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      keyframes: {
        scanline: {
          '0%, 100%': { transform: 'translateY(0%)' },
          '50%': { transform: 'translateY(220px)' },
        }
      },
      animation: {
        scanline: 'scanline 2.4s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
