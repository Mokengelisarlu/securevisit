/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Kiosk theme (from VMS SaaS design system)
        teal: {
          50: '#F0FDFA',
          100: '#E0F2FE',
          200: '#B2E3DB',
          300: '#7ED4CA',
          400: '#14B8A6',
          500: '#0D9488',
          600: '#0F766E',
          700: '#115E59',
          800: '#134E4A',
          900: '#0D3D3A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'System'],
        inter: ['Inter', 'System'],
      },
      spacing: {
        '4.5': '1.125rem',
        '5.5': '1.375rem',
      },
    },
  },
  plugins: [],
};
