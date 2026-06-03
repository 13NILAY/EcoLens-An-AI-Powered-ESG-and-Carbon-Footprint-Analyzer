import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader, Leaf, AlertCircle, CheckCircle, Building, Globe, BarChart3, Briefcase } from 'lucide-react'
import { getAuthToken } from '../../services/auth'
import { getCompanyProfile, updateCompanyProfile } from '../../services/profile'

const G  = '#00e676'
const BG = '#030d18'

const COUNTRIES = [
  'United States','United Kingdom','Canada','Australia','Germany','France',
  'India','Japan','China','Brazil','South Korea','Singapore','Netherlands',
  'Switzerland','Sweden','Norway','Denmark','Finland','Ireland','New Zealand',
  'Spain','Italy','Mexico','South Africa','United Arab Emirates','Saudi Arabia',
  'Indonesia','Thailand','Malaysia','Philippines','Vietnam','Poland','Turkey',
  'Argentina','Chile','Colombia','Peru','Nigeria','Kenya','Egypt','Other'
]

export default function CompanyProfileSetup() {
  const navigate = useNavigate()
  const token = getAuthToken()

  const [formData, setFormData] = useState({ companyName:'', country:'', marketCap:'', industry:'' })
  const [loading,    setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState('')

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getCompanyProfile(token)
        if (res?.data) setFormData({
          companyName: res.data.companyName || '',
          country:     res.data.country     || '',
          marketCap:   res.data.marketCap   || '',
          industry:    res.data.industry    || '',
        })
      } catch { /* new user */ } finally { setLoading(false) }
    }
    if (token) fetch()
  }, [token])

  const handleChange = e => {
    const { name, value } = e.target
    setFormData(p => ({ ...p, [name]: value }))
    setError('')
  }

  const validate = () => {
    if (!formData.companyName.trim()) { setError('Company name is required'); return false }
    if (!formData.country.trim())     { setError('Country is required'); return false }
    if (formData.marketCap && !/^[\d.,]+[BMKbmk]?$/.test(formData.marketCap.trim())) {
      setError('Market Cap should be numeric (e.g., 1.5B, 500M)')
      return false
    }
    if (!formData.industry.trim()) { setError('Industry is required'); return false }
    return true
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true); setError(''); setSuccess('')
    try {
      await updateCompanyProfile(formData, token)
      setSuccess('Profile saved! Redirecting to dashboard…')
      setTimeout(() => navigate('/company/dashboard'), 1000)
    } catch (err) {
      setError(err.message || 'Failed to update profile')
    } finally { setSubmitting(false) }
  }

  if (loading) return (
    <div style={s.root}>
      <div style={{ textAlign:'center' }}>
        <Loader style={{ color: G, animation:'spin 1s linear infinite', width:40, height:40, marginBottom:'1rem', display:'block', margin:'0 auto 1rem' }} />
        <p style={{ color:'#94a3b8' }}>Loading profile…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const fields = [
    { name:'companyName', label:'Company Name *', type:'text', placeholder:'e.g., Acme Corporation', icon: Building },
    { name:'country',     label:'Country *',      type:'select', icon: Globe },
    { name:'marketCap',   label:'Market Cap (USD)', type:'text', placeholder:'e.g., 1.5B, 500M', icon: BarChart3, hint:'Numeric format: 1.5B, 500M, or 10000' },
    { name:'industry',    label:'Industry *',     type:'industrySelect', icon: Briefcase },
  ]

  return (
    <div style={s.root}>
      <div style={s.card}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={s.logoWrap}><Leaf size={28} style={{ color: G }} /></div>
          <h1 style={s.heading}>Complete Your Profile</h1>
          <p style={{ color:'#64748b', fontSize:'0.9rem', marginTop:'0.4rem' }}>
            Set up your company profile to get started with EcoLens
          </p>
        </div>

        {success && (
          <div style={s.msgSuccess}><CheckCircle size={16} />{success}</div>
        )}
        {error && (
          <div style={s.msgError}><AlertCircle size={16} />{error}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1.1rem' }} noValidate>
          {/* Company Name */}
          <div style={s.field}>
            <label htmlFor="companyName" style={s.label}>Company Name *</label>
            <input type="text" id="companyName" name="companyName" value={formData.companyName}
              onChange={handleChange} placeholder="e.g., Acme Corporation" disabled={submitting}
              style={s.input}
              onFocus={e => Object.assign(e.target.style, s.inputFocus)}
              onBlur={e  => Object.assign(e.target.style, s.input)}
            />
          </div>

          {/* Country */}
          <div style={s.field}>
            <label htmlFor="country" style={s.label}>Country *</label>
            <select id="country" name="country" value={formData.country}
              onChange={handleChange} disabled={submitting} style={s.input}>
              <option value="">Select a country…</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Market Cap */}
          <div style={s.field}>
            <label htmlFor="marketCap" style={s.label}>Market Cap (USD)</label>
            <input type="text" id="marketCap" name="marketCap" value={formData.marketCap}
              onChange={handleChange} placeholder="e.g., 1.5B, 500M" disabled={submitting}
              style={s.input}
              onFocus={e => Object.assign(e.target.style, s.inputFocus)}
              onBlur={e  => Object.assign(e.target.style, s.input)}
            />
            <p style={{ fontSize:'0.75rem', color:'#475569', marginTop:'0.25rem' }}>Numeric format: 1.5B, 500M, or 10000</p>
          </div>

          {/* Industry */}
          <div style={s.field}>
            <label htmlFor="industry" style={s.label}>Industry *</label>
            <select id="industry" name="industry" value={formData.industry}
              onChange={handleChange} disabled={submitting} style={s.input}>
              <option value="">Select an industry…</option>
              <option value="energy">Energy & Utilities</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="technology">Technology</option>
              <option value="finance">Finance & Banking</option>
              <option value="retail">Retail & Consumer</option>
              <option value="healthcare">Healthcare</option>
              <option value="agriculture">Agriculture</option>
              <option value="transportation">Transportation & Logistics</option>
              <option value="construction">Construction & Real Estate</option>
              <option value="other">Other</option>
            </select>
          </div>

          <p style={{ fontSize:'0.8rem', color:'#475569' }}>* Required fields</p>

          <button type="submit" id="profile-submit" disabled={submitting}
            style={{ ...s.btn, opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
            onMouseEnter={e => { if (!submitting) Object.assign(e.currentTarget.style, s.btnHover) }}
            onMouseLeave={e => { if (!submitting) Object.assign(e.currentTarget.style, s.btn) }}>
            {submitting ? <><Loader size={16} style={{ animation:'spin 1s linear infinite' }} /> Saving…</> : 'Complete Profile & Continue'}
          </button>
        </form>

        <p style={{ textAlign:'center', color:'#475569', fontSize:'0.8rem', marginTop:'1.5rem' }}>
          You can update your profile anytime from settings.
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #051a2e; color: #ffffff; }
        input::placeholder { color: #475569 !important; }
      `}</style>
    </div>
  )
}

const s = {
  root: {
    minHeight: '100vh', display:'flex', alignItems:'center', justifyContent:'center',
    background: BG, padding:'2rem 1.25rem',
    fontFamily:"'DM Sans', system-ui, sans-serif",
  },
  card: {
    width:'100%', maxWidth:440,
    background:'rgba(7,35,61,0.8)',
    border:'1px solid rgba(0,230,118,0.1)',
    borderRadius:24, padding:'2.25rem',
    backdropFilter:'blur(20px)',
    boxShadow:'0 24px 60px rgba(0,0,0,0.5)',
  },
  logoWrap: {
    width:56, height:56,
    background:'rgba(0,230,118,0.1)',
    border:'1px solid rgba(0,230,118,0.25)',
    borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center',
    margin:'0 auto 1rem',
  },
  heading: {
    fontFamily:"'Cormorant Garamond', serif", fontSize:'1.8rem', fontWeight:700,
    color:'#ffffff', letterSpacing:'-0.02em', margin:0,
  },
  field:  { display:'flex', flexDirection:'column', gap:'0.4rem' },
  label:  { fontSize:'0.82rem', fontWeight:600, color:'#cbd5e1', letterSpacing:'0.02em' },
  input: {
    width:'100%', padding:'0.75rem 1rem',
    background:'rgba(5,26,46,0.9)', border:'1px solid rgba(0,230,118,0.15)',
    borderRadius:12, color:'#ffffff', fontSize:'0.88rem',
    fontFamily:"'DM Sans', sans-serif", outline:'none',
    transition:'all 0.25s', boxSizing:'border-box',
  },
  inputFocus: {
    width:'100%', padding:'0.75rem 1rem',
    background:'rgba(0,230,118,0.04)', border:'1px solid rgba(0,230,118,0.4)',
    borderRadius:12, color:'#ffffff', fontSize:'0.88rem',
    fontFamily:"'DM Sans', sans-serif", outline:'none',
    boxShadow:'0 0 0 3px rgba(0,230,118,0.08)', boxSizing:'border-box',
  },
  btn: {
    display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem',
    width:'100%', padding:'0.9rem',
    background: G, border:'none', borderRadius:12,
    color: BG, fontSize:'0.95rem', fontWeight:700,
    fontFamily:"'DM Sans', sans-serif",
    boxShadow:'0 4px 18px rgba(0,230,118,0.3)', boxSizing:'border-box',
    transition:'all 0.25s',
  },
  btnHover: {
    display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem',
    width:'100%', padding:'0.9rem',
    background:'#33ffaa', border:'none', borderRadius:12,
    color: BG, fontSize:'0.95rem', fontWeight:700,
    fontFamily:"'DM Sans', sans-serif",
    boxShadow:'0 10px 32px rgba(0,230,118,0.45)',
    transform:'translateY(-1px)', boxSizing:'border-box',
    cursor:'pointer', transition:'all 0.25s',
  },
  msgSuccess: {
    display:'flex', alignItems:'center', gap:'0.5rem',
    padding:'0.7rem 1rem', background:'rgba(0,230,118,0.08)',
    border:'1px solid rgba(0,230,118,0.2)', borderRadius:10,
    color: G, fontSize:'0.85rem', marginBottom:'1rem',
  },
  msgError: {
    display:'flex', alignItems:'center', gap:'0.5rem',
    padding:'0.7rem 1rem', background:'rgba(248,113,113,0.08)',
    border:'1px solid rgba(248,113,113,0.2)', borderRadius:10,
    color:'#f87171', fontSize:'0.85rem', marginBottom:'1rem',
  },
}
