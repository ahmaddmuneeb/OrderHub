'use client'

import {
  PackageCheck, PackageMinus, PackageOpen,
  Ban, Clock, Zap, PauseCircle, CheckCircle2, RotateCcw,
  AlertCircle, CreditCard, Truck, type LucideIcon,
  Package,
} from 'lucide-react'
import { Order, Platform, PLATFORM_STATUSES, getStatusLabel } from '../../types'
import { StatSkeleton } from '../ui/Skeleton'

interface Props {
  orders: Order[]
  loading: boolean
  platform: Platform | null
}

// Icon + colour per status ------------------------------------------------
interface StatusStyle {
  Icon: LucideIcon
  iconColor: string
  iconBg: string
  sparkColor: string
}

const STATUS_STYLES: Record<string, StatusStyle> = {
  // Shopify
  unfulfilled:     { Icon: PackageMinus,      iconColor: 'text-blue-400',    iconBg: 'bg-blue-500/15',    sparkColor: 'rgba(96,165,250,0.7)'  },
  partial:         { Icon: PackageOpen,  iconColor: 'text-amber-400',   iconBg: 'bg-amber-500/15',   sparkColor: 'rgba(251,191,36,0.7)'  },
  fulfilled:       { Icon: PackageCheck, iconColor: 'text-emerald-400', iconBg: 'bg-emerald-500/15', sparkColor: 'rgba(52,211,153,0.7)'  },
  cancelled:       { Icon: Ban,          iconColor: 'text-rose-400',    iconBg: 'bg-rose-500/15',    sparkColor: 'rgba(251,113,133,0.7)' },
  // WooCommerce
  pending:         { Icon: Clock,        iconColor: 'text-amber-400',   iconBg: 'bg-amber-500/15',   sparkColor: 'rgba(251,191,36,0.7)'  },
  processing:      { Icon: Zap,          iconColor: 'text-violet-400',  iconBg: 'bg-violet-500/15',  sparkColor: 'rgba(167,139,250,0.7)' },
  'on-hold':       { Icon: PauseCircle,  iconColor: 'text-orange-400',  iconBg: 'bg-orange-500/15',  sparkColor: 'rgba(251,146,60,0.7)'  },
  completed:       { Icon: CheckCircle2, iconColor: 'text-emerald-400', iconBg: 'bg-emerald-500/15', sparkColor: 'rgba(52,211,153,0.7)'  },
  refunded:        { Icon: RotateCcw,    iconColor: 'text-slate-400',   iconBg: 'bg-slate-500/15',   sparkColor: 'rgba(148,163,184,0.7)' },
  failed:          { Icon: AlertCircle,  iconColor: 'text-rose-400',    iconBg: 'bg-rose-500/15',    sparkColor: 'rgba(251,113,133,0.7)' },
  // BigCommerce
  Pending:              { Icon: Clock,        iconColor: 'text-amber-400',  iconBg: 'bg-amber-500/15',  sparkColor: 'rgba(251,191,36,0.7)'  },
  'Awaiting Payment':   { Icon: CreditCard,   iconColor: 'text-orange-400', iconBg: 'bg-orange-500/15', sparkColor: 'rgba(251,146,60,0.7)'  },
  'Awaiting Fulfillment':{ Icon: PackageMinus,     iconColor: 'text-blue-400',   iconBg: 'bg-blue-500/15',   sparkColor: 'rgba(96,165,250,0.7)'  },
  'Awaiting Shipment':  { Icon: Truck,        iconColor: 'text-indigo-400', iconBg: 'bg-indigo-500/15', sparkColor: 'rgba(129,140,248,0.7)' },
  'Partially Shipped':  { Icon: PackageOpen,  iconColor: 'text-amber-400',  iconBg: 'bg-amber-500/15',  sparkColor: 'rgba(251,191,36,0.7)'  },
  Shipped:              { Icon: PackageCheck, iconColor: 'text-cyan-400',   iconBg: 'bg-cyan-500/15',   sparkColor: 'rgba(34,211,238,0.7)'  },
  Completed:            { Icon: CheckCircle2, iconColor: 'text-emerald-400',iconBg: 'bg-emerald-500/15',sparkColor: 'rgba(52,211,153,0.7)'  },
  Cancelled:            { Icon: Ban,          iconColor: 'text-rose-400',   iconBg: 'bg-rose-500/15',   sparkColor: 'rgba(251,113,133,0.7)' },
  Declined:             { Icon: AlertCircle,  iconColor: 'text-red-400',    iconBg: 'bg-red-500/15',    sparkColor: 'rgba(248,113,113,0.7)' },
  Refunded:             { Icon: RotateCcw,    iconColor: 'text-slate-400',  iconBg: 'bg-slate-500/15',  sparkColor: 'rgba(148,163,184,0.7)' },
}

const FALLBACK_STYLE: StatusStyle = {
  Icon: PackageMinus,
  iconColor: 'text-slate-400',
  iconBg: 'bg-white/[0.08]',
  sparkColor: 'rgba(148,163,184,0.6)',
}

// Sparkline ---------------------------------------------------------------
function getDailyData(orders: Order[], status?: string): number[] {
  const now = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (6 - i))
    const day = d.toISOString().slice(0, 10)
    return orders.filter((o) => {
      if (status && o.status !== status) return false
      return (o.createdAt ?? '').slice(0, 10) === day
    }).length
  })
}

function Sparkline({ data, color, uid }: { data: number[]; color: string; uid: string }) {
  const w = 72
  const h = 32
  const max = Math.max(...data, 1)
  const gradId = `sg-${uid}`

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - (v / max) * h * 0.88 - h * 0.06
    return [x, y] as [number, number]
  })

  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const fill = `${line} L ${w} ${h} L 0 ${h} Z`

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${gradId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Component ---------------------------------------------------------------
export function StatsBar({ orders, loading, platform }: Props) {
  const statuses = platform ? PLATFORM_STATUSES[platform] : []
  const activeStatuses = statuses.filter((s) => orders.some((o) => o.status === s))
  const showStatuses = activeStatuses.length > 0 ? activeStatuses : statuses.slice(0, 5)

  const totalCols = 1 + showStatuses.length
  const gridClass =
    totalCols <= 4 ? 'grid-cols-4' :
    totalCols <= 5 ? 'grid-cols-5' :
    totalCols <= 6 ? 'grid-cols-6' : 'grid-cols-4 sm:grid-cols-8'

  if (loading) {
    return (
      <div className={`grid gap-3 ${gridClass}`}>
        {Array.from({ length: Math.min(totalCols, 6) }).map((_, i) => <StatSkeleton key={i} />)}
      </div>
    )
  }

  return (
    <div className={`grid gap-3 ${gridClass}`}>
      {/* Total orders — accent card */}
      <div className="flex flex-col rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 px-4 py-3.5 shadow-lg shadow-indigo-500/20">
        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
          <Package size={20} className="text-white" />
        </div>
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-2xl font-bold tracking-tight text-white">{orders.length}</p>
            <p className="mt-0.5 text-xs font-medium text-indigo-200">Total Orders</p>
          </div>
          <Sparkline data={getDailyData(orders)} color="rgba(255,255,255,0.75)" uid="total" />
        </div>
      </div>

      {/* Per-status cards */}
      {showStatuses.map((status) => {
        const count = orders.filter((o) => o.status === status).length
        const { Icon, iconColor, iconBg, sparkColor } = STATUS_STYLES[status] ?? FALLBACK_STYLE
        return (
          <div key={status} className="flex flex-col rounded-2xl bg-white/[0.06] px-4 py-3.5 ring-1 ring-white/[0.08]">
            <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-xl ${iconBg}`}>
              <Icon size={20} className={iconColor} />
            </div>
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-2xl font-bold tracking-tight text-white">{count}</p>
                <p className="mt-0.5 truncate text-xs font-medium text-slate-500">{getStatusLabel(status)}</p>
              </div>
              <Sparkline data={getDailyData(orders, status)} color={sparkColor} uid={status} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
