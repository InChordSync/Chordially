import { useState, useCallback, useEffect } from 'react'

interface NotificationItem {
  id: string
  type: string
  title: string
  body: string
  readAt: string | null
  createdAt: string
}

export default function NotificationDrawer({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=50')
      const data = await res.json()
      setItems(data.notifications || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const markRead = useCallback(async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
    setItems(prev => prev.map(i => i.id === id ? { ...i, readAt: new Date().toISOString() } : i))
  }, [])

  return (
    <div style={{
      position: 'fixed', right: 0, top: 0, width: 360, height: '100vh',
      background: '#fff', boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
      display: 'flex', flexDirection: 'column', zIndex: 1000
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: 16, borderBottom: '1px solid #e5e7eb' }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Notifications</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}>&times;</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
        {loading && <p style={{ textAlign: 'center', color: '#6b7280' }}>Loading...</p>}
        {!loading && items.length === 0 && <p style={{ textAlign: 'center', color: '#6b7280' }}>No notifications</p>}
        {items.map(item => (
          <div key={item.id} onClick={() => markRead(item.id)}
            style={{
              padding: 12, marginBottom: 4, borderRadius: 8, cursor: 'pointer',
              background: item.readAt ? '#f9fafb' : '#eff6ff'
            }}>
            <div style={{ fontSize: 14, fontWeight: item.readAt ? 400 : 600 }}>{item.title}</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{item.body}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
