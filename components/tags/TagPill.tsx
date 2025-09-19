'use client'

import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TagPillProps {
  tag: string
  color?: string | null
  onRemove?: (tag: string) => void
  onClick?: (tag: string) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline'
  removable?: boolean
}

export function TagPill({
  tag,
  color,
  onRemove,
  onClick,
  className,
  size = 'md',
  variant = 'default',
  removable = true,
}: TagPillProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  const variantClasses = {
    default: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800',
  }

  const pillStyle = color
    ? {
        backgroundColor: `${color}20`,
        borderColor: color,
        color: color,
      }
    : {}

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium transition-colors',
        sizeClasses[size],
        !color && variantClasses[variant],
        onClick && 'cursor-pointer',
        className
      )}
      style={pillStyle}
      onClick={() => onClick?.(tag)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick(tag)
        }
      }}
    >
      <span className="truncate max-w-[150px]">{tag}</span>
      {removable && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove(tag)
          }}
          className={cn(
            'rounded-full p-0.5 hover:bg-gray-300/50 dark:hover:bg-gray-600/50',
            size === 'sm' && '-mr-1'
          )}
          aria-label={`Remove ${tag} tag`}
        >
          <X className={cn(
            'h-3 w-3',
            size === 'lg' && 'h-4 w-4'
          )} />
        </button>
      )}
    </div>
  )
}