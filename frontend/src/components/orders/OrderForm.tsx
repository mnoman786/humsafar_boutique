'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect, useRef, useState, useMemo } from 'react'
import { Upload, X, Search, ChevronDown, User } from 'lucide-react'
import { Input, Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAllCustomers } from '@/hooks/useCustomers'
import type { Order } from '@/types/order'
import type { Customer } from '@/types/customer'
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
  expected_delivery_date: z.string().optional(),
  customer_notes: z.string().optional(),
  admin_notes: z.string().optional(),
  extra_notes: z.string().optional(),
})

export type OrderFormValues = z.infer<typeof orderSchema>

interface OrderFormProps {
  defaultValues?: Partial<OrderFormValues>
  onSubmit: (data: OrderFormValues, images: File[]) => void
  loading?: boolean
  existingImages?: Order['images']
  onDeleteImage?: (imageId: number) => void
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

  // Close dropdown on outside click
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
      {/* Trigger */}
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

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-gray-900 border border-border rounded-lg shadow-lg overflow-hidden">
          {/* Search input */}
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

          {/* Options list */}
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

// ── Main Form ─────────────────────────────────────────────────────────────────
export function OrderForm({ defaultValues, onSubmit, loading, existingImages = [], onDeleteImage }: OrderFormProps) {
  const [images, setImages] = useState<File[]>([])
  const [remaining, setRemaining] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: allCustomers = [], isLoading: customersLoading } = useAllCustomers()

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      status: 'waiting',
      quantity: 1,
      ...defaultValues,
    },
  })

  const total = watch('total_amount')
  const advance = watch('advance_payment')
  const customerId = watch('customer_id')

  useEffect(() => {
    setRemaining((Number(total) || 0) - (Number(advance) || 0))
  }, [total, advance])

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    setImages((prev) => [...prev, ...files])
  }

  const removeFile = (idx: number) => setImages((prev) => prev.filter((_, i) => i !== idx))

  const submit = (data: OrderFormValues) => onSubmit(data, images)

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      {/* Basic Details */}
      <section>
        <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">Basic Details</h3>
        <div className="grid sm:grid-cols-2 gap-4">

          {/* Customer picker — full width */}
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
              <option value="running">Running</option>
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
          <Input
            label="Advance Payment (PKR)"
            type="number"
            min={0}
            step="1"
            {...register('advance_payment')}
          />
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

      {/* Dates */}
      <section>
        <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">Dates</h3>
        <div className="grid sm:grid-cols-2 gap-4">
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
