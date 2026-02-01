import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked, onCheckedChange, disabled, ...props }, ref) => {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onCheckedChange?.(!checked)}
        className={cn(
          "group relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
          checked 
            ? "bg-primary border-primary" 
            : "bg-surface-container-highest border-outline",
          className
        )}
        ref={ref}
        {...props}
      >
        <span
          className={cn(
            "pointer-events-none block h-6 w-6 rounded-full shadow-sm ring-0 transition-all duration-200 ease-in-out flex items-center justify-center",
            checked 
              ? "translate-x-6 bg-primary-foreground" 
              : "translate-x-0.5 bg-outline",
             // MD3 Style: thumb grows when checked
             checked ? "scale-100" : "scale-75 group-hover:scale-90"
          )}
        >
          {checked && (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-primary opacity-100 transition-opacity duration-200">
              <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
            </svg>
          )}
        </span>
      </button>
    )
  }
)
Switch.displayName = "Switch"
