/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", // <-- Make sure it scans your main HTML file
    "./src/**/*.{js,ts,jsx,tsx}", // <-- Make sure it scans ALL files in your src folder
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}