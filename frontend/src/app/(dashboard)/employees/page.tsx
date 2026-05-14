'use client'
import { useState } from 'react'
import { Plus, Search, Pencil, Trash2, UserCheck, UserX } from 'lucide-react'
import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from '@/hooks/useEmployees'
import { useStoredUser } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Employee, EmployeeFormData } from '@/types/employee'
import { EmployeeModal } from '@/components/employees/EmployeeModal'

export default function EmployeesPage() {
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const currentUser = useStoredUser()
  const isUser = currentUser?.role === 'user'

  const { data, isLoading } = useEmployees({ search: search || undefined })
  const createEmployee = useCreateEmployee()
  const updateEmployee = useUpdateEmployee(editEmployee?.id ?? 0)
  const deleteEmployee = useDeleteEmployee()

  const openAdd = () => { setEditEmployee(null); setModalOpen(true) }
  const openEdit = (emp: Employee) => { setEditEmployee(emp); setModalOpen(true) }

  const handleSave = (formData: EmployeeFormData) => {
    if (editEmployee) {
      updateEmployee.mutate(formData, { onSuccess: () => { setModalOpen(false); setEditEmployee(null) } })
    } else {
      createEmployee.mutate(formData, { onSuccess: () => setModalOpen(false) })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-muted-foreground text-sm mt-1">{data?.count ?? 0} total employees</p>
        </div>
        {!isUser && (
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4" /> Add Employee
          </Button>
        )}
      </div>

      <Card className="p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full pl-9 pr-3 h-9 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Phone</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Per Day (PKR)</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : data?.results.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    No employees found. Add your first employee.
                  </td>
                </tr>
              ) : (
                data?.results.map((emp) => (
                  <tr key={emp.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{emp.full_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{emp.phone || '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(emp.per_day_income)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{emp.joined_date ? formatDate(emp.joined_date) : '—'}</td>
                    <td className="px-4 py-3">
                      {emp.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 text-xs font-medium">
                          <UserCheck className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                          <UserX className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(emp)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {!isUser && (
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(emp.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <EmployeeModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditEmployee(null) }}
        employee={editEmployee}
        onSave={handleSave}
        loading={createEmployee.isPending || updateEmployee.isPending}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { deleteEmployee.mutate(deleteId!); setDeleteId(null) }}
        title="Delete Employee?"
        description="This employee and all their attendance records will be permanently deleted."
        confirmLabel="Delete Employee"
        loading={deleteEmployee.isPending}
      />
    </div>
  )
}
