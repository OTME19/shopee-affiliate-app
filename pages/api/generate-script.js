export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { product, aiProvider } = req.body
  if (!product) return res.status(400).json({ error: 'No product data' })

  const prompt = `คุณเป็นผู้เชี่ยวชาญด้านการสร้าง content ขายสินค้าใน Shopee Video Feed

สินค้า: ${product.name}
ราคา: ฿${product.price}
ร้าน: ${product.shop_name || 'Shopee'}

สร้างสิ่งต่อไปนี้เป็น JSON format เท่านั้น ไม่ต้องมีข้อความอื่น:
{
  "script": "script วิดีโอ 35 วินาที ภาษาพูดธรรมชาติ มี hook ดึงดูด 5 วิแรก จุดเด่นสินค้า และ call to action",
  "caption": "caption สำหรับโพสต์ใน Shopee Video Feed ไม่เกิน 150 ตัวอักษร",
  "hashtags": "hashtag ภาษาไทยและอังกฤษ 8-10 ตัว คั่นด้วยช่องว่าง"
}`

  try {
    let text = ''

    if (aiProvider === 'gemini') {
      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + process.env.GEMINI_API_KEY,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
          }),
        }
      )
      const data = await response.json()
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
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await response.json()
      text = data?.content?.[0]?.text || ''

    } else {
      return res.status(400).json({ error: 'กรุณาเลือก AI ครับ' })
    }

    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return res.status(200).json(parsed)

  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'สร้าง script ไม่สำเร็จครับ: ' + e.message })
  }
}
