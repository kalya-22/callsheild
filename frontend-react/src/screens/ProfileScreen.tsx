import { C, GlassCard, CircularGauge, BottomNav, StatusBar, type NavFn, type Screen } from '../shared'
import { getCurrentUser } from '../services/callshieldApi'

const stats = [
  { label: 'Calls Analyzed', value: '1,284', icon: '📞' },
  { label: 'Scams Blocked', value: '47', icon: '🛡️' },
  { label: 'Accuracy', value: '97.2%', icon: '🎯' },
  { label: 'Days Protected', value: '186', icon: '📅' },
]

const quickActions: { icon: string; label: string; screen: Screen; color: string }[] = [
  { icon: '🆘', label: 'Emergency', screen: 'emergency', color: C.danger },
  { icon: '📢', label: 'Report Scam', screen: 'scam-report', color: C.warning },
  { icon: '⚙️', label: 'Settings', screen: 'settings', color: C.primary },
  { icon: '📊', label: 'Analytics', screen: 'analytics', color: C.accent },
]

export default function ProfileScreen({ navigate }: { navigate: NavFn }) {
  const user = getCurrentUser()

  return (
    <div style={{ height: '844px', background: C.bg, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(37,99,235,0.12) 0%, transparent 50%)',
      }} />
      <StatusBar />

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px', paddingBottom: '80px', position: 'relative', zIndex: 2 }}>
        {/* Profile header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          {/* Avatar */}
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '14px' }}>
            <div style={{
              width: '88px', height: '88px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '32px', fontWeight: 700, color: 'white',
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 8px 32px rgba(37,99,235,0.4)',
            }}>
              {(user?.full_name ?? 'Alex Johnson')
                .split(' ')
                .map(part => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            {/* Premium badge */}
            <div style={{
              position: 'absolute', bottom: '2px', right: '2px',
              width: '24px', height: '24px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              border: '2px solid #0F172A',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px',
            }}>
              ⭐
            </div>
          </div>

          <h2 style={{
            color: 'white', fontSize: '22px', fontWeight: 700,
            fontFamily: 'Poppins, Inter, sans-serif', margin: '0 0 4px',
          }}>
            {user?.full_name ?? 'Alex Johnson'}
          </h2>
          <p style={{ color: C.textMuted, fontSize: '14px', margin: '0 0 10px', fontFamily: 'Inter, sans-serif' }}>
            {user?.email ?? 'alex.johnson@email.com'}
          </p>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <span style={{
              padding: '4px 12px', borderRadius: '20px',
              background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)',
              color: '#F59E0B', fontSize: '11px', fontWeight: 600, fontFamily: 'Inter, sans-serif',
            }}>
              ⭐ Premium Member
            </span>
            <span style={{
              padding: '4px 12px', borderRadius: '20px',
              background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
              color: C.success, fontSize: '11px', fontWeight: 600, fontFamily: 'Inter, sans-serif',
            }}>
              ✓ Verified
            </span>
          </div>
        </div>

        {/* Security score */}
        <GlassCard style={{
          padding: '20px', marginBottom: '16px',
          background: 'linear-gradient(135deg, rgba(37,99,235,0.1) 0%, rgba(6,182,212,0.06) 100%)',
          border: '1px solid rgba(37,99,235,0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <CircularGauge value={92} size={100} color={C.primary} label="92" sublabel="Score" />
            <div>
              <p style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'Inter, sans-serif', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 6px' }}>
                Security Score
              </p>
              <h3 style={{ color: 'white', fontSize: '20px', fontWeight: 700, fontFamily: 'Inter, sans-serif', margin: '0 0 6px' }}>
                Excellent
              </h3>
              <p style={{ color: C.textSec, fontSize: '12px', margin: 0, fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
                Your account is well-protected. Keep up the great security habits!
              </p>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                marginTop: '8px',
                padding: '4px 10px', borderRadius: '10px',
                background: 'rgba(34,197,94,0.12)',
              }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: C.success }} />
                <span style={{ color: C.success, fontSize: '11px', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>Top 5% of users</span>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {stats.map(s => (
            <GlassCard key={s.label} style={{ padding: '16px' }}>
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>{s.icon}</div>
              <div style={{ color: 'white', fontSize: '20px', fontWeight: 700, fontFamily: 'Inter, sans-serif', marginBottom: '3px' }}>
                {s.value}
              </div>
              <div style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'Inter, sans-serif' }}>
                {s.label}
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ marginBottom: '16px' }}>
          <p style={{ color: 'white', fontSize: '15px', fontWeight: 600, fontFamily: 'Poppins, Inter, sans-serif', margin: '0 0 12px' }}>
            Quick Actions
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {quickActions.map(a => (
              <button
                key={a.label}
                onClick={() => navigate(a.screen)}
                style={{
                  padding: '16px 14px',
                  background: `${a.color}10`,
                  border: `1px solid ${a.color}25`,
                  borderRadius: '16px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  textAlign: 'left', transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: '22px' }}>{a.icon}</span>
                <span style={{ color: 'white', fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
                  {a.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Detection accuracy breakdown */}
        <GlassCard style={{ padding: '16px', marginBottom: '16px' }}>
          <p style={{ color: 'white', fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif', margin: '0 0 14px' }}>
            Detection Breakdown
          </p>
          {[
            { label: 'Safe Calls', val: 1184, color: C.success },
            { label: 'Suspicious', val: 53, color: C.warning },
            { label: 'Scams Caught', val: 47, color: C.danger },
          ].map(d => (
            <div key={d.label} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ color: C.textSec, fontSize: '12px', fontFamily: 'Inter, sans-serif' }}>{d.label}</span>
                <span style={{ color: 'white', fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>{d.val.toLocaleString()}</span>
              </div>
              <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.round(d.val / 1284 * 100)}%`, height: '100%',
                  background: d.color, borderRadius: '3px',
                  boxShadow: `0 0 6px ${d.color}66`,
                }} />
              </div>
            </div>
          ))}
        </GlassCard>

        {/* Member since */}
        <GlassCard style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'Inter, sans-serif', marginBottom: '3px' }}>Member since</div>
            <div style={{ color: 'white', fontSize: '14px', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>January 2026</div>
          </div>
          <div style={{
            padding: '8px 16px', borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.1))',
            border: '1px solid rgba(245,158,11,0.3)',
          }}>
            <span style={{ color: '#F59E0B', fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
              ⭐ Premium
            </span>
          </div>
        </GlassCard>
      </div>

      <BottomNav active="profile" navigate={navigate} />
    </div>
  )
}
