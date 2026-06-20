export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { url } = req.body
  if (!url) return res.status(400).json({ error: 'No URL provided' })

  try {
    const cleanUrl = url.split('?')[0]
    
    const response = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'th-TH,th;q=0.9',
      },
    })

    const html = await response.text()

    // ดึง JSON data จาก Shopee page
    const dataMatch = html.match(/window\.__NEXT_DATA__\s*=\s*({.+?})<\/script>/s) ||
                      html.match(/window\.pageData\s*=\s*({.+?});/s)

    let product = null

    if (dataMatch) {
      try {
        const pageData = JSON.parse(dataMatch[1])
        const itemData = pageData?.props?.pageProps?.initialData?.data?.productDetailData?.item ||
                        pageData?.props?.pageProps?.data?.itemInfo?.item

        if (itemData) {
          product = {
            shopee_item_id: String(itemData.itemid || itemData.item_id || ''),
            name: itemData.name || '',
            image_url: itemData.image
              ? `https://cf.shopee.co.th/file/${itemData.image}`
              : (itemData.images?.[0] ? `https://cf.shopee.co.th/file/${itemData.images[0]}` : ''),
            price: itemData.price ? itemData.price / 100000 : 0,
            original_price: itemData.price_before_discount ? itemData.price_before_discount / 100000 : 0,
            commission_rate: 0,
            sales_count: itemData.historical_sold || itemData.sold || 0,
            shop_name: itemData.shop_name || '',
            affiliate_link: url,
          }
        }
      } catch (e) {
        console.error('Parse error:', e)
      }
    }

    // fallback: ดึงจาก meta tags
    if (!product) {
      const titleMatch = html.match(/<title>([^<]+)<\/title>/)
      const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/)
      const priceMatch = html.match(/<meta property="product:price:amount" content="([^"]+)"/)

      product = {
        shopee_item_id: String(Date.now()),
        name: titleMatch ? titleMatch[1].replace(' | Shopee Thailand', '').trim() : 'สินค้าจาก Shopee',
        image_url: imageMatch ? imageMatch[1] : '',
        price: priceMatch ? parseFloat(priceMatch[1]) : 0,
        original_price: 0,
        commission_rate: 0,
        sales_count: 0,
        shop_name: '',
        affiliate_link: url,
      }
    }

    return res.status(200).json({ product })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'ดึงข้อมูลสินค้าไม่สำเร็จครับ: ' + e.message })
  }
}
