import React from 'react'
import { cn } from '@/utils/cn'

type ButtonVariant = 'default' | 'ghost' | 'outline' | 'secondary' | 'destructive' | 'link'
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantClasses: Record<ButtonVariant, string> = {
  default:
    'bg-primary text-primary-foreground shadow hover:opacity-90',
  ghost:
    'bg-transparent text-foreground hover:bg-muted hover:text-foreground',
  outline:
    'border border-input bg-background text-foreground shadow-sm hover:bg-muted',
  secondary:
    'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
  destructive:
    'bg-destructive text-white shadow-sm hover:bg-destructive/90',
  link:
    'text-primary underline-offset-4 hover:underline',
}

const sizeClasses: Record<ButtonSize, string> = {
  default: 'h-9 px-4 py-2 text-sm rounded-lg',
  sm: 'h-8 px-3 text-xs rounded-md',
  lg: 'h-11 px-8 text-base rounded-xl',
  icon: 'h-9 w-9 rounded-lg',
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium',
          'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:pointer-events-none disabled:opacity-50',
          '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
