import { useState } from 'react'
import { C, GlassCard, BackButton, StatusBar, type NavFn } from '../shared'

type EmergencyContact = {
  name: string
  relation: string
  phone: string
  initials: string
  color: string
}

const defaultContacts: EmergencyContact[] = [
  { name: 'Priya Sharma', relation: 'Wife', phone: '+91 94440 12345', initials: 'PS', color: '#A855F7' },
  { name: 'Arjun Sharma', relation: 'Son', phone: '+91 98765 43210', initials: 'AS', color: C.primary },
  { name: 'Dr. Rahul Mehta', relation: 'Doctor', phone: '+91 22 6160 6161', initials: 'RM', color: C.accent },
]

export default function EmergencyScreen({ navigate }: { navigate: NavFn }) {
  const [sosPressing, setSosPressing] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [contacts, setContacts] = useState<EmergencyContact[]>(() => {
    const saved = localStorage.getItem('callshield_emergency_contacts')
    return saved ? JSON.parse(saved) as EmergencyContact[] : defaultContacts
  })
  const [newContact, setNewContact] = useState({
    name: '',
    relation: '',
    phone: '',
  })

  function saveContacts(nextContacts: EmergencyContact[]) {
    setContacts(nextContacts)
    localStorage.setItem('callshield_emergency_contacts', JSON.stringify(nextContacts))
  }

  function getInitials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    return (parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '')
  }

  function addContact() {
    if (!newContact.name.trim() || !newContact.relation.trim() || !newContact.phone.trim()) return
    saveContacts([
      ...contacts,
      {
        name: newContact.name.trim(),
        relation: newContact.relation.trim(),
        phone: newContact.phone.trim(),
        initials: getInitials(newContact.name).toUpperCase(),
        color: C.primary,
      },
    ])
    setNewContact({ name: '', relation: '', phone: '' })
    setShowAdd(false)
  }

  function deleteContact(phone: string) {
    saveContacts(contacts.filter(contact => contact.phone !== phone))
  }

  return (
    <div style={{ minHeight: '844px', background: C.bg, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 80%, rgba(239,68,68,0.07) 0%, transparent 50%)' }} />
      <StatusBar />

      <div style={{ padding: '8px 20px 32px', position: 'relative', zIndex: 2, overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <BackButton navigate={navigate} to="profile" />
          <div>
            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 700, fontFamily: 'Poppins, Inter, sans-serif', margin: 0 }}>
              Emergency Contacts
            </h2>
            <p style={{ color: C.textMuted, fontSize: '12px', margin: 0, fontFamily: 'Inter, sans-serif' }}>
              Notified if a scam is detected
            </p>
          </div>
        </div>

        {/* SOS Button */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <p style={{ color: C.textMuted, fontSize: '12px', fontFamily: 'Inter, sans-serif', margin: '0 0 16px' }}>
            Hold to send emergency alert to all contacts
          </p>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {sosPressing && [100, 130, 160].map((size, i) => (
              <div key={i} style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: size, height: size, borderRadius: '50%',
                border: '2px solid rgba(239,68,68,0.4)',
                animation: `ripple-out 2s ease-out ${i * 0.4}s infinite`,
              }} />
            ))}
            <button
              onMouseDown={() => setSosPressing(true)}
              onMouseUp={() => setSosPressing(false)}
              onTouchStart={() => setSosPressing(true)}
              onTouchEnd={() => setSosPressing(false)}
              style={{
                width: '90px', height: '90px', borderRadius: '50%',
                background: sosPressing
                  ? 'linear-gradient(135deg, #DC2626, #EF4444)'
                  : 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(185,28,28,0.2))',
                border: `3px solid ${sosPressing ? C.danger : 'rgba(239,68,68,0.4)'}`,
                cursor: 'pointer', transition: 'all 0.2s',
                color: 'white', fontWeight: 800, fontSize: '22px',
                fontFamily: 'Inter, sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: sosPressing ? '0 0 32px rgba(239,68,68,0.6)' : '0 8px 24px rgba(239,68,68,0.2)',
                transform: sosPressing ? 'scale(0.95)' : 'scale(1)',
                position: 'relative', zIndex: 1,
              }}
            >
              SOS
            </button>
          </div>
        </div>

        {/* Contacts */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <span style={{ color: 'white', fontSize: '16px', fontWeight: 600, fontFamily: 'Poppins, Inter, sans-serif' }}>
            My Contacts
          </span>
          <button onClick={() => setShowAdd(!showAdd)} style={{
            padding: '6px 14px', borderRadius: '12px',
            background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)',
            color: C.primary, fontSize: '12px', fontWeight: 600,
            fontFamily: 'Inter, sans-serif', cursor: 'pointer',
          }}>
            + Add
          </button>
        </div>

        {showAdd && (
          <GlassCard style={{ padding: '16px', marginBottom: '14px', border: '1px solid rgba(37,99,235,0.3)' }}>
            {[
              { label: 'Name', key: 'name' as const },
              { label: 'Relationship', key: 'relation' as const },
              { label: 'Phone Number', key: 'phone' as const },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: '10px' }}>
                <label style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'Inter, sans-serif', fontWeight: 500, display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  {f.label}
                </label>
                <input style={{
                  width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
                  color: 'white', fontSize: '14px', fontFamily: 'Inter, sans-serif', outline: 'none',
                  boxSizing: 'border-box' as const,
                }} placeholder={`Enter ${f.label.toLowerCase()}`} value={newContact[f.key]} onChange={e => setNewContact(contact => ({ ...contact, [f.key]: e.target.value }))} />
              </div>
            ))}
            <button onClick={addContact} style={{
              width: '100%', padding: '13px',
              background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
              border: 'none', borderRadius: '12px',
              color: 'white', fontSize: '14px', fontWeight: 600,
              fontFamily: 'Inter, sans-serif', cursor: 'pointer',
            }}>
              Save Contact
            </button>
          </GlassCard>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {contacts.map((c, i) => (
            <GlassCard key={i} style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: `${c.color}22`, border: `1px solid ${c.color}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: c.color, fontSize: '14px', fontWeight: 700, fontFamily: 'Inter, sans-serif',
                  flexShrink: 0,
                }}>
                  {c.initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'white', fontSize: '15px', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
                    {c.name}
                  </div>
                  <div style={{ color: C.textMuted, fontSize: '12px', fontFamily: 'Inter, sans-serif' }}>
                    {c.relation} · {c.phone}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => deleteContact(c.phone)} style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.36 13.63a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.47 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.09a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                  </button>
                  <button style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.danger} strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Notify button */}
              <button style={{
                width: '100%', marginTop: '12px', padding: '10px',
                background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
                borderRadius: '12px', color: '#F59E0B', fontSize: '12px', fontWeight: 600,
                fontFamily: 'Inter, sans-serif', cursor: 'pointer',
              }}>
                🔔 Send Emergency Notification
              </button>
            </GlassCard>
          ))}
        </div>

        {/* Info box */}
        <div style={{
          marginTop: '20px', padding: '14px 16px',
          background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)',
          borderRadius: '14px', display: 'flex', gap: '10px',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}>
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
          </svg>
          <p style={{ color: 'rgba(6,182,212,0.8)', fontSize: '12px', margin: 0, fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
            Emergency contacts will receive an SMS alert including the caller info, AI risk score, and your current location when a scam is detected or you trigger SOS.
          </p>
        </div>
      </div>
    </div>
  )
}
