import { type StatusHistory, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, type OrderStatus } from '@/types/order'
import { formatDateTime } from '@/lib/utils'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OrderTimelineProps {
  history: StatusHistory[]
}

export function OrderTimeline({ history }: OrderTimelineProps) {
  if (!history.length) {
    return <p className="text-sm text-muted-foreground">No status history available.</p>
  }

  return (
    <div className="relative">
      <div className="absolute left-3.5 top-0 bottom-0 w-px bg-border" />
      <div className="space-y-4">
        {history.map((item, idx) => (
          <div key={item.id} className="flex gap-4 relative">
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-background',
              idx === history.length - 1 ? 'bg-primary' : 'bg-muted'
            )}>
              <CheckCircle2 className={cn(
                'w-3.5 h-3.5',
                idx === history.length - 1 ? 'text-primary-foreground' : 'text-muted-foreground'
              )} />
            </div>
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
                  ORDER_STATUS_COLORS[item.status as OrderStatus]
                )}>
                  {ORDER_STATUS_LABELS[item.status as OrderStatus] ?? item.status}
                </span>
                <span className="text-xs text-muted-foreground">by {item.changed_by_name}</span>
              </div>
              {item.notes && (
                <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(item.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
