'use client'

import { Search, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useOrderStore } from '../../store/useOrderStore'

export function FilterBar() {
  const t = useTranslations('filters')
  const { filters, setFilter } = useOrderStore()

  const hasFilters = filters.search || filters.dateFrom || filters.dateTo

  function clearAll() {
    setFilter('search', '')
    setFilter('dateFrom', '')
    setFilter('dateTo', '')
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* Search — uses logical properties for RTL */}
      <div className="relative min-w-[200px] flex-1">
        <Search size={13} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full rounded-xl border border-white/[0.1] bg-white/[0.06] py-2.5 ps-9 pe-9 text-sm text-slate-200
                     placeholder:text-slate-600 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-shadow"
        />
        {filters.search && (
          <button
            onClick={() => setFilter('search', '')}
            className="absolute end-3 top-1/2 -translate-y-1/2 rounded text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Date range */}
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilter('dateFrom', e.target.value)}
          className="rounded-xl border border-white/[0.1] bg-white/[0.06] px-3 py-2.5 text-sm text-slate-300
                     focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-shadow
                     [color-scheme:dark]"
        />
        <span className="text-xs font-medium text-slate-600">→</span>
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilter('dateTo', e.target.value)}
          className="rounded-xl border border-white/[0.1] bg-white/[0.06] px-3 py-2.5 text-sm text-slate-300
                     focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-shadow
                     [color-scheme:dark]"
        />
      </div>

      {hasFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-600
                     hover:bg-white/[0.06] hover:text-slate-300 transition-colors"
        >
          <X size={11} />
          {t('clear')}
        </button>
      )}
    </div>
  )
}
