/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        /* Display font — headings, hero text, brand name */
        syne: ['Syne', 'sans-serif'],
        /* Body font — paragraphs, labels, UI text */
        dm: ['DM Sans', 'system-ui', 'sans-serif'],
        /* Override default sans with DM Sans */
        sans: ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        /* ── Dark Luxury Palette ── */
        void:    '#020408',
        abyss:   '#060c14',
        deep:    '#0a1520',
        surface: '#0f1e30',
        panel:   '#152438',
        /* ── Accent Colors ── */
        'eco-emerald': '#00ff9d',
        'eco-cyan':    '#00d4ff',
        'eco-gold':    '#f0c060',
        'eco-purple':  '#a78bfa',
      },
      animation: {
        'fade-up':          'fadeUp 0.7s ease-out forwards',
        'fade-in':          'fadeIn 0.6s ease-out forwards',
        'scale-in':         'scaleIn 0.5s ease-out forwards',
        'float-slow':       'floatSlow 8s ease-in-out infinite',
        'float-medium':     'floatMedium 6s ease-in-out infinite',
        'blob-morph':       'blobMorph 12s ease-in-out infinite',
        'aurora':           'aurora 20s ease infinite',
        'aurora-alt':       'auroraAlt 25s ease infinite',
        'glow-pulse':       'glowPulse 3s ease-in-out infinite',
        'glow-pulse-cyan':  'glowPulseCyan 3s ease-in-out infinite',
        'spin-slow':        'spin 25s linear infinite',
        'shimmer':          'shimmer 2.5s linear infinite',
        'gradient-shift':   'gradientShift 8s ease infinite',
        'loading-bar':      'loadingBar 2s ease-out forwards',
        'bounce-gentle':    'bounceGentle 2s ease-in-out infinite',
        'pulse-ring':       'pulseRing 2s ease-out infinite',
      },
      keyframes: {
        fadeIn:   { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        fadeUp:   { '0%': { opacity: '0', transform: 'translateY(30px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:  { '0%': { opacity: '0', transform: 'scale(0.85)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        floatSlow:   { '0%, 100%': { transform: 'translateY(0) rotate(0deg)' }, '50%': { transform: 'translateY(-22px) rotate(2deg)' } },
        floatMedium: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-14px)' } },
        blobMorph: {
          '0%':   { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '33%':  { borderRadius: '40% 60% 70% 30% / 50% 60% 30% 60%' },
          '66%':  { borderRadius: '70% 30% 40% 60% / 40% 70% 60% 30%' },
          '100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
        },
        aurora: {
          '0%, 100%': { transform: 'translate(0%, 0%) scale(1)',    opacity: '0.5' },
          '25%':      { transform: 'translate(5%, 10%) scale(1.1)', opacity: '0.7' },
          '50%':      { transform: 'translate(-5%, 5%) scale(0.95)',opacity: '0.6' },
          '75%':      { transform: 'translate(8%, -5%) scale(1.05)',opacity: '0.5' },
        },
        auroraAlt: {
          '0%, 100%': { transform: 'translate(0%, 0%) scale(1)',     opacity: '0.3' },
          '33%':      { transform: 'translate(-8%, 8%) scale(1.15)', opacity: '0.5' },
          '66%':      { transform: 'translate(10%, -3%) scale(0.9)', opacity: '0.4' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0,255,157,0.15), 0 0 60px rgba(0,255,157,0.05)' },
          '50%':      { boxShadow: '0 0 40px rgba(0,255,157,0.35), 0 0 100px rgba(0,255,157,0.15)' },
        },
        glowPulseCyan: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0,212,255,0.15), 0 0 60px rgba(0,212,255,0.05)' },
          '50%':      { boxShadow: '0 0 40px rgba(0,212,255,0.35), 0 0 100px rgba(0,212,255,0.15)' },
        },
        shimmer:       { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        gradientShift: { '0%, 100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
        loadingBar:    { '0%': { width: '0%' }, '100%': { width: '100%' } },
        bounceGentle:  { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(8px)' } },
        pulseRing: {
          '0%':   { transform: 'scale(1)',   opacity: '0.8' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
      },
      boxShadow: {
        'emerald-glow':    '0 0 20px rgba(0,255,157,0.2), 0 0 60px rgba(0,255,157,0.06)',
        'emerald-glow-lg': '0 0 40px rgba(0,255,157,0.3), 0 0 120px rgba(0,255,157,0.1)',
        'cyan-glow':       '0 0 20px rgba(0,212,255,0.2), 0 0 60px rgba(0,212,255,0.06)',
        'card':            '0 4px 24px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04) inset',
        'card-hover':      '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,255,157,0.1)',
        'glass':           '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
        'btn-emerald':     '0 8px 32px rgba(0,255,157,0.25), 0 2px 8px rgba(0,255,157,0.15)',
        'btn-cyan':        '0 8px 32px rgba(0,212,255,0.25), 0 2px 8px rgba(0,212,255,0.15)',
      },
      backdropBlur: {
        'xs': '2px',
        '2xl': '40px',
        '3xl': '60px',
      },
    },
  },
  plugins: [],
}