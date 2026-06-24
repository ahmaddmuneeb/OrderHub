import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { getLocale, getMessages } from 'next-intl/server'
import { Providers } from './providers'
import { isRTL } from '../i18n/config'
import '../index.css'

const inter = Inter({ subsets: ['latin', 'latin-ext'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'OrderHub — Unified Order Management',
  description: 'Manage Shopify, WooCommerce, and BigCommerce orders in one place',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()
  const dir = isRTL(locale) ? 'rtl' : 'ltr'

  return (
    <html lang={locale} dir={dir} className={inter.variable}>
      <body suppressHydrationWarning>
        <Providers locale={locale} messages={messages}>{children}</Providers>
      </body>
    </html>
  )
}
