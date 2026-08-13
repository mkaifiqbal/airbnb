/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'airbnb-pink': '#FF385C',
        'airbnb-pink-hover': '#E31C5F',
        'airbnb-pink-light': '#FFE4E9',
        'airbnb-dark': '#222222',
        'airbnb-gray': '#717171',
        'airbnb-gray-light': '#B0B0B0',
        'airbnb-border': '#DDDDDD',
        'airbnb-border-light': '#EBEBEB',
        'airbnb-bg': '#FFFFFF',
        'airbnb-bg-secondary': '#F7F7F7',
        'airbnb-bg-hover': '#F0F0F0',
        'airbnb-star': '#FF385C',
        'airbnb-success': '#008A05',
        'airbnb-warning': '#E07912',
        'airbnb-error': '#C13515',
      },
      fontFamily: {
        sans: ['Nunito Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'xs': '12px',
        'sm': '14px',
        'base': '16px',
        'lg': '18px',
        'xl': '22px',
        '2xl': '26px',
        '3xl': '32px',
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        'pill': '32px',
      },
      boxShadow: {
        'airbnb': '0 2px 16px rgba(0, 0, 0, 0.12)',
        'airbnb-lg': '0 6px 20px rgba(0, 0, 0, 0.2)',
        'airbnb-card': '0 1px 2px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.05)',
        'search': '0 1px 2px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.05)',
        'search-hover': '0 2px 4px rgba(0, 0, 0, 0.18)',
        'dropdown': '0 12px 32px rgba(0, 0, 0, 0.22), 0 2px 8px rgba(0, 0, 0, 0.08)',
      },
      spacing: {
        'navbar': '80px',
        'navbar-mobile': '64px',
      },
      maxWidth: {
        'content': '1280px',
        'wide': '1760px',
      },
      transitionDuration: {
        'fast': '150ms',
        'base': '200ms',
        'slow': '300ms',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        heartBounce: {
          '0%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.3)' },
          '50%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
        calendarSlideIn: {
          from: { opacity: '0', transform: 'translateY(-6px) scale(0.97)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 150ms ease',
        slideUp: 'slideUp 300ms ease',
        slideDown: 'slideDown 150ms ease',
        shimmer: 'shimmer 1.5s infinite',
        heartBounce: 'heartBounce 0.3s ease',
        spin: 'spin 0.8s linear infinite',
        calendarSlideIn: 'calendarSlideIn 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
