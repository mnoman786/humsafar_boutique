'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { Payment, PaymentFormData } from '@/types/payment'
import type { PaginatedResponse } from '@/types/dashboard'
import { toast } from 'sonner'

interface PaymentFilters {
  order?: number
  payment_method?: string
  page?: number
  search?: string
}

export function usePayments(filters: PaymentFilters = {}) {
  return useQuery<PaginatedResponse<Payment>>({
    queryKey: ['payments', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/payments/', { params: filters })
      return data
    },
  })
}

export function useCreatePayment() {
  const qc = useQueryClient()
  return useMutation<Payment, Error, PaymentFormData>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post('/payments/', payload)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] })
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['order'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Payment recorded successfully.')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { amount?: string[] } } })?.response?.data?.amount?.[0]
      toast.error(msg || 'Failed to record payment.')
    },
  })
}

export function useUpdatePayment(id: number) {
  const qc = useQueryClient()
  return useMutation<Payment, Error, Partial<PaymentFormData>>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.patch(`/payments/${id}/`, payload)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] })
      qc.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Payment updated.')
    },
    onError: () => toast.error('Failed to update payment.'),
  })
}

export function useDeletePayment() {
  const qc = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await apiClient.delete(`/payments/${id}/`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] })
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['order'] })
      toast.success('Payment deleted.')
    },
    onError: () => toast.error('Failed to delete payment.'),
  })
}
