'use server'

import { cookies } from 'next/headers'
import { LOCALES, DEFAULT_LOCALE } from '../i18n/config'

export async function setLocale(locale: string) {
  const valid = (LOCALES as readonly string[]).includes(locale) ? locale : DEFAULT_LOCALE
  const cookieStore = await cookies()
  cookieStore.set('locale', valid, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
}
