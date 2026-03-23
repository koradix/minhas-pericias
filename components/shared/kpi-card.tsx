import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type KPIAccent = 'brand' | 'lime' | 'emerald' | 'amber' | 'rose' | 'slate'

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
  brand:   'bg-brand-500/10 text-brand-500',
  lime:    'bg-brand-500/10  text-brand-500',
  emerald: 'bg-emerald-500/10 text-emerald-500',
  amber:   'bg-amber-500/10   text-amber-500',
  rose:    'bg-rose-500/10    text-rose-500',
  slate:   'bg-zinc-800/50  text-zinc-400',
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accent = 'brand',
  highlight = false,
  className,
}: KPICardProps) {
  return (
    <div
      className={cn(
        'relative rounded-xl border bg-card p-5 shadow-saas transition-all hover:shadow-saas-glow overflow-hidden group/kpi',
        highlight ? 'border-brand-500/30 bg-zinc-900/30' : 'border-border',
        className,
      )}
    >
      {/* Accent indicator top */}
      {highlight && (
        <div className="absolute inset-x-0 top-0 h-0.5 bg-brand-500 rounded-t-xl" />
      )}

      <div className="flex items-start justify-between gap-3">
        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-zinc-500 truncate">{title}</p>

          <p className="mt-2 text-2xl font-semibold text-foreground tracking-tight tabular-nums">
            {value}
          </p>

          {subtitle && (
            <p className="mt-0.5 text-xs text-zinc-400 truncate">{subtitle}</p>
          )}

          {trend && (
            <p
              className={cn(
                'mt-1.5 text-xs font-medium flex items-center gap-1',
                trend.positive !== false ? 'text-emerald-500' : 'text-rose-500',
              )}
            >
              <span>{trend.positive !== false ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="font-normal text-zinc-500">{trend.label}</span>
            </p>
          )}
        </div>

        {/* Icon */}
        {Icon && (
          <div
            className={cn(
              'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-transparent transition-colors',
              accent === 'brand' ? 'border-brand-500/20 group-hover/kpi:bg-brand-500/20' : 'border-zinc-700/50',
              accentIcon[accent],
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  )
}
