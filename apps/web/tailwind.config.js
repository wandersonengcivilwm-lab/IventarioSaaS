const path = require('path')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    path.join(__dirname, 'src/**/*.{js,ts,jsx,tsx,mdx}'),
    path.join(__dirname, 'src/app/**/*.{js,ts,jsx,tsx,mdx}'),
    path.join(__dirname, 'src/components/**/*.{js,ts,jsx,tsx,mdx}'),
  ],
  theme: {
    extend: {
      colors: {
        background: '#FAFAF8',
        surface:    '#FFFFFF',
        border:     '#E5E7EB',
        // Pastéis
        blue:    { DEFAULT: '#A8C8E8', dark: '#6D8FB0', light: '#D4E8F5' },
        green:   { DEFAULT: '#A8D8B0', dark: '#5A9468', light: '#D4F0DA' },
        yellow:  { DEFAULT: '#F2E8A8', dark: '#C8A840', light: '#F9F3D0' },
        pink:    { DEFAULT: '#E8A8C8', dark: '#B06890', light: '#F5D4E8' },
        red:     { DEFAULT: '#E8B0A8', dark: '#C05040', light: '#F5D8D4' },
        // ABC
        'abc-a': '#A8D8B0',
        'abc-b': '#F2E8A8',
        'abc-c': '#E8B0A8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
