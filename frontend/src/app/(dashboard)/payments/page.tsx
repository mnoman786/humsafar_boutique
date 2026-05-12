'use client'
import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { usePayments, useDeletePayment } from '@/hooks/usePayments'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PAYMENT_METHOD_LABELS } from '@/types/payment'
import { PaymentModal } from '@/components/payments/PaymentModal'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

export default function PaymentsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data, isLoading } = usePayments({ page, search: search || undefined })
  const deletePayment = useDeletePayment()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-muted-foreground text-sm mt-1">{data?.count ?? 0} total payments</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" /> Record Payment
        </Button>
      </div>

      <Card className="p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by order # or customer..."
            className="w-full pl-9 pr-3 h-9 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order #</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Method</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Recorded By</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : data?.results.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No payments recorded yet.
                  </td>
                </tr>
              ) : (
                data?.results.map((payment) => (
                  <tr key={payment.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-primary">{payment.order_number}</td>
                    <td className="px-4 py-3 font-medium">{payment.customer_name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-muted text-xs font-medium">
                        {PAYMENT_METHOD_LABELS[payment.payment_method]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600">{formatCurrency(payment.amount)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(payment.payment_date)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{payment.recorded_by_name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => setDeleteId(payment.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && data.count > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">Page {page} of {Math.ceil(data.count / 20)}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={!data.previous}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={!data.next}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      <PaymentModal open={modalOpen} onClose={() => setModalOpen(false)} />

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { deletePayment.mutate(deleteId!); setDeleteId(null) }}
        title="Delete Payment?"
        description="This payment will be permanently removed and the order balance due will increase."
        confirmLabel="Delete Payment"
        loading={deletePayment.isPending}
      />
    </div>
  )
}
