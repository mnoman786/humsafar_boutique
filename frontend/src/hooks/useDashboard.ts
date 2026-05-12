'use client'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { DashboardStats, DashboardCharts } from '@/types/dashboard'
import type { OrderListItem } from '@/types/order'
import type { Payment } from '@/types/payment'

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const { data } = await apiClient.get('/dashboard/stats/')
      return data
    },
    staleTime: 1000 * 60,
  })
}

export function useDashboardCharts() {
  return useQuery<DashboardCharts>({
    queryKey: ['dashboard', 'charts'],
    queryFn: async () => {
      const { data } = await apiClient.get('/dashboard/charts/')
      return data
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useDashboardRecent() {
  return useQuery<{
    recent_orders: OrderListItem[]
    recent_payments: Payment[]
    recent_delivered: OrderListItem[]
  }>({
    queryKey: ['dashboard', 'recent'],
    queryFn: async () => {
      const { data } = await apiClient.get('/dashboard/recent/')
      return data
    },
    staleTime: 1000 * 30,
  })
}
