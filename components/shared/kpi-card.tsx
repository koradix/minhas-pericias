
import { cn } from '@/lib/utils'

export interface KPICardProps {
  title: string
  value: string | number
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
  highlight = false,
  trendText,
  trendClass = "text-[#4d7c0f]",
  className,
  subtitle,
}: KPICardProps) {

  // ─── Digital Atelier Card — High Contrast ──────────────────────────────────
  
  if (highlight) {
    return (
      <div className={cn("p-8 bg-[#a3e635] rounded-none border border-slate-900/10 h-full flex flex-col justify-between transition-all hover:bg-[#bef264]", className)}>
        <div className="mb-6">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-900 opacity-60">{title}</span>
        </div>
        <div>
          <div className="text-3xl xl:text-4xl font-bold text-slate-900 tracking-tighter leading-none mb-2">{value}</div>
          {subtitle && <div className="text-[11px] font-bold text-slate-900/70 uppercase tracking-widest">{subtitle}</div>}
          {trendText && <div className="mt-4 pt-4 border-t border-slate-900/10 text-[10px] uppercase tracking-widest text-slate-900/90 font-bold">{trendText}</div>}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("p-8 bg-white rounded-none border border-slate-100 hover:border-slate-900 transition-all h-full flex flex-col justify-between shadow-sm", className)}>
      <div className="mb-6">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{title}</span>
      </div>
      <div>
        <div className="text-3xl xl:text-4xl font-bold text-slate-900 tracking-tighter leading-none mb-2">{value}</div>
        {subtitle && <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{subtitle}</div>}
        {trendText && <div className={cn("mt-4 pt-4 border-t border-slate-50 text-[10px] uppercase tracking-widest font-bold", trendClass)}>{trendText}</div>}
      </div>
    </div>
  )
}
