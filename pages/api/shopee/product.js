import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

function generateSignature(appId, secret, timestamp) {
  const baseString = `${appId}${timestamp}`
  return crypto.createHmac('sha256', secret).update(baseString).digest('hex')
}

function extractItemId(url) {
  const patterns = [
    /i\.(\d+)\.(\d+)/,
    /product\/(\d+)\/(\d+)/,
    /-i\.(\d+)\.(\d+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return { shopId: match[1], itemId: match[2] }
  }
  return null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { url } = req.body
  if (!url) return res.status(400).json({ error: 'No URL provided' })

  const appId = process.env.SHOPEE_APP_ID
  const secret = process.env.SHOPEE_SECRET_KEY

  try {
    const ids = extractItemId(url)
    if (!ids) return res.status(400).json({ error: 'ลิงก์ไม่ถูกต้องครับ' })

    const timestamp = Math.floor(Date.now() / 1000)
    const signature = generateSignature(appId, secret, timestamp)

    const query = `
      query {
        getProductDetail(shopId: "${ids.shopId}", itemId: "${ids.itemId}") {
          itemId
          itemName
          imageUrl
          priceMin
          commissionRate
          sales
          shopName
          affiliateLink
          productLink
        }
      }
    `

    const response = await fetch('https://open-api.affiliate.shopee.co.th/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `SHA256 Credential=${appId},Timestamp=${timestamp},Signature=${signature}`,
      },
      body: JSON.stringify({ query }),
    })

    const data = await response.json()
    const p = data?.data?.getProductDetail

    if (!p) return res.status(404).json({ error: 'ไม่พบสินค้าครับ' })

    const productData = {
      shopee_item_id: String(p.itemId),
      name: p.itemName,
      image_url: p.imageUrl,
      price: p.priceMin,
      commission_rate: p.commissionRate,
      sales_count: p.sales || 0,
      shop_name: p.shopName,
      affiliate_link: p.affiliateLink,
      updated_at: new Date().toISOString(),
    }

    const { data: saved, error } = await supabase
      .from('products')
      .upsert(productData, { onConflict: 'shopee_item_id' })
      .select()
      .single()

    if (error) {
      console.error(error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ product: saved })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: e.message })
  }
}
