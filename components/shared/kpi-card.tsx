import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type KPIAccent = 'lime' | 'emerald' | 'amber' | 'rose' | 'slate'

interface KPITrend {
  value: number
  label: string
  positive?: boolean
}

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  trend?: KPITrend
  accent?: KPIAccent
  highlight?: boolean
  className?: string
}

const accentIcon: Record<KPIAccent, string> = {
  lime:    'bg-lime-50    text-lime-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber:   'bg-amber-50   text-amber-600',
  rose:    'bg-rose-50    text-rose-600',
  slate:   'bg-slate-100  text-slate-500',
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accent = 'lime',
  highlight = false,
  className,
}: KPICardProps) {
  return (
    <div
      className={cn(
        'relative rounded-lg border bg-white p-5 shadow-sm transition-shadow hover:shadow-md overflow-hidden',
        highlight ? 'border-lime-200' : 'border-slate-200',
        className,
      )}
    >
      {/* Accent indicator top */}
      {highlight && (
        <div className="absolute inset-x-0 top-0 h-0.5 bg-lime-500 rounded-t-lg" />
      )}

      <div className="flex items-start justify-between gap-3">
        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 truncate">{title}</p>

          <p className="mt-2 text-2xl font-semibold text-slate-800 tracking-tight tabular-nums">
            {value}
          </p>

          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-400 truncate">{subtitle}</p>
          )}

          {trend && (
            <p
              className={cn(
                'mt-1.5 text-xs font-medium flex items-center gap-1',
                trend.positive !== false ? 'text-emerald-600' : 'text-rose-500',
              )}
            >
              <span>{trend.positive !== false ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="font-normal text-slate-400">{trend.label}</span>
            </p>
          )}
        </div>

        {/* Icon */}
        {Icon && (
          <div
            className={cn(
              'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
              accentIcon[accent],
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  )
}
