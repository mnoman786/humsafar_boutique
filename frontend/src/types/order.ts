import type { CustomerBrief } from './customer'
import type { OrderMaterialItem } from './inventory'

export type OrderStatus = 'waiting' | 'running' | 'completed' | 'delivered' | 'cancelled'

export interface StatusHistory {
  id: number
  status: OrderStatus
  changed_by_name: string
  notes: string
  timestamp: string
}

export interface UploadedImage {
  id: number
  image: string
  uploaded_at: string
}

export interface Order {
  id: number
  order_number: string
  customer: CustomerBrief
  cloth_type: string
  cloth_color: string
  quantity: number
  design_details: string
  measurement_details: string
  total_amount: string
  advance_payment: string
  remaining_payment: string
  total_paid: string
  balance_due: string
  status: OrderStatus
  order_date: string
  expected_delivery_date: string | null
  delivered_date: string | null
  customer_notes: string
  admin_notes: string
  extra_notes: string
  created_by_name: string | null
  created_at: string
  updated_at: string
  status_history: StatusHistory[]
  images: UploadedImage[]
  materials: OrderMaterialItem[]
}

export interface OrderListItem {
  id: number
  order_number: string
  customer: CustomerBrief
  status: OrderStatus
  total_amount: string
  advance_payment: string
  remaining_payment: string
  expected_delivery_date: string | null
  created_at: string
}

export interface OrderFormData {
  customer_id: number
  cloth_type: string
  cloth_color: string
  quantity: number
  design_details: string
  measurement_details: string
  total_amount: string
  advance_payment: string
  status: OrderStatus
  order_date: string
  expected_delivery_date: string
  customer_notes: string
  admin_notes: string
  extra_notes: string
}

export interface OrderStatusUpdate {
  status: OrderStatus
  notes?: string
  delivered_date?: string
}

export interface OrderFilters {
  status?: OrderStatus | ''
  date_from?: string
  date_to?: string
  search?: string
  page?: number
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  waiting: 'Waiting',
  running: 'In Progress',
  completed: 'Completed',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  waiting: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  running: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  delivered: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}
