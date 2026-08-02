import { useState } from 'react'
import { C, GlassCard, BackButton, StatusBar, type NavFn } from '../shared'

type BlockedNumber = {
  name: string
  number: string
  reason: string
  date: string
}

const defaultBlockedNumbers: BlockedNumber[] = [
  { name: 'Spam Center', number: '+91 80123 99999', reason: 'Aggressive marketing', date: 'Jul 24, 2026' },
  { name: 'Loan Scam', number: '+91 70123 00000', reason: 'Pressure tactics', date: 'Jul 22, 2026' },
  { name: 'Unknown', number: '+91 91111 22222', reason: 'High-risk pattern', date: 'Jul 20, 2026' },
  { name: 'Fake Bank', number: '+91 22 4444 8888', reason: 'Vishing attempt', date: 'Jul 15, 2026' },
  { name: 'Insurance Fraud', number: '+91 88888 77777', reason: 'Suspicious Caller ID', date: 'Jul 10, 2026' },
]

export default function BlockedContactsScreen({ navigate }: { navigate: NavFn }) {
  const [blockedNumbers, setBlockedNumbers] = useState<BlockedNumber[]>(() => {
    const saved = localStorage.getItem('callshield_blocked_contacts')
    return saved ? JSON.parse(saved) as BlockedNumber[] : defaultBlockedNumbers
  })

  function unblockNumber(number: string) {
    setBlockedNumbers(items => {
      const updated = items.filter(item => item.number !== number)
      localStorage.setItem('callshield_blocked_contacts', JSON.stringify(updated))
      return updated
    })
  }

  return (
    <div style={{ minHeight: '844px', background: C.bg, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <StatusBar />

      <div style={{ padding: '8px 20px 32px', flex: 1, position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <BackButton navigate={navigate} to="settings" />
          <div>
            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 700, fontFamily: 'Poppins, Inter, sans-serif', margin: 0 }}>
              Blocked Contacts
            </h2>
            <p style={{ color: C.textMuted, fontSize: '12px', margin: 0, fontFamily: 'Inter, sans-serif' }}>
              Automatically blocked by AI Shield
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {blockedNumbers.map((b, i) => (
            <GlassCard key={i} style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  <div style={{ color: 'white', fontSize: '15px', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
                    {b.name}
                  </div>
                  <div style={{ color: C.textSec, fontSize: '13px', fontFamily: 'Inter, sans-serif', marginTop: '2px' }}>
                    {b.number}
                  </div>
                </div>
                <button onClick={() => unblockNumber(b.number)} style={{
                  padding: '6px 12px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white', fontSize: '12px', fontWeight: 500, fontFamily: 'Inter, sans-serif',
                  cursor: 'pointer'
                }}>
                  Unblock
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                <span style={{ 
                  color: C.danger, fontSize: '11px', fontWeight: 600, 
                  fontFamily: 'Inter, sans-serif', background: 'rgba(239,68,68,0.1)',
                  padding: '2px 8px', borderRadius: '6px'
                }}>
                  {b.reason}
                </span>
                <span style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'Inter, sans-serif' }}>
                  Blocked on {b.date}
                </span>
              </div>
            </GlassCard>
          ))}
        </div>

        <div style={{ 
          marginTop: '24px', padding: '16px', 
          background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', 
          borderRadius: '16px', textAlign: 'center'
        }}>
          <p style={{ color: C.textSec, fontSize: '13px', fontFamily: 'Inter, sans-serif', margin: 0, lineHeight: 1.5 }}>
            Numbers marked as "Scam" with {">"}90% AI confidence are automatically added to this list.
          </p>
        </div>
      </div>
    </div>
  )
}
