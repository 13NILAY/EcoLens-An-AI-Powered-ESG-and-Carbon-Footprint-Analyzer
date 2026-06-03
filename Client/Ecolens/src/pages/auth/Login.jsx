import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Leaf, Loader, ArrowRight, Shield, Zap, BarChart3 } from 'lucide-react'
import { loginUser, saveAuthToken } from '../../services/auth'

const G = '#00e676'
const T = '#00d4ff'
const BG = '#030d18'

/* ── Ambient canvas ── */
function AuthCanvas() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize()
    window.addEventListener('resize', resize)
    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
      r: Math.random() * 1.3 + 0.3, alpha: Math.random() * 0.4 + 0.1,
      rgb: Math.random() > 0.5 ? [0, 230, 118] : [0, 212, 255],
    }))
    let raf
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const d = Math.hypot(dx, dy)
          if (d < 100) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(0,230,118,${0.035 * (1 - d / 100)})`
            ctx.lineWidth = 0.5
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }
      particles.forEach(p => {
        p.vx *= 0.992; p.vy *= 0.992; p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0
        const [r, g, b] = p.rgb
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r},${g},${b},${p.alpha})`; ctx.fill()
      })
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} aria-hidden="true" />
}

export default function Login() {
  const navigate = useNavigate()
  const [formData,     setFormData]     = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [success,      setSuccess]      = useState('')
  const [mounted,      setMounted]      = useState(false)

  useEffect(() => { setTimeout(() => setMounted(true), 60) }, [])

  const handleInputChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const validateForm = () => {
    if (!formData.email.trim())        { setError('Email is required'); return false }
    if (!formData.email.includes('@')) { setError('Please enter a valid email'); return false }
    if (!formData.password)            { setError('Password is required'); return false }
    return true
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!validateForm()) return
    setLoading(true); setError(''); setSuccess('')
    try {
      const response = await loginUser({ email: formData.email, password: formData.password })
      saveAuthToken(response.token, response.user.role)
      setSuccess('Login successful! Redirecting…')
      setTimeout(() => {
        navigate(response.user.role === 'company' ? '/company/dashboard' : '/investor/dashboard')
      }, 500)
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page" style={styles.root}>
      {/* Left panel */}
      <div style={styles.leftPanel}>
        <AuthCanvas />
        <div style={{ ...styles.orb, width: 420, height: 420, top: '-12%', left: '-12%', background: `radial-gradient(circle, rgba(0,230,118,0.1) 0%, transparent 70%)`, animation: 'aurora 20s ease infinite' }} aria-hidden="true" />
        <div style={{ ...styles.orb, width: 300, height: 300, bottom: '-6%', right: '4%', background: `radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)`, animation: 'auroraAlt 25s ease infinite' }} aria-hidden="true" />

        <div style={styles.leftContent}>
          <Link to="/" style={styles.logo}>
            <div style={styles.logoIcon}><Leaf size={18} /></div>
            Eco<span style={{ color: G }}>Lens</span>
          </Link>
          <div style={styles.leftHero}>
            <h1 style={styles.leftHeadline}>
              Welcome<br />
              <span style={styles.leftHeadlineAccent}>Back.</span>
            </h1>
            <p style={styles.leftSub}>
              Sign in to access your ESG intelligence dashboard and continue your sustainability journey.
            </p>
          </div>
          <div style={styles.featurePills}>
            {[
              { icon: BarChart3, label: 'Live ESG Scoring',    color: G },
              { icon: Zap,       label: 'AI Recommendations',  color: T },
              { icon: Shield,    label: 'Enterprise Security', color: '#a78bfa' },
            ].map(({ icon: Icon, label, color }, i) => (
              <div key={i} style={styles.pill}>
                <Icon size={13} style={{ color, flexShrink: 0 }} />
                <span style={styles.pillText}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={styles.rightPanel}>
        <div style={{ ...styles.formCard, opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(24px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Sign in</h2>
            <p style={styles.formSub}>
              New here? <Link to="/signup" style={styles.formLink}>Create an account</Link>
            </p>
          </div>

          {success && <div style={styles.msgSuccess}><Zap size={14} />{success}</div>}
          {error   && <div style={styles.msgError}>{error}</div>}

          <form onSubmit={handleSubmit} style={styles.form} noValidate>
            <div style={styles.field}>
              <label htmlFor="login-email" style={styles.label}>Email Address</label>
              <input type="email" id="login-email" name="email" value={formData.email}
                onChange={handleInputChange} placeholder="you@example.com"
                disabled={loading} autoComplete="email" style={styles.input}
                onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={e  => Object.assign(e.target.style, styles.input)}
              />
            </div>

            <div style={styles.field}>
              <label htmlFor="login-password" style={styles.label}>Password</label>
              <div style={styles.inputWrap}>
                <input type={showPassword ? 'text' : 'password'} id="login-password" name="password"
                  value={formData.password} onChange={handleInputChange}
                  placeholder="••••••••" disabled={loading} autoComplete="current-password"
                  style={{ ...styles.input, paddingRight: '3rem' }}
                  onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                  onBlur={e  => Object.assign(e.target.style, { ...styles.input, paddingRight: '3rem' })}
                />
                <button type="button" onClick={() => setShowPassword(s => !s)} disabled={loading}
                  style={styles.eyeBtn} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div style={styles.rememberRow}>
              <label style={styles.checkLabel}>
                <input type="checkbox" disabled={loading} style={styles.checkbox} />
                <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Remember me</span>
              </label>
              <a href="#" style={styles.forgotLink}>Forgot password?</a>
            </div>

            <button type="submit" id="login-submit" disabled={loading}
              style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
              onMouseEnter={e => { if (!loading) Object.assign(e.currentTarget.style, styles.submitBtnHover) }}
              onMouseLeave={e => { if (!loading) Object.assign(e.currentTarget.style, styles.submitBtn) }}
            >
              {loading ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Signing in…</> : <>Sign In <ArrowRight size={16} /></>}
            </button>
          </form>

          <div style={styles.divider}>
            <div style={styles.dividerLine} />
            <span style={styles.dividerText}>or continue with</span>
            <div style={styles.dividerLine} />
          </div>

          <div style={styles.socialRow}>
            {[
              { label: 'Google', path: 'M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z' },
              { label: 'GitHub', path: 'M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z' },
            ].map(({ label, path }) => (
              <button key={label} type="button" style={styles.socialBtn}
                onMouseEnter={e => Object.assign(e.currentTarget.style, styles.socialBtnHover)}
                onMouseLeave={e => Object.assign(e.currentTarget.style, styles.socialBtn)}
                aria-label={`Continue with ${label}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d={path} /></svg>
                {label}
              </button>
            ))}
          </div>

          <p style={styles.formFooter}>Protected by industry-standard encryption and security protocols.</p>
        </div>
      </div>
    </div>
  )
}

const styles = {
  root: {
    minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr',
    background: BG, fontFamily: "'DM Sans', system-ui, sans-serif", cursor: 'auto',
  },
  leftPanel: {
    display: 'none', position: 'relative',
    background: 'linear-gradient(135deg, #030d18 0%, #051a2e 50%, #07233d 100%)',
    overflow: 'hidden', padding: '3rem',
  },
  leftContent: {
    position: 'relative', zIndex: 2, height: '100%',
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
  },
  logo: {
    display: 'inline-flex', alignItems: 'center', gap: '0.55rem',
    fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 700,
    color: '#ffffff', textDecoration: 'none', letterSpacing: '-0.01em',
  },
  logoIcon: {
    width: 34, height: 34, background: 'rgba(0,230,118,0.1)',
    border: '1px solid rgba(0,230,118,0.25)', borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: G,
  },
  leftHero: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1rem', padding: '2rem 0' },
  leftHeadline: {
    fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2.5rem, 4vw, 3.8rem)',
    fontWeight: 700, color: '#ffffff', letterSpacing: '-0.025em', lineHeight: 1.05, margin: 0,
  },
  leftHeadlineAccent: {
    background: `linear-gradient(135deg, ${G}, ${T})`,
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontStyle: 'italic',
  },
  leftSub: { fontSize: '1rem', color: '#94a3b8', lineHeight: 1.72, maxWidth: 360, margin: 0 },
  featurePills: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  pill: {
    display: 'inline-flex', alignItems: 'center', gap: '0.55rem',
    padding: '0.45rem 0.85rem', background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9999, width: 'fit-content',
  },
  pillText: { fontSize: '0.8rem', fontWeight: 500, color: '#cbd5e1' },
  orb: { position: 'absolute', borderRadius: '50%', filter: 'blur(70px)', pointerEvents: 'none', zIndex: 0 },

  rightPanel: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '2rem 1.25rem', background: BG, minHeight: '100vh',
  },
  formCard: {
    width: '100%', maxWidth: 420,
    background: 'rgba(7,35,61,0.8)',
    border: '1px solid rgba(0,230,118,0.1)',
    borderRadius: 24, padding: '2.25rem',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(0,230,118,0.05)',
  },
  formHeader: { marginBottom: '1.75rem' },
  formTitle: {
    fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem', fontWeight: 700,
    color: '#ffffff', letterSpacing: '-0.02em', margin: '0 0 0.4rem',
  },
  formSub: { fontSize: '0.85rem', color: '#94a3b8', margin: 0 },
  formLink: { color: G, textDecoration: 'none', fontWeight: 600 },
  form:    { display: 'flex', flexDirection: 'column', gap: '1.1rem' },
  field:   { display: 'flex', flexDirection: 'column', gap: '0.45rem' },
  label:   { fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', letterSpacing: '0.02em' },
  input: {
    width: '100%', padding: '0.75rem 1rem',
    background: 'rgba(5,26,46,0.9)', border: '1px solid rgba(0,230,118,0.15)',
    borderRadius: 12, color: '#ffffff', fontSize: '0.9rem',
    fontFamily: "'DM Sans', sans-serif", outline: 'none',
    transition: 'border-color 0.25s, box-shadow 0.25s', boxSizing: 'border-box', cursor: 'text',
  },
  inputFocus: {
    width: '100%', padding: '0.75rem 1rem',
    background: 'rgba(0,230,118,0.04)', border: '1px solid rgba(0,230,118,0.4)',
    borderRadius: 12, color: '#ffffff', fontSize: '0.9rem',
    fontFamily: "'DM Sans', sans-serif", outline: 'none',
    boxShadow: '0 0 0 3px rgba(0,230,118,0.08)', boxSizing: 'border-box', cursor: 'text',
  },
  inputWrap: { position: 'relative' },
  eyeBtn: {
    position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', color: '#64748b', cursor: 'pointer',
    display: 'flex', alignItems: 'center', padding: 0, transition: 'color 0.2s',
  },
  rememberRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' },
  checkLabel: { display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' },
  checkbox:   { accentColor: G, cursor: 'pointer' },
  forgotLink: { fontSize: '0.82rem', color: G, textDecoration: 'none', fontWeight: 500, opacity: 0.85 },
  submitBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
    width: '100%', padding: '0.88rem', background: G, border: 'none', borderRadius: 12,
    color: BG, fontSize: '0.95rem', fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
    cursor: 'pointer', transition: 'all 0.25s', marginTop: '0.25rem', boxSizing: 'border-box',
    boxShadow: '0 4px 18px rgba(0,230,118,0.3)',
  },
  submitBtnHover: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
    width: '100%', padding: '0.88rem', background: '#33ffaa', border: 'none', borderRadius: 12,
    color: BG, fontSize: '0.95rem', fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
    cursor: 'pointer', boxShadow: '0 10px 32px rgba(0,230,118,0.45)',
    transform: 'translateY(-1px)', marginTop: '0.25rem', boxSizing: 'border-box',
  },
  divider: { display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.5rem 0' },
  dividerLine: { flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' },
  dividerText: { fontSize: '0.75rem', color: '#475569', whiteSpace: 'nowrap' },
  socialRow: { display: 'flex', gap: '0.75rem' },
  socialBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
    padding: '0.7rem', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
    color: '#cbd5e1', fontSize: '0.85rem', fontFamily: "'DM Sans', sans-serif",
    cursor: 'pointer', transition: 'all 0.2s',
  },
  socialBtnHover: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
    padding: '0.7rem', background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.14)', borderRadius: 12,
    color: '#ffffff', fontSize: '0.85rem', fontFamily: "'DM Sans', sans-serif",
    cursor: 'pointer', transition: 'all 0.2s',
  },
  formFooter: { textAlign: 'center', fontSize: '0.72rem', color: '#475569', marginTop: '1.25rem', lineHeight: 1.5 },
  msgSuccess: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    padding: '0.7rem 1rem', background: 'rgba(0,230,118,0.07)',
    border: '1px solid rgba(0,230,118,0.2)', borderRadius: 10,
    color: G, fontSize: '0.85rem', marginBottom: '1rem',
  },
  msgError: {
    padding: '0.7rem 1rem', background: 'rgba(248,113,113,0.08)',
    border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10,
    color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem',
  },
}

const styleTag = document.createElement('style')
styleTag.textContent = `
  @media (min-width: 900px) {
    .auth-page { grid-template-columns: 1fr 1fr !important; }
    .auth-page > div:first-child { display: flex !important; }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes aurora {
    0%,100% { transform: translate(0%,0%) scale(1); opacity:.5; }
    25%      { transform: translate(5%,10%) scale(1.1); opacity:.7; }
    50%      { transform: translate(-5%,5%) scale(.95); opacity:.6; }
    75%      { transform: translate(8%,-5%) scale(1.05); opacity:.5; }
  }
  @keyframes auroraAlt {
    0%,100% { transform: translate(0%,0%) scale(1); opacity:.3; }
    33%     { transform: translate(-8%,8%) scale(1.15); opacity:.5; }
    66%     { transform: translate(10%,-3%) scale(.9); opacity:.4; }
  }
  input::placeholder { color: #475569; }
`
if (!document.getElementById('ecolens-auth-styles')) {
  styleTag.id = 'ecolens-auth-styles'
  document.head.appendChild(styleTag)
}
