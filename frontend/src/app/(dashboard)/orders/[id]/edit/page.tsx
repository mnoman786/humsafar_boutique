'use client'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useOrder, useUpdateOrder } from '@/hooks/useOrders'
import { OrderForm, type OrderFormValues } from '@/components/orders/OrderForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: order, isLoading } = useOrder(Number(id))
  const updateOrder = useUpdateOrder(Number(id))

  // OrderForm passes (data, images, advancePayments) — edit only uses data
  const handleSubmit = (data: OrderFormValues) => {
    updateOrder.mutate(
      {
        ...data,
        total_amount: String(data.total_amount),
        advance_payment: String(data.advance_payment),
        quantity: data.quantity,
      },
      { onSuccess: () => router.push(`/orders/${id}`) }
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!order) return <div className="text-center py-12 text-muted-foreground">Order not found.</div>

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Order</h1>
          <p className="text-muted-foreground text-sm font-mono">{order.order_number}</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <OrderForm
            defaultValues={{
              customer_id: order.customer.id,
              cloth_type: order.cloth_type,
              cloth_color: order.cloth_color,
              quantity: order.quantity,
              design_details: order.design_details,
              measurement_details: order.measurement_details,
              total_amount: parseFloat(order.total_amount),
              advance_payment: parseFloat(order.advance_payment),
              status: order.status,
              order_date: order.order_date ?? '',
              expected_delivery_date: order.expected_delivery_date ?? '',
              customer_notes: order.customer_notes,
              admin_notes: order.admin_notes,
              extra_notes: order.extra_notes,
            }}
            existingImages={order.images}
            existingMaterials={order.materials}
            onSubmit={handleSubmit}
            loading={updateOrder.isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
