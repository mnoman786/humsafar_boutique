'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Eye, Pencil, Trash2 } from 'lucide-react'
import { useCustomers, useDeleteCustomer, useCreateCustomer, useUpdateCustomer } from '@/hooks/useCustomers'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import type { Customer, CustomerFormData } from '@/types/customer'
import { CustomerModal } from '@/components/customers/CustomerModal'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

export default function CustomersPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data, isLoading } = useCustomers({ search, page })
  const deleteCustomer = useDeleteCustomer()
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer(editCustomer?.id ?? 0)

  const handleSave = (formData: CustomerFormData) => {
    if (editCustomer) {
      updateCustomer.mutate(formData, { onSuccess: () => { setModalOpen(false); setEditCustomer(null) } })
    } else {
      createCustomer.mutate(formData, { onSuccess: () => setModalOpen(false) })
    }
  }

  const openEdit = (customer: Customer) => {
    setEditCustomer(customer)
    setModalOpen(true)
  }

  const openAdd = () => {
    setEditCustomer(null)
    setModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground text-sm mt-1">{data?.count ?? 0} total customers</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4" /> Add Customer
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by name, phone or city..."
            className="w-full pl-9 pr-3 h-9 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">City</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Orders</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : data?.results.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    No customers found. {search ? 'Try a different search term.' : 'Add your first customer!'}
                  </td>
                </tr>
              ) : (
                data?.results.map((customer) => (
                  <tr key={customer.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => router.push(`/customers/${customer.id}`)}
                        className="font-medium hover:text-primary transition-colors text-left"
                      >
                        {customer.full_name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{customer.phone}</td>
                    <td className="px-4 py-3 text-muted-foreground">{customer.city || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {customer.total_orders}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(customer.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => router.push(`/customers/${customer.id}`)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(customer)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => setDeleteId(customer.id)}
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

      <CustomerModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditCustomer(null) }}
        customer={editCustomer}
        onSave={handleSave}
        loading={createCustomer.isPending || updateCustomer.isPending}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { deleteCustomer.mutate(deleteId!); setDeleteId(null) }}
        title="Delete Customer?"
        description="This customer and all associated data will be permanently deleted. This cannot be undone."
        confirmLabel="Delete Customer"
        loading={deleteCustomer.isPending}
      />
    </div>
  )
}
