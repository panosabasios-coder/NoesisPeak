'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'
import { t, Lang } from '../../lib/i18n'

export default function LoginPage() {
  const router = useRouter()
  const [lang, setLang] = useState<Lang>('de')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const T = t[lang]

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const supabase = createClient()
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError(T.invalid_credentials); setLoading(false); return }
    // Get role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()
    if (profile?.role === 'coach') router.replace('/coach')
    else router.replace('/player')
  }

  return (
    <div style={styles.page}>
      {/* Background glow */}
      <div style={styles.glowTop} />
      <div style={styles.glowBottom} />

      {/* Lang toggle */}
      <div style={styles.langToggle}>
        {(['de','en'] as Lang[]).map(l => (
          <button key={l} onClick={() => setLang(l)} style={{
            ...styles.langBtn,
            ...(lang === l ? styles.langBtnActive : {})
          }}>{l.toUpperCase()}</button>
        ))}
      </div>

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoMark}>NP</div>
          <div>
            <div style={styles.logoTitle}>Noesis Peak</div>
            <div style={styles.logoSub}>SV 07 Elversberg · Academy</div>
          </div>
        </div>

        <div style={styles.divider} />

        <h1 style={styles.title}>{T.login_title}</h1>
        <p style={styles.sub}>{T.login_sub}</p>

        <form onSubmit={handleLogin} style={styles.form}>
          <label style={styles.label}>{T.email}</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={styles.input}
            placeholder="name@elversberg.de"
          />

          <label style={styles.label}>{T.password}</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={styles.input}
            placeholder="••••••••"
          />

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" disabled={loading} style={{
            ...styles.btn,
            ...(loading ? styles.btnDisabled : {})
          }}>
            {loading ? T.signing_in : T.sign_in}
          </button>
        </form>

        <p style={styles.footer}>Noesis Peak · Performance Intelligence</p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
  },
  glowTop: {
    position: 'absolute', top: '-10%', left: '-10%',
    width: '60vw', height: '60vw', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  glowBottom: {
    position: 'absolute', bottom: '-10%', right: '-10%',
    width: '50vw', height: '50vw', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(76,175,130,0.05) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  langToggle: {
    position: 'absolute', top: 24, right: 24,
    display: 'flex', gap: 4,
    background: 'var(--surface)', borderRadius: 999,
    padding: 3, border: '1px solid var(--border1)',
  },
  langBtn: {
    padding: '4px 12px', borderRadius: 999, border: 'none',
    background: 'transparent', color: 'var(--muted2)',
    fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
    cursor: 'pointer', transition: 'all 0.2s',
  },
  langBtnActive: {
    background: 'var(--panel2)', color: 'var(--gold)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
  },
  card: {
    width: '100%', maxWidth: 400,
    background: 'var(--surface)',
    border: '1px solid var(--border1)',
    borderRadius: 'var(--r-xl)',
    padding: '36px 32px',
    position: 'relative', zIndex: 1,
    boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
  },
  logoWrap: {
    display: 'flex', alignItems: 'center', gap: 14,
    marginBottom: 24,
  },
  logoMark: {
    width: 46, height: 46, borderRadius: 12,
    background: 'linear-gradient(135deg, #C9A84C, #8A5E1A)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 700,
    color: '#0B0B0F', letterSpacing: '-0.02em',
    flexShrink: 0,
  },
  logoTitle: {
    fontSize: 17, fontWeight: 800, color: 'var(--offwhite)',
    letterSpacing: '-0.02em',
  },
  logoSub: {
    fontSize: 10, color: 'var(--muted)', marginTop: 2,
  },
  divider: {
    height: 1, background: 'var(--border1)', marginBottom: 24,
  },
  title: {
    fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em',
    color: 'var(--offwhite)', marginBottom: 6,
  },
  sub: {
    fontSize: 13, color: 'var(--muted2)', marginBottom: 28,
  },
  form: {
    display: 'flex', flexDirection: 'column', gap: 6,
  },
  label: {
    fontSize: 11, fontWeight: 700, color: 'var(--muted2)',
    letterSpacing: '0.06em', textTransform: 'uppercase',
    marginTop: 10, marginBottom: 4,
  },
  input: {
    background: 'var(--panel)', border: '1px solid var(--border2)',
    borderRadius: 'var(--r-sm)', color: 'var(--offwhite)',
    padding: '11px 14px', fontSize: 14, outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  error: {
    background: 'rgba(255,68,102,0.1)', border: '1px solid rgba(255,68,102,0.25)',
    borderRadius: 'var(--r-sm)', color: 'var(--danger)',
    fontSize: 12, padding: '8px 12px', marginTop: 4,
  },
  btn: {
    marginTop: 20,
    background: 'linear-gradient(135deg, #C9A84C, #A07830)',
    border: 'none', borderRadius: 'var(--r-md)',
    color: '#0B0B0F', fontWeight: 800, fontSize: 14,
    letterSpacing: '-0.01em', padding: '13px',
    transition: 'opacity 0.2s, transform 0.15s',
    cursor: 'pointer',
  },
  btnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  footer: {
    textAlign: 'center', fontSize: 10, color: 'var(--muted)',
    marginTop: 28, letterSpacing: '0.04em',
  },
}
