import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

function generateSignature(appId, secret, payload) {
  const baseString = appId + payload + secret
  return crypto.createHmac('sha256', secret).update(baseString).digest('hex')
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const appId = process.env.SHOPEE_APP_ID
  const secret = process.env.SHOPEE_SECRET_KEY

  try {
    const timestamp = Math.floor(Date.now() / 1000)
    const payload = `${appId}${timestamp}`
    const signature = generateSignature(appId, secret, timestamp.toString())

    const url = `https://open-api.affiliate.shopee.co.th/graphql`

    const query = `
      query {
        getTopSellingProducts(limit: 20) {
          nodes {
            itemId
            itemName
            imageUrl
            priceMin
            priceMax
            commissionRate
            sales
            shopName
            productLink
            affiliateLink
          }
        }
      }
    `

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `SHA256 Credential=${appId},Timestamp=${timestamp},Signature=${signature}`,
      },
      body: JSON.stringify({ query }),
    })

    const data = await response.json()
    const products = data?.data?.getTopSellingProducts?.nodes || []

    if (products.length === 0) {
      return res.status(200).json({ success: true, count: 0, message: 'ไม่พบสินค้าครับ' })
    }

    const upsertData = products.map((p) => ({
      shopee_item_id: String(p.itemId),
      name: p.itemName,
      image_url: p.imageUrl,
      price: p.priceMin,
      original_price: p.priceMax,
      commission_rate: p.commissionRate,
      sales_count: p.sales || 0,
      shop_name: p.shopName,
      affiliate_link: p.affiliateLink,
      is_trending: true,
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabase
      .from('products')
      .upsert(upsertData, { onConflict: 'shopee_item_id' })

    if (error) {
      console.error(error)
      return res.status(500).json({ success: false, error: error.message })
    }

    return res.status(200).json({ success: true, count: upsertData.length })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ success: false, error: e.message })
  }
}
