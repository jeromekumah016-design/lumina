/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'retro-cream': '#F5F1E9',
        'retro-dark': '#3F2A1E',
      },
      boxShadow: {
        'retro': '4px 4px 0 #000',
      }
    },
  },
  plugins: [],
};
