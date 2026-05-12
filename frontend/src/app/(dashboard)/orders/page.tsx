'use client'
import { Suspense, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, Search, Eye, Pencil, Trash2, RefreshCw } from 'lucide-react'
import { useOrders, useDeleteOrder } from '@/hooks/useOrders'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { OrderStatus } from '@/types/order'
import { ORDER_STATUS_LABELS } from '@/types/order'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

const STATUSES: Array<OrderStatus | ''> = ['', 'waiting', 'running', 'completed', 'delivered', 'cancelled']

function OrdersContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<OrderStatus | ''>(
    (searchParams.get('status') as OrderStatus) || ''
  )
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data, isLoading, refetch } = useOrders({ status, search, page })
  const deleteOrder = useDeleteOrder()

  const handleDelete = useCallback((id: number) => {
    setDeleteId(id)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {data?.count ?? 0} total orders
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={() => router.push('/orders/add')}>
            <Plus className="w-4 h-4" />
            Add Order
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by order #, customer name or phone..."
              className="w-full pl-9 pr-3 h-9 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUSES.map((s) => (
              <button
                key={s || 'all'}
                onClick={() => { setStatus(s); setPage(1) }}
                className={`px-3 h-9 rounded-lg text-xs font-medium transition-colors ${
                  status === s
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-input hover:bg-accent'
                }`}
              >
                {s === '' ? 'All' : ORDER_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order #</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Remaining</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Expected</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data?.results.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    No orders found. {search || status ? 'Try adjusting your filters.' : ''}
                  </td>
                </tr>
              ) : (
                data?.results.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => router.push(`/orders/${order.id}`)}
                        className="font-mono text-xs font-medium text-primary hover:underline"
                      >
                        {order.order_number}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{order.customer.full_name}</p>
                        <p className="text-xs text-muted-foreground">{order.customer.phone}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status as OrderStatus} />
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(order.total_amount)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={parseFloat(order.remaining_payment) > 0 ? 'text-destructive' : 'text-green-600'}>
                        {formatCurrency(order.remaining_payment)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(order.expected_delivery_date)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => router.push(`/orders/${order.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => router.push(`/orders/${order.id}/edit`)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => handleDelete(order.id)}
                          loading={deleteOrder.isPending && deleteId === order.id}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.count > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Page {page} of {Math.ceil(data.count / 20)}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={!data.previous}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={!data.next}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { deleteOrder.mutate(deleteId!); setDeleteId(null) }}
        title="Delete Order?"
        description="This order and all its payment history will be permanently deleted. This cannot be undone."
        confirmLabel="Delete Order"
        loading={deleteOrder.isPending}
      />
    </div>
  )
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-96 w-full" /></div>}>
      <OrdersContent />
    </Suspense>
  )
}
