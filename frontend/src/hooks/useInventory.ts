'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { InventoryItem, InventoryItemFormData, InventoryTransaction } from '@/types/inventory'
import { toast } from 'sonner'

export function useInventory(params: { category?: string; search?: string; is_active?: boolean } = {}) {
  return useQuery<InventoryItem[]>({
    queryKey: ['inventory', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/inventory/', { params })
      return data.results ?? data
    },
  })
}

export function useAllInventory() {
  return useQuery<InventoryItem[]>({
    queryKey: ['inventory-all'],
    queryFn: async () => {
      const { data } = await apiClient.get('/inventory/', { params: { is_active: true, page_size: 1000 } })
      return data.results ?? data
    },
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreateInventoryItem() {
  const qc = useQueryClient()
  return useMutation<InventoryItem, Error, InventoryItemFormData>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post('/inventory/', payload)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
      qc.invalidateQueries({ queryKey: ['inventory-all'] })
      toast.success('Item added to inventory.')
    },
    onError: () => toast.error('Failed to add item.'),
  })
}

export function useUpdateInventoryItem(id: number) {
  const qc = useQueryClient()
  return useMutation<InventoryItem, Error, Partial<InventoryItemFormData>>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.patch(`/inventory/${id}/`, payload)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
      qc.invalidateQueries({ queryKey: ['inventory-all'] })
      toast.success('Item updated.')
    },
    onError: () => toast.error('Failed to update item.'),
  })
}

export function useDeleteInventoryItem() {
  const qc = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await apiClient.delete(`/inventory/${id}/`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
      qc.invalidateQueries({ queryKey: ['inventory-all'] })
      toast.success('Item deleted.')
    },
    onError: () => toast.error('Failed to delete item.'),
  })
}

export function useStockAdjust(id: number) {
  const qc = useQueryClient()
  return useMutation<InventoryItem, Error, { quantity: number; notes?: string }>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post(`/inventory/${id}/adjust/`, payload)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
      qc.invalidateQueries({ queryKey: ['inventory-all'] })
      toast.success('Stock updated.')
    },
    onError: () => toast.error('Failed to adjust stock.'),
  })
}

export function useInventoryTransactions(itemId?: number) {
  return useQuery<InventoryTransaction[]>({
    queryKey: ['inventory-transactions', itemId],
    queryFn: async () => {
      const params = itemId ? { item_id: itemId } : {}
      const { data } = await apiClient.get('/inventory/transactions/', { params })
      return data.results ?? data
    },
    enabled: itemId !== undefined,
  })
}
