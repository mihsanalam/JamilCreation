/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#10B981',
        secondary: '#14B8A6',
        dark: '#0F172A',
        light: '#F8FAFC',
        danger: '#EF4444',
        warning: '#F59E0B',
      },
      fontFamily: {
        poppins: ['Poppins_600SemiBold', 'sans-serif'],
        inter: ['Inter_400Regular', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
