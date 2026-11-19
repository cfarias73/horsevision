/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#09090B',
        charcoal: '#141417',
        charcoalNested: '#1C1C21',
        hairline: '#26262A',
        racingGreen: '#0D3F2E',
        racingGreenDark: '#082B1F',
        racingGreenHover: '#093325',
        racingGreenLight: '#EBF5F0',
        crimson: '#0D3F2E',
        crimsonHover: '#082B1F',
        emeraldVet: '#10B981',
        amberVet: '#F59E0B',
        redVet: '#EF4444',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Space Mono"', 'monospace'],
        sans: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Newsreader"', 'Georgia', 'serif'],
      },
      borderRadius: {
        card: '22px',
        cta: '16px',
      },
    },
  },
  plugins: [],
};
