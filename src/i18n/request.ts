import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { LOCALES, DEFAULT_LOCALE } from './config'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const stored = cookieStore.get('locale')?.value ?? DEFAULT_LOCALE
  const locale = (LOCALES as readonly string[]).includes(stored) ? stored : DEFAULT_LOCALE

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
