export const LOCALES = [
  'en', 'ur', 'ar', 'es', 'fr', 'de', 'zh-CN', 'ja', 'ko', 'pt', 'tr', 'hi',
] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

export const RTL_LOCALES: readonly Locale[] = ['ur', 'ar']

export function isRTL(locale: string): boolean {
  return (RTL_LOCALES as readonly string[]).includes(locale)
}

export const LOCALE_NAMES: Record<Locale, { native: string; english: string }> = {
  en:     { native: 'English',         english: 'English' },
  ur:     { native: 'اردو',            english: 'Urdu' },
  ar:     { native: 'العربية',         english: 'Arabic' },
  es:     { native: 'Español',         english: 'Spanish' },
  fr:     { native: 'Français',        english: 'French' },
  de:     { native: 'Deutsch',         english: 'German' },
  'zh-CN':{ native: '中文（简体）',    english: 'Chinese (Simplified)' },
  ja:     { native: '日本語',           english: 'Japanese' },
  ko:     { native: '한국어',           english: 'Korean' },
  pt:     { native: 'Português',       english: 'Portuguese' },
  tr:     { native: 'Türkçe',          english: 'Turkish' },
  hi:     { native: 'हिन्दी',          english: 'Hindi' },
}
