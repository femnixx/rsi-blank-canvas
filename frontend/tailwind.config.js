/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        "brand-blue": "#0EA5E9",
        "brand-navy": "#0F172A",
        "brand-orange": "#F97316",
        "brand-bg": "#F8FAFC",
        "brand-text": "#1E293B",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
        ],
      },
      spacing: {
        "9/16": "56.25%",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [
    function ({ addComponents }) {
      addComponents({
        ".fluid-container": {
          width: "100%",
          margin: "0 auto",
          paddingLeft: "1rem",
          paddingRight: "1rem",
          maxWidth: "1280px",
          "@media (min-width: 640px)": {
            paddingLeft: "1.5rem",
            paddingRight: "1.5rem",
          },
          "@media (min-width: 1024px)": {
            paddingLeft: "2rem",
            paddingRight: "2rem",
          },
        },
        ".card-hover": {
          "@apply bg-white border border-zinc-200 rounded-xl shadow-sm transition-all duration-200": {},
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)",
          },
        },
        ".btn-primary": {
          "@apply bg-brand-blue text-white font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2": {},
          "&:hover": {
            backgroundColor: "#0284c7",
          },
          "&:active": {
            transform: "scale(0.98)",
          },
        },
        ".focus-ring": {
          "&:focus-visible": {
            outline: "2px solid #0EA5E9",
            outlineOffset: "2px",
          },
        },
      });
    },
  ],
};
