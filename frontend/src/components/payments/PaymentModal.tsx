'use client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { Input, Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useCreatePayment } from '@/hooks/usePayments'
import { useOrders, useOrder } from '@/hooks/useOrders'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'

const schema = z.object({
  order_id: z.coerce.number().min(1, 'Select an order'),
  amount: z.coerce.number().min(1, 'Enter a valid amount'),
  payment_date: z.string().min(1, 'Select payment date'),
  payment_method: z.enum(['cash', 'bank_transfer', 'jazzcash', 'easypaisa']),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface PaymentModalProps {
  open: boolean
  onClose: () => void
  preselectedOrderId?: number
}

export function PaymentModal({ open, onClose, preselectedOrderId }: PaymentModalProps) {
  const createPayment = useCreatePayment()
  // Only fetch all orders when no order is preselected
  const { data: ordersData } = useOrders({ status: '' })
  // Fetch the specific order details when preselected (to show balance)
  const { data: preselectedOrder } = useOrder(preselectedOrderId ?? null)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      payment_method: 'cash',
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      order_id: preselectedOrderId ?? 0,
    },
  })

  // Keep order_id in sync if preselectedOrderId changes (e.g. modal reused)
  useEffect(() => {
    if (preselectedOrderId) {
      setValue('order_id', preselectedOrderId)
    }
  }, [preselectedOrderId, setValue])

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      reset({
        payment_method: 'cash',
        payment_date: format(new Date(), 'yyyy-MM-dd'),
        order_id: preselectedOrderId ?? 0,
        amount: undefined,
        notes: '',
      })
    }
  }, [open, preselectedOrderId, reset])

  const watchedOrderId = watch('order_id')

  // Figure out balance for the selected order
  const selectedOrderBalance = (() => {
    if (preselectedOrder && preselectedOrderId) {
      return parseFloat(String(preselectedOrder.balance_due))
    }
    const match = ordersData?.results.find((o) => o.id === Number(watchedOrderId))
    return match ? parseFloat(match.remaining_payment) : null
  })()

  const onSubmit = (data: FormValues) => {
    createPayment.mutate(
      { ...data, amount: String(data.amount), notes: data.notes ?? '' },
      {
        onSuccess: () => {
          onClose()
        },
      }
    )
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-border">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">Record Payment</h2>
            {preselectedOrder && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {preselectedOrder.order_number} — {preselectedOrder.customer.full_name}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Order selector — hidden when pre-selected */}
          {preselectedOrderId ? (
            <input type="hidden" {...register('order_id')} value={preselectedOrderId} />
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1.5">Order *</label>
              <select
                {...register('order_id')}
                className="w-full px-3 h-10 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">-- Select order --</option>
                {ordersData?.results
                  .filter((o) => !['cancelled'].includes(o.status))
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.order_number} — {o.customer.full_name}
                    </option>
                  ))}
              </select>
              {errors.order_id && <p className="mt-1 text-xs text-destructive">{errors.order_id.message}</p>}
            </div>
          )}

          {/* Balance Due info box */}
          {selectedOrderBalance !== null && (
            <div className={`flex items-center justify-between px-4 py-3 rounded-lg border text-sm ${
              selectedOrderBalance > 0
                ? 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800'
                : 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
            }`}>
              <span className="text-muted-foreground font-medium">Balance Due</span>
              <span className={`font-bold ${selectedOrderBalance > 0 ? 'text-orange-700 dark:text-orange-400' : 'text-green-600'}`}>
                {formatCurrency(selectedOrderBalance)}
              </span>
            </div>
          )}

          <Input
            label="Amount (PKR) *"
            type="number"
            min={1}
            max={selectedOrderBalance ?? undefined}
            step="1"
            placeholder={selectedOrderBalance ? `Max: ${selectedOrderBalance.toLocaleString()}` : ''}
            {...register('amount')}
            error={errors.amount?.message}
          />

          <Input
            label="Payment Date *"
            type="date"
            {...register('payment_date')}
            error={errors.payment_date?.message}
          />

          <div>
            <label className="block text-sm font-medium mb-1.5">Payment Method</label>
            <select
              {...register('payment_method')}
              className="w-full px-3 h-10 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="jazzcash">JazzCash</option>
              <option value="easypaisa">EasyPaisa</option>
            </select>
          </div>

          <Textarea label="Notes" {...register('notes')} placeholder="Optional notes..." rows={2} />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={createPayment.isPending}>Record Payment</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
