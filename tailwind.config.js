/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9eaff',
          200: '#bcd9ff',
          300: '#8ec1ff',
          400: '#599dff',
          500: '#3376f6',
          600: '#1f57db',
          700: '#1a45b1',
          800: '#1b3c8f',
          900: '#1b3672',
        },
      },
    },
  },
  plugins: [],
};
