'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Globe, Check, ChevronUp } from 'lucide-react'
import { setLocale } from '../../lib/locale-action'
import { LOCALES, LOCALE_NAMES, type Locale } from '../../i18n/config'

interface Props {
  collapsed?: boolean
}

export function LanguageSwitcher({ collapsed = false }: Props) {
  const locale = useLocale() as Locale
  const t = useTranslations('language')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [focused, setFocused] = useState<number>(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const filtered = LOCALES.filter((code) => {
    if (!search) return true
    const q = search.toLowerCase()
    const info = LOCALE_NAMES[code]
    return (
      info.native.toLowerCase().includes(q) ||
      info.english.toLowerCase().includes(q) ||
      code.toLowerCase().includes(q)
    )
  })

  const current = LOCALE_NAMES[locale]

  async function switchLocale(code: Locale) {
    setOpen(false)
    setSearch('')
    await setLocale(code)
    router.refresh()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        setOpen(true)
        setFocused(0)
      }
      return
    }
    if (e.key === 'Escape') { setOpen(false); setFocused(-1) }
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocused((f) => Math.min(f + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setFocused((f) => Math.max(f - 1, 0)) }
    if (e.key === 'Enter' && focused >= 0 && filtered[focused]) {
      e.preventDefault()
      switchLocale(filtered[focused])
    }
    if (e.key === 'Tab') { setOpen(false) }
  }

  useEffect(() => {
    if (open && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  useEffect(() => {
    if (focused >= 0 && listRef.current) {
      const item = listRef.current.children[focused] as HTMLElement
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [focused])

  const handleToggle = useCallback(() => {
    setOpen((o) => {
      if (o) setSearch('')
      return !o
    })
    setFocused(-1)
  }, [])

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      {/* Trigger */}
      <button
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('label')}
        title={collapsed ? t('label') : undefined}
        className={`group flex w-full items-center rounded-xl px-2.5 py-2 text-sm transition-all duration-150 ${
          collapsed ? 'justify-center' : 'gap-2.5'
        } ${
          open
            ? 'bg-white/[0.08] text-slate-200'
            : 'text-slate-500 hover:bg-white/[0.05] hover:text-slate-300'
        }`}
      >
        <Globe
          size={15}
          className={`shrink-0 transition-colors ${open ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-400'}`}
        />
        {!collapsed && (
          <>
            <span className="flex-1 truncate text-start text-xs font-semibold">
              {current.native}
            </span>
            <ChevronUp
              size={12}
              className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-0' : 'rotate-180'}`}
            />
          </>
        )}
      </button>

      {/* Panel — opens upward */}
      {open && (
        <div
          className={`absolute z-50 bottom-full mb-2 animate-dropdown-in ${
            collapsed ? 'start-0 w-56' : 'start-0 end-0'
          }`}
          style={{ transformOrigin: 'bottom' }}
          role="dialog"
          aria-label={t('select')}
        >
          <div className="overflow-hidden rounded-2xl border border-white/[0.1] bg-slate-900/95 shadow-2xl shadow-black/50 backdrop-blur-xl ring-1 ring-white/[0.06]">
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-white/[0.07] px-3 py-2.5">
              <Globe size={12} className="shrink-0 text-indigo-400" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                {t('label')}
              </span>
            </div>

            {/* Search */}
            <div className="border-b border-white/[0.06] px-2 py-1.5">
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setFocused(0) }}
                placeholder="Search…"
                className="w-full rounded-lg bg-white/[0.06] px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
              />
            </div>

            {/* List */}
            <ul
              ref={listRef}
              role="listbox"
              aria-label={t('select')}
              className="max-h-56 overflow-y-auto py-1 scrollbar-thin"
            >
              {filtered.length === 0 ? (
                <li className="px-3 py-4 text-center text-xs text-slate-600">No languages found</li>
              ) : (
                filtered.map((code, idx) => {
                  const info = LOCALE_NAMES[code]
                  const isActive = code === locale
                  const isFocused = idx === focused
                  return (
                    <li
                      key={code}
                      role="option"
                      aria-selected={isActive}
                      onClick={() => switchLocale(code)}
                      onMouseEnter={() => setFocused(idx)}
                      className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 transition-colors duration-100 ${
                        isFocused
                          ? 'bg-white/[0.07]'
                          : isActive
                          ? 'bg-indigo-600/10'
                          : 'hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="min-w-0">
                        <p
                          className={`truncate text-sm font-semibold leading-tight ${
                            isActive ? 'text-indigo-400' : 'text-slate-200'
                          }`}
                          dir="auto"
                        >
                          {info.native}
                        </p>
                        <p className="truncate text-[10px] text-slate-600">{info.english}</p>
                      </div>
                      {isActive && (
                        <Check size={13} className="shrink-0 text-indigo-400" />
                      )}
                    </li>
                  )
                })
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
