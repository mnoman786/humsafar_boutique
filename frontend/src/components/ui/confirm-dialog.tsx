'use client'
import { useEffect } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  description?: string
  confirmLabel?: string
  loading?: boolean
  variant?: 'danger' | 'warning'
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  loading = false,
  variant = 'danger',
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-border animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Icon */}
        <div className="flex flex-col items-center px-6 pt-7 pb-5 text-center">
          <div className={cn(
            'w-14 h-14 rounded-full flex items-center justify-center mb-4',
            variant === 'danger'
              ? 'bg-red-100 dark:bg-red-950/40'
              : 'bg-orange-100 dark:bg-orange-950/40'
          )}>
            {variant === 'danger'
              ? <Trash2 className="w-6 h-6 text-destructive" />
              : <AlertTriangle className="w-6 h-6 text-orange-500" />
            }
          </div>

          <h2 className="text-lg font-semibold mb-1.5">{title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={variant === 'danger' ? 'destructive' : 'default'}
            className={cn('flex-1', variant === 'warning' && 'bg-orange-500 hover:bg-orange-600 text-white')}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
