import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default function Create() {
  const router = useRouter()
  const { product_id } = router.query
  const [product, setProduct] = useState(null)
  const [script, setScript] = useState('')
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [step, setStep] = useState(1)
  const [shopeeUrl, setShopeeUrl] = useState('')

  useEffect(() => {
    if (product_id) fetchProduct(product_id)
  }, [product_id])

  async function fetchProduct(id) {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
    if (data) setProduct(data)
  }

  async function generateScript() {
    if (!product) return
    setGenerating(true)
    try {
      const res = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product }),
      })
      const data = await res.json()
      if (data.script) {
        setScript(data.script)
        setCaption(data.caption)
        setHashtags(data.hashtags)
        setStep(2)
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดครับ')
    }
    setGenerating(false)
  }

  async function saveVideo() {
    if (!product) return
    setLoading(true)
    try {
      const { error } = await supabase.from('videos').insert({
        product_id: product.id,
        script,
        caption,
        hashtags,
        status: 'pending',
      })
      if (!error) setStep(3)
    } catch (e) {
      alert('บันทึกไม่สำเร็จครับ')
    }
    setLoading(false)
  }

  async function lookupProduct() {
    if (!shopeeUrl) return
    setLoading(true)
    try {
      const res = await fetch('/api/shopee/product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: shopeeUrl }),
      })
      const data = await res.json()
      if (data.product) {
        setProduct(data.product)
      } else {
        alert('ไม่พบสินค้าครับ ลองใหม่อีกครั้ง')
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดครับ')
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>

      <a href="/" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>← กลับหน้าหลัก</a>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 8, marginBottom: 24 }}>สร้างคลิป</h1>

      <div style={{ display: 'flex', marginBottom: 32 }}>
        {['เลือกสินค้า', 'สร้าง Script', 'พร้อมโพสต์'].map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', margin: '0 auto 6px',
              background: step >= i + 1 ? '#EE4D2D' : '#e0e0e0',
              color: step >= i + 1 ? 'white' : '#999',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700,
            }}>
              {i + 1}
            </div>
            <p style={{ fontSize: 12, color: step === i + 1 ? '#EE4D2D' : '#999' }}>{s}</p>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>วางลิงก์สินค้า Shopee</h2>
          <input
            type="text"
            placeholder="https://shopee.co.th/..."
            value={shopeeUrl}
            onChange={(e) => setShopeeUrl(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 14, marginBottom: 12 }}
          />
          <button
            onClick={lookupProduct}
            disabled={loading || !shopeeUrl}
            style={{ background: '#EE4D2D', color: 'white', padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, width: '100%' }}
          >
            {loading ? 'กำลังดึงข้อมูล...' : 'ดึงข้อมูลสินค้า'}
          </button>

          {product && (
            <div style={{ marginTop: 20, padding: 16, background: '#fff8f7', borderRadius: 8, border: '1px solid #ffd5cc' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                {product.image_url && (
                  <img src={product.image_url} alt={product.name} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
                )}
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{product.name}</p>
                  <p style={{ color: '#EE4D2D', fontWeight: 700, fontSize: 16 }}>฿{product.price?.toLocaleString()}</p>
                  <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Commission: {product.commission_rate}%</p>
                </div>
              </div>
              <button
                onClick={generateScript}
                disabled={generating}
                style={{ marginTop: 16, background: '#EE4D2D', color: 'white', padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, width: '100%' }}
              >
                {generating ? 'AI กำลังเขียน Script...' : 'สร้าง Script อัตโนมัติ →'}
              </button>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Script วิดีโอ (35 วิ)</h2>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={8}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 14, lineHeight: 1.6, resize: 'vertical' }}
            />
            <p style={{ fontSize: 12, color: '#aaa', marginTop: 6 }}>แก้ไขได้ตามต้องการครับ</p>
          </div>

          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Caption สำหรับโพสต์</h2>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={4}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 14, lineHeight: 1.6, resize: 'vertical' }}
            />
          </div>

          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Hashtags</h2>
            <textarea
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              rows={2}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 14, lineHeight: 1.6, resize: 'vertical' }}
            />
          </div>

          <button
            onClick={saveVideo}
            disabled={loading}
            style={{ background: '#EE4D2D', color: 'white', padding: '12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 15 }}
          >
            {loading ? 'กำลังบันทึก...' : 'บันทึกและไปขั้นตอนถัดไป →'}
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>พร้อมโพสต์แล้วครับ!</h2>
          <p style={{ color: '#888', fontSize: 14, marginBottom: 24 }}>บันทึก Script และ Caption เรียบร้อย</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <a href="/videos" style={{ background: '#EE4D2D', color: 'white', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
              ดูคลิปทั้งหมด
            </a>
            <a href="/create" style={{ background: '#333', color: 'white', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
              สร้างคลิปใหม่
            </a>
          </div>
        </div>
      )}

    </div>
  )
}
