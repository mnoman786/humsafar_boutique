'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Scissors, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLogin } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const login = useLogin()

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('access_token')) {
      router.push('/')
    }
  }, [router])

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (data: LoginForm) => login.mutate(data)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-boutique-50 via-white to-boutique-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-lg mb-4">
            <Scissors className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-boutique-700 to-boutique-400 bg-clip-text text-transparent">
            Humsafar Boutique
          </h1>
          <p className="text-muted-foreground mt-1">Order Management System</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-border p-8">
          <h2 className="text-xl font-semibold mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="admin@example.com"
                className={cn(
                  'w-full px-3 py-2.5 rounded-lg border text-sm transition-colors',
                  'bg-background focus:outline-none focus:ring-2 focus:ring-ring',
                  errors.email ? 'border-destructive' : 'border-input'
                )}
              />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={cn(
                    'w-full px-3 py-2.5 pr-10 rounded-lg border text-sm transition-colors',
                    'bg-background focus:outline-none focus:ring-2 focus:ring-ring',
                    errors.password ? 'border-destructive' : 'border-input'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={login.isPending}
              className={cn(
                'w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm',
                'hover:opacity-90 transition-opacity flex items-center justify-center gap-2',
                login.isPending && 'opacity-70 cursor-not-allowed'
              )}
            >
              {login.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {login.isPending ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Having trouble?{' '}
          <a href="mailto:admin@Humsafar.pk" className="text-primary hover:underline">
            Contact support
          </a>
        </p>
      </div>
    </div>
  )
}
