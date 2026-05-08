/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* ── existing bg / border / text tokens ── */
        'bg-app':      'var(--color-bg-app)',
        'bg-sidebar':  'var(--color-bg-sidebar)',
        'bg-panel':    'var(--color-bg-panel)',
        'bg-card':     'var(--color-bg-card)',
        'bg-elevated': 'var(--color-bg-elevated)',
        'bg-hover':    'var(--color-bg-hover)',
        'bg-overlay':  'var(--color-bg-overlay)',
        'border-subtle': 'var(--color-border-subtle)',
        'border-medium': 'var(--color-border-medium)',
        'border-active': 'var(--color-border-active)',
        'brand-primary':   'var(--color-brand-primary)',
        'brand-secondary': 'var(--color-brand-secondary)',
        'brand-accent':    'var(--color-brand-accent)',
        'brand-warning':   'var(--color-brand-warning)',
        'brand-danger':    'var(--color-brand-danger)',
        'text-primary':    'var(--color-text-primary)',
        'text-secondary':  'var(--color-text-secondary)',
        'text-muted':      'var(--color-text-muted)',
        /* ── new accent tokens ── */
        accent: {
          electric: 'var(--color-accent-electric)',
          teal:     'var(--color-accent-teal)',
          violet:   'var(--color-accent-violet)',
          amber:    'var(--color-accent-amber)',
          rose:     'var(--color-accent-rose)',
        },
        /* ── shadcn semantic aliases (HSL vars) ── */
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          electric: 'var(--color-accent-electric)',
          teal:     'var(--color-accent-teal)',
          violet:   'var(--color-accent-violet)',
          amber:    'var(--color-accent-amber)',
          rose:     'var(--color-accent-rose)',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input:  'hsl(var(--input))',
        ring:   'hsl(var(--ring))',
        /* ── zone colors ── */
        zone: {
          res_low:    'var(--zone-res-low)',
          res_med:    'var(--zone-res-med)',
          res_high:   'var(--zone-res-high)',
          commercial: 'var(--zone-commercial)',
          industrial: 'var(--zone-industrial)',
          mixed_use:  'var(--zone-mixed-use)',
          green:      'var(--zone-green)',
          transit:    'var(--zone-transit)',
          health:     'var(--zone-health)',
          education:  'var(--zone-education)',
          utility:    'var(--zone-utility)',
          smart:      'var(--zone-smart)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        lg:   'var(--radius)',
        md:   'calc(var(--radius) - 2px)',
        sm:   'calc(var(--radius) - 4px)',
        '2xl': '20px',
        pill:  '9999px',
      },
      boxShadow: {
        'elev-1':       'var(--elev-1)',
        'elev-2':       'var(--elev-2)',
        'elev-3':       'var(--elev-3)',
        'elev-float':   'var(--elev-float)',
        'glow-electric':'var(--glow-electric)',
        'glow-teal':    'var(--glow-teal)',
        'glow-violet':  'var(--glow-violet)',
        'glow-danger':  'var(--glow-danger)',
        'glow-soft':    'var(--glow-soft)',
      },
      backdropBlur: {
        xs:           '6px',
        glass:        '20px',
        'glass-thick':'28px',
      },
      transitionTimingFunction: {
        'out-expo': 'var(--ease-out-expo)',
        spring:     'var(--ease-spring)',
      },
      animation: {
        'pulse-slow':      'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':         'fadeIn 0.3s ease-in-out',
        'slide-up':        'slideUp 0.3s ease-out',
        'shimmer':         'shimmer 1.8s infinite linear',
        'glow-pulse':      'glowPulse 2s ease-in-out infinite',
        'slide-in-right':  'slideInRight 0.32s var(--ease-out-expo)',
        'slide-in-left':   'slideInLeft 0.32s var(--ease-out-expo)',
        'scale-in':        'scaleIn 0.2s var(--ease-out-expo)',
        'spin-slow':       'spin 8s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',     opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: 'var(--glow-electric)' },
          '50%':      { boxShadow: 'none' },
        },
        slideInRight: {
          '0%':   { transform: 'translateX(24px)', opacity: '0' },
          '100%': { transform: 'translateX(0)',     opacity: '1' },
        },
        slideInLeft: {
          '0%':   { transform: 'translateX(-24px)', opacity: '0' },
          '100%': { transform: 'translateX(0)',      opacity: '1' },
        },
        scaleIn: {
          '0%':   { transform: 'scale(0.94)', opacity: '0' },
          '100%': { transform: 'scale(1)',     opacity: '1' },
        },
      },
    },
  },
  plugins: [
    (await import('tailwindcss-animate')).default,
  ],
}
