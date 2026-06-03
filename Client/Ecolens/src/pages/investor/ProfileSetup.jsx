import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader, AlertCircle, CheckCircle, Leaf, Shield, Target } from 'lucide-react'
import { getAuthToken } from '../../services/auth'
import { getInvestorProfile, updateInvestorProfile } from '../../services/profile'
import { ALLOWED_INDUSTRIES } from '../../services/investor'

const T  = '#00d4ff'   // teal — investor accent
const G  = '#00e676'   // green
const BG = '#030d18'

export default function InvestorProfileSetup() {
  const navigate = useNavigate()
  const token = getAuthToken()

  const [formData, setFormData] = useState({
    riskTolerance: 'Medium', minEsgScore: 50, preferredIndustries: []
  })
  const [loading,    setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState('')

  useEffect(() => {
    const fetch = async () => {
      try {
        if (!token) return navigate('/login')
        const data = await getInvestorProfile(token)
        setFormData({
          riskTolerance:       data.risk_tolerance       || 'Medium',
          minEsgScore:         data.min_esg_score        || 50,
          preferredIndustries: data.preferred_industries || [],
        })
      } catch { /* first time */ } finally { setLoading(false) }
    }
    fetch()
  }, [token, navigate])

  const toggleIndustry = (ind) =>
    setFormData(p => ({
      ...p,
      preferredIndustries: p.preferredIndustries.includes(ind)
        ? p.preferredIndustries.filter(i => i !== ind)
        : [...p.preferredIndustries, ind],
    }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    if (formData.preferredIndustries.length === 0) {
      setError('Please select at least one preferred industry.')
      return
    }
    setSubmitting(true)
    try {
      await updateInvestorProfile(formData, token)
      setSuccess('Profile saved successfully!')
      setTimeout(() => navigate('/investor/dashboard'), 1200)
    } catch (err) {
      setError(err.message || 'Failed to save profile')
    } finally { setSubmitting(false) }
  }

  if (loading) return (
    <div style={s.root}>
      <div style={{ textAlign:'center' }}>
        <Loader style={{ color: T, width:40, height:40, animation:'spin 1s linear infinite', display:'block', margin:'0 auto 1rem' }} />
        <p style={{ color:'#94a3b8' }}>Loading profile…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const strengthBar = [
    { label:'0 – Any', pct: 0 },
    { label:'50 – Moderate', pct: 50 },
    { label:'100 – Best Only', pct: 100 },
  ]

  return (
    <div style={s.root}>
      <div style={s.card}>
        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={s.logoWrap}><Leaf size={28} style={{ color: T }} /></div>
          <h1 style={s.heading}>Investor Profile</h1>
          <p style={{ color:'#64748b', fontSize:'0.9rem', marginTop:'0.4rem' }}>
            Set up your ESG investment preferences
          </p>
        </div>

        {success && <div style={s.msgSuccess}><CheckCircle size={15} />{success}</div>}
        {error   && <div style={s.msgError}><AlertCircle size={15} />{error}</div>}

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>

          {/* Preferred Industries */}
          <div style={s.section}>
            <div style={s.sectionHead}>
              <Target size={18} style={{ color: T }} />
              <h3 style={s.sectionTitle}>Preferred Industries</h3>
            </div>
            <p style={{ fontSize:'0.8rem', color:'#64748b', marginBottom:'0.85rem' }}>
              Select industries you're interested in investing in
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.6rem' }}>
              {ALLOWED_INDUSTRIES.map(ind => {
                const active = formData.preferredIndustries.includes(ind)
                return (
                  <label key={ind} style={{
                    display:'flex', alignItems:'center', gap:'0.6rem',
                    padding:'0.6rem 0.75rem',
                    background: active ? 'rgba(0,212,255,0.07)' : 'rgba(5,26,46,0.8)',
                    border: active ? '1.5px solid rgba(0,212,255,0.35)' : '1.5px solid rgba(255,255,255,0.06)',
                    borderRadius:10, cursor:'pointer', transition:'all 0.2s',
                  }}>
                    <input type="checkbox" checked={active} onChange={() => toggleIndustry(ind)}
                      style={{ accentColor: T, cursor:'pointer', flexShrink:0 }} />
                    <span style={{ fontSize:'0.82rem', fontWeight:500, color: active ? '#ffffff' : '#94a3b8', textTransform:'capitalize' }}>{ind}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Risk Tolerance */}
          <div style={s.section}>
            <div style={s.sectionHead}>
              <Shield size={18} style={{ color:'#f59e0b' }} />
              <h3 style={s.sectionTitle}>Risk Appetite</h3>
            </div>
            <select value={formData.riskTolerance}
              onChange={e => setFormData(p => ({ ...p, riskTolerance: e.target.value }))}
              style={s.input}>
              <option value="Low">Low – Conservative</option>
              <option value="Medium">Medium – Balanced</option>
              <option value="High">High – Aggressive</option>
            </select>
          </div>

          {/* Min ESG Score */}
          <div style={s.section}>
            <div style={{ ...s.sectionHead, justifyContent:'space-between' }}>
              <h3 style={s.sectionTitle}>Minimum ESG Score</h3>
              <span style={{ fontSize:'1.4rem', fontWeight:700, color: T }}>{formData.minEsgScore}</span>
            </div>
            <input type="range" min="0" max="100" value={formData.minEsgScore}
              onChange={e => setFormData(p => ({ ...p, minEsgScore: +e.target.value }))}
              style={{ width:'100%', accentColor: T, margin:'0.5rem 0' }} />
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.72rem', color:'#64748b' }}>
              <span>0 – Any</span><span>50 – Moderate</span><span>100 – Best Only</span>
            </div>
          </div>

          <button type="submit" id="investor-profile-submit" disabled={submitting}
            style={{ ...s.btn, opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
            onMouseEnter={e => { if (!submitting) Object.assign(e.currentTarget.style, s.btnHover) }}
            onMouseLeave={e => { if (!submitting) Object.assign(e.currentTarget.style, s.btn) }}>
            {submitting ? <><Loader size={16} style={{ animation:'spin 1s linear infinite' }} /> Saving…</> : 'Save Profile & Continue'}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #051a2e; color: #ffffff; }
      `}</style>
    </div>
  )
}

const s = {
  root: {
    minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
    background: BG, padding:'2rem 1.25rem',
    fontFamily:"'DM Sans', system-ui, sans-serif",
  },
  card: {
    width:'100%', maxWidth:480,
    background:'rgba(7,35,61,0.8)',
    border:'1px solid rgba(0,212,255,0.1)',
    borderRadius:24, padding:'2.25rem',
    backdropFilter:'blur(20px)',
    boxShadow:'0 24px 60px rgba(0,0,0,0.5)',
  },
  logoWrap: {
    width:56, height:56,
    background:'rgba(0,212,255,0.1)',
    border:'1px solid rgba(0,212,255,0.25)',
    borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center',
    margin:'0 auto 1rem',
  },
  heading: {
    fontFamily:"'Cormorant Garamond', serif", fontSize:'1.8rem', fontWeight:700,
    color:'#ffffff', letterSpacing:'-0.02em', margin:0,
  },
  section: {
    background:'rgba(5,26,46,0.7)',
    border:'1px solid rgba(0,212,255,0.08)',
    borderRadius:14, padding:'1rem 1.1rem',
  },
  sectionHead: { display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'0.5rem' },
  sectionTitle: { fontSize:'0.95rem', fontWeight:600, color:'#ffffff', margin:0 },
  input: {
    width:'100%', padding:'0.72rem 1rem',
    background:'rgba(5,26,46,0.9)', border:'1px solid rgba(0,212,255,0.15)',
    borderRadius:10, color:'#ffffff', fontSize:'0.88rem',
    fontFamily:"'DM Sans', sans-serif", outline:'none', boxSizing:'border-box',
    marginTop:'0.25rem',
  },
  btn: {
    display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem',
    width:'100%', padding:'0.9rem',
    background:'linear-gradient(135deg, #00d4ff, #0369a1)',
    border:'none', borderRadius:12, color: BG,
    fontSize:'0.95rem', fontWeight:700,
    fontFamily:"'DM Sans', sans-serif",
    boxShadow:'0 4px 18px rgba(0,212,255,0.35)', boxSizing:'border-box',
    transition:'all 0.25s',
  },
  btnHover: {
    display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem',
    width:'100%', padding:'0.9rem',
    background:'linear-gradient(135deg, #33e0ff, #0369a1)',
    border:'none', borderRadius:12, color: BG,
    fontSize:'0.95rem', fontWeight:700,
    fontFamily:"'DM Sans', sans-serif",
    boxShadow:'0 10px 32px rgba(0,212,255,0.5)',
    transform:'translateY(-1px)', boxSizing:'border-box', cursor:'pointer',
  },
  msgSuccess: {
    display:'flex', alignItems:'center', gap:'0.5rem',
    padding:'0.7rem 1rem', background:'rgba(0,212,255,0.08)',
    border:'1px solid rgba(0,212,255,0.2)', borderRadius:10,
    color: T, fontSize:'0.85rem', marginBottom:'1rem',
  },
  msgError: {
    display:'flex', alignItems:'center', gap:'0.5rem',
    padding:'0.7rem 1rem', background:'rgba(248,113,113,0.08)',
    border:'1px solid rgba(248,113,113,0.2)', borderRadius:10,
    color:'#f87171', fontSize:'0.85rem', marginBottom:'1rem',
  },
}