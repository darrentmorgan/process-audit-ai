/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Static fallback colors (used when CSS vars not available)
        primary: '#4299e1',
        secondary: '#38a169',
        warning: '#ed8936',
        
        // Hospo Dojo specific colors
        hd: {
          white: '#FFFFFF',
          ivory: '#EAE8DD', 
          black: '#1C1C1C',
          khaki: '#42551C',
        },
        
        // Theme-aware colors using CSS custom properties
        theme: {
          primary: 'var(--color-primary)',
          secondary: 'var(--color-secondary)',
          accent: 'var(--color-accent)',
          background: 'var(--color-background)',
          surface: 'var(--color-surface)',
          text: {
            primary: 'var(--color-text-primary)',
            secondary: 'var(--color-text-secondary)',
            muted: 'var(--color-text-muted)'
          },
          border: 'var(--color-border)',
          success: 'var(--color-success)',
          warning: 'var(--color-warning)',
          error: 'var(--color-error)'
        }
      },
      fontFamily: {
        theme: ['var(--font-family)'],
        // Hospo Dojo specific fonts
        headline: ['Gefika', 'Bebas Neue', 'Oswald', 'Impact', 'sans-serif'],
        sub: ['Nimbus Sans', 'Nimbus Sans L', 'Helvetica Neue', 'Arial', 'sans-serif'],
        body: ['DM Sans', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif']
      },
      fontSize: {
        'theme-xs': 'var(--font-size-xs)',
        'theme-sm': 'var(--font-size-sm)',
        'theme-base': 'var(--font-size-base)',
        'theme-lg': 'var(--font-size-lg)',
        'theme-xl': 'var(--font-size-xl)',
        'theme-2xl': 'var(--font-size-2xl)',
        'theme-3xl': 'var(--font-size-3xl)',
        'theme-4xl': 'var(--font-size-4xl)'
      },
      fontWeight: {
        'theme-normal': 'var(--font-weight-normal)',
        'theme-medium': 'var(--font-weight-medium)',
        'theme-semibold': 'var(--font-weight-semibold)',
        'theme-bold': 'var(--font-weight-bold)'
      },
      spacing: {
        'theme-xs': 'var(--spacing-xs)',
        'theme-sm': 'var(--spacing-sm)',
        'theme-md': 'var(--spacing-md)',
        'theme-lg': 'var(--spacing-lg)',
        'theme-xl': 'var(--spacing-xl)',
        'theme-2xl': 'var(--spacing-2xl)',
        // Hospo Dojo specific spacing
        'hd': '24px'
      },
      borderRadius: {
        'theme-sm': 'var(--border-radius-sm)',
        'theme-base': 'var(--border-radius-base)',
        'theme-md': 'var(--border-radius-md)',
        'theme-lg': 'var(--border-radius-lg)',
        'theme-xl': 'var(--border-radius-xl)',
        // Hospo Dojo specific radius
        'hd': '12px'
      },
      boxShadow: {
        'theme-sm': 'var(--shadow-sm)',
        'theme-base': 'var(--shadow-base)',
        'theme-md': 'var(--shadow-md)',
        'theme-lg': 'var(--shadow-lg)',
        'theme-xl': 'var(--shadow-xl)'
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'theme-transition': 'themeTransition 0.3s ease'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        themeTransition: {
          '0%': { opacity: '0.8' },
          '100%': { opacity: '1' },
        }
      },
      transitionProperty: {
        'theme': 'color, background-color, border-color, box-shadow, opacity'
      }
    },
  },
  plugins: [
    // Custom plugin for theme utilities
    function({ addUtilities, theme }) {
      const themeUtilities = {
        '.transition-theme': {
          transition: 'var(--transition-colors)'
        },
        '.font-theme': {
          fontFamily: 'var(--font-family)'
        }
      }
      
      addUtilities(themeUtilities)
    }
  ],
}