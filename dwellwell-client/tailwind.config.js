/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand colors
        brand: {
          primary: '#103049',     // deep navy slate
          secondary: '#FFC857',   // warm golden yellow for energy and contrast
          accent: '#3EB489',       // soft teal/green for calming DIY positivity
          background: '#F0F4F8',   // soft, clean off-white with a hint of blue
          foreground: '#1F2937',   // strong slate-gray for text (readable but not black)
        }
        ,
        // Optional status colors if you want consistent naming
        status: {
          info: '#3B82F6',
          success: '#10B981',
          warning: '#FBBF24',
          danger: '#EF4444',     // red-500
        },
      },
    },
  },
  plugins: [],
};