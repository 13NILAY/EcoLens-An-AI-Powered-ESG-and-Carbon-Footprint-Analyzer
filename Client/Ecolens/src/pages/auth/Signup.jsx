import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Leaf, Loader, ArrowRight, Building, TrendingUp, CheckCircle, Shield } from 'lucide-react'
import { signupUser, saveAuthToken } from '../../services/auth'

const G  = '#00e676'
const T  = '#00d4ff'
const BG = '#030d18'

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
          const d  = Math.hypot(dx, dy)
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
        if (p.x < 0) p.x = canvas.width;  if (p.x > canvas.width)  p.x = 0
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

export default function Signup() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'company' })
  const [showPassword,        setShowPassword]        = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')
  const [mounted,  setMounted]  = useState(false)
  const [step,     setStep]     = useState(1)

  useEffect(() => { setTimeout(() => setMounted(true), 60) }, [])

  const handleInputChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const validateForm = () => {
    if (!formData.name.trim())                          { setError('Name is required'); return false }
    if (!formData.email.trim())                         { setError('Email is required'); return false }
    if (!formData.email.includes('@'))                  { setError('Please enter a valid email'); return false }
    if (!formData.password)                             { setError('Password is required'); return false }
    if (formData.password.length < 6)                  { setError('Password must be at least 6 characters'); return false }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return false }
    return true
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!validateForm()) return
    setLoading(true); setError(''); setSuccess('')
    try {
      const response = await signupUser({ name: formData.name, email: formData.email, password: formData.password, role: formData.role })
      saveAuthToken(response.token, response.user.role)
      setSuccess('Account created! Redirecting to your dashboard…')
      setTimeout(() => {
        navigate(response.user.role === 'company' ? '/company/dashboard' : '/investor/dashboard')
      }, 700)
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const roles = [
    {
      id: 'company', icon: Building, label: 'Company',
      tagline: 'Track & reduce your ESG footprint', accentColor: G,
      features: ['Carbon footprint analysis', 'ESG score calculation', 'AI-powered recommendations'],
    },
    {
      id: 'investor', icon: TrendingUp, label: 'Investor',
      tagline: 'Build sustainable investment portfolios', accentColor: T,
      features: ['Live ESG rankings', 'News sentiment analysis', 'Portfolio builder tools'],
    },
  ]
  const selectedRole = roles.find(r => r.id === formData.role)

  return (
    <div className="auth-page" style={styles.root}>
      {/* Left panel */}
      <div style={styles.leftPanel}>
        <AuthCanvas />
        <div style={{ ...styles.orb, width: 420, height: 420, top: '-15%', left: '-10%', background: 'radial-gradient(circle, rgba(0,230,118,0.09) 0%, transparent 70%)', animation: 'aurora 20s ease infinite' }} aria-hidden="true" />
        <div style={{ ...styles.orb, width: 280, height: 280, bottom: '5%', right: '8%', background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)', animation: 'auroraAlt 22s ease infinite' }} aria-hidden="true" />

        <div style={styles.leftContent}>
          <Link to="/" style={styles.logo}>
            <div style={styles.logoIcon}><Leaf size={18} /></div>
            Eco<span style={{ color: G }}>Lens</span>
          </Link>

          <div style={styles.leftHero}>
            <h1 style={styles.leftHeadline}>
              Join the<br />
              <span style={styles.leftHeadlineAccent}>Movement.</span>
            </h1>
            <p style={styles.leftSub}>
              Create your account and start transforming sustainability data into real, actionable ESG intelligence today.
            </p>
          </div>

          {/* Dynamic role highlight */}
          <div style={styles.roleSummary}>
            <div style={{ ...styles.roleSummaryHeader, borderColor: `${selectedRole.accentColor}28` }}>
              <div style={{ ...styles.roleSummaryIcon, background: `${selectedRole.accentColor}12`, border: `1px solid ${selectedRole.accentColor}28` }}>
                <selectedRole.icon size={18} style={{ color: selectedRole.accentColor }} />
              </div>
              <div>
                <div style={styles.roleSummaryTitle}>{selectedRole.label} Account</div>
                <div style={styles.roleSummaryTagline}>{selectedRole.tagline}</div>
              </div>
            </div>
            <ul style={styles.roleSummaryList}>
              {selectedRole.features.map((f, i) => (
                <li key={i} style={styles.roleSummaryItem}>
                  <CheckCircle size={12} style={{ color: selectedRole.accentColor, flexShrink: 0 }} />
                  <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={styles.rightPanel}>
        <div style={{ ...styles.formCard, opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(24px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Create Account</h2>
            <p style={styles.formSub}>
              Already have one? <Link to="/login" style={styles.formLink}>Sign in</Link>
            </p>
          </div>

          {success && <div style={styles.msgSuccess}><CheckCircle size={14} />{success}</div>}
          {error   && <div style={styles.msgError}>{error}</div>}

          {/* STEP 1: Role Picker */}
          {step === 1 && (
            <div style={styles.rolePickerWrap}>
              <p style={styles.rolePickerLabel}>I want to join as a:</p>
              <div style={styles.roleCards}>
                {roles.map(role => {
                  const Icon = role.icon
                  const isActive = formData.role === role.id
                  return (
                    <button key={role.id} id={`role-${role.id}`} type="button"
                      onClick={() => setFormData(p => ({ ...p, role: role.id }))}
                      style={{
                        ...styles.roleCard,
                        ...(isActive ? {
                          background:  `${role.accentColor}08`,
                          border:      `1.5px solid ${role.accentColor}40`,
                          boxShadow:   `0 0 20px ${role.accentColor}10`,
                        } : {}),
                      }}
                      aria-pressed={isActive}>
                      <div style={{ ...styles.roleCardIcon, background: `${role.accentColor}10`, border: `1px solid ${role.accentColor}22` }}>
                        <Icon size={22} style={{ color: role.accentColor }} />
                      </div>
                      <div style={styles.roleCardLabel}>{role.label}</div>
                      <div style={styles.roleCardTagline}>{role.tagline}</div>
                      {isActive && (
                        <div style={{ ...styles.roleActiveCheck, background: role.accentColor }}>
                          <CheckCircle size={10} style={{ color: BG }} />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              <button id="role-next-btn" type="button" onClick={() => setStep(2)}
                style={styles.submitBtn}
                onMouseEnter={e => Object.assign(e.currentTarget.style, styles.submitBtnHover)}
                onMouseLeave={e => Object.assign(e.currentTarget.style, styles.submitBtn)}>
                Continue as {selectedRole.label} <ArrowRight size={16} />
              </button>

              <p style={styles.formFooter}>
                By continuing, you agree to our{' '}
                <a href="#" style={styles.formLink}>Terms of Service</a> and{' '}
                <a href="#" style={styles.formLink}>Privacy Policy</a>.
              </p>
            </div>
          )}

          {/* STEP 2: Details Form */}
          {step === 2 && (
            <>
              <button type="button" onClick={() => { setStep(1); setError('') }} style={styles.backBtn}>
                ← Back
              </button>

              <div style={{ ...styles.selectedRoleBadge, borderColor: `${selectedRole.accentColor}28` }}>
                <selectedRole.icon size={13} style={{ color: selectedRole.accentColor }} />
                <span style={{ color: selectedRole.accentColor, fontSize: '0.78rem', fontWeight: 600 }}>
                  {selectedRole.label} Account
                </span>
              </div>

              <form onSubmit={handleSubmit} style={{ ...styles.form, marginTop: '1rem' }} noValidate>
                <div style={styles.field}>
                  <label htmlFor="signup-name" style={styles.label}>Full Name</label>
                  <input type="text" id="signup-name" name="name" value={formData.name}
                    onChange={handleInputChange} placeholder="Jane Doe" disabled={loading} autoComplete="name"
                    style={styles.input}
                    onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                    onBlur={e  => Object.assign(e.target.style, styles.input)}
                  />
                </div>

                <div style={styles.field}>
                  <label htmlFor="signup-email" style={styles.label}>Email Address</label>
                  <input type="email" id="signup-email" name="email" value={formData.email}
                    onChange={handleInputChange} placeholder="you@example.com" disabled={loading} autoComplete="email"
                    style={styles.input}
                    onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                    onBlur={e  => Object.assign(e.target.style, styles.input)}
                  />
                </div>

                <div style={styles.field}>
                  <label htmlFor="signup-password" style={styles.label}>Password</label>
                  <div style={styles.inputWrap}>
                    <input type={showPassword ? 'text' : 'password'} id="signup-password" name="password"
                      value={formData.password} onChange={handleInputChange}
                      placeholder="Min. 6 characters" disabled={loading} autoComplete="new-password"
                      style={{ ...styles.input, paddingRight: '3rem' }}
                      onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                      onBlur={e  => Object.assign(e.target.style, { ...styles.input, paddingRight: '3rem' })}
                    />
                    <button type="button" onClick={() => setShowPassword(s => !s)} disabled={loading} style={styles.eyeBtn}>
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {formData.password.length > 0 && (
                    <div style={styles.strengthRow}>
                      {[1, 2, 3, 4].map(i => {
                        const strength = formData.password.length >= 12 ? 4 : formData.password.length >= 8 ? 3 : formData.password.length >= 6 ? 2 : 1
                        const colors   = ['#f87171', '#f59e0b', T, G]
                        return <div key={i} style={{ ...styles.strengthBar, background: i <= strength ? colors[strength - 1] : 'rgba(255,255,255,0.07)' }} />
                      })}
                      <span style={{ ...styles.strengthText, color: formData.password.length >= 12 ? G : formData.password.length >= 8 ? T : formData.password.length >= 6 ? '#f59e0b' : '#f87171' }}>
                        {formData.password.length >= 12 ? 'Strong' : formData.password.length >= 8 ? 'Good' : formData.password.length >= 6 ? 'Fair' : 'Weak'}
                      </span>
                    </div>
                  )}
                </div>

                <div style={styles.field}>
                  <label htmlFor="signup-confirm" style={styles.label}>Confirm Password</label>
                  <div style={styles.inputWrap}>
                    <input type={showConfirmPassword ? 'text' : 'password'} id="signup-confirm" name="confirmPassword"
                      value={formData.confirmPassword} onChange={handleInputChange}
                      placeholder="Re-enter password" disabled={loading} autoComplete="new-password"
                      style={{ ...styles.input, paddingRight: '3rem',
                        borderColor: formData.confirmPassword && formData.confirmPassword !== formData.password ? 'rgba(248,113,113,0.4)' : undefined,
                      }}
                      onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                      onBlur={e  => Object.assign(e.target.style, { ...styles.input, paddingRight: '3rem' })}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(s => !s)} disabled={loading} style={styles.eyeBtn}>
                      {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.confirmPassword !== formData.password && (
                    <span style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>Passwords do not match</span>
                  )}
                </div>

                <label style={{ ...styles.checkLabel, alignItems: 'flex-start', gap: '0.6rem', marginTop: '0.25rem' }}>
                  <input type="checkbox" required disabled={loading} style={{ ...styles.checkbox, marginTop: '0.15rem', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
                    I agree to the{' '}<a href="#" style={styles.formLink}>Terms of Service</a> and{' '}<a href="#" style={styles.formLink}>Privacy Policy</a>
                  </span>
                </label>

                <button type="submit" id="signup-submit" disabled={loading}
                  style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.5rem' }}
                  onMouseEnter={e => { if (!loading) Object.assign(e.currentTarget.style, styles.submitBtnHover) }}
                  onMouseLeave={e => { if (!loading) Object.assign(e.currentTarget.style, styles.submitBtn) }}>
                  {loading ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creating account…</> : <>Create Account <ArrowRight size={16} /></>}
                </button>
              </form>

              <p style={{ ...styles.formFooter, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '1.25rem' }}>
                <Shield size={11} style={{ color: '#475569' }} />
                Your data is encrypted and never sold to third parties.
              </p>
            </>
          )}
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
  leftContent: { position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
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
  orb: { position: 'absolute', borderRadius: '50%', filter: 'blur(70px)', pointerEvents: 'none', zIndex: 0 },

  roleSummary: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  roleSummaryHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid', borderRadius: 14 },
  roleSummaryIcon: { width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  roleSummaryTitle: { fontFamily: "'Cormorant Garamond', serif", fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' },
  roleSummaryTagline: { fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' },
  roleSummaryList: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem' },
  roleSummaryItem: { display: 'flex', alignItems: 'center', gap: '0.5rem' },

  rightPanel: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.25rem', background: BG, minHeight: '100vh' },
  formCard: {
    width: '100%', maxWidth: 430,
    background: 'rgba(7,35,61,0.8)',
    border: '1px solid rgba(0,230,118,0.1)',
    borderRadius: 24, padding: '2.25rem',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(0,230,118,0.05)',
  },
  formHeader: { marginBottom: '1.5rem' },
  formTitle: {
    fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem', fontWeight: 700,
    color: '#ffffff', letterSpacing: '-0.02em', margin: '0 0 0.4rem',
  },
  formSub: { fontSize: '0.85rem', color: '#94a3b8', margin: 0 },
  formLink: { color: G, textDecoration: 'none', fontWeight: 600 },
  formFooter: { textAlign: 'center', fontSize: '0.72rem', color: '#475569', margin: '1.25rem 0 0', lineHeight: 1.5 },

  rolePickerWrap: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  rolePickerLabel: { fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', margin: 0 },
  roleCards: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' },
  roleCard: {
    position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.6rem',
    padding: '1.1rem', background: 'rgba(5,26,46,0.8)',
    border: '1.5px solid rgba(255,255,255,0.07)', borderRadius: 16,
    cursor: 'pointer', textAlign: 'left', transition: 'all 0.3s ease', fontFamily: "'DM Sans', sans-serif",
  },
  roleCardIcon: { width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  roleCardLabel: { fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem', fontWeight: 700, color: '#ffffff' },
  roleCardTagline: { fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4 },
  roleActiveCheck: { position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  selectedRoleBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
    padding: '0.35rem 0.75rem', background: 'rgba(255,255,255,0.04)',
    border: '1px solid', borderRadius: 9999, marginBottom: '0.25rem',
  },
  backBtn: { background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.82rem', cursor: 'pointer', padding: '0 0 0.75rem', fontFamily: "'DM Sans', sans-serif", transition: 'color 0.2s' },

  form:  { display: 'flex', flexDirection: 'column', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', letterSpacing: '0.02em' },
  input: {
    width: '100%', padding: '0.72rem 1rem',
    background: 'rgba(5,26,46,0.9)', border: '1px solid rgba(0,230,118,0.15)',
    borderRadius: 12, color: '#ffffff', fontSize: '0.88rem',
    fontFamily: "'DM Sans', sans-serif", outline: 'none',
    transition: 'all 0.25s', boxSizing: 'border-box', cursor: 'text',
  },
  inputFocus: {
    width: '100%', padding: '0.72rem 1rem',
    background: 'rgba(0,230,118,0.04)', border: '1px solid rgba(0,230,118,0.4)',
    borderRadius: 12, color: '#ffffff', fontSize: '0.88rem',
    fontFamily: "'DM Sans', sans-serif", outline: 'none',
    boxShadow: '0 0 0 3px rgba(0,230,118,0.08)', boxSizing: 'border-box', cursor: 'text',
  },
  inputWrap: { position: 'relative' },
  eyeBtn: { position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 },

  strengthRow: { display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.4rem' },
  strengthBar: { height: 3, flex: 1, borderRadius: 2, transition: 'background 0.3s' },
  strengthText: { fontSize: '0.72rem', fontWeight: 600, minWidth: 42 },

  checkLabel: { display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' },
  checkbox:   { accentColor: G, cursor: 'pointer' },

  submitBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
    width: '100%', padding: '0.88rem', background: G, border: 'none', borderRadius: 12,
    color: BG, fontSize: '0.95rem', fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
    cursor: 'pointer', transition: 'all 0.25s', boxSizing: 'border-box',
    boxShadow: '0 4px 18px rgba(0,230,118,0.3)',
  },
  submitBtnHover: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
    width: '100%', padding: '0.88rem', background: '#33ffaa', border: 'none', borderRadius: 12,
    color: BG, fontSize: '0.95rem', fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
    cursor: 'pointer', boxShadow: '0 10px 32px rgba(0,230,118,0.45)',
    transform: 'translateY(-1px)', boxSizing: 'border-box',
  },

  msgSuccess: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1rem', background: 'rgba(0,230,118,0.07)', border: '1px solid rgba(0,230,118,0.2)', borderRadius: 10, color: G, fontSize: '0.85rem', marginBottom: '1rem' },
  msgError:   { padding: '0.7rem 1rem', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' },
}

if (!document.getElementById('ecolens-signup-styles')) {
  const tag = document.createElement('style')
  tag.id = 'ecolens-signup-styles'
  tag.textContent = `
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
  document.head.appendChild(tag)
}
