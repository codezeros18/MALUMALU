/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eaf3ee',
          100: '#c9e0d2',
          400: '#2E7D4F',
          800: '#1F5C3A',
        },
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'system-ui', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
