'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { cn } from '../../lib/utils'

/* ─── Public types ─── */

export interface DropdownOption {
  value: string
  label: string
  description?: string
  icon?: React.ReactNode
  disabled?: boolean
  group?: string
}

interface BaseProps {
  options: DropdownOption[]
  placeholder?: string
  label?: string
  hint?: string
  searchable?: boolean
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  maxListHeight?: number
  className?: string
  /** Align panel to right edge of trigger */
  align?: 'left' | 'right'
}

interface SingleProps extends BaseProps {
  multiple?: false
  value: string
  onChange: (value: string) => void
}

interface MultiProps extends BaseProps {
  multiple: true
  value: string[]
  onChange: (value: string[]) => void
}

export type DropdownProps = SingleProps | MultiProps

/* ─── Size tokens ─── */

const TRIGGER_SIZE = {
  sm: 'py-1.5 px-2.5 text-xs min-h-[32px]',
  md: 'py-2.5 px-3  text-sm min-h-[40px]',
  lg: 'py-3   px-4  text-sm min-h-[46px]',
}

/* ─── Sub-components ─── */

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        'flex h-4 w-4 shrink-0 items-center justify-center rounded-md border transition-all duration-150',
        checked
          ? 'border-indigo-500 bg-indigo-600 shadow-sm shadow-indigo-500/30'
          : 'border-white/[0.2] bg-white/[0.05]',
      )}
    >
      {checked && (
        <Check size={9} className="text-white" strokeWidth={3.5} />
      )}
    </span>
  )
}

/* ─── Main component ─── */

export function Dropdown(props: DropdownProps) {
  const {
    options,
    placeholder = 'Select…',
    label,
    hint,
    searchable = false,
    disabled = false,
    size = 'md',
    maxListHeight = 280,
    className,
    align = 'left',
  } = props

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [focusIdx, setFocusIdx] = useState(-1)

  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef   = useRef<HTMLButtonElement>(null)
  const searchRef    = useRef<HTMLInputElement>(null)

  const isMulti = props.multiple === true
  const rawValue = props.value
  const selectedSet = new Set(isMulti ? (rawValue as string[]) : rawValue ? [rawValue as string] : [])
  const hasValue = selectedSet.size > 0

  /* Close on outside click */
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) close()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  /* Focus search on open */
  useEffect(() => {
    if (open && searchable) {
      const t = setTimeout(() => searchRef.current?.focus(), 60)
      return () => clearTimeout(t)
    }
    if (!open) { setSearch(''); setFocusIdx(-1) }
  }, [open, searchable])

  function close() { setOpen(false) }
  function toggle() { if (!disabled) setOpen((o) => !o) }

  /* Filtered + grouped */
  const filtered = options.filter(
    (o) => !search || o.label.toLowerCase().includes(search.toLowerCase())
              || o.description?.toLowerCase().includes(search.toLowerCase()),
  )

  const navigable = filtered.filter((o) => !o.disabled)

  const groups = filtered.reduce<{ key: string; items: DropdownOption[] }[]>((acc, opt) => {
    const key = opt.group ?? ''
    const existing = acc.find((g) => g.key === key)
    if (existing) existing.items.push(opt)
    else acc.push({ key, items: [opt] })
    return acc
  }, [])

  /* Selection helpers */
  function select(opt: DropdownOption) {
    if (opt.disabled) return
    if (isMulti) {
      const arr = rawValue as string[]
      const next = selectedSet.has(opt.value)
        ? arr.filter((v) => v !== opt.value)
        : [...arr, opt.value]
      ;(props as MultiProps).onChange(next)
    } else {
      ;(props as SingleProps).onChange(opt.value)
      close()
    }
  }

  function clearAll(e: React.MouseEvent) {
    e.stopPropagation()
    if (isMulti) (props as MultiProps).onChange([])
    else         (props as SingleProps).onChange('')
  }

  /* Keyboard navigation */
  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault(); setOpen(true)
      }
      return
    }
    switch (e.key) {
      case 'Escape':
        e.preventDefault(); close(); triggerRef.current?.focus(); break
      case 'ArrowDown':
        e.preventDefault(); setFocusIdx((i) => Math.min(i + 1, navigable.length - 1)); break
      case 'ArrowUp':
        e.preventDefault(); setFocusIdx((i) => Math.max(i - 1, 0)); break
      case 'Enter':
        if (focusIdx >= 0) { e.preventDefault(); select(navigable[focusIdx]) }
        break
      case 'Tab':
        close(); break
    }
  }

  /* Trigger label */
  function renderLabel() {
    if (!hasValue) return <span className="text-slate-600 select-none">{placeholder}</span>

    if (!isMulti) {
      const opt = options.find((o) => o.value === (rawValue as string))
      return (
        <span className="flex min-w-0 items-center gap-2">
          {opt?.icon && <span className="shrink-0 text-slate-400">{opt.icon}</span>}
          <span className="truncate font-medium text-slate-200">{opt?.label ?? rawValue as string}</span>
        </span>
      )
    }

    const arr = rawValue as string[]
    if (arr.length === 1) {
      const opt = options.find((o) => o.value === arr[0])
      return (
        <span className="flex min-w-0 items-center gap-2">
          {opt?.icon && <span className="shrink-0 text-slate-400">{opt.icon}</span>}
          <span className="truncate font-medium text-slate-200">{opt?.label ?? arr[0]}</span>
        </span>
      )
    }

    return (
      <span className="flex min-w-0 flex-wrap items-center gap-1">
        {arr.slice(0, 2).map((v) => {
          const opt = options.find((o) => o.value === v)
          return (
            <span
              key={v}
              className="inline-flex items-center rounded-lg bg-indigo-500/15 px-2 py-px text-xs font-semibold text-indigo-300 ring-1 ring-indigo-500/20"
            >
              {opt?.label ?? v}
            </span>
          )
        })}
        {arr.length > 2 && (
          <span className="inline-flex items-center rounded-lg bg-white/[0.08] px-2 py-px text-xs font-semibold text-slate-400 ring-1 ring-white/[0.1]">
            +{arr.length - 2} more
          </span>
        )}
      </span>
    )
  }

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Label row */}
      {label && (
        <label className="mb-1.5 block text-sm font-semibold text-slate-400">{label}</label>
      )}

      {/* ── Trigger ── */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'flex w-full items-center gap-2 rounded-xl border bg-white/[0.07] text-left transition-all duration-150',
          'focus-visible:outline-none',
          TRIGGER_SIZE[size],
          open
            ? 'border-indigo-500/60 ring-2 ring-indigo-500/20 bg-white/[0.09]'
            : 'border-white/[0.1] hover:border-white/[0.18] hover:bg-white/[0.09]',
          disabled && 'cursor-not-allowed opacity-40 pointer-events-none',
        )}
      >
        {/* Value area */}
        <span className="flex min-w-0 flex-1">{renderLabel()}</span>

        {/* Right actions */}
        <span className="flex shrink-0 items-center gap-0.5 pl-1">
          {hasValue && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              onClick={clearAll}
              onPointerDown={(e) => e.stopPropagation()}
              className="rounded-md p-0.5 text-slate-600 transition-colors hover:bg-white/[0.1] hover:text-slate-300"
              aria-label="Clear selection"
            >
              <X size={12} />
            </span>
          )}
          <ChevronDown
            size={14}
            className={cn(
              'text-slate-500 transition-transform duration-200',
              open && 'rotate-180 text-indigo-400',
            )}
          />
        </span>
      </button>

      {/* Hint */}
      {hint && !open && (
        <p className="mt-1 text-xs text-slate-600">{hint}</p>
      )}

      {/* ── Panel ── */}
      {open && (
        <div
          role="listbox"
          aria-multiselectable={isMulti}
          className={cn(
            'absolute z-50 mt-1.5 overflow-hidden rounded-2xl',
            'border border-white/[0.08] bg-slate-900',
            'shadow-2xl shadow-black/70 ring-1 ring-white/[0.04]',
            'animate-dropdown-in',
            align === 'right' ? 'right-0' : 'left-0',
            'min-w-full',
          )}
        >
          {/* Search */}
          {searchable && (
            <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-3 py-2.5">
              <Search size={13} className="shrink-0 text-slate-500" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setFocusIdx(-1) }}
                onKeyDown={handleKeyDown}
                placeholder="Search…"
                className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="rounded text-slate-600 hover:text-slate-300 transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}

          {/* Options */}
          <div
            className="scrollbar-thin overflow-y-auto p-1.5"
            style={{ maxHeight: maxListHeight }}
          >
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 py-8 text-center">
                <Search size={15} className="text-slate-700" />
                <p className="text-xs text-slate-600">No results for "{search}"</p>
              </div>
            ) : (
              groups.map(({ key, items }) => (
                <div key={key}>
                  {key && (
                    <p className="mb-0.5 mt-2 px-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-600 first:mt-0.5">
                      {key}
                    </p>
                  )}
                  {items.map((opt) => {
                    const selected  = selectedSet.has(opt.value)
                    const navIdx    = navigable.indexOf(opt)
                    const focused   = navIdx !== -1 && navIdx === focusIdx

                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        disabled={opt.disabled}
                        onClick={() => select(opt)}
                        onMouseEnter={() => !opt.disabled && setFocusIdx(navIdx)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left',
                          'transition-all duration-100',
                          opt.disabled
                            ? 'cursor-not-allowed opacity-30'
                            : selected
                              ? 'bg-indigo-600/15 text-indigo-300'
                              : focused
                                ? 'bg-white/[0.07] text-slate-200'
                                : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200',
                        )}
                      >
                        {/* Left: checkbox (multi) or icon (single) */}
                        {isMulti ? (
                          <Checkbox checked={selected} />
                        ) : opt.icon ? (
                          <span className={cn('shrink-0', selected ? 'text-indigo-400' : 'text-slate-500')}>
                            {opt.icon}
                          </span>
                        ) : (
                          /* empty space to align labels when no icon */
                          <span className="h-4 w-4 shrink-0" />
                        )}

                        {/* Icon alongside checkbox in multi */}
                        {isMulti && opt.icon && (
                          <span className={cn('shrink-0', selected ? 'text-indigo-400' : 'text-slate-500')}>
                            {opt.icon}
                          </span>
                        )}

                        {/* Label + description */}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium leading-snug">
                            {opt.label}
                          </span>
                          {opt.description && (
                            <span className="mt-0.5 block truncate text-xs leading-snug text-slate-600">
                              {opt.description}
                            </span>
                          )}
                        </span>

                        {/* Right: checkmark for single */}
                        {!isMulti && (
                          <span className="ml-auto flex h-4 w-4 shrink-0 items-center justify-center">
                            {selected && (
                              <Check
                                size={13}
                                className="text-indigo-400"
                                strokeWidth={2.5}
                              />
                            )}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>

          {/* Multi-select footer */}
          {isMulti && (rawValue as string[]).length > 0 && (
            <div className="flex items-center justify-between border-t border-white/[0.06] px-3.5 py-2">
              <span className="text-xs text-slate-500">
                {(rawValue as string[]).length} selected
              </span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); (props as MultiProps).onChange([]) }}
                className="text-xs font-semibold text-indigo-400 transition-colors hover:text-indigo-300"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
