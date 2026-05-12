'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { Employee, EmployeeFormData, WeeklyAttendanceData } from '@/types/employee'
import type { PaginatedResponse } from '@/types/dashboard'
import { toast } from 'sonner'

export function useEmployees(params: { search?: string; is_active?: boolean } = {}) {
  return useQuery<PaginatedResponse<Employee>>({
    queryKey: ['employees', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/employees/', { params })
      return data
    },
  })
}

export function useCreateEmployee() {
  const qc = useQueryClient()
  return useMutation<Employee, Error, EmployeeFormData>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post('/employees/', payload)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Employee added.')
    },
    onError: () => toast.error('Failed to add employee.'),
  })
}

export function useUpdateEmployee(id: number) {
  const qc = useQueryClient()
  return useMutation<Employee, Error, Partial<EmployeeFormData>>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.patch(`/employees/${id}/`, payload)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Employee updated.')
    },
    onError: () => toast.error('Failed to update employee.'),
  })
}

export function useDeleteEmployee() {
  const qc = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await apiClient.delete(`/employees/${id}/`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Employee deleted.')
    },
    onError: () => toast.error('Failed to delete employee.'),
  })
}

export function useWeeklyAttendance(weekStart: string) {
  return useQuery<WeeklyAttendanceData>({
    queryKey: ['attendance', weekStart],
    queryFn: async () => {
      const { data } = await apiClient.get('/employees/attendance/', {
        params: { week_start: weekStart },
      })
      return data
    },
    enabled: !!weekStart,
  })
}

export function useRecordAttendance() {
  const qc = useQueryClient()
  return useMutation<
    { id: number; employee_id: number; date: string; hours: number },
    Error,
    { employee_id: number; date: string; hours: number }
  >({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post('/employees/attendance/', payload)
      return data
    },
    onSuccess: (_data, variables) => {
      // Invalidate the week containing this date
      const d = new Date(variables.date)
      const dayOfWeek = d.getDay()
      const monday = new Date(d)
      monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7))
      const weekStart = monday.toISOString().split('T')[0]
      qc.invalidateQueries({ queryKey: ['attendance', weekStart] })
    },
    onError: () => toast.error('Failed to save attendance.'),
  })
}
