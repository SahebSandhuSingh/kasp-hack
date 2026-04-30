/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        shopify: {
          green: '#008060',
          'green-dark': '#006e52',
          'green-light': '#e3f1ec',
          surface: '#FFFFFF',
          bg: '#F1F2F4',
          border: '#E1E3E5',
          text: '#202223',
          secondary: '#6D7175',
          critical: '#D72C0D',
          'critical-light': '#FFF4F4',
          warning: '#FFC453',
          'warning-light': '#FFF5EA',
          'warning-text': '#916A00',
          success: '#008060',
          'success-light': '#E3F1EC',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.06)',
        'nav': '0 1px 0 rgba(0,0,0,0.07)',
      },
      borderRadius: {
        'card': '8px',
        'btn': '4px',
      }
    },
  },
  plugins: [],
}
