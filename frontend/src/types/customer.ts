export interface Customer {
  id: number
  full_name: string
  phone: string
  alternate_phone: string
  address: string
  city: string
  notes: string
  total_orders: number
  created_at: string
  updated_at: string
}

export interface CustomerBrief {
  id: number
  full_name: string
  phone: string
  city: string
}

export type CustomerFormData = Omit<Customer, 'id' | 'total_orders' | 'created_at' | 'updated_at'>
