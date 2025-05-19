/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bento-blue': {
          50: '#eef4ff',
          100: '#dbe8ff',
          200: '#bdd5ff',
          300: '#90baff',
          400: '#5d96fc',
          500: '#2463eb',
          600: '#155dfc',
          700: '#0c42d9',
          800: '#0f37b4',
          900: '#13328f',
          950: '#0c1e5a',
        },
        'bento-dark': {
          50: '#f4f6fb',
          100: '#e8edf7',
          200: '#ccd8ec',
          300: '#9fb7db',
          400: '#6b92c6',
          500: '#4773b0',
          600: '#355b94',
          700: '#2c4a78',
          800: '#274063',
          900: '#0f172a',
          950: '#080d19',
        },
        'bento-accent': {
          50: '#eff8ff',
          100: '#dbeefe',
          200: '#bee5fd',
          300: '#91d6fb',
          400: '#5dc0f8',
          500: '#36a6f0',
          600: '#2184e0',
          700: '#196ac0',
          800: '#195a9e',
          900: '#194c7d',
          950: '#123152',
        },
        'bento-gray': {
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
      },
      fontFamily: {
        sans: ['"Pretendard Variable"', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', '"Helvetica Neue"', '"Segoe UI"', '"Apple SD Gothic Neo"', '"Noto Sans KR"', '"Malgun Gothic"', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', 'sans-serif'],
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.7s ease-out forwards',
        'slide-in-right': 'slideInRight 0.7s ease-out forwards',
        'pulse-slow': 'pulse-slow 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 7s ease-in-out 1s infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'ping-slow': 'ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite',
        'width': 'width 1.2s ease-out forwards',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-50px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(50px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(36, 99, 235, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(36, 99, 235, 0.6)' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '0.7' },
        },
        pingSlow: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '75%, 100%': { transform: 'scale(2)', opacity: '0' },
        },
        width: {
          '0%': { width: '0' },
          '100%': { width: '6rem' },
        },
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh': 'linear-gradient(to right top, rgba(17, 24, 39, 0.8), rgba(17, 24, 39, 0.4)), url("/mesh-gradient.svg")',
      },
    },
  },
  plugins: [],
}