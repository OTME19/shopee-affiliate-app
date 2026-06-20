import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default function Home() {
  const [products, setProducts] = useState([])
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalVideos: 0,
    totalViews: 0,
    totalCommission: 0,
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    setLoading(true)
    const { data: productData } = await supabase
      .from('products')
      .select('*')
      .order('commission_rate', { ascending: false })
      .limit(5)

    const { data: videoData } = await supabase
      .from('videos')
      .select('*, products(name, image_url)')
      .order('created_at', { ascending: false })
      .limit(5)

    const { data: analyticsData } = await supabase
      .from('analytics')
      .select('views, clicks, commission_earned')

    const totalViews = analyticsData?.reduce((sum, a) => sum + (a.views || 0), 0) || 0
    const totalCommission = analyticsData?.reduce((sum, a) => sum + (a.commission_earned || 0), 0) || 0

    setProducts(productData || [])
    setVideos(videoData || [])
    setStats({
      totalProducts: productData?.length || 0,
      totalVideos: videoData?.length || 0,
      totalViews,
      totalCommission,
    })
    setLoading(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p style={{ color: '#EE4D2D', fontSize: 18 }}>กำลังโหลด...</p>
    </div>
  )

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#EE4D2D' }}>Shopee Affiliate</h1>
          <p style={{ color: '#888', fontSize: 14 }}>ระบบสร้างคลิปอัตโนมัติ</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href="/trending" style={{ background: '#EE4D2D', color: 'white', padding: '8px 16px', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
            สินค้า Trending
          </a>
          <a href="/video-maker" style={{ background: '#333', color: 'white', padding: '8px 16px', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
  🎬 สร้างวิดีโอ
          </a>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'สินค้าทั้งหมด', value: stats.totalProducts, unit: 'ชิ้น', color: '#EE4D2D' },
          { label: 'วิดีโอที่สร้าง', value: stats.totalVideos, unit: 'คลิป', color: '#333' },
          { label: 'ยอดวิวรวม', value: stats.totalViews.toLocaleString(), unit: 'ครั้ง', color: '#1a73e8' },
          { label: 'Commission รวม', value: stats.totalCommission.toFixed(2), unit: 'บาท', color: '#2e7d32' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>{s.label}</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: 12, color: '#aaa' }}>{s.unit}</p>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>สินค้า Commission สูงสุด</h2>
          <a href="/trending" style={{ fontSize: 13, color: '#EE4D2D' }}>ดูทั้งหมด →</a>
        </div>
        {products.length === 0 ? (
          <p style={{ color: '#aaa', textAlign: 'center', padding: '24px 0' }}>
            ยังไม่มีสินค้า — ไปที่ "สินค้า Trending" เพื่อดึงข้อมูลครับ
          </p>
        ) : (
          products.map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
              {p.image_url && <img src={p.image_url} alt={p.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} />}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</p>
                <p style={{ fontSize: 12, color: '#888' }}>฿{p.price?.toLocaleString()} · Commission {p.commission_rate}%</p>
              </div>
              <a href={`/create?product_id=${p.id}`} style={{ background: '#EE4D2D', color: 'white', padding: '6px 12px', borderRadius: 6, fontSize: 12, textDecoration: 'none' }}>
                สร้างคลิป
              </a>
            </div>
          ))
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>คลิปล่าสุด</h2>
          <a href="/videos" style={{ fontSize: 13, color: '#EE4D2D' }}>ดูทั้งหมด →</a>
        </div>
        {videos.length === 0 ? (
          <p style={{ color: '#aaa', textAlign: 'center', padding: '24px 0' }}>
            ยังไม่มีคลิป — กด "สร้างคลิป" เพื่อเริ่มต้นครับ
          </p>
        ) : (
          videos.map((v) => (
            <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 500 }}>{v.products?.name}</p>
                <p style={{ fontSize: 12, color: '#888' }}>{new Date(v.created_at).toLocaleDateString('th-TH')}</p>
              </div>
              <span style={{
                background: v.status === 'posted' ? '#e8f5e9' : '#fff3e0',
                color: v.status === 'posted' ? '#2e7d32' : '#e65100',
                padding: '4px 10px', borderRadius: 20, fontSize: 12
              }}>
                {v.status === 'posted' ? 'โพสต์แล้ว' : 'รอโพสต์'}
              </span>
            </div>
          ))
        )}
      </div>

    </div>
  )
}
