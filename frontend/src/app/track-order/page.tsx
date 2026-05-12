'use client'
import { useState } from 'react'
import { Scissors, Search, Loader2, CheckCircle2 } from 'lucide-react'
import { useTrackOrder } from '@/hooks/useOrders'
import { OrderTimeline } from '@/components/orders/OrderTimeline'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { OrderStatus } from '@/types/order'
import { cn } from '@/lib/utils'

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('')
  const [phone, setPhone] = useState('')
  const trackOrder = useTrackOrder()

  const handleTrack = () => {
    if (!orderNumber.trim() || !phone.trim()) return
    trackOrder.mutate({ order_number: orderNumber.trim(), phone: phone.trim() })
  }

  const order = trackOrder.data

  return (
    <div className="min-h-screen bg-gradient-to-br from-boutique-50 via-white to-boutique-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary shadow-lg mb-4">
            <Scissors className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-boutique-700 to-boutique-400 bg-clip-text text-transparent">
            Track Your Order
          </h1>
          <p className="text-muted-foreground mt-2">Enter your order details to check the current status</p>
        </div>

        {/* Search Form */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-border p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Order Number</label>
              <input
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                placeholder="HB-20240101-0001"
                className="w-full px-3 h-10 rounded-lg border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Phone Number</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="03001234567"
                className="w-full px-3 h-10 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
              />
            </div>
          </div>

          <button
            onClick={handleTrack}
            disabled={trackOrder.isPending || !orderNumber || !phone}
            className={cn(
              'w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2',
              'hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {trackOrder.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Searching...</>
              : <><Search className="w-4 h-4" /> Track Order</>
            }
          </button>
        </div>

        {/* Results */}
        {trackOrder.isError && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-destructive/30 p-6 text-center">
            <p className="text-destructive font-medium">Order not found</p>
            <p className="text-muted-foreground text-sm mt-1">Please check your order number and phone number.</p>
          </div>
        )}

        {order && (
          <div className="space-y-4">
            {/* Order Summary */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-border p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="font-mono text-sm text-muted-foreground">{order.order_number}</p>
                  <h2 className="text-xl font-bold mt-0.5">{(order as { customer_name?: string }).customer_name}</h2>
                </div>
                <OrderStatusBadge status={order.status as OrderStatus} />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Cloth Type</p>
                  <p className="font-medium">{order.cloth_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cloth Color</p>
                  <p className="font-medium">{order.cloth_color}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Expected Delivery</p>
                  <p className="font-medium">{formatDate(order.expected_delivery_date)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Delivered Date</p>
                  <p className="font-medium">{formatDate(order.delivered_date)}</p>
                </div>
              </div>

              {/* Payment Info */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-bold mt-0.5">{formatCurrency(order.total_amount)}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                    <p className="text-xs text-muted-foreground">Paid</p>
                    <p className="font-bold text-green-600 mt-0.5">{formatCurrency(order.advance_payment)}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                    <p className="text-xs text-muted-foreground">Remaining</p>
                    <p className="font-bold text-orange-600 mt-0.5">{formatCurrency(order.remaining_payment)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-border p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Order Progress
              </h3>
              <OrderTimeline history={order.status_history ?? []} />
            </div>

            {/* Reference Images */}
            {order.images && order.images.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-border p-6">
                <h3 className="font-semibold mb-4">Reference Images</h3>
                <div className="flex flex-wrap gap-3">
                  {order.images.map((img) => (
                    <a key={img.id} href={img.image} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.image}
                        alt="reference"
                        className="w-20 h-20 object-cover rounded-lg border border-border"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          © 2025 Hamsafar Boutique. All rights reserved.
        </p>
      </div>
    </div>
  )
}
