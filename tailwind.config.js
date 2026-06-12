/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Lumina retro-modern (neo-brutalist) palette
        'retro-cream': '#F5F1E9',   // app background
        'retro-paper': '#FFFDF6',   // card surface
        'retro-ink': '#1A1612',     // primary text / dark surfaces
        'retro-dark': '#6F6256',    // secondary text (warm gray-brown)
        'retro-blue': '#0284C8',    // single action blue
        'retro-amber': '#F4B942',   // brand star / highlights
        'retro-pink': '#BE185D',    // women accent
        'retro-navy': '#1E40AF',    // men accent
      },
      boxShadow: {
        'retro': '4px 4px 0 #000',     // hero cards, big CTAs
        'retro-sm': '2px 2px 0 #000',  // list cards, chips, inputs
      }
    },
  },
  plugins: [],
};
