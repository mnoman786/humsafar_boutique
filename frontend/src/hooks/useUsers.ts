'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { User } from '@/types/auth'
import { toast } from 'sonner'

export interface UserCreatePayload {
  email: string
  full_name: string
  phone: string
  role: 'admin' | 'staff' | 'user'
  password: string
  password_confirm: string
}

export interface UserUpdatePayload {
  full_name?: string
  phone?: string
  role?: 'admin' | 'staff' | 'user'
  is_active?: boolean
}

export function useUsers() {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await apiClient.get('/auth/users/')
      return data.results ?? data
    },
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation<User, Error, UserCreatePayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post('/auth/users/', payload)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('User created successfully.')
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { email?: string[]; password?: string[] } } })
          ?.response?.data?.email?.[0] ||
        (err as { response?: { data?: { password?: string[] } } })
          ?.response?.data?.password?.[0]
      toast.error(msg || 'Failed to create user.')
    },
  })
}

export function useUpdateUser(id: number) {
  const qc = useQueryClient()
  return useMutation<User, Error, UserUpdatePayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.patch(`/auth/users/${id}/`, payload)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('User updated.')
    },
    onError: () => toast.error('Failed to update user.'),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await apiClient.delete(`/auth/users/${id}/`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('User deleted.')
    },
    onError: () => toast.error('Failed to delete user.'),
  })
}
