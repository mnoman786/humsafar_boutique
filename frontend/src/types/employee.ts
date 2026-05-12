export interface Employee {
  id: number
  full_name: string
  phone: string
  per_day_income: string
  joined_date: string | null
  is_active: boolean
  notes: string
  created_at: string
}

export interface EmployeeFormData {
  full_name: string
  phone?: string
  per_day_income: string
  joined_date?: string
  is_active?: boolean
  notes?: string
}

export interface AttendanceEntry {
  id: number
  employee_id: number
  date: string
  hours: number
}

export interface WeeklyEmployeeRow {
  id: number
  full_name: string
  per_day_income: number
  attendance: Record<string, number>
  total_days: number
  total_salary: number
}

export interface WeeklyAttendanceData {
  week_start: string
  week_end: string
  dates: string[]
  employees: WeeklyEmployeeRow[]
  grand_total_days: number
  grand_total_salary: number
}
