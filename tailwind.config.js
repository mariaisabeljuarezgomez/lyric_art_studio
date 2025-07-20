module.exports = {
  content: ["./pages/*.{html,js}", "./index.html", "./js/*.js"],
  theme: {
    extend: {
      colors: {
        primary: "#000000", // black - Pure black canvas for artwork prominence
        secondary: "#1a1a1a", // gray-900 - Subtle depth without visual competition
        accent: "#00FFFF", // cyan-400 - Electric blue for focused interactions
        background: "#0a0a0a", // gray-950 - Slightly lifted black for content areas
        surface: "#2a2a2a", // gray-800 - Card backgrounds with gentle separation
        "text-primary": "#FFFFFF", // white - Clean contrast for extended reading
        "text-secondary": "#CCCCCC", // gray-300 - Clear hierarchy without harshness
        success: "#00FF88", // green-400 - Positive confirmation with energy
        warning: "#FFB800", // amber-500 - Attention without alarm
        error: "#FF4444", // red-500 - Clear concern with approachability
        "border-subtle": "rgba(255, 255, 255, 0.1)", // white with 10% opacity
        "border-accent": "#00FFFF", // cyan-400 - For active states and focus
      },
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      boxShadow: {
        'primary': '0 4px 20px rgba(0, 0, 0, 0.3)',
        'accent-glow': '0 4px 20px rgba(0, 255, 255, 0.1)',
        'card': '0 2px 10px rgba(0, 0, 0, 0.2)',
      },
      borderWidth: {
        '1': '1px',
        '2': '2px',
      },
      transitionDuration: {
        '200': '200ms',
        '300': '300ms',
      },
      transitionTimingFunction: {
        'smooth': 'ease-out',
      },
      animation: {
        'particle-slow': 'float 10s ease-in-out infinite',
        'particle-medium': 'float 7s ease-in-out infinite',
        'particle-fast': 'float 5s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '25%': { transform: 'translateY(-10px) translateX(5px)' },
          '50%': { transform: 'translateY(-5px) translateX(-5px)' },
          '75%': { transform: 'translateY(-15px) translateX(3px)' },
        }
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [],
}