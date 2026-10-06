/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        "brand-blue": "#0EA5E9",
        "brand-navy": "#0F172A",
        "brand-slate": "#1E293B",
        "brand-orange": "#F97316",
        "brand-bg": "#0F172A",
        "brand-text": "#F1F5F9",
        "brand-muted": "#94A3B8",
        "brand-card": "rgba(30, 41, 59, 0.7)",
        "brand-border": "rgba(148, 163, 184, 0.15)",
        "brand-glass": "rgba(15, 23, 42, 0.6)",
        "cmmi-l2": "#3B82F6",
        "cmmi-l2-bg": "rgba(59, 130, 246, 0.15)",
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
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-in-left": "slideInLeft 0.4s ease-out",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "shimmer": "shimmer 2s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-glow": "radial-gradient(circle at 50% 0%, rgba(59,130,246,0.15) 0%, transparent 60%)",
      },
      backdropBlur: {
        "glass": "12px",
        "glass-sm": "8px",
      },
    },
  },
  plugins: [
    function ({ addComponents }) {
      addComponents({
        ".glass-panel": {
          "@apply rounded-2xl border border-brand-border bg-brand-card backdrop-blur-glass p-5 shadow-xl": {},
        },
        ".glass-card": {
          "@apply rounded-xl border border-brand-border bg-brand-card backdrop-blur-glass p-4 shadow-lg": {},
        },
        ".glass-sidebar": {
          "@apply w-64 border-r border-brand-border bg-brand-glass backdrop-blur-glass": {},
        },
        ".btn-primary": {
          "@apply inline-flex items-center justify-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:bg-sky-400": {},
          "&:active": {
            transform: "scale(0.97)",
          },
        },
        ".btn-secondary": {
          "@apply inline-flex items-center justify-center gap-2 rounded-lg border border-brand-border bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-white/10": {},
        },
        ".btn-ghost": {
          "@apply inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-brand-muted transition-colors hover:text-white hover:bg-white/5": {},
        },
        ".input-dark": {
          "@apply w-full rounded-lg border border-brand-border bg-white/5 px-3 py-2 text-sm text-white placeholder:text-brand-muted outline-none transition-all duration-200 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/50": {},
        },
        ".card-accent": {
          "@apply relative rounded-2xl border border-brand-border bg-brand-card backdrop-blur-glass p-5 shadow-lg transition-all duration-300 hover:border-brand-blue/40 hover:shadow-blue-500/10 before:absolute before:top-0 before:left-6 before:right-6 before:h-px before:bg-gradient-to-r before:from-transparent before:via-brand-blue/60 before:to-transparent": {},
        },
      });
    },
  ],
};
