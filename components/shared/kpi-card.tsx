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
      <div className={cn("p-6 bg-[#a3e635] rounded-none border border-[#1f2937]/10 border-t-4 border-t-[#1f2937] h-full flex flex-col justify-between transition-transform hover:-translate-y-1", className)}>
        <div className="flex items-center gap-3 mb-4">
          {Icon && <Icon className="text-[#1f2937] h-5 w-5" strokeWidth={2} />}
          <span className="text-[10px] font-black uppercase tracking-widest text-[#1f2937]">{title}</span>
        </div>
        <div>
          <div className="font-manrope text-3xl xl:text-4xl font-black text-[#1f2937] tracking-tighter">{value}</div>
          {subtitle && <div className="mt-1 text-[11px] font-bold text-[#1f2937]/70">{subtitle}</div>}
          {trendText && <div className="mt-3 text-[10px] uppercase tracking-wider text-[#1f2937]/90 font-black">{trendText}</div>}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("p-6 bg-white rounded-none border border-slate-200 border-t-4 border-t-slate-200 hover:border-t-[#1f2937] transition-all h-full flex flex-col justify-between", className)}>
      <div className="flex items-center gap-3 mb-4">
        {Icon && <Icon className="h-5 w-5 text-slate-400" strokeWidth={2} />}
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{title}</span>
      </div>
      <div>
        <div className="font-manrope text-3xl xl:text-4xl font-black text-[#1f2937] tracking-tighter">{value}</div>
        {subtitle && <div className="mt-1 text-[11px] font-bold text-slate-400">{subtitle}</div>}
        {trendText && <div className={cn("mt-3 text-[10px] uppercase tracking-wider font-black", trendClass)}>{trendText}</div>}
      </div>
    </div>
  )
}
