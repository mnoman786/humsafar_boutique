'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, X, Package, AlertTriangle, ArrowDownToLine, History } from 'lucide-react'
import {
  useInventory, useCreateInventoryItem, useUpdateInventoryItem,
  useDeleteInventoryItem, useStockAdjust, useInventoryTransactions,
} from '@/hooks/useInventory'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import type { InventoryItem, InventoryItemFormData } from '@/types/inventory'
import { CATEGORY_LABELS, CATEGORY_COLORS, UNIT_LABELS, isWholeUnit } from '@/types/inventory'

// ── Item Modal ────────────────────────────────────────────────────────────────

const itemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.enum(['fabric', 'thread', 'accessory', 'other']),
  unit: z.enum(['meters', 'yards', 'pieces', 'kg', 'grams', 'tola']),
  quantity: z.coerce.number().min(0),
  low_stock_threshold: z.coerce.number().min(0),
  cost_per_unit: z.coerce.number().min(0),
  description: z.string().optional(),
  is_active: z.boolean(),
})
type ItemFormValues = z.infer<typeof itemSchema>

function ItemModal({ item, onClose }: { item: InventoryItem | null; onClose: () => void }) {
  const createItem = useCreateInventoryItem()
  const updateItem = useUpdateInventoryItem(item?.id ?? 0)
  const isEdit = !!item

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: item ? {
      name: item.name,
      category: item.category,
      unit: item.unit,
      quantity: parseFloat(item.quantity),
      low_stock_threshold: parseFloat(item.low_stock_threshold),
      cost_per_unit: parseFloat(item.cost_per_unit),
      description: item.description,
      is_active: item.is_active,
    } : {
      category: 'fabric', unit: 'meters', quantity: 0,
      low_stock_threshold: 0, cost_per_unit: 0, is_active: true,
    },
  })

  const selectedUnit = watch('unit')
  const whole = isWholeUnit(selectedUnit)

  const onSubmit = (data: ItemFormValues) => {
    const payload = { ...data, description: data.description ?? '' } as InventoryItemFormData
    if (isEdit) {
      updateItem.mutate(payload, { onSuccess: onClose })
    } else {
      createItem.mutate(payload, { onSuccess: onClose })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-border max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-white dark:bg-gray-900">
          <h2 className="text-lg font-semibold">{isEdit ? 'Edit Item' : 'Add Inventory Item'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <Input label="Name *" {...register('name')} error={errors.name?.message} placeholder="e.g. Red Silk Fabric" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Category</label>
              <select {...register('category')} className="w-full px-3 h-10 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Unit</label>
              <select {...register('unit')} className="w-full px-3 h-10 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {Object.entries(UNIT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input label="Current Stock" type="number" min={0} step={whole ? '1' : '0.01'} {...register('quantity')} error={errors.quantity?.message} />
            <Input label="Low Stock Alert" type="number" min={0} step={whole ? '1' : '0.01'} {...register('low_stock_threshold')} />
            <Input label="Cost / Unit (PKR)" type="number" min={0} step="0.01" {...register('cost_per_unit')} />
          </div>

          <Textarea label="Description" {...register('description')} rows={2} placeholder="Optional notes about this item..." />

          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" {...register('is_active')} className="w-4 h-4 rounded accent-primary" />
            <label htmlFor="is_active" className="text-sm font-medium">Active</label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={createItem.isPending || updateItem.isPending}>
              {isEdit ? 'Save Changes' : 'Add Item'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Stock Adjust Modal ────────────────────────────────────────────────────────

function AdjustModal({ item, onClose }: { item: InventoryItem; onClose: () => void }) {
  const adjust = useStockAdjust(item.id)
  const [qty, setQty] = useState('')
  const [notes, setNotes] = useState('')
  const whole = isWholeUnit(item.unit)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(qty)
    if (!amount) return
    adjust.mutate({ quantity: amount, notes }, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-border">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">Adjust Stock</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{item.name} — current: {item.quantity} {item.unit}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Quantity to Add / Remove</label>
            <input
              type="number"
              step={whole ? '1' : '0.01'}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="e.g. 10 to add, -5 to remove"
              className="w-full px-3 h-10 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">Use negative value to reduce stock</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for adjustment..."
              className="w-full px-3 h-10 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={adjust.isPending}>Update Stock</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Transaction History Modal ─────────────────────────────────────────────────

function HistoryModal({ item, onClose }: { item: InventoryItem; onClose: () => void }) {
  const { data: txns = [], isLoading } = useInventoryTransactions(item.id)

  const TYPE_COLORS = {
    in: 'text-green-600',
    out: 'text-red-600',
    adjustment: 'text-blue-600',
  }
  const TYPE_LABELS = { in: 'Stock In', out: 'Used', adjustment: 'Adjustment' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-border max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">Transaction History</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{item.name}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-4">
          {isLoading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : txns.length === 0 ? (
            <p className="text-center py-8 text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            <div className="space-y-2">
              {txns.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-border text-sm">
                  <div>
                    <span className={`font-medium ${TYPE_COLORS[t.transaction_type]}`}>
                      {TYPE_LABELS[t.transaction_type]}
                    </span>
                    {t.order_number && <span className="ml-2 text-xs text-muted-foreground font-mono">{t.order_number}</span>}
                    {t.notes && <p className="text-xs text-muted-foreground mt-0.5">{t.notes}</p>}
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className={`font-semibold ${TYPE_COLORS[t.transaction_type]}`}>
                      {t.transaction_type === 'out' ? '−' : '+'}{t.quantity} {item.unit}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(t.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const { data: items = [], isLoading } = useInventory()
  const deleteItem = useDeleteInventoryItem()

  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null)
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState<InventoryItem | null>(null)

  const lowStockCount = items.filter((i) => i.is_low_stock && i.is_active).length

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" /> Inventory
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {items.length} items · {lowStockCount > 0 && (
              <span className="text-orange-600 font-medium">{lowStockCount} low stock</span>
            )}
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4" /> Add Item
        </Button>
      </div>

      {/* Low stock alert banner */}
      {lowStockCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-orange-50 border border-orange-200 dark:bg-orange-950/20 dark:border-orange-800 text-sm text-orange-700 dark:text-orange-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span><strong>{lowStockCount}</strong> item{lowStockCount > 1 ? 's are' : ' is'} running low on stock.</span>
        </div>
      )}

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Stock</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Cost/Unit</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {[...Array(6)].map((_, j) => <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>)}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    No inventory items yet. Add your first item.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{item.name}</p>
                      {item.description && <p className="text-xs text-muted-foreground truncate max-w-48">{item.description}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[item.category]}`}>
                        {CATEGORY_LABELS[item.category]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={item.is_low_stock ? 'text-orange-600 font-semibold' : 'font-medium'}>
                        {item.quantity}
                      </span>
                      <span className="text-muted-foreground ml-1 text-xs">{item.unit}</span>
                      {item.is_low_stock && <AlertTriangle className="w-3 h-3 text-orange-500 inline ml-1" />}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {parseFloat(item.cost_per_unit) > 0 ? formatCurrency(item.cost_per_unit) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {item.is_active ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400">Active</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">Inactive</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setHistoryItem(item)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          title="Transaction history"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setAdjustItem(item)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          title="Adjust stock"
                        >
                          <ArrowDownToLine className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditItem(item)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(item.id)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modals */}
      {addOpen && <ItemModal item={null} onClose={() => setAddOpen(false)} />}
      {editItem && <ItemModal item={editItem} onClose={() => setEditItem(null)} />}
      {adjustItem && <AdjustModal item={adjustItem} onClose={() => setAdjustItem(null)} />}
      {historyItem && <HistoryModal item={historyItem} onClose={() => setHistoryItem(null)} />}

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { deleteItem.mutate(deleteId!); setDeleteId(null) }}
        title="Delete Item?"
        description="This inventory item will be permanently deleted. Orders using it will keep their records."
        confirmLabel="Delete Item"
        loading={deleteItem.isPending}
      />
    </div>
  )
}
