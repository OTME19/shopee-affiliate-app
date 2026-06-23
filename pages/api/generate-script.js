export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { product, aiProvider } = req.body
  if (!product) return res.status(400).json({ error: 'No product data' })

  const prompt = `คุณเป็นผู้เชี่ยวชาญด้านการสร้าง content ขายสินค้าใน Shopee Video Feed

สินค้า: ${product.name}
ราคา: ฿${product.price}
ร้าน: ${product.shop_name || 'Shopee'}

ตอบกลับเป็น JSON เท่านั้น ห้ามมีข้อความอื่นนอกจาก JSON ห้ามใช้ markdown:
{"script":"script วิดีโอ 35 วินาที ภาษาพูดธรรมชาติ มี hook ดึงดูด จุดเด่นสินค้า และ call to action","caption":"caption สำหรับโพสต์ไม่เกิน 150 ตัวอักษร","hashtags":"hashtag 8-10 ตัว คั่นด้วยช่องว่าง"}`

  try {
    let text = ''

    if (aiProvider === 'gemini') {
      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + process.env.GEMINI_API_KEY,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024,
            },
          }),
        }
      )
      const data = await response.json()
      console.log('Gemini raw:', JSON.stringify(data).substring(0, 500))
      text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''

    } else if (aiProvider === 'claude') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await response.json()
      text = data?.content?.[0]?.text || ''

    } else {
      return res.status(400).json({ error: 'กรุณาเลือก AI ครับ' })
    }

    if (!text) return res.status(500).json({ error: 'AI ไม่ส่ง response กลับมาครับ' })

    const clean = text.replace(/```json|```/g, '').trim()
    const firstBrace = clean.indexOf('{')
    const lastBrace = clean.lastIndexOf('}')
    const jsonOnly = clean.substring(firstBrace, lastBrace + 1)
    const parsed = JSON.parse(jsonOnly)
    return res.status(200).json(parsed)

  } catch (e) {
    console.error('Error:', e.message)
    return res.status(500).json({ error: 'สร้าง script ไม่สำเร็จครับ: ' + e.message })
  }
}
