'use client'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Phone, MapPin, FileText } from 'lucide-react'
import { useCustomer } from '@/hooks/useCustomers'
import { useOrders } from '@/hooks/useOrders'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { OrderStatus } from '@/types/order'

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: customer, isLoading } = useCustomer(Number(id))
  const { data: ordersData } = useOrders({ search: '' })

  const customerOrders = ordersData?.results.filter(o => o.customer.id === Number(id)) ?? []

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <div className="lg:col-span-2"><Skeleton className="h-64 w-full" /></div>
        </div>
      </div>
    )
  }

  if (!customer) return <div className="text-center py-12 text-muted-foreground">Customer not found.</div>

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold">{customer.full_name}</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Customer Info */}
        <Card>
          <CardHeader><CardTitle>Customer Profile</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-bold">
                {customer.full_name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">{customer.full_name}</p>
                <p className="text-muted-foreground capitalize">{customer.city}</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4 shrink-0" />
                <span>{customer.phone}</span>
              </div>
              {customer.alternate_phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4 shrink-0" />
                  <span>{customer.alternate_phone}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{customer.address}</span>
                </div>
              )}
              {customer.notes && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <FileText className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{customer.notes}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-border">
              <div className="flex justify-between text-muted-foreground">
                <span>Total Orders</span>
                <span className="font-semibold text-foreground">{customer.total_orders}</span>
              </div>
              <div className="flex justify-between text-muted-foreground mt-1">
                <span>Member Since</span>
                <span>{formatDate(customer.created_at)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order History */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Order History</CardTitle>
                <Button size="sm" onClick={() => router.push(`/orders/add`)}>New Order</Button>
              </div>
            </CardHeader>
            <CardContent>
              {customerOrders.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm">No orders for this customer yet.</p>
              ) : (
                <div className="space-y-3">
                  {customerOrders.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => router.push(`/orders/${order.id}`)}
                      className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors text-left"
                    >
                      <div>
                        <p className="font-mono text-xs font-semibold">{order.order_number}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <OrderStatusBadge status={order.status as OrderStatus} />
                        <span className="text-sm font-medium">{formatCurrency(order.total_amount)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
