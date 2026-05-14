'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { Order, OrderListItem, OrderFormData, OrderStatusUpdate, OrderFilters } from '@/types/order'
import type { PaginatedResponse } from '@/types/dashboard'
import { toast } from 'sonner'

export function useOrders(filters: OrderFilters = {}) {
  return useQuery<PaginatedResponse<OrderListItem>>({
    queryKey: ['orders', filters],
    queryFn: async () => {
      const params: Record<string, string | number> = {}
      if (filters.status) params.status = filters.status
      if (filters.date_from) params.date_from = filters.date_from
      if (filters.date_to) params.date_to = filters.date_to
      if (filters.search) params.search = filters.search
      if (filters.page) params.page = filters.page
      const { data } = await apiClient.get('/orders/', { params })
      return data
    },
  })
}

export function useOrder(id: number | null) {
  return useQuery<Order>({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/orders/${id}/`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation<Order, Error, FormData>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post('/orders/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['inventory'] })
      qc.invalidateQueries({ queryKey: ['inventory-all'] })
      toast.success(`Order ${data.order_number} created successfully.`)
    },
    onError: () => toast.error('Failed to create order.'),
  })
}

export function useUpdateOrder(id: number) {
  const qc = useQueryClient()
  return useMutation<Order, Error, Partial<OrderFormData>>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.patch(`/orders/${id}/`, payload)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['order', id] })
      toast.success('Order updated successfully.')
    },
    onError: () => toast.error('Failed to update order.'),
  })
}

export function useUpdateOrderStatus(id: number) {
  const qc = useQueryClient()
  return useMutation<Order, Error, OrderStatusUpdate>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post(`/orders/${id}/update-status/`, payload)
      return data
    },
    onSuccess: (data) => {
      qc.setQueryData(['order', id], data)
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['order', id] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['inventory'] })
      qc.invalidateQueries({ queryKey: ['inventory-all'] })
      toast.success(`Status updated to "${data.status}".`)
    },
    onError: () => toast.error('Failed to update status.'),
  })
}

export function useDeleteOrder() {
  const qc = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await apiClient.delete(`/orders/${id}/`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Order deleted.')
    },
    onError: () => toast.error('Failed to delete order.'),
  })
}

export function useUploadOrderImages(id: number) {
  const qc = useQueryClient()
  return useMutation<void, Error, File[]>({
    mutationFn: async (files) => {
      const formData = new FormData()
      files.forEach((f) => formData.append('images', f))
      await apiClient.post(`/orders/${id}/images/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order', id] })
      toast.success('Images uploaded.')
    },
    onError: () => toast.error('Failed to upload images.'),
  })
}

export function useDeleteOrderImage(orderId: number) {
  const qc = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: async (imageId) => {
      await apiClient.delete(`/orders/${orderId}/images/`, { data: { image_id: imageId } })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order', orderId] })
      toast.success('Image deleted.')
    },
    onError: () => toast.error('Failed to delete image.'),
  })
}

export function useTrackOrder() {
  return useMutation<Order, Error, { order_number: string; phone: string }>({
    mutationFn: async (params) => {
      const { data } = await apiClient.get('/orders/track/', { params })
      return data
    },
    onError: () => toast.error('Order not found. Check your order number and phone number.'),
  })
}
