// components/company/CompanyLayout.jsx
import { useState, useEffect } from 'react'
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import {
  Leaf, Upload, BarChart3, History, Menu, X,
  ChevronDown, Building, LogOut, Settings
} from 'lucide-react'
import { clearAuth, getAuthToken } from '../../services/auth'
import { getCompanyProfile } from '../../services/profile'

/* ── Design Tokens ── */
const G = '#00e676'   // electric green
const T = '#00d4ff'   // teal

const S = {
  root: {
    display: 'flex', height: '100vh',
    background: '#030d18',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    color: '#cbd5e1',
    overflow: 'hidden', cursor: 'auto',
  },
  backdrop: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(4px)', zIndex: 40,
  },
  sidebar: (open) => ({
    position: 'fixed', top: 0, left: 0, bottom: 0,
    zIndex: 50, width: 240,
    background: 'rgba(5,26,46,0.98)',
    borderRight: '1px solid rgba(0,230,118,0.1)',
    backdropFilter: 'blur(24px)',
    display: 'flex', flexDirection: 'column',
    transform: open ? 'translateX(0)' : 'translateX(-100%)',
    transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
  }),
  sidebarStatic: { position: 'static', transform: 'none', flexShrink: 0 },
  logoArea: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1.25rem 1.25rem 1rem',
    borderBottom: '1px solid rgba(0,230,118,0.08)',
  },
  logoLink: {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    textDecoration: 'none',
    fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem', fontWeight: 700,
    color: '#ffffff', letterSpacing: '-0.01em',
  },
  logoIcon: {
    width: 32, height: 32,
    background: 'rgba(0,230,118,0.1)',
    border: '1px solid rgba(0,230,118,0.25)',
    borderRadius: 9, display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: G,
  },
  portalBadge: {
    fontSize: '0.63rem', fontWeight: 600,
    color: G, background: 'rgba(0,230,118,0.08)',
    border: '1px solid rgba(0,230,118,0.18)',
    borderRadius: 9999, padding: '0.18rem 0.5rem',
    letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '0.2rem',
  },
  nav: { padding: '1rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' },
  navLink: (active) => ({
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.65rem 0.85rem', borderRadius: 11,
    fontSize: '0.875rem', fontWeight: active ? 600 : 500,
    color: active ? G : '#94a3b8',
    background: active ? 'rgba(0,230,118,0.08)' : 'transparent',
    border: active ? '1px solid rgba(0,230,118,0.18)' : '1px solid transparent',
    textDecoration: 'none', transition: 'all 0.2s ease', cursor: 'pointer',
  }),
  userPanel: {
    padding: '0.85rem 0.85rem 1rem',
    borderTop: '1px solid rgba(0,230,118,0.07)',
  },
  userBox: {
    display: 'flex', alignItems: 'center', gap: '0.65rem',
    padding: '0.65rem 0.75rem',
    background: 'rgba(0,230,118,0.04)',
    border: '1px solid rgba(0,230,118,0.1)',
    borderRadius: 12,
  },
  avatar: {
    width: 32, height: 32,
    background: `linear-gradient(135deg, ${G}, #16a34a)`,
    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  userName: { fontSize: '0.82rem', fontWeight: 600, color: '#ffffff' },
  userSub:  { fontSize: '0.72rem', color: '#64748b', marginTop: '0.1rem' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 },
  topBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 1.5rem', height: 64,
    background: 'rgba(5,26,46,0.92)',
    borderBottom: '1px solid rgba(0,230,118,0.08)',
    backdropFilter: 'blur(20px)', flexShrink: 0, gap: '1rem',
  },
  pageTitle: {
    fontFamily: "'Cormorant Garamond', serif", fontSize: '1.25rem', fontWeight: 700,
    color: '#ffffff', letterSpacing: '-0.015em',
  },
  pageSub: { fontSize: '0.74rem', color: '#64748b', marginTop: '0.1rem' },
  userMenuBtn: {
    display: 'flex', alignItems: 'center', gap: '0.65rem',
    padding: '0.45rem 0.75rem',
    background: 'rgba(0,230,118,0.05)',
    border: '1px solid rgba(0,230,118,0.12)',
    borderRadius: 10, cursor: 'pointer',
    transition: 'all 0.2s ease', color: '#cbd5e1',
  },
  dropdownMenu: {
    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
    width: 180,
    background: 'rgba(5,26,46,0.98)',
    border: '1px solid rgba(0,230,118,0.12)',
    borderRadius: 14, padding: '0.4rem',
    backdropFilter: 'blur(24px)',
    boxShadow: '0 16px 40px rgba(0,0,0,0.6)', zIndex: 100,
  },
  dropdownItem: (danger) => ({
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    width: '100%', padding: '0.6rem 0.75rem',
    background: 'none', border: 'none', borderRadius: 10, cursor: 'pointer',
    fontSize: '0.85rem', fontWeight: 500,
    color: danger ? '#f87171' : '#cbd5e1',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'background 0.15s, color 0.15s', textAlign: 'left',
  }),
  content: {
    flex: 1, overflow: 'auto', padding: '1.75rem',
    background: '#030d18',
  },
  hamburger: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 36, height: 36,
    background: 'rgba(0,230,118,0.06)',
    border: '1px solid rgba(0,230,118,0.12)',
    borderRadius: 9, cursor: 'pointer', color: '#cbd5e1',
    transition: 'background 0.2s',
  },
}

function NavItem({ item, active }) {
  const [hov, setHov] = useState(false)
  const Icon = item.icon
  const style = {
    ...S.navLink(active),
    ...(hov && !active ? {
      background: 'rgba(0,230,118,0.05)', color: '#cbd5e1',
      border: '1px solid rgba(0,230,118,0.08)',
    } : {}),
  }
  return (
    <Link to={item.href} style={style}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <Icon size={17} aria-hidden="true" />
      {item.name}
    </Link>
  )
}

export default function CompanyLayout() {
  const [sidebarOpen,      setSidebarOpen]      = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [companyName,      setCompanyName]      = useState('Company')
  const [userEmail,        setUserEmail]        = useState('')
  const [isDesktop,        setIsDesktop]        = useState(window.innerWidth >= 1024)

  const location = useLocation()
  const navigate  = useNavigate()
  const token     = getAuthToken()

  useEffect(() => {
    const h = () => setIsDesktop(window.innerWidth >= 1024)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getCompanyProfile(token)
        if (res?.data) {
          setCompanyName(res.data.companyName || 'Company')
          setUserEmail(res.data.email || '')
        }
      } catch { /* silent */ }
    }
    if (token) fetch()
  }, [token])

  const handleLogout = () => { clearAuth(); navigate('/login') }

  const navigation = [
    { name: 'Upload Reports', href: '/company/upload',    icon: Upload },
    { name: 'Dashboard',      href: '/company/dashboard', icon: BarChart3 },
    { name: 'Report History', href: '/company/history',   icon: History },
    { name: 'Settings',       href: '/company/settings',  icon: Settings },
  ]

  const isActive  = (p) => location.pathname === p
  const pageTitle = navigation.find(i => isActive(i.href))?.name || 'Dashboard'

  const SidebarContent = () => (
    <>
      <div style={S.logoArea}>
        <Link to="/" style={S.logoLink} aria-label="EcoLens home">
          <div style={S.logoIcon}><Leaf size={17} /></div>
          <div>
            <div>Eco<span style={{ color: G }}>Lens</span></div>
            <div style={S.portalBadge}>Company Portal</div>
          </div>
        </Link>
        {!isDesktop && (
          <button style={{ ...S.hamburger, marginLeft: 'auto' }} onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
            <X size={17} />
          </button>
        )}
      </div>
      <nav style={S.nav} aria-label="Company navigation">
        {navigation.map(item => (
          <NavItem key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </nav>
      <div style={S.userPanel}>
        <div style={S.userBox}>
          <div style={S.avatar}><Building size={14} style={{ color: '#030d18' }} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={S.userName} title={companyName}>
              {companyName.length > 18 ? companyName.slice(0, 18) + '…' : companyName}
            </div>
            <div style={S.userSub}>{userEmail || 'Company Portal'}</div>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <div style={S.root}>
      {sidebarOpen && !isDesktop && (
        <div style={S.backdrop} onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}

      <div style={isDesktop ? { ...S.sidebar(true), ...S.sidebarStatic } : S.sidebar(sidebarOpen)}>
        <SidebarContent />
      </div>

      <div style={S.main}>
        <header style={S.topBar} role="banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {!isDesktop && (
              <button style={S.hamburger} onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
                <Menu size={18} />
              </button>
            )}
            <div>
              <div style={S.pageTitle}>{pageTitle}</div>
              <div style={S.pageSub}>Manage your sustainability reports and insights</div>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <button style={S.userMenuBtn} onClick={() => setUserDropdownOpen(o => !o)}
              aria-label="User menu" aria-expanded={userDropdownOpen}>
              <div style={{ textAlign: 'right', lineHeight: 1.3 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ffffff' }}>{companyName}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{userEmail}</div>
              </div>
              <div style={{ ...S.avatar, width: 32, height: 32 }}>
                <Building size={14} style={{ color: '#030d18' }} />
              </div>
              <ChevronDown size={14} style={{ color: '#64748b' }} aria-hidden="true" />
            </button>

            {userDropdownOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setUserDropdownOpen(false)} aria-hidden="true" />
                <div style={S.dropdownMenu} role="menu">
                  <button style={S.dropdownItem(false)}
                    onClick={() => { setUserDropdownOpen(false); navigate('/company/settings') }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,230,118,0.07)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    role="menuitem">
                    <Settings size={14} /> Settings
                  </button>
                  <button style={S.dropdownItem(true)} onClick={handleLogout}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.07)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    role="menuitem">
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main style={S.content} id="main-content">
          <Outlet />
        </main>
      </div>

      {/* ═══ Comprehensive theme overrides — auto-themes all Tailwind portal pages ═══ */}
      <style>{`
        #main-content * { cursor: auto !important; }
        #main-content a, #main-content button, #main-content label,
        #main-content select, #main-content [role="button"] { cursor: pointer !important; }
        #main-content input[type="text"], #main-content input[type="email"],
        #main-content input[type="number"], #main-content input[type="password"],
        #main-content textarea { cursor: text !important; }

        /* ── Scrollbar ── */
        #main-content::-webkit-scrollbar { width: 5px; }
        #main-content::-webkit-scrollbar-track { background: #030d18; }
        #main-content::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #00e676, #16a34a); border-radius: 8px; }

        /* ── Base ── */
        #main-content { background: #030d18 !important; }

        /* ── Surfaces / Cards ── */
        #main-content .bg-white { background: rgba(7,35,61,0.75) !important; }
        #main-content .bg-gray-50 { background: rgba(5,26,46,0.85) !important; }
        #main-content .bg-gray-100 { background: rgba(0,230,118,0.06) !important; }
        #main-content .bg-gray-200 { background: rgba(255,255,255,0.07) !important; }

        /* ── Text ── */
        #main-content .text-gray-900 { color: #ffffff !important; }
        #main-content .text-gray-800 { color: #e2e8f0 !important; }
        #main-content .text-gray-700 { color: #cbd5e1 !important; }
        #main-content .text-gray-600 { color: #94a3b8 !important; }
        #main-content .text-gray-500 { color: #64748b !important; }
        #main-content .text-gray-400 { color: #475569 !important; }

        /* ── Borders ── */
        #main-content .border-gray-200 { border-color: rgba(0,230,118,0.1) !important; }
        #main-content .border-gray-300 { border-color: rgba(0,230,118,0.12) !important; }
        #main-content .border-gray-100 { border-color: rgba(0,230,118,0.07) !important; }

        /* ── Green / Emerald ── */
        #main-content .text-emerald-600,
        #main-content .text-emerald-500 { color: #00e676 !important; }
        #main-content .bg-emerald-600,
        #main-content .bg-emerald-500 { background: #00e676 !important; color: #030d18 !important; }
        #main-content .from-emerald-500 { --tw-gradient-from: #00e676 !important; }
        #main-content .to-emerald-600   { --tw-gradient-to:   #16a34a !important; }
        #main-content .bg-gradient-to-r.from-emerald-500.to-emerald-600 { background: linear-gradient(135deg, #00e676, #16a34a) !important; color: #030d18 !important; }
        #main-content .border-emerald-200 { border-color: rgba(0,230,118,0.2) !important; }
        #main-content .border-emerald-500 { border-color: rgba(0,230,118,0.4) !important; }
        #main-content .bg-emerald-50  { background: rgba(0,230,118,0.07) !important; }
        #main-content .text-emerald-900 { color: #ccffd8 !important; }
        #main-content .text-emerald-700 { color: #86efac !important; }
        #main-content .hover\\:bg-emerald-50:hover  { background: rgba(0,230,118,0.08) !important; }
        #main-content .hover\\:border-emerald-200:hover { border-color: rgba(0,230,118,0.22) !important; }
        #main-content .hover\\:bg-emerald-700:hover { background: #16a34a !important; }
        #main-content .focus\\:ring-emerald-500:focus { box-shadow: 0 0 0 3px rgba(0,230,118,0.25) !important; }

        /* ── Red / Error ── */
        #main-content .bg-red-50   { background: rgba(239,68,68,0.07) !important; }
        #main-content .bg-red-600  { background: #ef4444 !important; }
        #main-content .border-red-200 { border-color: rgba(239,68,68,0.2) !important; }
        #main-content .text-red-600, #main-content .text-red-700 { color: #f87171 !important; }
        #main-content .text-red-800, #main-content .text-red-900 { color: #fca5a5 !important; }
        #main-content .hover\\:bg-red-700:hover { background: #dc2626 !important; }

        /* ── Yellow / Amber ── */
        #main-content .bg-yellow-100  { background: rgba(245,158,11,0.1) !important; }
        #main-content .text-yellow-500 { color: #f59e0b !important; }
        #main-content .text-yellow-800 { color: #fbbf24 !important; }

        /* ── Blue / Teal ── */
        #main-content .bg-blue-100   { background: rgba(0,212,255,0.08) !important; }
        #main-content .text-blue-600 { color: #00d4ff !important; }
        #main-content .text-blue-800 { color: #7dd3fc !important; }

        /* ── Purple ── */
        #main-content .text-purple-600 { color: #a78bfa !important; }

        /* ── Inputs & Selects ── */
        #main-content input,
        #main-content select,
        #main-content textarea {
          background: rgba(5,26,46,0.9) !important;
          border-color: rgba(0,230,118,0.15) !important;
          color: #ffffff !important;
        }
        #main-content input:focus,
        #main-content select:focus,
        #main-content textarea:focus {
          border-color: rgba(0,230,118,0.4) !important;
          box-shadow: 0 0 0 3px rgba(0,230,118,0.1) !important;
          outline: none !important;
        }
        #main-content input::placeholder,
        #main-content textarea::placeholder { color: #475569 !important; }
        #main-content option { background: #051a2e; color: #ffffff; }

        /* ── Green (success) — separate from emerald ── */
        #main-content .bg-green-50   { background: rgba(0,230,118,0.07) !important; }
        #main-content .bg-green-100  { background: rgba(0,230,118,0.1) !important; }
        #main-content .text-green-600,
        #main-content .text-green-700 { color: #00e676 !important; }
        #main-content .text-green-800,
        #main-content .text-green-900 { color: #86efac !important; }
        #main-content .border-green-200 { border-color: rgba(0,230,118,0.2) !important; }

        /* ── Amber / Orange ── */
        #main-content .bg-amber-50  { background: rgba(245,158,11,0.07) !important; }
        #main-content .bg-amber-100 { background: rgba(245,158,11,0.12) !important; }
        #main-content .text-amber-600,
        #main-content .text-amber-700 { color: #f59e0b !important; }
        #main-content .text-amber-800  { color: #fbbf24 !important; }
        #main-content .border-amber-200 { border-color: rgba(245,158,11,0.2) !important; }

        /* ── Indigo ── */
        #main-content .bg-indigo-50,
        #main-content .from-indigo-50  { background: rgba(99,102,241,0.07) !important; }
        #main-content .bg-indigo-100   { background: rgba(99,102,241,0.1) !important; }
        #main-content .text-indigo-600 { color: #00d4ff !important; }
        #main-content .border-indigo-100,
        #main-content .border-indigo-200 { border-color: rgba(0,212,255,0.12) !important; }

        /* ── Purple / Violet ── */
        #main-content .bg-purple-50  { background: rgba(167,139,250,0.07) !important; }
        #main-content .bg-purple-100 { background: rgba(167,139,250,0.12) !important; }
        #main-content .text-purple-700 { color: #c4b5fd !important; }
        #main-content .border-purple-200 { border-color: rgba(167,139,250,0.2) !important; }

        /* ── Opacity variants (e.g. bg-emerald-50/50, bg-blue-50/50) ── */
        #main-content [class*="bg-emerald-50\/"] { background: rgba(0,230,118,0.05) !important; }
        #main-content [class*="bg-blue-50\/"]    { background: rgba(0,212,255,0.05) !important; }
        #main-content [class*="bg-purple-50\/"]  { background: rgba(167,139,250,0.05) !important; }
        #main-content [class*="bg-gray-50\/"]    { background: rgba(5,26,46,0.6) !important; }
        #main-content [class*="bg-red-50\/"]     { background: rgba(239,68,68,0.05) !important; }
        #main-content [class*="bg-amber-50\/"]   { background: rgba(245,158,11,0.05) !important; }

        /* ── Gradient containers ── */
        #main-content [class*="from-slate-50"],
        #main-content [class*="from-blue-50"],
        #main-content [class*="from-indigo-50"],
        #main-content [class*="from-emerald-50"],
        #main-content [class*="from-green-50"],
        #main-content [class*="from-red-50"],
        #main-content [class*="from-rose-50"] { background: rgba(5,26,46,0.85) !important; }

        /* ── Dividers ── */
        #main-content .divide-y > * + *   { border-top-color: rgba(0,230,118,0.08) !important; }
        #main-content .divide-y.divide-gray-100 > * + * { border-top-color: rgba(0,230,118,0.07) !important; }
        #main-content .divide-y.divide-gray-200 > * + * { border-top-color: rgba(0,230,118,0.1) !important; }
        #main-content .border-l-4         { border-left-width: 4px; }
        #main-content .border-l-red-500   { border-left-color: #ef4444 !important; }
        #main-content .border-l-amber-500 { border-left-color: #f59e0b !important; }
        #main-content .border-l-blue-500  { border-left-color: #00d4ff !important; }

        /* ── Mode selector pills ── */
        #main-content .bg-blue-600 { background: #00d4ff !important; color: #030d18 !important; }
        #main-content .hover\:bg-blue-700:hover { background: #00c4ef !important; }
        #main-content .bg-blue-50  { background: rgba(0,212,255,0.07) !important; }
        #main-content .text-blue-700 { color: #00d4ff !important; }
        #main-content .border-blue-100 { border-color: rgba(0,212,255,0.1) !important; }

        /* ── Slate ── */
        #main-content .bg-slate-50 { background: rgba(5,26,46,0.85) !important; }

        /* ── White / transparent overlays ── */
        #main-content .bg-white\/80 { background: rgba(7,35,61,0.7) !important; }

        /* ── disabled:bg-gray-400 for buttons ── */
        #main-content button:disabled { background: rgba(100,116,139,0.4) !important; color: #64748b !important; }

        /* ── Hover states ── */
        #main-content .hover\\:bg-gray-50:hover { background: rgba(0,230,118,0.05) !important; }
        #main-content .hover\\:bg-red-50:hover   { background: rgba(239,68,68,0.08) !important; }
        #main-content .hover\\:bg-amber-50:hover { background: rgba(245,158,11,0.08) !important; }

        /* ── Recharts ── */
        #main-content .recharts-cartesian-grid-horizontal line,
        #main-content .recharts-cartesian-grid-vertical line { stroke: rgba(0,230,118,0.07) !important; }
        #main-content .recharts-text,
        #main-content .recharts-label { fill: #94a3b8 !important; }
        #main-content .recharts-default-tooltip {
          background: rgba(5,26,46,0.97) !important;
          border: 1px solid rgba(0,230,118,0.2) !important;
          border-radius: 10px !important;
          color: #ffffff !important;
        }
        #main-content .recharts-tooltip-label { color: #ffffff !important; }
        #main-content .recharts-legend-item-text { color: #94a3b8 !important; }

        /* ── Loading states ── */
        #main-content .min-h-screen { background: #030d18 !important; }

        /* ── Rounded cards ── */
        #main-content .rounded-2xl,
        #main-content .rounded-3xl { backdrop-filter: blur(8px); }

        /* ── Shadow ── */
        #main-content .shadow-sm { box-shadow: 0 2px 16px rgba(0,0,0,0.5) !important; }
        #main-content .shadow-lg { box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important; }

        /* ── Card lift ── */
        .portal-card { transition: transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s ease; }
        .portal-card:hover { transform: translateY(-3px); box-shadow: 0 16px 40px rgba(0,0,0,0.5) !important; }

        /* ── Progress bars ── */
        #main-content .bg-gray-200.rounded-full { background: rgba(0,230,118,0.08) !important; }

        /* ── Dashed border upload zone ── */
        #main-content .border-dashed { border-color: rgba(0,230,118,0.25) !important; }
        #main-content .border-dashed:hover { border-color: rgba(0,230,118,0.45) !important; }

        /* ── Scale hover ── */
        #main-content .hover\\:scale-105:hover { transform: scale(1.05) !important; }
        #main-content .hover\\:scale-\\[1\\.02\\]:hover { transform: scale(1.02) !important; }

        /* ── Transitions ── */
        #main-content .transition-colors { transition: color 0.2s, background-color 0.2s, border-color 0.2s !important; }
        #main-content .transition-all    { transition: all 0.25s ease !important; }
      `}</style>
    </div>
  )
}