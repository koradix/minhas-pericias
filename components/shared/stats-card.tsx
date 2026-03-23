import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: {
    value: number
    label: string
    positive?: boolean
  }
  accent?: "blue" | "emerald" | "amber" | "violet" | "rose"
  className?: string
}

const accentStyles = {
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600",
  rose: "bg-rose-50 text-rose-600",
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  accent = "blue",
  className,
}: StatsCardProps) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white p-6 shadow-sm", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500 truncate">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
          {description && (
            <p className="mt-1 text-xs text-slate-400">{description}</p>
          )}
          {trend && (
            <p
              className={cn(
                "mt-2 text-xs font-medium",
                trend.positive !== false ? "text-emerald-600" : "text-red-500"
              )}
            >
              {trend.positive !== false ? "↑" : "↓"} {Math.abs(trend.value)}%{" "}
              {trend.label}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl",
              accentStyles[accent]
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  )
}
