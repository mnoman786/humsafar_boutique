'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { OrderForm, type OrderFormValues, type AdvancePaymentEntry } from '@/components/orders/OrderForm'
import { useCreateOrder } from '@/hooks/useOrders'
import apiClient from '@/lib/axios'
import { toast } from 'sonner'

export default function AddOrderPage() {
  const router = useRouter()
  const createOrder = useCreateOrder()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (
    data: OrderFormValues,
    images: File[],
    advancePayments: AdvancePaymentEntry[]
  ) => {
    setSubmitting(true)

    const formData = new FormData()
    Object.entries(data).forEach(([key, val]) => {
      if (key === 'advance_payment') return // handled via Payment records
      if (val !== undefined && val !== '') {
        formData.append(key, String(val))
      }
    })
    formData.append('advance_payment', '0')
    images.forEach((img) => formData.append('images', img))

    createOrder.mutate(formData, {
      onSuccess: async (order) => {
        // Create each advance payment record sequentially so balance checks stay accurate
        if (advancePayments.length > 0) {
          const valid = advancePayments.filter((p) => p.amount > 0 && p.payment_date)
          try {
            for (const p of valid) {
              await apiClient.post('/payments/', {
                order_id: order.id,
                amount: String(p.amount),
                payment_date: p.payment_date,
                payment_method: p.payment_method,
                notes: p.notes || '',
              })
            }
          } catch {
            toast.error('Order created but one or more payments could not be saved.')
          }
        }
        setSubmitting(false)
        router.push(`/orders/${order.id}`)
      },
      onError: () => setSubmitting(false),
    })
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add New Order</h1>
          <p className="text-muted-foreground text-sm">Create a new boutique order</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <OrderForm
            onSubmit={handleSubmit}
            loading={submitting}
            showAdvancePayments
          />
        </CardContent>
      </Card>
    </div>
  )
}
