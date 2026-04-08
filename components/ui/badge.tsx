import { type HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "secondary"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    // Digital Atelier Neutrals
    default: "bg-slate-100 text-slate-900 border-slate-200",
    secondary: "bg-slate-50 text-slate-400 border-slate-100",
    
    // Status Colors (Modified to match Lime/Slate aesthetic)
    success: "bg-[#a3e635]/10 text-[#4d7c0f] border-[#a3e635]/20",
    warning: "bg-amber-50 text-amber-900 border-amber-100",
    danger: "bg-red-50 text-red-900 border-red-100",
    info: "bg-slate-900 text-white border-slate-900", // No more blue, using black for info
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-none border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest leading-none",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
