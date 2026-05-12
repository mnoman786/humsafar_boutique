'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, ShoppingBag, Users, CreditCard,
  BarChart3, Settings, X, Scissors, UserCog, CalendarCheck
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { User } from '@/types/auth'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'staff'] },
  { href: '/orders', label: 'Orders', icon: ShoppingBag, roles: ['admin', 'staff'] },
  { href: '/customers', label: 'Customers', icon: Users, roles: ['admin', 'staff'] },
  { href: '/payments', label: 'Payments', icon: CreditCard, roles: ['admin'] },
  { href: '/employees', label: 'Employees', icon: UserCog, roles: ['admin'] },
  { href: '/attendance', label: 'Attendance', icon: CalendarCheck, roles: ['admin', 'staff'] },
  { href: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin'] },
  { href: '/settings', label: 'Settings', icon: Settings, roles: ['admin', 'staff'] },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  // Start null on both server and client to avoid hydration mismatch,
  // then populate from localStorage after hydration completes.
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user')
      if (stored) setUser(JSON.parse(stored))
    } catch {}
  }, [])

  const filtered = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  )

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-30 h-full w-64 bg-white dark:bg-gray-900 border-r border-border',
          'flex flex-col transition-transform duration-300 ease-in-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Scissors className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="bg-gradient-to-r from-boutique-600 to-boutique-400 bg-clip-text text-transparent">
              Humsafar
            </span>
          </Link>
          <button onClick={onClose} className="lg:hidden text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {filtered.map((item) => {
            const isActive = item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User info */}
        {user && (
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                {user.full_name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.full_name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
