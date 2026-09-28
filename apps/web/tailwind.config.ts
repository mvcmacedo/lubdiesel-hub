import type { Config } from 'tailwindcss';

/**
 * Lubdiesel design tokens — automotive + premium + technical + industrial.
 * Dark, professional, high legibility, low visual noise.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#0D0D0D',
          secondary: '#171717',
        },
        card: '#1F1F1F',
        border: '#2C2C2C',
        foreground: {
          DEFAULT: '#F5F5F5',
          muted: '#A3A3A3',
        },
        brand: {
          DEFAULT: '#F5C400',
          hover: '#D9AD00',
        },
        success: '#3FB950',
        danger: '#F85149',
      },
      borderRadius: {
        lg: '0.75rem',
        xl: '1rem',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
