'use client'
import { use, useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, ChevronDown, PlusCircle, Trash2, Upload, ChevronLeft, ChevronRight, X as XIcon, ZoomIn } from 'lucide-react'
import { useOrder, useUpdateOrderStatus, useUploadOrderImages, useDeleteOrderImage } from '@/hooks/useOrders'
import { usePayments, useDeletePayment } from '@/hooks/usePayments'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { OrderTimeline } from '@/components/orders/OrderTimeline'
import { PaymentModal } from '@/components/payments/PaymentModal'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { PAYMENT_METHOD_LABELS } from '@/types/payment'
import type { OrderStatus } from '@/types/order'
import { ORDER_STATUS_LABELS } from '@/types/order'
import { useStoredUser } from '@/hooks/useAuth'

const STATUSES: OrderStatus[] = ['waiting', 'running', 'completed', 'delivered', 'cancelled']

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const user = useStoredUser()
  const isAdmin = user?.role === 'admin'

  const { data: order, isLoading } = useOrder(Number(id))
  const { data: paymentsData } = usePayments({ order: Number(id) })
  const updateStatus = useUpdateOrderStatus(Number(id))
  const deletePayment = useDeletePayment()
  const uploadImages = useUploadOrderImages(Number(id))
  const deleteImage = useDeleteOrderImage(Number(id))

  const [statusOpen, setStatusOpen] = useState(false)
  const [statusNotes, setStatusNotes] = useState('')
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [deletePaymentId, setDeletePaymentId] = useState<number | null>(null)
  const [deleteImageId, setDeleteImageId] = useState<number | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowRight' && order?.images && lightboxIndex < order.images.length - 1)
        setLightboxIndex(lightboxIndex + 1)
      if (e.key === 'ArrowLeft' && lightboxIndex > 0)
        setLightboxIndex(lightboxIndex - 1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightboxIndex, order?.images])

  const handleStatusChange = (newStatus: OrderStatus) => {
    const payload: Parameters<typeof updateStatus.mutate>[0] = { status: newStatus, notes: statusNotes }
    if (newStatus === 'delivered') {
      payload.delivered_date = new Date().toISOString().split('T')[0]
    }
    updateStatus.mutate(payload)
    setStatusOpen(false)
    setStatusNotes('')
  }

  const handleDeletePayment = (paymentId: number) => {
    setDeletePaymentId(paymentId)
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!order) return <div className="text-center py-12 text-muted-foreground">Order not found.</div>

  const balanceDue = parseFloat(String(order.balance_due))
  const hasPendingBalance = balanceDue > 0

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold font-mono">{order.order_number}</h1>
            <OrderStatusBadge status={order.status} />
            {hasPendingBalance && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                Balance: {formatCurrency(balanceDue)}
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm">{order.customer.full_name} — {order.customer.phone}</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Record Payment button — admin only, visible when balance remains */}
          {isAdmin && (
            <Button
              variant={hasPendingBalance ? 'default' : 'outline'}
              onClick={() => setPaymentModalOpen(true)}
            >
              <PlusCircle className="w-4 h-4" />
              {hasPendingBalance ? 'Record Payment' : 'Add Payment'}
            </Button>
          )}

          {/* Status Update */}
          <div className="relative">
            <Button variant="outline" onClick={() => setStatusOpen(!statusOpen)}>
              Update Status <ChevronDown className="w-4 h-4" />
            </Button>
            {statusOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setStatusOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-border z-20 p-3">
                  <textarea
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    placeholder="Add notes (optional)"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none mb-2"
                    rows={2}
                  />
                  <div className="space-y-1">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        disabled={s === order.status}
                        className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {ORDER_STATUS_LABELS[s]}
                        {s === order.status && ' (current)'}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <Button variant="outline" onClick={() => router.push(`/orders/${id}/edit`)}>
            <Pencil className="w-4 h-4" /> Edit
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">

          {/* Order Details */}
          <Card>
            <CardHeader><CardTitle>Order Details</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid sm:grid-cols-2 gap-4 text-sm">
                {[
                  ['Cloth Type', order.cloth_type],
                  ['Cloth Color', order.cloth_color],
                  ['Quantity', order.quantity],
                  ['Order Date', formatDate(order.order_date)],
                  ['Expected Delivery', formatDate(order.expected_delivery_date)],
                  ['Delivered Date', formatDate(order.delivered_date)],
                  ['Created By', order.created_by_name ?? '—'],
                  ['Created At', formatDateTime(order.created_at)],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <dt className="text-muted-foreground font-medium">{label}</dt>
                    <dd className="mt-0.5">{value || '—'}</dd>
                  </div>
                ))}
                {order.design_details && (
                  <div className="sm:col-span-2">
                    <dt className="text-muted-foreground font-medium">Design Details</dt>
                    <dd className="mt-0.5 whitespace-pre-line">{order.design_details}</dd>
                  </div>
                )}
                {order.measurement_details && (
                  <div className="sm:col-span-2">
                    <dt className="text-muted-foreground font-medium">Measurements</dt>
                    <dd className="mt-0.5 whitespace-pre-line">{order.measurement_details}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Payment Summary</CardTitle>
                {isAdmin && (
                  <Button size="sm" variant="outline" onClick={() => setPaymentModalOpen(true)}>
                    <PlusCircle className="w-3.5 h-3.5" /> Add Payment
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Summary grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-5">
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <p className="text-xs text-muted-foreground">Total Amount</p>
                  <p className="mt-1 font-bold">{formatCurrency(order.total_amount)}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-muted-foreground">Advance Paid</p>
                  <p className="mt-1 font-bold text-blue-600">{formatCurrency(order.advance_payment)}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                  <p className="text-xs text-muted-foreground">Additional Paid</p>
                  <p className="mt-1 font-bold text-green-600">{formatCurrency(order.total_paid)}</p>
                </div>
                <div className={`p-3 rounded-lg border ${
                  hasPendingBalance
                    ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                    : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                }`}>
                  <p className="text-xs text-muted-foreground">Balance Due</p>
                  <p className={`mt-1 font-bold ${hasPendingBalance ? 'text-destructive' : 'text-green-600'}`}>
                    {formatCurrency(order.balance_due)}
                  </p>
                </div>
              </div>

              {/* Payment history */}
              {paymentsData?.results && paymentsData.results.length > 0 ? (
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide" style={{ fontSize: '11px' }}>
                    Payment History
                  </h4>
                  <div className="space-y-1.5">
                    {paymentsData.results.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-border hover:bg-muted/20 transition-colors text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 rounded-full bg-muted text-xs font-medium">
                            {PAYMENT_METHOD_LABELS[p.payment_method]}
                          </span>
                          <span className="text-muted-foreground">{formatDate(p.payment_date)}</span>
                          {p.notes && <span className="text-muted-foreground text-xs hidden sm:block">— {p.notes}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-green-600">{formatCurrency(p.amount)}</span>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeletePayment(p.id)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              title="Delete payment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-sm text-muted-foreground border border-dashed border-border rounded-lg">
                  No additional payments recorded yet.
                  {isAdmin && (
                    <button
                      onClick={() => setPaymentModalOpen(true)}
                      className="block mx-auto mt-1 text-primary hover:underline text-sm"
                    >
                      Record first payment →
                    </button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Reference Images</CardTitle>
                {isAdmin && (
                  <Button size="sm" variant="outline" onClick={() => imageInputRef.current?.click()} loading={uploadImages.isPending}>
                    <Upload className="w-3.5 h-3.5" /> Add Images
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? [])
                  if (files.length) uploadImages.mutate(files)
                  e.target.value = ''
                }}
              />
              {order.images.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {order.images.map((img, idx) => (
                    <div key={img.id} className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <button
                        type="button"
                        onClick={() => setLightboxIndex(idx)}
                        className="block w-24 h-24 rounded-lg border border-border overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.image} alt="reference" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => setDeleteImageId(img.id)}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete image"
                        >
                          <XIcon className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground border border-dashed border-border rounded-lg">
                  No images uploaded yet.
                  {isAdmin && (
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="block mx-auto mt-1 text-primary hover:underline text-sm"
                    >
                      Upload first image →
                    </button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Materials Used */}
          {order.materials && order.materials.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Materials Used</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {order.materials.map((m) => (
                    <div key={m.id} className="flex items-center justify-between py-2 px-3 rounded-lg border border-border text-sm">
                      <span className="font-medium">{m.item_name}</span>
                      <span className="text-muted-foreground">{m.quantity} {m.unit}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {(order.customer_notes || order.admin_notes) && (
            <Card>
              <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {order.customer_notes && (
                  <div>
                    <p className="font-medium text-muted-foreground mb-1">Customer Notes</p>
                    <p className="whitespace-pre-line">{order.customer_notes}</p>
                  </div>
                )}
                {order.admin_notes && (
                  <div>
                    <p className="font-medium text-muted-foreground mb-1">Admin Notes</p>
                    <p className="whitespace-pre-line">{order.admin_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Timeline */}
        <div>
          <Card className="sticky top-20">
            <CardHeader><CardTitle>Status Timeline</CardTitle></CardHeader>
            <CardContent>
              <OrderTimeline history={order.status_history} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Payment Confirm */}
      <ConfirmDialog
        open={deletePaymentId !== null}
        onClose={() => setDeletePaymentId(null)}
        onConfirm={() => { deletePayment.mutate(deletePaymentId!); setDeletePaymentId(null) }}
        title="Delete Payment?"
        description="This payment will be permanently removed and the balance due will increase accordingly."
        confirmLabel="Delete Payment"
        loading={deletePayment.isPending}
      />

      {/* Delete Image Confirm */}
      <ConfirmDialog
        open={deleteImageId !== null}
        onClose={() => setDeleteImageId(null)}
        onConfirm={() => { deleteImage.mutate(deleteImageId!); setDeleteImageId(null) }}
        title="Delete Image?"
        description="This image will be permanently removed from the order."
        confirmLabel="Delete Image"
        loading={deleteImage.isPending}
      />

      {/* Payment Modal — pre-selects this order */}
      <PaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        preselectedOrderId={Number(id)}
      />

      {/* Image Lightbox */}
      {lightboxIndex !== null && order.images.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Prev */}
          {lightboxIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1) }}
              className="absolute left-4 p-2 text-white hover:text-gray-300 bg-black/40 rounded-full"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
          )}

          {/* Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={order.images[lightboxIndex].image}
            alt="Full view"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next */}
          {lightboxIndex < order.images.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1) }}
              className="absolute right-4 p-2 text-white hover:text-gray-300 bg-black/40 rounded-full"
            >
              <ChevronRight className="w-7 h-7" />
            </button>
          )}

          {/* Close */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 p-2 text-white bg-black/40 rounded-full hover:bg-black/60"
          >
            <XIcon className="w-5 h-5" />
          </button>

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/40 px-3 py-1 rounded-full">
            {lightboxIndex + 1} / {order.images.length}
          </div>
        </div>
      )}
    </div>
  )
}
