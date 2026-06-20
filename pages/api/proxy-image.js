export default async function handler(req, res) {
  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'No URL' })

  try {
    const response = await fetch(decodeURIComponent(url), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://shopee.co.th/',
      },
    })

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const buffer = await response.arrayBuffer()

    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=86400')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.send(Buffer.from(buffer))
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'โหลดรูปไม่สำเร็จครับ' })
  }
}
