'use client'

import { Search, X } from 'lucide-react'
import { Platform } from '../../types'
import { useOrderStore } from '../../store/useOrderStore'

export function FilterBar() {
  const { filters, setFilter } = useOrderStore()

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          placeholder="Search order # or customer…"
          className="w-full rounded-lg border border-gray-300 py-2 pl-8 pr-8 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
        {filters.search && (
          <button
            onClick={() => setFilter('search', '')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <select
        value={filters.platform}
        onChange={(e) => setFilter('platform', e.target.value as Platform | 'all')}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      >
        <option value="all">All Platforms</option>
        <option value="shopify">Shopify</option>
        <option value="woocommerce">WooCommerce</option>
        <option value="bigcommerce">BigCommerce</option>
      </select>

      <input
        type="date"
        value={filters.dateFrom}
        onChange={(e) => setFilter('dateFrom', e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        title="From date"
      />
      <input
        type="date"
        value={filters.dateTo}
        onChange={(e) => setFilter('dateTo', e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        title="To date"
      />

      {(filters.search || filters.platform !== 'all' || filters.dateFrom || filters.dateTo) && (
        <button
          onClick={() => {
            setFilter('search', '')
            setFilter('platform', 'all')
            setFilter('dateFrom', '')
            setFilter('dateTo', '')
          }}
          className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-500 hover:bg-gray-50"
        >
          <X size={12} />
          Clear
        </button>
      )}
    </div>
  )
}
