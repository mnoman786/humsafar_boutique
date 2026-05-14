'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, X, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, type UserCreatePayload, type UserUpdatePayload } from '@/hooks/useUsers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { formatDateTime } from '@/lib/utils'
import type { User } from '@/types/auth'

// ── Helpers ───────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = { admin: 'Admin', staff: 'Staff', user: 'User' }
const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  staff: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  user: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
}

// ── Create Modal ──────────────────────────────────────────────────────────────

const createSchema = z.object({
  email: z.string().email('Enter a valid email'),
  full_name: z.string().min(2, 'Name is required'),
  phone: z.string().optional(),
  role: z.enum(['admin', 'staff', 'user']),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirm: z.string().min(1, 'Confirm your password'),
}).refine((d) => d.password === d.password_confirm, {
  message: 'Passwords do not match',
  path: ['password_confirm'],
})

type CreateFormValues = z.infer<typeof createSchema>

function CreateUserModal({ onClose }: { onClose: () => void }) {
  const createUser = useCreateUser()
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'user' },
  })

  const onSubmit = (data: CreateFormValues) => {
    createUser.mutate(data as UserCreatePayload, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-border">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold">Add New User</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <Input label="Full Name *" {...register('full_name')} error={errors.full_name?.message} placeholder="e.g. Sara Ahmed" />
          <Input label="Email *" type="email" {...register('email')} error={errors.email?.message} placeholder="user@example.com" />
          <Input label="Phone" {...register('phone')} placeholder="+92 300 0000000" />

          <div>
            <label className="block text-sm font-medium mb-1.5">Role *</label>
            <select
              {...register('role')}
              className="w-full px-3 h-10 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="user">User — Attendance & Employees only</option>
              <option value="staff">Staff — Full access (no admin)</option>
              <option value="admin">Admin — Full access</option>
            </select>
          </div>

          {/* Password */}
          <div className="relative">
            <Input
              label="Password *"
              type={showPw ? 'text' : 'password'}
              {...register('password')}
              error={errors.password?.message}
              placeholder="Min. 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-8 text-muted-foreground hover:text-foreground"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="Confirm Password *"
              type={showConfirm ? 'text' : 'password'}
              {...register('password_confirm')}
              error={errors.password_confirm?.message}
              placeholder="Repeat password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-8 text-muted-foreground hover:text-foreground"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={createUser.isPending}>Create User</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

const editSchema = z.object({
  full_name: z.string().min(2, 'Name is required'),
  phone: z.string().optional(),
  role: z.enum(['admin', 'staff', 'user']),
  is_active: z.boolean(),
})

type EditFormValues = z.infer<typeof editSchema>

function EditUserModal({ user, onClose }: { user: User; onClose: () => void }) {
  const updateUser = useUpdateUser(user.id)

  const { register, handleSubmit, formState: { errors } } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      full_name: user.full_name,
      phone: user.phone,
      role: user.role as 'admin' | 'staff' | 'user',
      is_active: user.is_active,
    },
  })

  const onSubmit = (data: EditFormValues) => {
    updateUser.mutate(data as UserUpdatePayload, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-border">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">Edit User</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <Input label="Full Name *" {...register('full_name')} error={errors.full_name?.message} />
          <Input label="Phone" {...register('phone')} />

          <div>
            <label className="block text-sm font-medium mb-1.5">Role *</label>
            <select
              {...register('role')}
              className="w-full px-3 h-10 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="user">User — Attendance & Employees only</option>
              <option value="staff">Staff — Full access (no admin)</option>
              <option value="admin">Admin — Full access</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              {...register('is_active')}
              className="w-4 h-4 rounded border-input accent-primary"
            />
            <label htmlFor="is_active" className="text-sm font-medium">Active</label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={updateUser.isPending}>Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { data: users = [], isLoading } = useUsers()
  const deleteUser = useDeleteUser()

  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            Users
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage system users and their access roles</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" /> Add User
        </Button>
      </div>

      {/* Role legend */}
      <div className="flex flex-wrap gap-3 text-sm">
        {Object.entries(ROLE_LABELS).map(([role, label]) => (
          <span key={role} className={`px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[role]}`}>
            {label}
          </span>
        ))}
        <span className="text-muted-foreground text-xs self-center">
          User = Attendance &amp; Employees only · Staff = Full (no admin) · Admin = Full access
        </span>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {users.length} {users.length === 1 ? 'user' : 'users'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : users.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">No users yet.</div>
          ) : (
            <div className="divide-y divide-border">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-muted/20 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                    {u.full_name.slice(0, 2).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{u.full_name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role]}`}>
                        {ROLE_LABELS[u.role]}
                      </span>
                      {!u.is_active && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {u.email}{u.phone ? ` · ${u.phone}` : ''} · Joined {formatDateTime(u.date_joined)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => setEditUser(u)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(u.id)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {createOpen && <CreateUserModal onClose={() => setCreateOpen(false)} />}
      {editUser && <EditUserModal user={editUser} onClose={() => setEditUser(null)} />}

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { deleteUser.mutate(deleteId!); setDeleteId(null) }}
        title="Delete User?"
        description="This user will be permanently removed and will no longer be able to log in."
        confirmLabel="Delete User"
        loading={deleteUser.isPending}
      />
    </div>
  )
}
