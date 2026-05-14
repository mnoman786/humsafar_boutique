export type InventoryCategory = 'fabric' | 'thread' | 'accessory' | 'other'
export type InventoryUnit = 'meters' | 'yards' | 'pieces' | 'kg' | 'grams' | 'tola'

export const CATEGORY_LABELS: Record<InventoryCategory, string> = {
  fabric: 'Fabric',
  thread: 'Thread',
  accessory: 'Accessory',
  other: 'Other',
}

export const UNIT_LABELS: Record<InventoryUnit, string> = {
  meters: 'Meters',
  yards: 'Yards',
  pieces: 'Pieces',
  kg: 'Kilograms',
  grams: 'Grams',
  tola: 'Tola',
}

// Units that require whole numbers only (no decimals)
export const WHOLE_NUMBER_UNITS: InventoryUnit[] = ['pieces']

export const isWholeUnit = (unit: string): boolean =>
  WHOLE_NUMBER_UNITS.includes(unit as InventoryUnit)

export const CATEGORY_COLORS: Record<InventoryCategory, string> = {
  fabric: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  thread: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  accessory: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
}

export interface InventoryItem {
  id: number
  name: string
  category: InventoryCategory
  unit: InventoryUnit
  quantity: string
  low_stock_threshold: string
  cost_per_unit: string
  description: string
  is_active: boolean
  is_low_stock: boolean
  created_at: string
  updated_at: string
}

export interface InventoryTransaction {
  id: number
  item_name: string
  order_number: string | null
  transaction_type: 'in' | 'out' | 'adjustment'
  quantity: string
  notes: string
  created_by_name: string | null
  created_at: string
}

export interface InventoryItemFormData {
  name: string
  category: InventoryCategory
  unit: InventoryUnit
  quantity: number
  low_stock_threshold: number
  cost_per_unit: number
  description: string
  is_active: boolean
}

export interface OrderMaterialItem {
  id: number
  item_id: number
  item_name: string
  unit: string
  quantity: string
}

// Used in OrderForm state (not part of Zod schema)
export interface MaterialEntry {
  item_id: number
  item_name: string
  unit: string
  available: number
  quantity: number
}
