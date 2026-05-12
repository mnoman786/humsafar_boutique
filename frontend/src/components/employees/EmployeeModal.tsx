'use client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Employee, EmployeeFormData } from '@/types/employee'

const schema = z.object({
  full_name: z.string().min(2, 'Name is required'),
  phone: z.string().optional(),
  per_day_income: z.coerce.number().min(0, 'Enter a valid amount'),
  joined_date: z.string().optional(),
  is_active: z.boolean().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface EmployeeModalProps {
  open: boolean
  onClose: () => void
  employee: Employee | null
  onSave: (data: EmployeeFormData) => void
  loading?: boolean
}

export function EmployeeModal({ open, onClose, employee, onSave, loading }: EmployeeModalProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { is_active: true },
  })

  useEffect(() => {
    if (open) {
      reset(employee ? {
        full_name: employee.full_name,
        phone: employee.phone,
        per_day_income: parseFloat(employee.per_day_income),
        joined_date: employee.joined_date ?? '',
        is_active: employee.is_active,
        notes: employee.notes,
      } : { is_active: true, per_day_income: 0 })
    }
  }, [open, employee, reset])

  const onSubmit = (data: FormValues) => {
    onSave({ ...data, per_day_income: String(data.per_day_income) })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-border">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold">{employee ? 'Edit Employee' : 'Add Employee'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <Input label="Full Name *" {...register('full_name')} error={errors.full_name?.message} placeholder="e.g. Nasir Ali" />
          <Input label="Phone" {...register('phone')} placeholder="03001234567" />
          <Input label="Per Day Income (PKR) *" type="number" min={0} step="1" {...register('per_day_income')} error={errors.per_day_income?.message} />
          <Input label="Joined Date" type="date" {...register('joined_date')} />

          <div className="flex items-center gap-3">
            <input type="checkbox" id="is_active" {...register('is_active')} className="w-4 h-4 rounded" />
            <label htmlFor="is_active" className="text-sm font-medium">Active Employee</label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Notes</label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="Optional notes..."
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>{employee ? 'Save Changes' : 'Add Employee'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
