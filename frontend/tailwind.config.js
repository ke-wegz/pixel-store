/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#090412",
          surface: "#110722",
          card: "#180a30",
          cardHover: "#230e46",
          border: "#31145e",
          purple: "#7e22ce",
          neonPurple: "#a855f7",
          electricBlue: "#00d2ff",
          lightBlue: "#38bdf8",
          neonPink: "#ff2a85",
          softPink: "#f43f5e",
          pureWhite: "#ffffff",
          muted: "#9d8ec2",
          subtle: "#635384",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
        display: ["Orbitron", "Inter", "sans-serif"],
      },
      boxShadow: {
        "neon-pink": "0 0 25px -4px rgba(255, 42, 133, 0.55)",
        "neon-blue": "0 0 25px -4px rgba(0, 210, 255, 0.55)",
        "neon-purple": "0 0 30px -4px rgba(168, 85, 247, 0.5)",
        "card-glow":
          "0 10px 30px -10px rgba(0, 0, 0, 0.7), 0 0 20px -5px rgba(126, 34, 206, 0.3)",
      },
    },
  },
  plugins: [],
};
