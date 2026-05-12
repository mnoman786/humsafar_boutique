export type PaymentMethod = 'cash' | 'bank_transfer' | 'jazzcash' | 'easypaisa'

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  jazzcash: 'JazzCash',
  easypaisa: 'EasyPaisa',
}

export interface Payment {
  id: number
  order_number: string
  customer_name: string
  amount: string
  payment_date: string
  payment_method: PaymentMethod
  recorded_by_name: string | null
  notes: string
  created_at: string
}

export interface PaymentFormData {
  order_id: number
  amount: string
  payment_date: string
  payment_method: PaymentMethod
  notes: string
}
