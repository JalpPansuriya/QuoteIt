import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 focus:ring-blue-500": variant === 'primary',
            "bg-slate-100 text-slate-800 hover:bg-slate-200 focus:ring-slate-500": variant === 'secondary',
            "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-500": variant === 'outline',
            "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200 focus:ring-red-500": variant === 'danger',
            "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900": variant === 'ghost',
            "h-8 px-3 text-sm": size === 'sm',
            "h-10 px-4 py-2": size === 'md',
            "h-12 px-6 text-lg": size === 'lg',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
