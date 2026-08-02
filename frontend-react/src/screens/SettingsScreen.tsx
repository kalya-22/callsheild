import { useState } from 'react'
import { C, GlassCard, BackButton, StatusBar, type NavFn } from '../shared'

function Toggle({ value, onChange, color = C.primary }: { value: boolean; onChange: () => void; color?: string }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: '46px', height: '26px', borderRadius: '13px',
        background: value ? `linear-gradient(135deg, ${color}, ${color}cc)` : 'rgba(255,255,255,0.1)',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'all 0.3s',
        boxShadow: value ? `0 2px 8px ${color}44` : 'none',
        flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: '3px',
        left: value ? '23px' : '3px',
        width: '20px', height: '20px', borderRadius: '50%', background: 'white',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        transition: 'left 0.25s cubic-bezier(0.4,0,0.2,1)',
      }} />
    </button>
  )
}

function SettingRow({ icon, label, sub, right }: { icon: string; label: string; sub?: string; right: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      padding: '14px 0',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      <div style={{
        width: '38px', height: '38px', borderRadius: '12px',
        background: 'rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '18px', flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: 'white', fontSize: '14px', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'Inter, sans-serif', marginTop: '2px' }}>{sub}</div>}
      </div>
      {right}
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <p style={{
      color: C.textMuted, fontSize: '11px', fontFamily: 'Inter, sans-serif',
      fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px',
      margin: '20px 0 8px', padding: '0 4px',
    }}>
      {title}
    </p>
  )
}

export default function SettingsScreen({ navigate }: { navigate: NavFn }) {
  const [settings, setSettings] = useState({
    darkMode: true,
    autoDetect: true,
    notifications: true,
    vibrate: true,
    biometric: true,
    crashReports: false,
    marketing: false,
    location: false,
  })
  const [sensitivity, setSensitivity] = useState(70)
  const [language, setLanguage] = useState('English')

  const toggle = (key: keyof typeof settings) =>
    setSettings(s => ({ ...s, [key]: !s[key] }))

  return (
    <div style={{ minHeight: '844px', background: C.bg, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <StatusBar />

      <div style={{ padding: '8px 20px 32px', overflowY: 'auto', flex: 1, position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <BackButton navigate={navigate} to="profile" />
          <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 700, fontFamily: 'Poppins, Inter, sans-serif', margin: 0 }}>
            Settings
          </h2>
        </div>

        <SectionHeader title="Appearance" />
        <GlassCard style={{ padding: '0 16px' }}>
          <SettingRow icon="🌙" label="Dark Mode" sub="Deep navy UI" right={<Toggle value={settings.darkMode} onChange={() => toggle('darkMode')} />} />
          <SettingRow icon="🌐" label="Language" sub={language}
            right={
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '10px', color: 'white', fontSize: '12px',
                  fontFamily: 'Inter, sans-serif', padding: '6px 10px', cursor: 'pointer',
                }}
              >
                {['English', 'Spanish', 'French', 'German', 'Hindi'].map(l => (
                  <option key={l} value={l} style={{ background: '#1E293B' }}>{l}</option>
                ))}
              </select>
            }
          />
        </GlassCard>

        <SectionHeader title="Detection" />
        <GlassCard style={{ padding: '0 16px' }}>
          <SettingRow icon="🤖" label="Auto-Detect Calls" sub="Analyze calls automatically" right={<Toggle value={settings.autoDetect} onChange={() => toggle('autoDetect')} color={C.accent} />} />
          <div style={{ padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🎯</div>
                <div>
                  <div style={{ color: 'white', fontSize: '14px', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>Detection Sensitivity</div>
                  <div style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'Inter, sans-serif' }}>
                    {sensitivity < 40 ? 'Lenient' : sensitivity < 70 ? 'Balanced' : 'Strict'} · {sensitivity}%
                  </div>
                </div>
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="range" min={0} max={100} value={sensitivity}
                onChange={e => setSensitivity(Number(e.target.value))}
                style={{ width: '100%', accentColor: C.primary, cursor: 'pointer', height: '4px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ color: C.textMuted, fontSize: '10px', fontFamily: 'Inter, sans-serif' }}>Lenient</span>
                <span style={{ color: C.textMuted, fontSize: '10px', fontFamily: 'Inter, sans-serif' }}>Strict</span>
              </div>
            </div>
          </div>
        </GlassCard>

        <SectionHeader title="Notifications" />
        <GlassCard style={{ padding: '0 16px' }}>
          <SettingRow icon="🔔" label="Push Notifications" sub="Scam alerts & updates" right={<Toggle value={settings.notifications} onChange={() => toggle('notifications')} color={C.warning} />} />
          <SettingRow icon="📳" label="Vibration" sub="Haptic feedback on alerts" right={<Toggle value={settings.vibrate} onChange={() => toggle('vibrate')} />} />
        </GlassCard>

        <SectionHeader title="Security & Privacy" />
        <GlassCard style={{ padding: '0 16px' }}>
          <SettingRow icon="👤" label="Biometric Login" sub="Face ID / Fingerprint" right={<Toggle value={settings.biometric} onChange={() => toggle('biometric')} color={C.success} />} />
          <div onClick={() => navigate('blocked-contacts')} style={{ cursor: 'pointer' }}>
            <SettingRow icon="🚫" label="Blocked Contacts" sub="5 numbers blocked"
              right={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              }
            />
          </div>
          <SettingRow icon="🔐" label="Manage Permissions" sub="Microphone, phone state"
            right={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            }
          />
          <SettingRow icon="📊" label="Anonymous Analytics" sub="Help improve detection" right={<Toggle value={settings.crashReports} onChange={() => toggle('crashReports')} />} />
          <SettingRow icon="📍" label="Location (Emergency)" sub="For SOS alerts" right={<Toggle value={settings.location} onChange={() => toggle('location')} color={C.danger} />} />
        </GlassCard>

        <SectionHeader title="Account" />
        <GlassCard style={{ padding: '0 16px' }}>
          {[
            { icon: '⭐', label: 'Upgrade to Premium', sub: 'Unlimited AI analysis' },
            { icon: '📋', label: 'About CallShield', sub: 'v2.4.1 · Build 892' },
            { icon: '📝', label: 'Privacy Policy' },
            { icon: '⚖️', label: 'Terms of Service' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '14px 0',
              borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              cursor: 'pointer',
            }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                {item.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'white', fontSize: '14px', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>{item.label}</div>
                {item.sub && <div style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'Inter, sans-serif' }}>{item.sub}</div>}
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          ))}
        </GlassCard>

        <button style={{
          width: '100%', marginTop: '20px', padding: '14px',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '14px', color: C.danger, fontSize: '14px', fontWeight: 600,
          fontFamily: 'Inter, sans-serif', cursor: 'pointer',
        }}>
          Sign Out
        </button>
      </div>
    </div>
  )
}
