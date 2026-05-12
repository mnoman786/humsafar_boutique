'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/axios'
import type { LoginCredentials, LoginResponse, User } from '@/types/auth'
import { toast } from 'sonner'

export function useCurrentUser() {
  return useQuery<User>({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await apiClient.get('/auth/me/')
      return data
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('access_token'),
  })
}

export function useLogin() {
  const router = useRouter()
  const qc = useQueryClient()

  return useMutation<LoginResponse, Error, LoginCredentials>({
    mutationFn: async (credentials) => {
      const { data } = await apiClient.post('/auth/login/', credentials)
      return data
    },
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.access)
      localStorage.setItem('refresh_token', data.refresh)
      localStorage.setItem('user', JSON.stringify(data.user))
      qc.setQueryData(['me'], data.user)
      toast.success(`Welcome back, ${data.user.full_name}!`)
      router.push('/')
    },
    onError: () => {
      toast.error('Invalid email or password.')
    },
  })
}

export function useLogout() {
  const router = useRouter()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        await apiClient.post('/auth/logout/', { refresh }).catch(() => {})
      }
    },
    onSettled: () => {
      localStorage.clear()
      qc.clear()
      router.push('/login')
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: { old_password: string; new_password: string; confirm_password: string }) => {
      const res = await apiClient.post('/auth/change-password/', data)
      return res.data
    },
    onSuccess: () => toast.success('Password changed successfully.'),
    onError: () => toast.error('Failed to change password.'),
  })
}

export function useStoredUser(): User | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}
