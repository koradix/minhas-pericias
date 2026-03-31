import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface KPICardProps {
  title: string
  value: string | number
  icon?: LucideIcon
  highlight?: boolean
  className?: string
  trendText?: string
  trendClass?: string
  subtitle?: string
  accent?: 'brand' | 'lime' | 'amber' | 'emerald' | 'slate'
}

export function KPICard({
  title,
  value,
  icon: Icon,
  highlight = false,
  trendText,
  trendClass = "text-[#416900]",
  className,
  subtitle,
  accent = 'slate',
}: KPICardProps) {
  const accentColor =
    accent === 'brand' || accent === 'lime' ? '#84cc16'
    : accent === 'amber' ? '#f59e0b'
    : accent === 'emerald' ? '#10b981'
    : '#6b7280'

  if (highlight) {
    return (
      <div className={cn("p-6 bg-[#416900] border border-[#416900]/20 rounded-xl shadow-lg shadow-[#416900]/10 transition-transform hover:-translate-y-1 h-full flex flex-col justify-between", className)}>
        <div className="flex items-center gap-3 mb-4">
          {Icon && <Icon className="text-white/80 h-5 w-5" strokeWidth={2} />}
          <span className="text-xs font-semibold uppercase tracking-wider text-white/80">{title}</span>
        </div>
        <div>
          <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
          {subtitle && <div className="mt-1 text-[11px] text-white/70">{subtitle}</div>}
          {trendText && <div className="mt-2 text-[10px] text-white/90 font-bold">{trendText}</div>}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("p-6 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col justify-between", className)}>
      <div className="flex items-center gap-3 mb-4">
        {Icon && <Icon className="h-5 w-5" style={{ color: accentColor }} strokeWidth={2} />}
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
      </div>
      <div>
        <div className="text-3xl font-bold text-slate-900 tracking-tight">{value}</div>
        {subtitle && <div className="mt-1 text-[11px] text-slate-400">{subtitle}</div>}
        {trendText && <div className={cn("mt-2 text-[10px] font-bold", trendClass)}>{trendText}</div>}
      </div>
    </div>
  )
}
