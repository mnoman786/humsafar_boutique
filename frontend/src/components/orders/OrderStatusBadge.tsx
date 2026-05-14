import type { OrderStatus } from '@/types/order'
import { ORDER_STATUS_LABELS } from '@/types/order'
import { cn } from '@/lib/utils'

const STATUS_CLASSES: Record<OrderStatus, string> = {
  waiting:   'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  running:   'bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-400',
  completed: 'bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-400',
  delivered: 'bg-teal-100   text-teal-800   dark:bg-teal-900/30   dark:text-teal-400',
  cancelled: 'bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-400',
}

interface OrderStatusBadgeProps {
  status: OrderStatus
  className?: string
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
      STATUS_CLASSES[status],
      className
    )}>
      {ORDER_STATUS_LABELS[status]}
    </span>
  )
}
