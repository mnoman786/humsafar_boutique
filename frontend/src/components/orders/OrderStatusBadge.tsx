import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, type OrderStatus } from '@/types/order'
import { cn } from '@/lib/utils'

interface OrderStatusBadgeProps {
  status: OrderStatus
  className?: string
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
      ORDER_STATUS_COLORS[status],
      className
    )}>
      {ORDER_STATUS_LABELS[status]}
    </span>
  )
}
