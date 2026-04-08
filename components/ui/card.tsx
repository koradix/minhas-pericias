import { type HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-none border border-slate-100 bg-white shadow-sm", className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-2 p-8 pb-0", className)} {...props} />
}

function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-lg font-bold text-slate-900 uppercase tracking-tight", className)} {...props} />
  )
}

function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-[10px] font-bold text-slate-400 uppercase tracking-widest", className)} {...props} />
}

function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-8", className)} {...props} />
}

function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center p-8 pt-0", className)} {...props} />
  )
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
