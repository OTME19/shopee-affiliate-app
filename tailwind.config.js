/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        shopee: {
          orange: '#EE4D2D',
          light: '#FFF0ED',
        },
      },
    },
  },
  plugins: [],
}
