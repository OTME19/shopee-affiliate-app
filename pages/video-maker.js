import { useState, useRef } from 'react'

export default function VideoMaker() {
  const canvasRef = useRef(null)
  const [product, setProduct] = useState(null)
  const [script, setScript] = useState('')
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [shopeeUrl, setShopeeUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [rendering, setRendering] = useState(false)
  const [videoUrl, setVideoUrl] = useState(null)
  const [step, setStep] = useState(1)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [copied, setCopied] = useState('')

  async function fetchProduct() {
    if (!shopeeUrl) return
    setLoading(true)
    try {
      const res = await fetch('/api/shopee/product', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: shopeeUrl }) })
      const data = await res.json()
      if (data.product) { setProduct(data.product) } else { alert('ดึงข้อมูลไม่สำเร็จครับ') }
    } catch (e) { alert('เกิดข้อผิดพลาดครับ') }
    setLoading(false)
  }

  async function generateScript() {
    if (!product) return
    setGenerating(true)
    try {
      const res = await fetch('/api/generate-script', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product }) })
      const data = await res.json()
      if (data.script) { setScript(data.script); setCaption(data.caption); setHashtags(data.hashtags); setStep(2) }
    } catch (e) { alert('เกิดข้อผิดพลาดครับ') }
    setGenerating(false)
  }

  function drawFrame(ctx, img, lines, frameIndex, totalFrames) {
    const w = 1080
    const h = 1920
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, w, h)
    if (img) {
      const imgSize = 900
      const imgX = (w - imgSize) / 2
      const imgY = 180
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(imgX, imgY, imgSize, imgSize, 40)
      ctx.clip()
      ctx.drawImage(img, imgX, imgY, imgSize, imgSize)
      ctx.restore()
    }
    const grad = ctx.createLinearGradient(0, 1000, 0, h)
    grad.addColorStop(0, 'rgba(26,26,26,0)')
    grad.addColorStop(0.4, 'rgba(26,26,26,0.95)')
    grad.addColorStop(1, 'rgba(26,26,26,1)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 1000, w, h - 1000)
    if (product && product.price) {
      ctx.fillStyle = '#EE4D2D'
      ctx.beginPath()
      ctx.roundRect(60, 1100, 280, 70, 12)
      ctx.fill()
      ctx.fillStyle = 'white'
      ctx.font = 'bold 38px sans-serif'
      ctx.fillText('฿' + Number(product.price).toLocaleString(), 80, 1148)
    }
    const progress = frameIndex / totalFrames
    const lineIndex = Math.floor(progress * lines.length)
    const currentLine = lines[Math.min(lineIndex, lines.length - 1)] || ''
    if (currentLine) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.beginPath()
      ctx.roundRect(60, 1580, w - 120, 100, 12)
      ctx.fill()
      ctx.fillStyle = '#FFFF00'
      ctx.font = 'bold 44px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(currentLine, w / 2, 1643)
      ctx.textAlign = 'left'
    }
    ctx.fillStyle = 'white'
    ctx.font = 'bold 48px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(product && product.name ? product.name.substring(0, 60) : '', w / 2, 1750)
    ctx.textAlign = 'left'
    ctx.fillStyle = '#EE4D2D'
    ctx.font = 'bold 36px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Shopee', w / 2, 1860)
    ctx.textAlign = 'left'
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.fillRect(0, h - 8, w, 8)
    ctx.fillStyle = '#EE4D2D'
    ctx.fillRect(0, h - 8, w * progress, 8)
  }

  async function renderVideo() {
    if (!product || !script) return
    setRendering(true)
    setVideoUrl(null)
    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      canvas.width = 1080
      canvas.height = 1920
      let img = null
      if (product.image_url) {
        img = await new Promise((resolve) => {
          const i = new Image()
          i.crossOrigin = 'anonymous'
          i.onload = () => resolve(i)
          i.onerror = () => resolve(null)
          i.src = '/api/proxy-image?url=' + encodeURIComponent(product.image_url)
        })
      }
      const words = script.split(' ')
      const lines = []
      let line = ''
      for (const word of words) {
        if ((line + ' ' + word).trim().length > 20) { if (line) lines.push(line.trim()); line = word }
        else { line = (line + ' ' + word).trim() }
      }
      if (line) lines.push(line.trim())
      const fps = 30
      const totalFrames = fps * 35
      const chunks = []
      const stream = canvas.captureStream(fps)
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: 2500000 })
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        setVideoUrl(URL.createObjectURL(blob))
        setStep(3)
        setRendering(false)
      }
      recorder.start()
      for (let f = 0; f < totalFrames; f++) {
        drawFrame(ctx, img, lines, f, totalFrames)
        setCurrentFrame(f)
        await new Promise((r) => setTimeout(r, 1000 / fps))
      }
      recorder.stop()
    } catch (e) { alert('เกิดข้อผิดพลาด: ' + e.message); setRendering(false) }
  }

  function copyText(text, key) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  const progress = rendering ? Math.round((currentFrame / (30 * 35)) * 100) : 0

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>
      <a href="/" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>กลับหน้าหลัก</a>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 8, marginBottom: 24 }}>สร้างวิดีโอ</h1>
      <div style={{ display: 'flex', marginBottom: 32 }}>
        {['ใส่ลิงก์สินค้า', 'สร้างวิดีโอ', 'ดาวน์โหลด'].map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', margin: '0 auto 6px', background: step >= i + 1 ? '#EE4D2D' : '#e0e0e0', color: step >= i + 1 ? 'white' : '#999', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>{i + 1}</div>
            <p style={{ fontSize: 12, color: step === i + 1 ? '#EE4D2D' : '#999' }}>{s}</p>
          </div>
        ))}
      </div>
      {step === 1 && (
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>วางลิงก์สินค้า Shopee</h2>
          <input type="text" placeholder="https://shopee.co.th/..." value={shopeeUrl} onChange={(e) => setShopeeUrl(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 14, marginBottom: 12 }} />
          <button onClick={fetchProduct} disabled={loading || !shopeeUrl} style={{ background: '#EE4D2D', color: 'white', padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, width: '100%', fontSize: 14 }}>{loading ? 'กำลังดึงข้อมูล...' : 'ดึงข้อมูลสินค้า'}</button>
          {product && (
            <div style={{ marginTop: 20, padding: 16, background: '#fff8f7', borderRadius: 8, border: '1px solid #ffd5cc' }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                {product.image_url && <img src={product.image_url} alt={product.name} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />}
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{product.name}</p>
                  <p style={{ color: '#EE4D2D', fontWeight: 700, fontSize: 16 }}>{'฿' + Number(product.price).toLocaleString()}</p>
                </div>
              </div>
              <textarea value={script} onChange={(e) => setScript(e.target.value)} placeholder="กด สร้าง Script อัตโนมัติ หรือพิมพ์เองได้เลยครับ" rows={5} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 13, lineHeight: 1.6, resize: 'vertical', marginBottom: 8 }} />
              <button onClick={generateScript} disabled={generating} style={{ background: '#333', color: 'white', padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, marginBottom: 8, width: '100%' }}>{generating ? 'AI กำลังเขียน...' : 'สร้าง Script อัตโนมัติ'}</button>
              {script && <button onClick={renderVideo} disabled={rendering} style={{ background: '#EE4D2D', color: 'white', padding: '12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, width: '100%', fontSize: 15 }}>{rendering ? ('กำลังสร้างวิดีโอ... ' + progress + '%') : 'สร้างวิดีโอ 35 วิ'}</button>}
              {rendering && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ background: '#f0f0f0', borderRadius: 8, height: 12, overflow: 'hidden' }}>
                    <div style={{ background: '#EE4D2D', height: '100%', width: progress + '%', transition: 'width 0.3s' }} />
                  </div>
                  <p style={{ fontSize: 12, color: '#888', marginTop: 6, textAlign: 'center' }}>{'กรุณารอสักครู่ (' + progress + '%)'}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {step === 3 && videoUrl && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>วิดีโอพร้อมแล้วครับ!</p>
            <video src={videoUrl} controls style={{ width: '100%', maxHeight: 400, borderRadius: 12, background: '#000', marginBottom: 16 }} />
            <a href={videoUrl} download="video.webm" style={{ display: 'block', background: '#EE4D2D', color: 'white', padding: '12px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 15, marginBottom: 8 }}>ดาวน์โหลดวิดีโอ</a>
            <button onClick={() => { setStep(1); setVideoUrl(null); setProduct(null); setScript(''); setShopeeUrl('') }} style={{ background: '#f5f5f5', color: '#333', padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer', width: '100%', fontSize: 14 }}>สร้างวิดีโอใหม่</button>
          </div>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600 }}>Caption</h2>
              <button onClick={() => copyText(caption, 'caption')} style={{ background: copied === 'caption' ? '#e8f5e9' : '#f5f5f5', color: copied === 'caption' ? '#2e7d32' : '#333', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>{copied === 'caption' ? 'Copied!' : 'Copy'}</button>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: '#444' }}>{caption}</p>
          </div>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600 }}>Hashtags</h2>
              <button onClick={() => copyText(hashtags, 'hashtags')} style={{ background: copied === 'hashtags' ? '#e8f5e9' : '#f5f5f5', color: copied === 'hashtags' ? '#2e7d32' : '#333', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>{copied === 'hashtags' ? 'Copied!' : 'Copy'}</button>
            </div>
            <p style={{ fontSize: 13, color: '#EE4D2D', lineHeight: 1.7 }}>{hashtags}</p>
          </div>
          <div className="card" style={{ background: '#fff8f7', border: '1px solid #ffd5cc' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>วิธีโพสต์ใน Shopee Video Feed</h2>
            <ol style={{ fontSize: 13, color: '#555', lineHeight: 2, paddingLeft: 20 }}>
              <li>ดาวน์โหลดวิดีโอลงมือถือ</li>
              <li>เปิดแอพ Shopee กด ฉัน แล้วกด วิดีโอของฉัน</li>
              <li>กด + อัพโหลดวิดีโอ</li>
              <li>วาง Caption และ Hashtag ที่ Copy ไว้</li>
              <li>กด เผยแพร่</li>
            </ol>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}
