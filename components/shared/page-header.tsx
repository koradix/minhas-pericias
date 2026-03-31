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
        "flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between mb-10",
        className
      )}
    >
      <div>
        <h1 className="text-[24px] font-bold text-[#1f2937] tracking-tight font-manrope leading-tight">{title}</h1>
        {description && <p className="mt-1.5 text-[14px] font-medium text-[#9ca3af]">{description}</p>}
      </div>
      {actions && (
        <div className="flex items-center gap-3 mt-4 sm:mt-0 flex-wrap">{actions}</div>
      )}
    </div>
  )
}
