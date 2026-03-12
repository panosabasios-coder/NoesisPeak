'use client'
import { useState, useEffect, useContext } from 'react'
import { createClient } from '../../lib/supabase'
import { t } from '../../lib/i18n'
import { LangContext, PlayerContext } from './layout'

function getGreeting(T: any) {
  const h = new Date().getHours()
  if (h < 12) return T.good_morning
  if (h < 18) return T.good_afternoon
  return T.good_evening
}

function Slider({ label, hint, value, onChange, min = 1, max = 7 }: any) {
  const pct = ((value - min) / (max - min)) * 100
  const color = value <= 2 ? '#22C55E' : value <= 4 ? '#C9A84C' : value <= 5 ? '#F97316' : '#EF4444'
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--offwhite)' }}>{label}</span>
        <span style={{ fontFamily:'var(--mono)', fontSize: 14, fontWeight: 800, color: value ? color : 'var(--muted)' }}>
          {value ? `${value}/7` : '—'}
        </span>
      </div>
      {hint && <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 6 }}>{hint}</div>}
      <input type="range" min={min} max={max} value={value || min} onChange={e => onChange(+e.target.value)}
        style={{ width:'100%', accentColor: color, cursor:'pointer' }} />
      <div style={{ display:'flex', justifyContent:'space-between', marginTop: 3 }}>
        <span style={{ fontSize: 9, color: 'var(--muted)' }}>{min}</span>
        <span style={{ fontSize: 9, color: 'var(--muted)' }}>{max}</span>
      </div>
    </div>
  )
}

function StreakBadge({ streak, T }: { streak: number; T: any }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      background: 'var(--panel)', border: '1px solid rgba(201,168,76,0.2)',
      borderRadius: 'var(--r-lg)', padding: '14px 20px', marginBottom: 24,
    }}>
      <div style={{ fontSize: 36 }}>🔥</div>
      <div>
        <div style={{ fontFamily:'var(--mono)', fontSize: 28, fontWeight: 900, color: 'var(--gold)', lineHeight: 1 }}>
          {streak}
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{T.streak_label} — {T.streak_sub}</div>
      </div>
      {streak >= 7 && <div style={{ marginLeft:'auto', fontSize: 22 }}>⭐</div>}
      {streak >= 14 && <div style={{ fontSize: 22 }}>🏆</div>}
    </div>
  )
}

export default function PlayerHome() {
  const { lang } = useContext(LangContext)
  const { player, profile } = useContext(PlayerContext)
  const T = t[lang]
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const [preAnswers, setPreAnswers] = useState({ sleep: 0, fatigue: 0, soreness: 0, stress: 0 })
  const [postAnswers, setPostAnswers] = useState({ rpe: 0, duration: 60 })
  const [preStatus, setPreStatus] = useState<'idle'|'saving'|'done'|'already'>('idle')
  const [postStatus, setPostStatus] = useState<'idle'|'saving'|'done'|'already'>('idle')
  const [streak, setStreak] = useState(0)
  const [existingId, setExistingId] = useState<string|null>(null)

  useEffect(() => {
    if (!player?.id) return
    loadTodayData()
    calcStreak()
  }, [player])

  async function loadTodayData() {
    const { data } = await supabase
      .from('daily_monitoring')
      .select('*')
      .eq('player_id', player.id)
      .eq('date', today)
      .maybeSingle()
    if (data) {
      setExistingId(data.id)
      if (data.sleep_quality) {
        setPreAnswers({ sleep: data.sleep_quality, fatigue: data.fatigue || 0, soreness: data.muscle_soreness || 0, stress: data.psychological_condition || 0 })
        setPreStatus('already')
      }
      if (data.rpe) {
        setPostAnswers({ rpe: data.rpe, duration: data.duration_min || 60 })
        setPostStatus('already')
      }
    }
  }

  async function calcStreak() {
    const { data } = await supabase
      .from('daily_monitoring')
      .select('date')
      .eq('player_id', player.id)
      .not('sleep_quality', 'is', null)
      .order('date', { ascending: false })
      .limit(60)
    if (!data) return
    let s = 0
    let check = new Date()
    for (const row of data) {
      const d = new Date(row.date + 'T00:00:00')
      const diff = Math.round((check.getTime() - d.getTime()) / 86400000)
      if (diff > 1) break
      s++
      check = d
    }
    setStreak(s)
  }

  async function savePre() {
    if (!preAnswers.sleep || !preAnswers.fatigue || !preAnswers.soreness || !preAnswers.stress) return
    setPreStatus('saving')
    const hi = preAnswers.sleep + preAnswers.fatigue + preAnswers.soreness + preAnswers.stress
    const payload: any = {
      date: today,
      player_id: player.id,
      sleep_quality: preAnswers.sleep,
      fatigue: preAnswers.fatigue,
      muscle_soreness: preAnswers.soreness,
      psychological_condition: preAnswers.stress,
      hooper_index: hi,
    }
    if (existingId) {
      await supabase.from('daily_monitoring').update(payload).eq('id', existingId)
    } else {
      const { data } = await supabase.from('daily_monitoring').insert(payload).select('id').single()
      if (data) setExistingId(data.id)
    }
    setPreStatus('done')
    calcStreak()
  }

  async function savePost() {
    if (!postAnswers.rpe || !postAnswers.duration) return
    setPostStatus('saving')
    const payload: any = {
      date: today,
      player_id: player.id,
      rpe: postAnswers.rpe,
      duration_min: postAnswers.duration,
    }
    if (existingId) {
      await supabase.from('daily_monitoring').update(payload).eq('id', existingId)
    } else {
      const { data } = await supabase.from('daily_monitoring').insert(payload).select('id').single()
      if (data) setExistingId(data.id)
    }
    setPostStatus('done')
  }

  const name = player?.name?.split(' ')[0] || profile?.email?.split('@')[0] || ''

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--offwhite)' }}>
          {getGreeting(T)}, {name} 👋
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted2)', marginTop: 4 }}>
          {new Date().toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB', { weekday:'long', day:'numeric', month:'long' })}
        </p>
      </div>

      {/* Streak */}
      <StreakBadge streak={streak} T={T} />

      {/* PRE-SESSION */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <div style={styles.cardTitle}>⚡ {T.checkin_pre_title}</div>
            <div style={styles.cardSub}>🕓 {T.checkin_deadline}</div>
          </div>
          <div style={{ ...styles.badge, background: 'rgba(201,168,76,0.12)', color: 'var(--gold)', border:'1px solid rgba(201,168,76,0.25)' }}>
            {lang === 'de' ? 'Morgens' : 'Morning'}
          </div>
        </div>

        {preStatus === 'already' || preStatus === 'done' ? (
          <div style={styles.doneMsg}>✅ {T.already_done}</div>
        ) : (
          <>
            <Slider label={T.sleep}    hint={T.scale_hint} value={preAnswers.sleep}    onChange={(v:number) => setPreAnswers(p=>({...p,sleep:v}))} />
            <Slider label={T.fatigue}  hint={T.scale_hint} value={preAnswers.fatigue}  onChange={(v:number) => setPreAnswers(p=>({...p,fatigue:v}))} />
            <Slider label={T.soreness} hint={T.scale_hint} value={preAnswers.soreness} onChange={(v:number) => setPreAnswers(p=>({...p,soreness:v}))} />
            <Slider label={T.stress}   hint={T.scale_hint} value={preAnswers.stress}   onChange={(v:number) => setPreAnswers(p=>({...p,stress:v}))} />
            <button onClick={savePre} disabled={preStatus === 'saving'} style={styles.saveBtn}>
              {preStatus === 'saving' ? T.saving : T.save}
            </button>
          </>
        )}
      </div>

      {/* POST-SESSION */}
      <div style={{ ...styles.card, marginTop: 16 }}>
        <div style={styles.cardHeader}>
          <div>
            <div style={styles.cardTitle}>🏃 {T.checkin_post_title}</div>
            <div style={styles.cardSub}>⏱ {T.checkin_post_deadline}</div>
          </div>
          <div style={{ ...styles.badge, background: 'rgba(76,175,130,0.1)', color: 'var(--green)', border:'1px solid rgba(76,175,130,0.2)' }}>
            {lang === 'de' ? 'Nach Training' : 'Post Training'}
          </div>
        </div>

        {postStatus === 'already' || postStatus === 'done' ? (
          <div style={styles.doneMsg}>✅ {T.already_done}</div>
        ) : (
          <>
            <Slider label={T.rpe} hint={lang === 'de' ? '1 = Sehr leicht · 10 = Maximum' : '1 = Very easy · 10 = Maximum'} value={postAnswers.rpe} onChange={(v:number) => setPostAnswers(p=>({...p,rpe:v}))} min={1} max={10} />
            <Slider label={T.duration} hint={lang === 'de' ? 'Dauer in Minuten' : 'Duration in minutes'} value={postAnswers.duration} onChange={(v:number) => setPostAnswers(p=>({...p,duration:v}))} min={10} max={180} />
            {postAnswers.rpe > 0 && postAnswers.duration > 0 && (
              <div style={styles.sRPE}>
                sRPE Load: <span style={{ color:'var(--gold)', fontWeight:800 }}>{postAnswers.rpe * postAnswers.duration} AU</span>
              </div>
            )}
            <button onClick={savePost} disabled={postStatus === 'saving'} style={{ ...styles.saveBtn, background:'linear-gradient(135deg,#4CAF82,#2D7A55)' }}>
              {postStatus === 'saving' ? T.saving : T.save}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: 'var(--surface)', border: '1px solid var(--border1)',
    borderRadius: 'var(--r-lg)', padding: '20px 22px',
  },
  cardHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 20,
  },
  cardTitle: { fontSize: 15, fontWeight: 800, color: 'var(--offwhite)', marginBottom: 3 },
  cardSub:   { fontSize: 11, color: 'var(--muted)' },
  badge: { fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 999 },
  doneMsg: {
    background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
    borderRadius: 'var(--r-sm)', padding: '12px 16px',
    color: 'var(--safe)', fontSize: 13, fontWeight: 600,
  },
  saveBtn: {
    width: '100%', marginTop: 8,
    background: 'linear-gradient(135deg,#C9A84C,#A07830)',
    border: 'none', borderRadius: 'var(--r-md)',
    color: '#0B0B0F', fontWeight: 800, fontSize: 14,
    padding: '13px', cursor: 'pointer',
  },
  sRPE: {
    background: 'var(--panel)', borderRadius: 'var(--r-sm)',
    padding: '10px 14px', fontSize: 12, color: 'var(--muted2)',
    marginBottom: 8, fontFamily: 'var(--mono)',
  },
}
