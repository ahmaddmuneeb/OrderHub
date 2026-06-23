import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // firebase-admin + crypto-js are server-only; don't bundle them client-side
  serverExternalPackages: ['firebase-admin', 'crypto-js', 'oauth-1.0a', 'axios'],
}

export default nextConfig
