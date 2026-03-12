import { type HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "secondary"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
    warning: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
    danger: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
    info: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20",
    secondary: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
