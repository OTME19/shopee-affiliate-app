/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'cf.shopee.co.th',
      'down-th.img.susercontent.com',
      'cf.shopee.com',
    ],
  },
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
    SHOPEE_APP_ID: process.env.SHOPEE_APP_ID,
    SHOPEE_SECRET_KEY: process.env.SHOPEE_SECRET_KEY,
    CLAUDE_API_KEY: process.env.CLAUDE_API_KEY,
  },
}

module.exports = nextConfig
