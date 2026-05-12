export type UserRole = 'admin' | 'staff'

export interface User {
  id: number
  email: string
  full_name: string
  role: UserRole
  phone: string
  is_active: boolean
  date_joined: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface LoginResponse extends AuthTokens {
  user: User
}
