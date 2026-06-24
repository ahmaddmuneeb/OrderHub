import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  // firebase-admin + crypto-js are server-only; don't bundle them client-side
  serverExternalPackages: ['firebase-admin', 'crypto-js', 'oauth-1.0a', 'axios'],
}

export default withNextIntl(nextConfig)
