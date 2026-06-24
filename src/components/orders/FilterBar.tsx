'use client'

import { Search, X } from 'lucide-react'
import { Platform } from '../../types'
import { useOrderStore } from '../../store/useOrderStore'

const PLATFORMS: { value: Platform | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'shopify', label: 'Shopify' },
  { value: 'woocommerce', label: 'WooCommerce' },
  { value: 'bigcommerce', label: 'BigCommerce' },
]

export function FilterBar() {
  const { filters, setFilter } = useOrderStore()

  const hasFilters =
    filters.search || filters.platform !== 'all' || filters.dateFrom || filters.dateTo

  function clearAll() {
    setFilter('search', '')
    setFilter('platform', 'all')
    setFilter('dateFrom', '')
    setFilter('dateTo', '')
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* Search */}
      <div className="relative min-w-[220px] flex-1">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          placeholder="Search orders or customers…"
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-8 text-sm
                     placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        {filters.search && (
          <button
            onClick={() => setFilter('search', '')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Platform pills */}
      <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
        {PLATFORMS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter('platform', value)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              filters.platform === value
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Date range */}
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilter('dateFrom', e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700
                     focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        <span className="text-xs text-slate-400">→</span>
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilter('dateTo', e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700
                     focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {hasFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-500
                     hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <X size={11} />
          Clear
        </button>
      )}
    </div>
  )
}
