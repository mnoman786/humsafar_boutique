'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { Customer, CustomerFormData } from '@/types/customer'
import type { PaginatedResponse } from '@/types/dashboard'
import { toast } from 'sonner'

interface CustomerFilters {
  search?: string
  page?: number
}

export function useCustomers(filters: CustomerFilters = {}) {
  return useQuery<PaginatedResponse<Customer>>({
    queryKey: ['customers', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/customers/', { params: filters })
      return data
    },
  })
}

/** Fetches ALL customers (no pagination) — used for dropdown/select lists */
export function useAllCustomers() {
  return useQuery<Customer[]>({
    queryKey: ['customers-all'],
    queryFn: async () => {
      const { data } = await apiClient.get('/customers/', { params: { page_size: 1000 } })
      return data.results ?? data
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useCustomer(id: number | null) {
  return useQuery<Customer>({
    queryKey: ['customer', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/customers/${id}/`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation<Customer, Error, CustomerFormData>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post('/customers/', payload)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Customer added successfully.')
    },
    onError: () => toast.error('Failed to add customer.'),
  })
}

export function useUpdateCustomer(id: number) {
  const qc = useQueryClient()
  return useMutation<Customer, Error, Partial<CustomerFormData>>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.patch(`/customers/${id}/`, payload)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['customer', id] })
      toast.success('Customer updated successfully.')
    },
    onError: () => toast.error('Failed to update customer.'),
  })
}

export function useDeleteCustomer() {
  const qc = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await apiClient.delete(`/customers/${id}/`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Customer deleted.')
    },
    onError: () => toast.error('Failed to delete customer.'),
  })
}
