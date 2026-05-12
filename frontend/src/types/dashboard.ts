export interface OrderCounts {
  total: number
  waiting: number
  running: number
  completed: number
  delivered: number
  cancelled: number
}

export interface DashboardStats {
  orders: OrderCounts
  total_revenue: number
  monthly_revenue: number
  pending_payments: number
  total_customers: number
}

export interface MonthlySalesItem {
  month: string
  orders: number
  revenue: number
}

export interface OrderStatusItem {
  status: string
  label: string
  count: number
}

export interface DashboardCharts {
  monthly_sales: MonthlySalesItem[]
  order_status: OrderStatusItem[]
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
