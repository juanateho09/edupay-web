/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        "ep-sidebar": "var(--ep-sidebar)",
        "ep-teal": "var(--ep-teal)",
        "ep-mid": "var(--ep-mid)",
        "ep-light": "var(--ep-light)",
        "ep-bg": "var(--ep-bg)",
        "ep-card": "var(--ep-card)",
        "ep-text": "var(--ep-text)",
        "ep-text-sec": "var(--ep-text-sec)",
        "ep-border": "var(--ep-border)",
        "ep-danger": "var(--ep-danger)",
      },
    },
  },
  plugins: [],
}

