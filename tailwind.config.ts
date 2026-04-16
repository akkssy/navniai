import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: {
          50: '#faf9f7',
          100: '#f7f6f2',
          200: '#eeedea',
          300: '#e2e0dc',
          400: '#d1cfc9',
        },
        ink: {
          50: '#f5f5f5',
          100: '#e0e0e0',
          200: '#b3b3b3',
          300: '#8a8a8a',
          400: '#666666',
          500: '#4a4a4a',
          600: '#333333',
          700: '#1a1a1a',
        },
        accent: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#7bb5f9',
          400: '#4a9af5',
          500: '#2f6fed',
          600: '#1d5bd6',
          700: '#1a4db3',
        },
        // Keep backward-compat aliases for components not yet migrated
        primary: {
          300: '#7bb5f9',
          400: '#4a9af5',
          500: '#2f6fed',
          600: '#1d5bd6',
        },
        dark: {
          300: '#8a8a8a',
          400: '#666666',
          500: '#4a4a4a',
          600: '#333333',
          700: '#1a1a1a',
          800: '#111111',
          900: '#0a0a0a',
          950: '#050505',
        },
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '8px',
        xl: '8px',
        '2xl': '8px',
      },
      boxShadow: {
        'subtle': '0 1px 2px rgba(0,0,0,0.04)',
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)',
        'input-focus': '0 0 0 3px rgba(47,111,237,0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-up-delay': 'slideUp 0.4s ease-out 0.1s both',
        'blur-in': 'blurIn 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        blurIn: {
          '0%': { opacity: '0', filter: 'blur(4px)' },
          '100%': { opacity: '1', filter: 'blur(0)' },
        },
      },
    },
  },
  plugins: [],
}
export default config

