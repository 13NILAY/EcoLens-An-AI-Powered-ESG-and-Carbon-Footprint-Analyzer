import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Leaf, ArrowRight, Globe, Building, TrendingUp,
  CheckCircle, ChevronDown, BarChart3, Eye, Zap, Brain, Upload
} from 'lucide-react';
import * as THREE from 'three';
import bgImage from '../assets/BackgroundImage.avif';

/* ══════════════════════════════════════════════════════════════
   DESIGN TOKENS — Bright & Clean (navy + electric green)
══════════════════════════════════════════════════════════════ */
const C = {
  bg:        '#030d18',   // deep navy void
  bgMid:     '#051a2e',   // section bg
  bgCard:    '#07233d',   // card surface
  bgBorder:  'rgba(0,230,118,0.12)',

  green:     '#00e676',   // electric bright green
  greenMid:  '#22c55e',   // medium green
  greenDim:  '#16a34a',   // hover green
  teal:      '#00d4ff',   // bright teal accent

  white:     '#ffffff',
  whiteD:    '#cbd5e1',
  whiteFaint:'#64748b',
};

/* ══════════════════════════════════════════════════════════════
   NATURE CURSOR (bright green)
══════════════════════════════════════════════════════════════ */
function NatureCursor() {
  const circleRef = useRef(null);
  const dotRef    = useRef(null);
  const mouse     = useRef({ x:-200, y:-200 });
  const trail     = useRef({ x:-200, y:-200 });
  const raf       = useRef(null);

  useEffect(() => {
    const onMove = e => {
      mouse.current = { x: e.clientX, y: e.clientY };
      const isLink = e.target.closest('a, button, [role="button"], select, input');
      circleRef.current?.classList.toggle('nc-hover', !!isLink);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    const loop = () => {
      if (circleRef.current) {
        circleRef.current.style.left = `${mouse.current.x}px`;
        circleRef.current.style.top  = `${mouse.current.y}px`;
      }
      trail.current.x += (mouse.current.x - trail.current.x) * 0.1;
      trail.current.y += (mouse.current.y - trail.current.y) * 0.1;
      if (dotRef.current) {
        dotRef.current.style.left = `${trail.current.x}px`;
        dotRef.current.style.top  = `${trail.current.y}px`;
      }
      raf.current = requestAnimationFrame(loop);
    };
    loop();
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf.current); };
  }, []);

  return (
    <>
      <div ref={circleRef} className="nc-ring"  aria-hidden="true" />
      <div ref={dotRef}    className="nc-dot"   aria-hidden="true" />
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   HERO PARTICLES — LIGHTWEIGHT (50 pts, simple drift)
══════════════════════════════════════════════════════════════ */
function HeroParticles({ canvasRef }) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(1);   // cap at 1 for speed
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setClearColor(0x000000, 0);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 500);
    camera.position.z = 26;

    const COUNT = 50;
    const geo   = new THREE.BufferGeometry();
    const pos   = new Float32Array(COUNT * 3);
    const col   = new Float32Array(COUNT * 3);
    const vY    = new Float32Array(COUNT);
    const vX    = new Float32Array(COUNT);
    const g = new THREE.Color(C.green);
    const t = new THREE.Color(C.teal);

    for (let i = 0; i < COUNT; i++) {
      pos[i*3]   = (Math.random()-.5)*55;
      pos[i*3+1] = (Math.random()-.5)*38;
      pos[i*3+2] = (Math.random()-.5)*6;
      vY[i]      = Math.random()*0.045 + 0.012;
      vX[i]      = (Math.random()-.5)*0.012;
      const c    = Math.random()>.4 ? g : t;
      col[i*3]=c.r; col[i*3+1]=c.g; col[i*3+2]=c.b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({ size:.3, vertexColors:true, transparent:true, opacity:.65, sizeAttenuation:true });
    scene.add(new THREE.Points(geo, mat));

    let raf;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const p = geo.attributes.position.array;
      for (let i = 0; i < COUNT; i++) {
        p[i*3]   += vX[i];
        p[i*3+1] += vY[i];
        if (p[i*3+1] > 20) { p[i*3]=(Math.random()-.5)*55; p[i*3+1]=-20; }
      }
      geo.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    };
    tick();

    const onResize = () => {
      if (!canvas.clientWidth) return;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); renderer.dispose(); geo.dispose(); mat.dispose(); };
  }, [canvasRef]);

  return null;
}

/* ══════════════════════════════════════════════════════════════
   WIREFRAME GLOBE — lightweight, low-poly (mission section)
══════════════════════════════════════════════════════════════ */
function ThreeGlobe({ mountRef }) {
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const W = el.clientWidth||340, H = el.clientHeight||340;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setPixelRatio(1);
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W/H, 0.1, 500);
    camera.position.z = 4;

    // Outer bright green wireframe
    const g1 = new THREE.SphereGeometry(1.4, 18, 18);
    const m1 = new THREE.MeshBasicMaterial({ color: 0x00e676, wireframe: true, transparent: true, opacity: 0.5 });
    const s1 = new THREE.Mesh(g1, m1); scene.add(s1);

    // Inner teal wireframe
    const g2 = new THREE.SphereGeometry(1.05, 12, 12);
    const m2 = new THREE.MeshBasicMaterial({ color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.15 });
    const s2 = new THREE.Mesh(g2, m2); scene.add(s2);

    // Equatorial ring
    const gr = new THREE.TorusGeometry(1.7, 0.011, 6, 56);
    const mr = new THREE.MeshBasicMaterial({ color: 0x00e676, transparent: true, opacity: 0.35 });
    const ring = new THREE.Mesh(gr, mr);
    ring.rotation.x = Math.PI / 3.2; scene.add(ring);

    let raf;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      s1.rotation.y += 0.003; s1.rotation.x += 0.0007;
      s2.rotation.y -= 0.004;
      ring.rotation.z += 0.005;
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      try { el.removeChild(renderer.domElement); } catch {}
      renderer.dispose();
    };
  }, [mountRef]);

  return null;
}

/* ══════════════════════════════════════════════════════════════
   WAVY SVG DIVIDER
══════════════════════════════════════════════════════════════ */
function Wave({ fill, flip=false, style={} }) {
  return (
    <div style={{ lineHeight:0, transform: flip?'scaleX(-1)':'none', ...style }}>
      <svg viewBox="0 0 1440 64" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display:'block', width:'100%' }}>
        <path d="M0,32 C200,64 400,0 600,32 C800,64 1000,4 1200,32 C1320,52 1400,18 1440,32 L1440,64 L0,64 Z" fill={fill}/>
      </svg>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   LOADING SCREEN — fast, lightweight
══════════════════════════════════════════════════════════════ */
function LoadingScreen({ onDone }) {
  const [prog, setProg]     = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const iv = setInterval(() => {
      setProg(p => {
        if (p >= 100) {
          clearInterval(iv);
          setTimeout(() => setFadeOut(true), 150);
          setTimeout(onDone, 550);
          return 100;
        }
        return Math.min(p + (p<60?3.5:p<85?2:1.2), 100);
      });
    }, 30);
    return () => clearInterval(iv);
  }, [onDone]);

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background: C.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1.75rem', opacity:fadeOut?0:1, transition:'opacity 0.5s ease', pointerEvents:fadeOut?'none':'all' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'0.7rem', fontFamily:"'Cormorant Garamond', serif", fontSize:'2rem', fontWeight:700, color: C.white }}>
        <Leaf size={30} style={{ color: C.green, animation:'leafPulse 1.5s ease-in-out infinite' }} />
        Eco<span style={{ color: C.green }}>Lens</span>
      </div>
      <div style={{ width:200, height:2, background:'rgba(255,255,255,0.06)', borderRadius:2, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${prog}%`, background:`linear-gradient(90deg, ${C.green}, ${C.teal})`, borderRadius:2, transition:'width 0.08s linear' }} />
      </div>
      <p style={{ fontSize:'0.72rem', color: C.whiteFaint, letterSpacing:'0.12em', textTransform:'uppercase' }}>Loading environment…</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   HOMEPAGE
══════════════════════════════════════════════════════════════ */
export default function Homepage() {
  const [loaded,   setLoaded]   = useState(false);
  const [mounted,  setMounted]  = useState(false);
  const [scrollY,  setScrollY]  = useState(0);
  const [mouse,    setMouse]    = useState({ x:0, y:0 });
  const [portal,   setPortal]   = useState('company');

  const bgRef       = useRef(null);
  const particleRef = useRef(null);
  const globeRef    = useRef(null);

  useEffect(() => { if (loaded) setTimeout(() => setMounted(true), 60); }, [loaded]);

  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', h, { passive:true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    const h = e => setMouse({ x:(e.clientX/window.innerWidth-.5), y:(e.clientY/window.innerHeight-.5) });
    window.addEventListener('mousemove', h, { passive:true });
    return () => window.removeEventListener('mousemove', h);
  }, []);

  // Parallax BG
  useEffect(() => {
    if (!bgRef.current) return;
    bgRef.current.style.transform = `translate(${mouse.x*22}px, ${mouse.y*14 - scrollY*0.38}px) scale(1.15)`;
  }, [scrollY, mouse]);

  // Scroll reveal
  useEffect(() => {
    if (!loaded) return;
    const els = document.querySelectorAll('[data-reveal]');
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('el-visible'); obs.unobserve(e.target); } }),
      { threshold: 0.1, rootMargin:'0px 0px -20px 0px' }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [loaded]);

  // Magnetic
  const mag = (e, el) => {
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.transform  = `translate(${(e.clientX-r.left-r.width/2)*0.28}px,${(e.clientY-r.top-r.height/2)*0.28}px)`;
    el.style.transition = 'transform 0.1s ease';
  };
  const resetMag = el => {
    if (!el) return;
    el.style.transform  = 'translate(0,0)';
    el.style.transition = 'transform 0.55s cubic-bezier(0.16,1,0.3,1)';
  };

  // 3D tilt
  const tilt = (e, el) => {
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX-r.left)/r.width-.5;
    const y = (e.clientY-r.top)/r.height-.5;
    el.style.transform  = `perspective(900px) rotateY(${x*12}deg) rotateX(${-y*12}deg) translateZ(8px)`;
    el.style.transition = 'transform 0.08s ease';
  };
  const resetTilt = el => {
    if (!el) return;
    el.style.transform  = 'perspective(900px) rotateY(0) rotateX(0) translateZ(0)';
    el.style.transition = 'transform 0.6s cubic-bezier(0.16,1,0.3,1)';
  };

  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior:'smooth' });

  /* Feature data */
  const companyFeats = [
    { icon:Upload,    title:'Report Upload',    desc:'PDF & CSV ingestion with AI-powered data extraction',       col:C.green },
    { icon:BarChart3, title:'Carbon Analysis',  desc:'Scope 1, 2, 3 emissions breakdown with benchmarking',       col:C.teal },
    { icon:Brain,     title:'AI Insights',      desc:'ML recommendations to reduce your environmental impact',    col:'#a78bfa' },
    { icon:Eye,       title:'ESG Scoring',      desc:'Transparent Environmental, Social, Governance scoring',     col:'#f59e0b' },
  ];
  const investorFeats = [
    { icon:TrendingUp, title:'Live Rankings',     desc:'Real-time ESG performance across all sectors',          col:C.green },
    { icon:Globe,      title:'Sentiment NLP',     desc:'AI-powered global news & social media monitoring',       col:C.teal },
    { icon:BarChart3,  title:'Portfolio Builder', desc:'Construct ethical, sustainable investment portfolios',   col:'#a78bfa' },
    { icon:Zap,        title:'Company Comparison',desc:'Side-by-side ESG analysis and ranking comparisons',     col:'#f59e0b' },
  ];
  const feats = portal === 'company' ? companyFeats : investorFeats;

  return (
    <div style={{ background: C.bg, color: C.white, fontFamily:"'DM Sans', system-ui, sans-serif", overflowX:'hidden', cursor:'none' }}>

      {!loaded && <LoadingScreen onDone={() => setLoaded(true)} />}
      {loaded && <NatureCursor />}

      {/* ── Subtle noise grain ── */}
      <div className="eg-noise" aria-hidden="true" />

      {/* ════════════════ NAV ════════════════ */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        background: scrollY>70 ? 'rgba(3,13,24,0.92)' : 'transparent',
        backdropFilter: scrollY>70 ? 'blur(22px)' : 'none',
        borderBottom: `1px solid ${scrollY>70 ? 'rgba(0,230,118,0.1)' : 'transparent'}`,
        transition:'all 0.4s ease',
        opacity: mounted?1:0, transform: mounted?'translateY(0)':'translateY(-18px)',
      }}>
        <div style={{ maxWidth:1220, margin:'0 auto', padding:'0.9rem 1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem' }}>
          <Link to="/" style={{ display:'flex', alignItems:'center', gap:'0.6rem', textDecoration:'none', fontFamily:"'Cormorant Garamond',serif", fontSize:'1.45rem', fontWeight:700, color:C.white, letterSpacing:'-0.01em' }}>
            <div style={{ width:34, height:34, background:'rgba(0,230,118,0.1)', border:'1px solid rgba(0,230,118,0.25)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', color:C.green }}>
              <Leaf size={18}/>
            </div>
            Eco<span style={{ color:C.green }}>Lens</span>
          </Link>

          <div style={{ display:'flex', gap:'0.1rem' }} className="eg-nav-links">
            {[['home','Home'],['mission','Mission'],['portals','Features'],['pipeline','Process']].map(([id,label]) => (
              <button key={id} onClick={()=>scrollTo(id)} style={{ background:'none', border:'none', color:C.whiteD, fontSize:'0.875rem', fontWeight:500, padding:'0.5rem 0.9rem', borderRadius:8, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", transition:'color 0.2s' }}
                onMouseEnter={e=>e.currentTarget.style.color=C.white}
                onMouseLeave={e=>e.currentTarget.style.color=C.whiteD}>
                {label}
              </button>
            ))}
          </div>

          <div style={{ display:'flex', gap:'0.65rem', alignItems:'center' }}>
            <Link to="/login" style={{ fontSize:'0.875rem', fontWeight:500, color:C.whiteD, textDecoration:'none', padding:'0.45rem 0.85rem', transition:'color 0.2s' }}
              onMouseEnter={e=>e.currentTarget.style.color=C.white}
              onMouseLeave={e=>e.currentTarget.style.color=C.whiteD}>
              Sign In
            </Link>
            <Link to="/signup"
              onMouseMove={e=>mag(e,e.currentTarget)}
              onMouseLeave={e=>{ resetMag(e.currentTarget); e.currentTarget.style.boxShadow=`0 4px 18px rgba(0,230,118,0.3)`; }}
              style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', fontSize:'0.875rem', fontWeight:700, color:'#030d18', background:C.green, textDecoration:'none', padding:'0.55rem 1.15rem', borderRadius:9999, boxShadow:`0 4px 18px rgba(0,230,118,0.3)`, transition:'all 0.25s' }}
              onMouseEnter={e=>Object.assign(e.currentTarget.style,{ background:'#33ffaa', boxShadow:`0 6px 28px rgba(0,230,118,0.5)` })}>
              Get Started <ArrowRight size={13}/>
            </Link>
          </div>
        </div>
      </nav>

      {/* ════════════════ HERO ════════════════ */}
      <section id="home" style={{ position:'relative', height:'100svh', minHeight:600, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
        {/* Background image with parallax */}
        <div ref={bgRef} style={{ position:'absolute', inset:'-16%', backgroundImage:`url(${bgImage})`, backgroundSize:'cover', backgroundPosition:'center', zIndex:0, willChange:'transform' }} />

        {/* Lighter overlay — less dark so image breathes */}
        <div style={{ position:'absolute', inset:0, zIndex:1, background:'linear-gradient(180deg, rgba(3,13,24,0.65) 0%, rgba(3,13,24,0.1) 30%, rgba(3,13,24,0.1) 62%, rgba(3,13,24,0.88) 100%)' }} />

        {/* Vignette */}
        <div className="hero-vignette" style={{ position:'absolute', inset:0, zIndex:2, background:'radial-gradient(ellipse at center, transparent 45%, rgba(3,13,24,0.6) 100%)', pointerEvents:'none' }} />

        {/* Bright green ambient glow */}
        <div style={{ position:'absolute', width:700, height:700, bottom:'-10%', right:'-8%', background:`radial-gradient(circle, rgba(0,230,118,0.07) 0%, transparent 65%)`, zIndex:2, pointerEvents:'none', filter:'blur(60px)' }} />
        <div style={{ position:'absolute', width:500, height:500, top:'-5%', left:'-5%', background:`radial-gradient(circle, rgba(0,212,255,0.05) 0%, transparent 65%)`, zIndex:2, pointerEvents:'none', filter:'blur(60px)' }} />

        {/* Three.js particles */}
        <canvas ref={particleRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', zIndex:3, pointerEvents:'none' }} aria-hidden="true" />
        {loaded && <HeroParticles canvasRef={particleRef} />}

        {/* Hero content */}
        <div style={{ position:'relative', zIndex:5, textAlign:'center', maxWidth:880, margin:'0 auto', padding:'8rem 1.5rem 5rem' }}>
          {/* Label badge */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', fontSize:'0.72rem', fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:C.green, background:'rgba(0,230,118,0.08)', border:`1px solid rgba(0,230,118,0.22)`, padding:'0.4rem 1rem', borderRadius:9999, marginBottom:'1.8rem', opacity:mounted?1:0, transform:mounted?'translateY(0)':'translateY(16px)', transition:'opacity 0.8s ease 0.3s, transform 0.8s ease 0.3s' }}>
            <Leaf size={10}/>
            Environmental Intelligence Platform
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(2.8rem, 7.5vw, 6rem)', fontWeight:700, color:C.white, lineHeight:1.04, letterSpacing:'-0.025em', marginBottom:'1.5rem', opacity:mounted?1:0, transform:mounted?'translateY(0)':'translateY(30px)', transition:'opacity 0.9s ease 0.5s, transform 0.9s ease 0.5s' }}>
            See the World Through
            <span style={{ display:'block', background:`linear-gradient(135deg, ${C.green}, ${C.teal})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', fontStyle:'italic' }}>
              Nature's Eyes
            </span>
          </h1>

          {/* Subtext */}
          <p style={{ fontSize:'clamp(1rem, 2.3vw, 1.2rem)', color:C.whiteD, lineHeight:1.8, maxWidth:560, margin:'0 auto 2.5rem', opacity:mounted?1:0, transform:mounted?'translateY(0)':'translateY(18px)', transition:'opacity 0.85s ease 0.7s, transform 0.85s ease 0.7s' }}>
          Transforming Sustainability Data into Actionable Insights
          </p>

          {/* CTAs */}
          <div style={{ display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap', opacity:mounted?1:0, transform:mounted?'translateY(0)':'translateY(14px)', transition:'opacity 0.8s ease 0.9s, transform 0.8s ease 0.9s' }}>
            <Link to="/signup">
              <button
                className="eg-btn-primary"
                onMouseMove={e=>mag(e,e.currentTarget)} onMouseLeave={e=>resetMag(e.currentTarget)}
                style={{ display:'inline-flex', alignItems:'center', gap:'0.65rem', fontFamily:"'DM Sans',sans-serif", fontSize:'1rem', fontWeight:700, color:'#030d18', background:C.green, border:'none', cursor:'pointer', padding:'0.95rem 2.2rem', borderRadius:9999, boxShadow:`0 8px 30px rgba(0,230,118,0.35)`, transition:'all 0.3s ease', position:'relative', overflow:'hidden' }}
                onMouseEnter={e=>Object.assign(e.currentTarget.style,{ background:'#33ffaa', boxShadow:`0 14px 40px rgba(0,230,118,0.55)`, transform:'scale(1.04)' })}
                onMouseLeave={e=>Object.assign(e.currentTarget.style,{ background:C.green, boxShadow:`0 8px 30px rgba(0,230,118,0.35)`, transform:'scale(1)' })}
              >
                <Leaf size={17}/> Explore EcoLens <ArrowRight size={15}/>
              </button>
            </Link>
            <button onClick={()=>scrollTo('mission')}
              onMouseMove={e=>mag(e,e.currentTarget)} onMouseLeave={e=>resetMag(e.currentTarget)}
              style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', fontFamily:"'DM Sans',sans-serif", fontSize:'1rem', fontWeight:600, color:C.whiteD, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.15)', cursor:'pointer', padding:'0.95rem 2rem', borderRadius:9999, transition:'all 0.3s ease' }}
              onMouseEnter={e=>Object.assign(e.currentTarget.style,{ color:C.white, background:'rgba(255,255,255,0.1)', borderColor:'rgba(255,255,255,0.3)' })}
              onMouseLeave={e=>Object.assign(e.currentTarget.style,{ color:C.whiteD, background:'rgba(255,255,255,0.06)', borderColor:'rgba(255,255,255,0.15)' })}
            >
              Learn More <ChevronDown size={16}/>
            </button>
          </div>

          {/* Micro-copy */}
          <div style={{ display:'flex', gap:'1.5rem', justifyContent:'center', marginTop:'2.25rem', flexWrap:'wrap', opacity:mounted?1:0, transition:'opacity 0.8s ease 1.1s' }}>
            {['11 ESG Metrics Tracked','AI-Powered ESG Analysis','NLP-Based News Sentiment'].map((t,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.35rem', fontSize:'0.77rem', color:C.whiteFaint }}>
                <Leaf size={10} style={{ color:C.green }}/>{t}
              </div>
            ))}
          </div>
        </div>

        {/* Scroll cue */}
        <div style={{ position:'absolute', bottom:'1.75rem', left:'50%', transform:'translateX(-50%)', zIndex:5, display:'flex', flexDirection:'column', alignItems:'center', gap:'0.4rem', color:C.whiteFaint, fontSize:'0.67rem', letterSpacing:'0.1em', textTransform:'uppercase', opacity:mounted?1:0, transition:'opacity 0.8s ease 1.3s' }}>
          <ChevronDown size={19} className="eg-bounce"/>
          Scroll to explore
        </div>
      </section>

     

      {/* ════════════════ WAVE → MISSION ════════════════ */}
      <Wave fill={C.bgMid} style={{ background:'rgba(5,26,46,0.98)', marginTop:'-1px' }}/>

      {/* ════════════════ MISSION ════════════════ */}
      <section id="mission" style={{ background:C.bgMid, padding:'clamp(5rem,10vw,9rem) 0', position:'relative', overflow:'hidden' }}>
        {/* Bright ambient glow */}
        <div style={{ position:'absolute', width:500, height:500, top:'-10%', right:'-8%', background:`radial-gradient(circle, rgba(0,230,118,0.06) 0%, transparent 70%)`, filter:'blur(60px)', pointerEvents:'none' }}/>

        <div style={{ maxWidth:1220, margin:'0 auto', padding:'0 1.5rem', display:'grid', gridTemplateColumns:'1fr', gap:'3.5rem', alignItems:'center' }} className="eg-mission-grid">
          {/* Left text */}
          <div data-reveal className="earth-reveal">
            <div style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', fontSize:'0.7rem', fontWeight:600, color:C.teal, background:'rgba(0,212,255,0.08)', border:`1px solid rgba(0,212,255,0.22)`, padding:'0.35rem 0.85rem', borderRadius:9999, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:'1.25rem' }}>
              <Globe size={10}/> Our Mission
            </div>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(2rem,5vw,3.6rem)', fontWeight:700, color:C.white, letterSpacing:'-0.025em', lineHeight:1.08, marginBottom:'1.2rem' }}>
              Transforming ESG Reports into{' '}
              <span style={{ background:`linear-gradient(135deg, ${C.green}, ${C.teal})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', fontStyle:'italic', display:'block' }}>
                Actionable Insights
              </span>
            </h2>
            <p style={{ fontSize:'1rem', color:C.whiteD, lineHeight:1.82, maxWidth:520, marginBottom:'1.6rem' }}>
              EcoLens uses AI and NLP to analyze sustainability reports, calculate ESG scores, monitor public sentiment, and help investors identify sustainable companies.
            </p>
            {['AI-powered ESG score calculation','Carbon Scope 1, 2 & 3 analysis','Real-time news sentiment monitoring','11 ESG Metrics Extraction'].map((f,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'0.65rem', fontSize:'0.9rem', color:C.whiteD }}>
                <CheckCircle size={13} style={{ color:C.green, flexShrink:0 }}/>{f}
              </div>
            ))}
            <div style={{ display:'flex', gap:'0.75rem', marginTop:'2rem', flexWrap:'wrap' }}>
              <Link to="/company">
                <button onMouseMove={e=>mag(e,e.currentTarget)} onMouseLeave={e=>resetMag(e.currentTarget)}
                  style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', padding:'0.8rem 1.65rem', background:C.green, color:'#030d18', border:'none', borderRadius:9999, fontWeight:700, fontSize:'0.9rem', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", boxShadow:`0 4px 18px rgba(0,230,118,0.3)`, transition:'all 0.3s' }}
                  onMouseEnter={e=>Object.assign(e.currentTarget.style,{ background:'#33ffaa', boxShadow:`0 8px 28px rgba(0,230,118,0.45)` })}
                  onMouseLeave={e=>Object.assign(e.currentTarget.style,{ background:C.green, boxShadow:`0 4px 18px rgba(0,230,118,0.3)` })}>
                  <Building size={15}/> Company Portal
                </button>
              </Link>
              <Link to="/investor">
                <button onMouseMove={e=>mag(e,e.currentTarget)} onMouseLeave={e=>resetMag(e.currentTarget)}
                  style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', padding:'0.8rem 1.65rem', background:'rgba(0,212,255,0.09)', color:C.teal, border:`1px solid rgba(0,212,255,0.28)`, borderRadius:9999, fontWeight:600, fontSize:'0.9rem', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", transition:'all 0.3s' }}
                  onMouseEnter={e=>Object.assign(e.currentTarget.style,{ background:'rgba(0,212,255,0.18)', boxShadow:`0 6px 24px rgba(0,212,255,0.2)` })}
                  onMouseLeave={e=>Object.assign(e.currentTarget.style,{ background:'rgba(0,212,255,0.09)', boxShadow:'none' })}>
                  <TrendingUp size={15}/> Investor Portal
                </button>
              </Link>
            </div>
          </div>

          {/* 3D Globe */}
          <div data-reveal className="earth-reveal" style={{ display:'flex', justifyContent:'center' }}>
            <div ref={globeRef} style={{ width:'100%', maxWidth:360, aspectRatio:'1', borderRadius:'50%', overflow:'hidden', background:`radial-gradient(circle at 38% 38%, rgba(0,230,118,0.05) 0%, transparent 70%)` }} aria-hidden="true">
              {loaded && <ThreeGlobe mountRef={globeRef}/>}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ WAVE → FEATURES ════════════════ */}
      <Wave fill={C.bgCard} flip style={{ background:C.bgMid }}/>

      {/* ════════════════ FEATURES ════════════════ */}
      <section id="portals" style={{ background:C.bgCard, padding:'clamp(5rem,10vw,8.5rem) 0', position:'relative', overflow:'hidden' }}>
        {/* Decorative big text */}
        <div aria-hidden="true" style={{ position:'absolute', top:'1rem', left:'50%', transform:'translateX(-50%)', fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(5rem,16vw,13rem)', fontWeight:700, color:'rgba(0,230,118,0.03)', letterSpacing:'-0.05em', whiteSpace:'nowrap', pointerEvents:'none', userSelect:'none' }}>EcoLens</div>

        <div style={{ maxWidth:1220, margin:'0 auto', padding:'0 1.5rem' }}>
          <div data-reveal className="earth-reveal" style={{ textAlign:'center', marginBottom:'3.5rem' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', fontSize:'0.7rem', fontWeight:600, color:C.green, background:'rgba(0,230,118,0.07)', border:`1px solid rgba(0,230,118,0.18)`, padding:'0.35rem 0.85rem', borderRadius:9999, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:'1rem' }}>
              <Leaf size={10}/> Platform Features
            </div>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(2rem,5vw,3.4rem)', fontWeight:700, color:C.white, letterSpacing:'-0.025em', lineHeight:1.1, marginBottom:'0.85rem' }}>
              Core Platform{' '}
              <span style={{ background:`linear-gradient(135deg, ${C.green}, ${C.teal})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', fontStyle:'italic' }}>Capabilities</span>
            </h2>
            <p style={{ fontSize:'1rem', color:C.whiteD, maxWidth:500, margin:'0 auto 2rem', lineHeight:1.72 }}>
              Two powerful portals — one for companies measuring impact, one for investors building tomorrow.
            </p>
            {/* Toggle */}
            <div style={{ display:'inline-flex', gap:'0.25rem', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'0.28rem' }}>
              {[
                { id:'company', icon:Building, label:'For Companies' },
                { id:'investor',icon:TrendingUp,label:'For Investors' },
              ].map(({id,icon:Icon,label})=>(
                <button key={id} onClick={()=>setPortal(id)} style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', padding:'0.58rem 1.3rem', borderRadius:10, border: portal===id ? `1px solid rgba(0,230,118,0.28)` : '1px solid transparent', fontSize:'0.875rem', fontWeight:500, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", background: portal===id ? 'rgba(0,230,118,0.1)' : 'transparent', color: portal===id ? C.green : C.whiteFaint, transition:'all 0.3s' }}>
                  <Icon size={14}/> {label}
                </button>
              ))}
            </div>
          </div>

          {/* 3D tilt feature cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(230px, 1fr))', gap:'1.15rem' }}>
            {feats.map((f,i)=>{
              const Icon = f.icon;
              return (
                <div key={`${portal}-${i}`} data-reveal className="earth-reveal eg-card"
                  style={{ padding:'1.75rem', background:'rgba(5,26,46,0.8)', border:`1px solid rgba(0,230,118,0.08)`, borderRadius:'1.75rem', backdropFilter:'blur(12px)', transformStyle:'preserve-3d', transition:'border-color 0.3s, box-shadow 0.3s', animationDelay:`${i*0.07}s` }}
                  onMouseMove={e=>tilt(e,e.currentTarget)}
                  onMouseLeave={e=>{ resetTilt(e.currentTarget); e.currentTarget.style.borderColor='rgba(0,230,118,0.08)'; e.currentTarget.style.boxShadow='none'; }}
                  onMouseEnter={e=>{ e.currentTarget.style.borderColor=`rgba(0,230,118,0.22)`; e.currentTarget.style.boxShadow=`0 20px 56px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,230,118,0.08)`; }}
                >
                  <div style={{ width:44, height:44, background:`${f.col}14`, border:`1px solid ${f.col}28`, borderRadius:13, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'1rem', color:f.col }}>
                    <Icon size={20}/>
                  </div>
                  <h4 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.18rem', fontWeight:700, color:C.white, marginBottom:'0.5rem', letterSpacing:'-0.01em' }}>{f.title}</h4>
                  <p style={{ fontSize:'0.855rem', color:C.whiteD, lineHeight:1.68 }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════ WAVE → PIPELINE ════════════════ */}
      <Wave fill={C.bgMid} style={{ background:C.bgCard }}/>

      {/* ════════════════ PIPELINE — CSS-based (no Three.js terrain) ════════════════ */}
      <section id="pipeline" style={{ background:C.bgMid, padding:'clamp(4.5rem,9vw,7.5rem) 0', position:'relative', overflow:'hidden' }}>
        {/* Animated gradient pulse strip */}
        <div style={{ position:'absolute', top:'50%', left:0, right:0, height:1, background:`linear-gradient(90deg, transparent, ${C.green}30, transparent)`, transform:'translateY(-50%)', animation:'pulseLine 4s ease-in-out infinite', pointerEvents:'none' }}/>

        <div style={{ maxWidth:1220, margin:'0 auto', padding:'0 1.5rem' }}>
          <div data-reveal className="earth-reveal" style={{ textAlign:'center', marginBottom:'3rem' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', fontSize:'0.7rem', fontWeight:600, color:C.teal, background:'rgba(0,212,255,0.07)', border:`1px solid rgba(0,212,255,0.18)`, padding:'0.35rem 0.85rem', borderRadius:9999, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:'1rem' }}>
              <Zap size={10}/> Intelligence Pipeline
            </div>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(2rem,5vw,3.4rem)', fontWeight:700, color:C.white, letterSpacing:'-0.025em', lineHeight:1.1 }}>
              From Raw Data to{' '}
              <span style={{ background:`linear-gradient(135deg, ${C.teal}, ${C.green})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', fontStyle:'italic' }}>
                Living Insight
              </span>
            </h2>
          </div>

          {/* CSS pipeline visual */}
          <div data-reveal className="earth-reveal" style={{ position:'relative', padding:'2.5rem 1.5rem', background:'rgba(7,35,61,0.7)', border:`1px solid rgba(0,230,118,0.1)`, borderRadius:'2rem', marginBottom:'2.5rem', overflow:'hidden' }}>
            {/* Grid pattern */}
            <div style={{ position:'absolute', inset:0, backgroundImage:`radial-gradient(rgba(0,230,118,0.06) 1px, transparent 1px)`, backgroundSize:'28px 28px', pointerEvents:'none' }}/>
            {/* Glowing line */}
            <div className="eg-pipeline-line" style={{ position:'relative', height:3, background:`linear-gradient(90deg, ${C.green}18, ${C.green}, ${C.teal}, ${C.green}18)`, borderRadius:4, marginBottom:'1.5rem', boxShadow:`0 0 20px rgba(0,230,118,0.4)` }}>
              {[0,1,2,3,4].map(i => (
                <div key={i} className="eg-pipeline-dot" style={{ position:'absolute', top:'50%', left:`${i*25}%`, transform:'translate(-50%,-50%)', width:14, height:14, background:`radial-gradient(circle, ${i%2===0?C.green:C.teal}, #030d18)`, borderRadius:'50%', border:`2px solid ${i%2===0?C.green:C.teal}`, boxShadow:`0 0 12px ${i%2===0?'rgba(0,230,118,0.7)':'rgba(0,212,255,0.7)'}`, animationDelay:`${i*0.4}s` }}/>
              ))}
            </div>
            {/* Labels */}
            <div style={{ display:'flex', justifyContent:'space-between', gap:'0.5rem', flexWrap:'wrap' }}>
              {['Report Upload','AI Extraction','Sentiment NLP','ESG Scoring','Insight Output'].map((label,i)=>(
                <div key={i} style={{ textAlign:'center', flex:1, minWidth:100 }}>
                  <div style={{ fontSize:'0.78rem', fontWeight:600, color: i%2===0 ? C.green : C.teal }}>{`0${i+1}`}</div>
                  <div style={{ fontSize:'0.82rem', color:C.white, fontWeight:500, marginTop:'0.2rem' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Step cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(165px, 1fr))', gap:'1rem' }}>
            {[
              { n:'01', title:'Upload',          col:C.green,       desc:'PDF/CSV ingestion' },
              { n:'02', title:'AI Extraction',   col:C.teal,        desc:'Scope 1, 2, 3 parsed' },
              { n:'03', title:'Sentiment NLP',   col:'#a78bfa',     desc:'Global news analysis' },
              { n:'04', title:'ESG Scoring',     col:'#f59e0b',     desc:'Weighted composite score' },
              { n:'05', title:'Insight Output',  col:C.green,       desc:'AI recommendations' },
            ].map((s,i)=>(
              <div key={i} data-reveal className="earth-reveal" style={{ textAlign:'center', padding:'1.2rem 0.85rem', background:'rgba(7,35,61,0.6)', border:`1px solid ${s.col}1a`, borderRadius:'1.5rem', animationDelay:`${i*0.08}s` }}>
                <div style={{ fontSize:'0.65rem', fontWeight:700, color:s.col, opacity:0.7, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'0.35rem' }}>{s.n}</div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.02rem', fontWeight:700, color:C.white, marginBottom:'0.28rem' }}>{s.title}</div>
                <div style={{ fontSize:'0.77rem', color:C.whiteFaint }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ WAVE → CTA ════════════════ */}
      <Wave fill={C.bg} flip style={{ background:C.bgMid }}/>

      {/* ════════════════ CTA SECTION ════════════════ */}
      <section style={{ background:C.bg, padding:'clamp(5rem,10vw,8rem) 0', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', width:700, height:700, top:'-20%', right:'-10%', background:`radial-gradient(circle, rgba(0,230,118,0.05) 0%, transparent 65%)`, filter:'blur(60px)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', width:500, height:500, bottom:'5%', left:'-5%', background:`radial-gradient(circle, rgba(0,212,255,0.04) 0%, transparent 65%)`, filter:'blur(60px)', pointerEvents:'none' }}/>

        <div style={{ maxWidth:1220, margin:'0 auto', padding:'0 1.5rem' }}>
          <div data-reveal className="earth-reveal" style={{ textAlign:'center', marginBottom:'3.5rem' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', fontSize:'0.7rem', fontWeight:600, color:C.green, background:'rgba(0,230,118,0.07)', border:`1px solid rgba(0,230,118,0.18)`, padding:'0.35rem 0.85rem', borderRadius:9999, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:'1rem' }}>
              <Leaf size={10}/> Begin Your Journey
            </div>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(2rem,5.5vw,3.8rem)', fontWeight:700, color:C.white, letterSpacing:'-0.025em', lineHeight:1.08, marginBottom:'1rem' }}>
              Build Smarter{' '}
              <span style={{ background:`linear-gradient(135deg, ${C.green}, ${C.teal})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', fontStyle:'italic' }}>Sustainable</span>
              <br/>Decisions
            </h2>
            <p style={{ fontSize:'1rem', color:C.whiteD, maxWidth:450, margin:'0 auto', lineHeight:1.75 }}>
              Explore ESG performance, sustainability trends, and investment opportunities through AI-driven analysis.
            </p>
          </div>

          {/* Portal cards */}
          <div data-reveal className="earth-reveal" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(290px, 1fr))', gap:'1.5rem' }}>
            {[
              { icon:Building, title:'Company Portal', col:C.green, colRgb:'0,230,118', desc:'Upload sustainability reports, measure carbon footprint, and receive AI-powered recommendations.', features:['Scope 1, 2, 3 analysis','AI improvement recommendations','Industry benchmarking'], href:'/company', cta:'Start Company Analysis' },
              { icon:TrendingUp,title:'Investor Portal', col:C.teal,  colRgb:'0,212,255', desc:'Access live ESG rankings, NLP sentiment analysis, and build sustainable investment portfolios.', features:['Live ESG rankings & scores','News sentiment analysis','Portfolio builder tools'], href:'/investor', cta:'Explore Investments' },
            ].map((card,i)=>{
              const Icon = card.icon;
              return (
                <div key={i}
                  onMouseMove={e=>tilt(e,e.currentTarget)}
                  onMouseLeave={e=>{ resetTilt(e.currentTarget); e.currentTarget.style.borderColor=`rgba(${card.colRgb},0.12)`; }}
                  onMouseEnter={e=>{ e.currentTarget.style.borderColor=`rgba(${card.colRgb},0.32)`; }}
                  style={{ padding:'2.25rem', background:'rgba(7,35,61,0.7)', border:`1px solid rgba(${card.colRgb},0.12)`, borderRadius:'2rem', backdropFilter:'blur(12px)', transformStyle:'preserve-3d', transition:'border-color 0.3s', position:'relative', overflow:'hidden' }}
                >
                  <div style={{ position:'absolute', inset:0, background:`radial-gradient(circle at top left, rgba(${card.colRgb},0.06), transparent 55%)`, pointerEvents:'none' }}/>
                  <div style={{ width:50, height:50, background:`rgba(${card.colRgb},0.1)`, border:`1px solid rgba(${card.colRgb},0.24)`, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', color:card.col, marginBottom:'1.25rem' }}>
                    <Icon size={22}/>
                  </div>
                  <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.45rem', fontWeight:700, color:C.white, marginBottom:'0.65rem' }}>{card.title}</h3>
                  <p style={{ fontSize:'0.875rem', color:C.whiteD, lineHeight:1.72, marginBottom:'1.5rem' }}>{card.desc}</p>
                  {card.features.map((f,j)=>(
                    <div key={j} style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.5rem', fontSize:'0.82rem', color:C.whiteD }}>
                      <CheckCircle size={12} style={{ color:card.col, flexShrink:0 }}/> {f}
                    </div>
                  ))}
                  <Link to={card.href}
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', marginTop:'1.75rem', padding:'0.85rem', background:`rgba(${card.colRgb},0.09)`, border:`1px solid rgba(${card.colRgb},0.25)`, borderRadius:12, color:card.col, fontWeight:600, fontSize:'0.875rem', textDecoration:'none', fontFamily:"'DM Sans',sans-serif", transition:'all 0.3s' }}
                    onMouseEnter={e=>Object.assign(e.currentTarget.style,{ background:card.col, color:'#030d18' })}
                    onMouseLeave={e=>Object.assign(e.currentTarget.style,{ background:`rgba(${card.colRgb},0.09)`, color:card.col })}
                  >
                    {card.cta} <ArrowRight size={15}/>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════ FOOTER ════════════════ */}
      <footer style={{ background:'#020a12', borderTop:`1px solid rgba(0,230,118,0.08)`, position:'relative', overflow:'hidden' }}>
        <div aria-hidden="true" style={{ position:'absolute', top:'1rem', right:'2rem', opacity:0.03 }}><Leaf size={140} style={{ color:C.green }}/></div>
        <div aria-hidden="true" style={{ position:'absolute', bottom:'0.5rem', left:'2rem', opacity:0.025, transform:'rotate(20deg)' }}><Leaf size={90} style={{ color:C.teal }}/></div>

        <div style={{ maxWidth:1220, margin:'0 auto', padding:'3.5rem 1.5rem 2rem' }}>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:'2.5rem', marginBottom:'2.5rem' }} className="eg-footer-grid">
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', fontFamily:"'Cormorant Garamond',serif", fontSize:'1.35rem', fontWeight:700, color:C.white, marginBottom:'0.75rem' }}>
                <Leaf size={18} style={{ color:C.green }}/> Eco<span style={{ color:C.green }}>Lens</span>
              </div>
              <p style={{ fontSize:'0.85rem', color:C.whiteFaint, lineHeight:1.72, maxWidth:230 }}>Environmental intelligence for a sustainable future. One lens at a time.</p>
              <div style={{ marginTop:'1rem', fontSize:'0.75rem', fontStyle:'italic', color:C.green, opacity:0.75 }}>"Empowering a Greener Tomorrow"</div>
            </div>
            {[
              { title:'Product',   links:['Features','Pricing','Case Studies','API'] },
              { title:'Resources', links:['Docs','Blog','Support','Community'] },
              { title:'Company',   links:['About','Careers','Contact','Privacy'] },
            ].map((col,i)=>(
              <div key={i}>
                <h4 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'0.9rem', fontWeight:700, color:C.white, marginBottom:'0.8rem', letterSpacing:'0.04em' }}>{col.title}</h4>
                {col.links.map((l,j)=>(
                  <a key={j} href="#" style={{ display:'block', fontSize:'0.82rem', color:C.whiteFaint, textDecoration:'none', padding:'0.22rem 0', transition:'color 0.2s' }}
                    onMouseEnter={e=>e.target.style.color=C.white}
                    onMouseLeave={e=>e.target.style.color=C.whiteFaint}>{l}</a>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop:`1px solid rgba(255,255,255,0.05)`, paddingTop:'1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
            <p style={{ fontSize:'0.74rem', color:C.whiteFaint }}>© 2025 EcoLens. All rights reserved.</p>
            <div style={{ display:'flex', gap:'1.25rem' }}>
              {['Terms','Privacy','Cookies'].map((l,i)=>(
                <a key={i} href="#" style={{ fontSize:'0.74rem', color:C.whiteFaint, textDecoration:'none' }}>{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ════════════════ SCOPED CSS ════════════════ */}
      <style>{`
        /* ── Cursor ── */
        .nc-ring {
          position: fixed; width: 30px; height: 30px;
          border: 1.5px solid rgba(0,230,118,0.7);
          border-radius: 50%; pointer-events: none; z-index: 9998;
          transform: translate(-50%,-50%);
          transition: width 0.3s, height 0.3s, border-color 0.3s, background 0.3s;
        }
        .nc-ring.nc-hover { width: 46px; height: 46px; background: rgba(0,230,118,0.07); border-color: ${C.green}; }
        .nc-dot {
          position: fixed; width: 5px; height: 5px;
          background: ${C.green}; border-radius: 50%; pointer-events: none; z-index: 9999;
          transform: translate(-50%,-50%);
          box-shadow: 0 0 8px rgba(0,230,118,0.8);
        }

        /* ── Noise ── */
        .eg-noise {
          position: fixed; inset: 0; z-index: 1; pointer-events: none; opacity: 0.022;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 180px;
        }

        /* ── Hero vignette breathe ── */
        .hero-vignette { animation: vignBreathe 5s ease-in-out infinite; }
        @keyframes vignBreathe {
          0%,100% { opacity: 0.8; } 50% { opacity: 0.4; }
        }

        /* ── Scroll reveal ── */
        .earth-reveal {
          opacity: 0; transform: translateY(28px);
          transition: opacity 0.85s cubic-bezier(0.16,1,0.3,1), transform 0.85s cubic-bezier(0.16,1,0.3,1);
        }
        .el-visible { opacity: 1 !important; transform: translateY(0) !important; }

        /* ── Bounce ── */
        .eg-bounce { animation: egBounce 2.2s ease-in-out infinite; }
        @keyframes egBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(8px)} }

        /* ── Loading leaf pulse ── */
        @keyframes leafPulse {
          0%,100%{transform:rotate(-8deg) scale(1)} 50%{transform:rotate(8deg) scale(1.1)}
        }

        /* ── Pipeline glow line pulse ── */
        @keyframes pulseLine {
          0%,100%{opacity:0.3} 50%{opacity:0.9}
        }

        /* ── Pipeline dot pulse ── */
        .eg-pipeline-dot { animation: dotPulse 2s ease-in-out infinite; }
        @keyframes dotPulse {
          0%,100%{box-shadow:0 0 8px rgba(0,230,118,0.4)} 50%{box-shadow:0 0 18px rgba(0,230,118,0.9)}
        }

        /* ── Card hover glow ── */
        .eg-card:hover {
          box-shadow: 0 0 0 1px rgba(0,230,118,0.12), 0 24px 60px rgba(0,0,0,0.5) !important;
        }

        /* ── Button ripple ── */
        .eg-btn-primary { position: relative; overflow: hidden; }
        .eg-btn-primary:active::after {
          content:''; position:absolute; left:50%; top:50%;
          width:6px; height:6px; background:rgba(255,255,255,0.4); border-radius:50%;
          transform:translate(-50%,-50%) scale(0);
          animation: btnRipple 0.5s ease-out forwards;
          pointer-events:none;
        }
        @keyframes btnRipple { to { transform:translate(-50%,-50%) scale(65); opacity:0; } }

        /* ── Scrollbar ── */
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(180deg, ${C.green}, #16a34a); border-radius: 8px; }

        /* ── Responsive ── */
        @media (min-width: 640px) { .eg-stats-grid { grid-template-columns: repeat(4,1fr) !important; } }
        @media (min-width: 1024px) { .eg-mission-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (min-width: 768px)  { .eg-nav-links { display: flex !important; } }
        @media (max-width: 768px)  { .eg-footer-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 480px)  { .eg-footer-grid { grid-template-columns: 1fr !important; } .eg-nav-links { display: none !important; } }
      `}</style>
    </div>
  );
}