'use client'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { OrderForm, type OrderFormValues } from '@/components/orders/OrderForm'
import { useCreateOrder } from '@/hooks/useOrders'

export default function AddOrderPage() {
  const router = useRouter()
  const createOrder = useCreateOrder()

  const handleSubmit = (data: OrderFormValues, images: File[]) => {
    const formData = new FormData()
    Object.entries(data).forEach(([key, val]) => {
      if (val !== undefined && val !== '') {
        formData.append(key, String(val))
      }
    })
    images.forEach((img) => formData.append('images', img))
    createOrder.mutate(formData, {
      onSuccess: (order) => router.push(`/orders/${order.id}`),
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
          <OrderForm onSubmit={handleSubmit} loading={createOrder.isPending} />
        </CardContent>
      </Card>
    </div>
  )
}
