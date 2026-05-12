'use client'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useChangePassword } from '@/hooks/useAuth'
import type { User } from '@/types/auth'
import apiClient from '@/lib/axios'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name is required'),
  phone: z.string().optional(),
})

const passwordSchema = z.object({
  old_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'Minimum 8 characters'),
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const changePassword = useChangePassword()
  const [profileLoading, setProfileLoading] = useState(false)

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: '', phone: '' },
  })

  // Populate user from localStorage after hydration, then reset form defaults
  useEffect(() => {
    try {
      const stored = localStorage.getItem('user')
      if (stored) {
        const parsed: User = JSON.parse(stored)
        setUser(parsed)
        profileForm.reset({ full_name: parsed.full_name ?? '', phone: parsed.phone ?? '' })
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const handleProfileSave = async (data: ProfileForm) => {
    setProfileLoading(true)
    try {
      const res = await apiClient.patch('/auth/me/', data)
      const stored = JSON.parse(localStorage.getItem('user') ?? '{}')
      localStorage.setItem('user', JSON.stringify({ ...stored, ...res.data }))
      toast.success('Profile updated successfully.')
    } catch {
      toast.error('Failed to update profile.')
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordSave = (data: PasswordForm) => {
    changePassword.mutate(data, {
      onSuccess: () => passwordForm.reset(),
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account settings</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(handleProfileSave)} className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                {user?.full_name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">{user?.email}</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium capitalize">
                  {user?.role}
                </span>
              </div>
            </div>

            <Input label="Full Name" {...profileForm.register('full_name')} error={profileForm.formState.errors.full_name?.message} />
            <Input label="Phone" {...profileForm.register('phone')} placeholder="03001234567" />

            <div className="flex justify-end">
              <Button type="submit" loading={profileLoading}>Save Profile</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(handlePasswordSave)} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              {...passwordForm.register('old_password')}
              error={passwordForm.formState.errors.old_password?.message}
            />
            <Input
              label="New Password"
              type="password"
              {...passwordForm.register('new_password')}
              error={passwordForm.formState.errors.new_password?.message}
            />
            <Input
              label="Confirm New Password"
              type="password"
              {...passwordForm.register('confirm_password')}
              error={passwordForm.formState.errors.confirm_password?.message}
            />

            <div className="flex justify-end">
              <Button type="submit" loading={changePassword.isPending}>Change Password</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
