import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default function Trending() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [sortBy, setSortBy] = useState('commission_rate')

  useEffect(() => {
    fetchProducts()
  }, [sortBy])

  async function fetchProducts() {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*')
      .order(sortBy, { ascending: false })
      .limit(50)
    setProducts(data || [])
    setLoading(false)
  }

  async function syncTrending() {
    setFetching(true)
    try {
      const res = await fetch('/api/shopee/trending')
      const data = await res.json()
      if (data.success) {
        alert(`ดึงสินค้าสำเร็จ ${data.count} รายการครับ`)
        fetchProducts()
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.error)
      }
    } catch (e) {
      alert('เชื่อมต่อไม่ได้ครับ')
    }
    setFetching(false)
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <a href="/" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>← กลับหน้าหลัก</a>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>สินค้า Trending</h1>
        </div>
        <button
          onClick={syncTrending}
          disabled={fetching}
          style={{ background: '#EE4D2D', color: 'white', padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
        >
          {fetching ? 'กำลังดึงข้อมูล...' : 'ดึงสินค้า Trending'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { key: 'commission_rate', label: 'Commission สูงสุด' },
          { key: 'sales_count', label: 'ขายดีสุด' },
          { key: 'created_at', label: 'ล่าสุด' },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setSortBy(s.key)}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer', border: 'none',
              background: sortBy === s.key ? '#EE4D2D' : '#f0f0f0',
              color: sortBy === s.key ? 'white' : '#333',
              fontWeight: sortBy === s.key ? 600 : 400,
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#888', padding: 40 }}>กำลังโหลด...</p>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 12 }}>
          <p style={{ fontSize: 16, color: '#888', marginBottom: 16 }}>ยังไม่มีสินค้าครับ</p>
          <p style={{ fontSize: 14, color: '#aaa' }}>กด "ดึงสินค้า Trending" เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {products.map((p) => (
            <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {p.image_url && (
                <img src={p.image_url} alt={p.name} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8 }} />
              )}
              <p style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.4 }}>{p.name}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#EE4D2D' }}>฿{p.price?.toLocaleString()}</p>
                <span style={{ background: '#fff0ed', color: '#EE4D2D', padding: '2px 8px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                  {p.commission_rate}%
                </span>
              </div>
              <p style={{ fontSize: 12, color: '#888' }}>ขายแล้ว {p.sales_count?.toLocaleString()} ชิ้น</p>
              
                href={'/create?product_id=' + p.id} 
                style={{ background: '#EE4D2D', color: 'white', padding: '8px', borderRadius: 8, fontSize: 13, textDecoration: 'none', textAlign: 'center', fontWeight: 600, marginTop: 'auto' }}
              >
                สร้างคลิป
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
