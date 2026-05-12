'use client'
import { Menu, Sun, Moon, LogOut, User, ChevronDown } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useLogout } from '@/hooks/useAuth'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { User as UserType } from '@/types/auth'

interface NavbarProps {
  onMenuClick: () => void
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<UserType | null>(null)
  const logout = useLogout()

  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem('user')
      if (stored) setUser(JSON.parse(stored))
    } catch {}
  }, [])
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <header className="h-16 border-b border-border bg-white dark:bg-gray-900 flex items-center px-4 gap-4 sticky top-0 z-10">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
      >
        {mounted && (theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />)}
      </button>

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-accent transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
            {user?.full_name.slice(0, 2).toUpperCase() ?? 'U'}
          </div>
          <span className="text-sm font-medium hidden sm:block">{user?.full_name ?? 'User'}</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </button>

        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-border z-20 py-1">
              <Link
                href="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors"
              >
                <User className="w-4 h-4" />
                Profile & Settings
              </Link>
              <hr className="my-1 border-border" />
              <button
                onClick={() => { setDropdownOpen(false); logout.mutate() }}
                className={cn(
                  'w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors',
                  logout.isPending && 'opacity-50 cursor-not-allowed'
                )}
                disabled={logout.isPending}
              >
                <LogOut className="w-4 h-4" />
                {logout.isPending ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
