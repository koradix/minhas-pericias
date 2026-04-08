
import { type ButtonHTMLAttributes, forwardRef } from "react"
import { cn } from "@/lib/utils"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline" | "brand"
  size?: "sm" | "md" | "lg"
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    // ─── Digital Atelier Base ────────────────────────────────────────────────
    const base =
      "inline-flex items-center justify-center gap-0 rounded-none font-bold uppercase tracking-widest transition-all duration-200 focus-visible:outline-none disabled:opacity-30 disabled:pointer-events-none cursor-pointer"

    const variants = {
      // Midnight black
      primary: "bg-[#0f172a] text-white hover:bg-black active:scale-[0.98]",
      // Lime green brand
      brand: "bg-[#a3e635] text-slate-900 hover:bg-[#bef264] active:scale-[0.98]",
      // Light slate
      secondary: "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-900",
      // Text only
      ghost: "text-slate-400 hover:text-slate-900 bg-transparent",
      // Signal red
      danger: "bg-red-600 text-white hover:bg-red-700",
      // Precise outline
      outline: "border border-slate-200 text-slate-900 bg-white hover:border-slate-900 hover:bg-slate-50",
    }

    const sizes = {
      sm: "h-8 px-4 text-[10px]",
      md: "h-11 px-6 text-[11px]",
      lg: "h-14 px-8 text-[12px]",
    }

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = "Button"
export { Button }
