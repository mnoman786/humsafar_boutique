'use client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { Input, Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Customer, CustomerFormData } from '@/types/customer'

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  alternate_phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface CustomerModalProps {
  open: boolean
  onClose: () => void
  customer: Customer | null
  onSave: (data: CustomerFormData) => void
  loading?: boolean
}

export function CustomerModal({ open, onClose, customer, onSave, loading }: CustomerModalProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (customer) {
      reset({
        full_name: customer.full_name,
        phone: customer.phone,
        alternate_phone: customer.alternate_phone,
        address: customer.address,
        city: customer.city,
        notes: customer.notes,
      })
    } else {
      reset({ full_name: '', phone: '', alternate_phone: '', address: '', city: '', notes: '' })
    }
  }, [customer, reset])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-border">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold">{customer ? 'Edit Customer' : 'Add Customer'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSave as (d: FormValues) => void)} className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input label="Full Name *" {...register('full_name')} error={errors.full_name?.message} placeholder="Muhammad Ali" />
            </div>
            <Input label="Phone *" {...register('phone')} error={errors.phone?.message} placeholder="03001234567" />
            <Input label="Alternate Phone" {...register('alternate_phone')} placeholder="03001234567" />
            <Input label="City" {...register('city')} placeholder="Lahore" />
            <div className="sm:col-span-2">
              <Textarea label="Address" {...register('address')} placeholder="Street, Area, City" rows={2} />
            </div>
            <div className="sm:col-span-2">
              <Textarea label="Notes" {...register('notes')} placeholder="Any special notes..." rows={2} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>
              {customer ? 'Save Changes' : 'Add Customer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
