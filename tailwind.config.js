/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#F2E9DC',
          light: '#FAF5ED',
          dark: '#E8DDD0',
        },
        beige: {
          DEFAULT: '#E5D5C1',
          light: '#ECE0D0',
          dark: '#DAC4AC',
        },
        mutedBrown: {
          DEFAULT: '#8B6F52',
          light: '#9E8264',
          dark: '#775E43',
        },
        deepBrown: {
          DEFAULT: '#5C4033',
          light: '#6E4E3F',
          dark: '#4A3328',
        },
        espresso: {
          DEFAULT: '#352820',
          light: '#423228',
          dark: '#271D17',
        },
        caramel: {
          DEFAULT: '#C19A6B',
          light: '#D1AC80',
          dark: '#B08856',
        },
      },
      fontFamily: {
        serif: ['Newsreader', 'Playfair Display', 'Georgia', 'serif'],
        display: ['Playfair Display', 'Newsreader', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'editorial': '0 2px 20px -2px rgba(53, 40, 32, 0.08)',
        'editorial-hover': '0 12px 30px -4px rgba(53, 40, 32, 0.12)',
        'editorial-card': '0 4px 20px -2px rgba(92, 64, 51, 0.06)',
      },
      letterSpacing: {
        'editorial-tight': '-0.025em',
        'editorial-loose': '0.08em',
        'editorial-wide': '0.15em',
      }
    },
  },
  plugins: [],
}

