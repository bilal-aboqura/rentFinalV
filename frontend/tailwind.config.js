/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9eaff',
          200: '#bcd9ff',
          300: '#8ec1ff',
          400: '#599dff',
          500: '#3479f6',
          600: '#1f59db',
          700: '#1a46b0',
          800: '#1b3c8c',
          900: '#1c3571',
        },
      },
    },
  },
  plugins: [],
};
