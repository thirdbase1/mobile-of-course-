import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Base Colors */
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        
        /* Surface & Components */
        "surface-primary": "hsl(var(--surface-primary))",
        "surface-secondary": "hsl(var(--surface-secondary))",
        "surface-tertiary": "hsl(var(--surface-tertiary))",
        
        /* Foreground Text */
        "foreground-secondary": "hsl(var(--foreground-secondary))",
        "foreground-tertiary": "hsl(var(--foreground-tertiary))",
        
        /* Card & Popover */
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        popover: "hsl(var(--popover))",
        "popover-foreground": "hsl(var(--popover-foreground))",
        
        /* Primary - Blue */
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        "primary-light": "hsl(var(--primary-light))",
        "primary-dark": "hsl(var(--primary-dark))",
        
        /* Accent - Cyan */
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        
        /* Secondary */
        secondary: "hsl(var(--secondary))",
        "secondary-foreground": "hsl(var(--secondary-foreground))",
        
        /* Muted */
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        
        /* Status Colors */
        success: "hsl(var(--success))",
        "success-foreground": "hsl(var(--success-foreground))",
        warning: "hsl(var(--warning))",
        "warning-foreground": "hsl(var(--warning-foreground))",
        destructive: "hsl(var(--destructive))",
        "destructive-foreground": "hsl(var(--destructive-foreground))",
        
        /* Borders */
        border: "hsl(var(--border))",
        "border-light": "hsl(var(--border-light))",
        input: "hsl(var(--input))",
        "input-border": "hsl(var(--input-border))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) + 2px)",
        sm: "calc(var(--radius) - 2px)",
      },
      fontSize: {
        xs: ["12px", { lineHeight: "16px", letterSpacing: "0.5px" }],
        sm: ["13px", { lineHeight: "18px", letterSpacing: "0.3px" }],
        base: ["14px", { lineHeight: "20px", letterSpacing: "0px" }],
        lg: ["16px", { lineHeight: "24px", letterSpacing: "0px" }],
        xl: ["18px", { lineHeight: "28px", letterSpacing: "-0.5px" }],
        "2xl": ["20px", { lineHeight: "32px", letterSpacing: "-0.5px" }],
        "3xl": ["24px", { lineHeight: "36px", letterSpacing: "-1px" }],
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["Monaco", "Courier New", "monospace"],
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
        xl: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
        "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
        "inner-lg": "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
      },
      textColor: {
        "foreground-secondary": "hsl(var(--foreground-secondary))",
        "foreground-tertiary": "hsl(var(--foreground-tertiary))",
      },
      backgroundColor: {
        "surface-primary": "hsl(var(--surface-primary))",
        "surface-secondary": "hsl(var(--surface-secondary))",
        "surface-tertiary": "hsl(var(--surface-tertiary))",
      },
    },
  },
  plugins: [],
};
export default config;
