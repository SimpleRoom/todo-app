/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        primaryHover: '#2563eb',
        success: '#10b981',
        danger: '#ef4444',
        dangerHover: '#dc2626',
        background: '#f9fafb',
        surface: '#ffffff',
        text: '#1f2937',
        muted: '#6b7280',
        border: '#e5e7eb',
      },
      borderRadius: {
        DEFAULT: '8px',
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(0,0,0,0.05)',
        card: '0 2px 8px rgba(0,0,0,0.06)',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
