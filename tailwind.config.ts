import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0b0c10',
        card: '#151821',
        border: '#242836',
        accent: '#c8f135',
      },
    },
  },
  plugins: [],
};

export default config;
