import { type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-16",
        className
      )}
    >
      <div className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight uppercase leading-none">{title}</h1>
        <div className="h-1 w-12 bg-[#a3e635]" />
        {description && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{description}</p>}
      </div>
      {actions && (
        <div className="flex items-center gap-0 mt-4 sm:mt-0 flex-wrap border border-slate-200 shadow-sm bg-white overflow-hidden">
          {actions}
        </div>
      )}
    </div>
  )
}
