'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect, useRef, useState, useMemo } from 'react'
import { Upload, X, Search, ChevronDown, User, Plus, Trash2 } from 'lucide-react'
import { Input, Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAllCustomers } from '@/hooks/useCustomers'
import { useAllInventory } from '@/hooks/useInventory'
import type { Order } from '@/types/order'
import type { Customer } from '@/types/customer'
import type { PaymentMethod } from '@/types/payment'
import type { MaterialEntry } from '@/types/inventory'
import { isWholeUnit } from '@/types/inventory'
import { PAYMENT_METHOD_LABELS } from '@/types/payment'
import { cn } from '@/lib/utils'

const orderSchema = z.object({
  customer_id: z.coerce.number().min(1, 'Select a customer'),
  cloth_type: z.string().min(1, 'Cloth type is required'),
  cloth_color: z.string().min(1, 'Cloth color is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  design_details: z.string().optional(),
  measurement_details: z.string().optional(),
  total_amount: z.coerce.number().min(0, 'Enter a valid amount'),
  advance_payment: z.coerce.number().min(0, 'Enter a valid amount'),
  status: z.enum(['waiting', 'running', 'completed', 'delivered', 'cancelled']),
  order_date: z.string().min(1, 'Order date is required'),
  expected_delivery_date: z.string().optional(),
  customer_notes: z.string().optional(),
  admin_notes: z.string().optional(),
  extra_notes: z.string().optional(),
})

export type OrderFormValues = z.infer<typeof orderSchema>

export interface AdvancePaymentEntry {
  amount: number
  payment_date: string
  payment_method: PaymentMethod
  notes: string
}

export type { MaterialEntry }

interface OrderFormProps {
  defaultValues?: Partial<OrderFormValues>
  onSubmit: (data: OrderFormValues, images: File[], advancePayments: AdvancePaymentEntry[], materials: MaterialEntry[]) => void
  loading?: boolean
  existingImages?: Order['images']
  existingMaterials?: Order['materials']
  onDeleteImage?: (imageId: number) => void
  /** When true, shows the multi-payment advance section instead of the single advance_payment field */
  showAdvancePayments?: boolean
}

// ── Searchable Customer Picker ────────────────────────────────────────────────
function CustomerPicker({
  value,
  onChange,
  error,
  customers,
  loading,
}: {
  value: number
  onChange: (id: number) => void
  error?: string
  customers: Customer[]
  loading: boolean
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = customers.find((c) => c.id === value)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return customers
    return customers.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.city ?? '').toLowerCase().includes(q)
    )
  }, [customers, search])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = () => {
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleSelect = (customer: Customer) => {
    onChange(customer.id)
    setSearch('')
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          'w-full flex items-center justify-between px-3 h-10 rounded-lg border bg-background text-sm transition-colors text-left',
          'focus:outline-none focus:ring-2 focus:ring-ring',
          error ? 'border-destructive' : 'border-input',
          !selected && 'text-muted-foreground'
        )}
      >
        {loading ? (
          <span className="text-muted-foreground">Loading customers…</span>
        ) : selected ? (
          <span className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="font-medium">{selected.full_name}</span>
            <span className="text-muted-foreground">— {selected.phone}</span>
          </span>
        ) : (
          <span>Select a customer…</span>
        )}
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-gray-900 border border-border rounded-lg shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone or city…"
              className="flex-1 text-sm bg-transparent outline-none"
            />
          </div>

          <div className="max-h-52 overflow-y-auto scrollbar-thin">
            {customers.length === 0 && !loading && (
              <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                No customers found. Add one first.
              </p>
            )}
            {filtered.length === 0 && customers.length > 0 && (
              <p className="px-3 py-3 text-sm text-muted-foreground text-center">
                No match for "{search}"
              </p>
            )}
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelect(c)}
                className={cn(
                  'w-full text-left px-3 py-2.5 text-sm hover:bg-accent transition-colors flex items-center justify-between',
                  c.id === value && 'bg-primary/10 text-primary font-medium'
                )}
              >
                <span>{c.full_name}</span>
                <span className="text-xs text-muted-foreground">{c.phone}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
}

const today = () => new Date().toISOString().split('T')[0]

// ── Main Form ─────────────────────────────────────────────────────────────────
export function OrderForm({
  defaultValues,
  onSubmit,
  loading,
  existingImages = [],
  existingMaterials = [],
  onDeleteImage,
  showAdvancePayments = false,
}: OrderFormProps) {
  const [images, setImages] = useState<File[]>([])
  const [remaining, setRemaining] = useState(0)
  const [advancePayments, setAdvancePayments] = useState<AdvancePaymentEntry[]>([])
  const [materials, setMaterials] = useState<MaterialEntry[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: allCustomers = [], isLoading: customersLoading } = useAllCustomers()
  const { data: allInventory = [] } = useAllInventory()

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      status: 'waiting',
      quantity: 1,
      advance_payment: 0,
      order_date: today(),
      ...defaultValues,
    },
  })

  const total = watch('total_amount')
  const advance = watch('advance_payment')
  const customerId = watch('customer_id')

  const advanceTotal = advancePayments.reduce((sum, p) => sum + (p.amount || 0), 0)

  useEffect(() => {
    const t = Number(total) || 0
    const a = showAdvancePayments ? advanceTotal : (Number(advance) || 0)
    setRemaining(t - a)
  }, [total, advance, showAdvancePayments, advanceTotal])

  const addPaymentRow = () => {
    setAdvancePayments((prev) => [
      ...prev,
      { amount: 0, payment_date: today(), payment_method: 'cash', notes: '' },
    ])
  }

  const removePaymentRow = (idx: number) => {
    setAdvancePayments((prev) => prev.filter((_, i) => i !== idx))
  }

  const updatePaymentRow = <K extends keyof AdvancePaymentEntry>(
    idx: number,
    field: K,
    value: AdvancePaymentEntry[K]
  ) => {
    setAdvancePayments((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
    )
  }

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    setImages((prev) => [...prev, ...files])
  }

  const removeFile = (idx: number) => setImages((prev) => prev.filter((_, i) => i !== idx))

  const addMaterialRow = (itemId: number) => {
    const item = allInventory.find((i) => i.id === itemId)
    if (!item || materials.some((m) => m.item_id === itemId)) return
    setMaterials((prev) => [...prev, {
      item_id: item.id,
      item_name: item.name,
      unit: item.unit,
      available: parseFloat(item.quantity),
      quantity: 1,
    }])
  }

  const removeMaterialRow = (itemId: number) =>
    setMaterials((prev) => prev.filter((m) => m.item_id !== itemId))

  const updateMaterialQty = (itemId: number, qty: number) =>
    setMaterials((prev) => prev.map((m) => m.item_id === itemId ? { ...m, quantity: qty } : m))

  const submit = (data: OrderFormValues) => onSubmit(data, images, advancePayments, materials)

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      {/* Basic Details */}
      <section>
        <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">Basic Details</h3>
        <div className="grid sm:grid-cols-2 gap-4">

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1.5">Customer *</label>
            <CustomerPicker
              value={Number(customerId) || 0}
              onChange={(id) => setValue('customer_id', id, { shouldValidate: true })}
              error={errors.customer_id?.message}
              customers={allCustomers}
              loading={customersLoading}
            />
          </div>

          <Input label="Cloth Type *" {...register('cloth_type')} error={errors.cloth_type?.message} placeholder="e.g. Silk, Cotton" />
          <Input label="Cloth Color *" {...register('cloth_color')} error={errors.cloth_color?.message} placeholder="e.g. Red, Navy Blue" />
          <Input label="Quantity *" type="number" min={1} {...register('quantity')} error={errors.quantity?.message} />

          <div>
            <label className="block text-sm font-medium mb-1.5">Status</label>
            <select
              {...register('status')}
              className="w-full px-3 h-10 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="waiting">Waiting</option>
              <option value="running">In Progress</option>
              <option value="completed">Completed</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <Textarea label="Design Details" {...register('design_details')} placeholder="Describe the design..." rows={3} />
          <Textarea label="Measurement Details" {...register('measurement_details')} placeholder="Neck, Chest, Waist..." rows={3} />
        </div>
      </section>

      {/* Pricing */}
      <section>
        <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">Pricing</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <Input
            label="Total Amount (PKR) *"
            type="number"
            min={0}
            step="1"
            {...register('total_amount')}
            error={errors.total_amount?.message}
          />

          {!showAdvancePayments && (
            <Input
              label="Advance Payment (PKR)"
              type="number"
              min={0}
              step="1"
              {...register('advance_payment')}
            />
          )}

          {showAdvancePayments && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Total Advance</label>
              <div className="flex h-10 items-center px-3 rounded-lg border border-input bg-muted/30 text-sm font-semibold">
                PKR {advanceTotal.toLocaleString()}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">Remaining Payment</label>
            <div className={cn(
              'flex h-10 items-center px-3 rounded-lg border text-sm font-semibold',
              remaining > 0
                ? 'border-orange-300 bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400'
                : 'border-green-300 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400'
            )}>
              PKR {remaining.toLocaleString()}
            </div>
          </div>
        </div>
      </section>

      {/* Advance Payments list — create mode only */}
      {showAdvancePayments && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Advance Payments
            </h3>
            <Button type="button" variant="outline" size="sm" onClick={addPaymentRow}>
              <Plus className="w-3.5 h-3.5" /> Add Payment
            </Button>
          </div>

          {advancePayments.length === 0 ? (
            <div className="text-center py-5 text-sm text-muted-foreground border border-dashed border-border rounded-lg">
              No advance payments yet.{' '}
              <button type="button" className="text-primary hover:underline" onClick={addPaymentRow}>
                Add one
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {advancePayments.map((p, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg border border-border bg-muted/20 space-y-3"
                >
                  <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
                    {/* Amount */}
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Amount (PKR) *</label>
                      <input
                        type="number"
                        min={1}
                        step="1"
                        value={p.amount || ''}
                        onChange={(e) => updatePaymentRow(idx, 'amount', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full px-3 h-10 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    {/* Date */}
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Date *</label>
                      <input
                        type="date"
                        value={p.payment_date}
                        onChange={(e) => updatePaymentRow(idx, 'payment_date', e.target.value)}
                        className="w-full px-3 h-10 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    {/* Method */}
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Method</label>
                      <select
                        value={p.payment_method}
                        onChange={(e) => updatePaymentRow(idx, 'payment_method', e.target.value as PaymentMethod)}
                        className="w-full px-3 h-10 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
                          <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>
                        ))}
                      </select>
                    </div>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => removePaymentRow(idx)}
                      className="h-10 w-10 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Notes</label>
                    <input
                      type="text"
                      value={p.notes}
                      onChange={(e) => updatePaymentRow(idx, 'notes', e.target.value)}
                      placeholder="Optional note (e.g. token, partial)"
                      className="w-full px-3 h-10 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {advancePayments.length > 1 && (
            <p className="mt-3 text-right text-sm text-muted-foreground">
              Total advance:{' '}
              <span className="font-semibold text-foreground">PKR {advanceTotal.toLocaleString()}</span>
            </p>
          )}
        </section>
      )}

      {/* Dates */}
      <section>
        <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">Dates</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="Order Date *"
            type="date"
            {...register('order_date')}
            error={errors.order_date?.message}
          />
          <Input label="Expected Delivery Date" type="date" {...register('expected_delivery_date')} />
        </div>
      </section>

      {/* Notes */}
      <section>
        <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">Notes</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Textarea label="Customer Notes" {...register('customer_notes')} placeholder="Notes visible to customer..." rows={3} />
          <Textarea label="Admin Notes" {...register('admin_notes')} placeholder="Internal admin notes..." rows={3} />
          <Textarea label="Extra Notes" className="sm:col-span-2" {...register('extra_notes')} rows={2} />
        </div>
      </section>

      {/* Materials */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Materials Used</h3>
        </div>

        {/* Existing materials (edit mode) */}
        {existingMaterials.length > 0 && materials.length === 0 && (
          <div className="mb-3 p-3 rounded-lg bg-muted/30 border border-border text-sm">
            <p className="text-xs text-muted-foreground font-medium mb-2">Previously recorded materials:</p>
            <div className="space-y-1">
              {existingMaterials.map((m) => (
                <span key={m.id} className="inline-flex items-center gap-1 mr-2 px-2 py-0.5 rounded-full bg-muted text-xs">
                  {m.item_name} — {m.quantity} {m.unit}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Item picker */}
        {allInventory.length > 0 && (
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1.5">Add material</label>
            <select
              onChange={(e) => { if (e.target.value) { addMaterialRow(Number(e.target.value)); e.target.value = '' } }}
              className="w-full px-3 h-10 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">— Select an inventory item —</option>
              {allInventory
                .filter((i) => !materials.some((m) => m.item_id === i.id))
                .map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.quantity} {i.unit} available)
                  </option>
                ))}
            </select>
          </div>
        )}

        {materials.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No materials added yet.</p>
        ) : (
          <div className="space-y-2">
            {materials.map((m) => (
              <div key={m.item_id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-muted/20">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{m.item_name}</p>
                  <p className="text-xs text-muted-foreground">Available: {m.available} {m.unit}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    min={isWholeUnit(m.unit) ? 1 : 0.01}
                    step={isWholeUnit(m.unit) ? '1' : '0.01'}
                    max={m.available}
                    value={m.quantity}
                    onChange={(e) => updateMaterialQty(m.item_id, isWholeUnit(m.unit) ? parseInt(e.target.value) || 0 : parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 h-8 rounded-lg border border-input bg-background text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-xs text-muted-foreground w-12">{m.unit}</span>
                  <button type="button" onClick={() => removeMaterialRow(m.item_id)}
                    className="text-muted-foreground hover:text-destructive transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Images */}
      <section>
        <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">Reference Images</h3>

        {existingImages.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-4">
            {existingImages.map((img) => (
              <div key={img.id} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.image} alt="Order" className="w-20 h-20 object-cover rounded-lg border border-border" />
                {onDeleteImage && (
                  <button
                    type="button"
                    onClick={() => onDeleteImage(img.id)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {images.map((file, idx) => (
            <div key={idx} className="relative group w-20 h-20 rounded-lg border border-border overflow-hidden bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <Upload className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Add</span>
          </button>
        </div>

        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFilePick} />
      </section>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
        <Button type="submit" loading={loading}>Save Order</Button>
      </div>
    </form>
  )
}
