import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default function Videos() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [copied, setCopied] = useState('')

  useEffect(() => {
    fetchVideos()
  }, [])

  async function fetchVideos() {
    setLoading(true)
    const { data } = await supabase
      .from('videos')
      .select('*, products(name, image_url, price, commission_rate, affiliate_link)')
      .order('created_at', { ascending: false })
    setVideos(data || [])
    setLoading(false)
  }

  async function markAsPosted(id) {
    await supabase
      .from('videos')
      .update({ status: 'posted', posted_at: new Date().toISOString() })
      .eq('id', id)
    fetchVideos()
    setSelected(null)
  }

  function copyText(text, key) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <a href="/" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>← กลับหน้าหลัก</a>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>คลิปทั้งหมด</h1>
        </div>
        <a href="/create" style={{ background: '#EE4D2D', color: 'white', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
          + สร้างคลิปใหม่
        </a>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#888', padding: 40 }}>กำลังโหลด...</p>
      ) : videos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 12 }}>
          <p style={{ fontSize: 16, color: '#888', marginBottom: 16 }}>ยังไม่มีคลิปครับ</p>
          <a href="/create" style={{ background: '#EE4D2D', color: 'white', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
            สร้างคลิปแรก
          </a>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {videos.map((v) => (
              <div
                key={v.id}
                onClick={() => setSelected(v)}
                className="card"
                style={{ cursor: 'pointer', border: selected?.id === v.id ? '2px solid #EE4D2D' : '1px solid #f0f0f0' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {v.products?.image_url && (
                    <img src={v.products.image_url} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8 }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{v.products?.name}</p>
                    <p style={{ fontSize: 12, color: '#888' }}>
                      {new Date(v.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span style={{
                    background: v.status === 'posted' ? '#e8f5e9' : '#fff3e0',
                    color: v.status === 'posted' ? '#2e7d32' : '#e65100',
                    padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600
                  }}>
                    {v.status === 'posted' ? '✅ โพสต์แล้ว' : '⏳ รอโพสต์'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {selected && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 600 }}>Script วิดีโอ</h2>
                  <button
                    onClick={() => copyText(selected.script, 'script')}
                    style={{ background: copied === 'script' ? '#e8f5e9' : '#f5f5f5', color: copied === 'script' ? '#2e7d32' : '#333', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                  >
                    {copied === 'script' ? '✅ Copied!' : 'Copy'}
                  </button>
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: '#444', whiteSpace: 'pre-wrap' }}>{selected.script}</p>
              </div>

              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 600 }}>Caption</h2>
                  <button
                    onClick={() => copyText(selected.caption, 'caption')}
                    style={{ background: copied === 'caption' ? '#e8f5e9' : '#f5f5f5', color: copied === 'caption' ? '#2e7d32' : '#333', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                  >
                    {copied === 'caption' ? '✅ Copied!' : 'Copy'}
                  </button>
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: '#444', whiteSpace: 'pre-wrap' }}>{selected.caption}</p>
              </div>

              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 600 }}>Hashtags</h2>
                  <button
                    onClick={() => copyText(selected.hashtags, 'hashtags')}
                    style={{ background: copied === 'hashtags' ? '#e8f5e9' : '#f5f5f5', color: copied === 'hashtags' ? '#2e7d32' : '#333', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                  >
                    {copied === 'hashtags' ? '✅ Copied!' : 'Copy'}
                  </button>
                </div>
                <p style={{ fontSize: 13, color: '#EE4D2D', lineHeight: 1.7 }}>{selected.hashtags}</p>
              </div>

              {selected.products?.affiliate_link && (
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 600 }}>ลิงก์ Affiliate</h2>
                    <button
                      onClick={() => copyText(selected.products.affiliate_link, 'link')}
                      style={{ background: copied === 'link' ? '#e8f5e9' : '#f5f5f5', color: copied === 'link' ? '#2e7d32' : '#333', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                    >
                      {copied === 'link' ? '✅ Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p style={{ fontSize: 12, color: '#888', wordBreak: 'break-all' }}>{selected.products.affiliate_link}</p>
                </div>
              )}

              {selected.status !== 'posted' && (
                <button
                  onClick={() => markAsPosted(selected.id)}
                  style={{ background: '#2e7d32', color: 'white', padding: '12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 15 }}
                >
                  ✅ ทำเครื่องหมายว่าโพสต์แล้ว
                </button>
              )}

              <button
                onClick={() => setSelected(null)}
                style={{ background: '#f5f5f5', color: '#333', padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14 }}
              >
                ปิด
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
