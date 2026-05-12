'use client'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, History, X, ArrowRight, RotateCcw } from 'lucide-react'
import { useWeeklyAttendance, useRecordAttendance, useAttendanceHistory } from '@/hooks/useEmployees'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'

const HOURS_OPTIONS = [0, 0.5, 1, 1.5, 2, 2.5]

function getMonday(d: Date): string {
  const day = d.getDay()
  const diff = (day + 6) % 7
  const monday = new Date(d)
  monday.setDate(d.getDate() - diff)
  return monday.toISOString().split('T')[0]
}

function addWeeks(dateStr: string, weeks: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + weeks * 7)
  return d.toISOString().split('T')[0]
}

function formatDay(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return {
    day: d.toLocaleDateString('en-US', { weekday: 'short' }),
    date: d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
  }
}

function formatWeekRange(start: string, end: string) {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  return `${s.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} — ${e.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`
}

function formatDateTime(str: string) {
  return new Date(str).toLocaleString('en-US', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function cellColor(value: number) {
  if (value === 0) return 'text-muted-foreground bg-muted/30'
  if (value >= 2) return 'text-purple-700 bg-purple-50 dark:bg-purple-950/20 dark:text-purple-400'
  if (value >= 1) return 'text-green-700 bg-green-50 dark:bg-green-950/20 dark:text-green-400'
  return 'text-orange-700 bg-orange-50 dark:bg-orange-950/20 dark:text-orange-400'
}

// ── History Panel ─────────────────────────────────────────────────────────────
interface HistorySelection { employeeId: number; employeeName: string; date: string }

function HistoryPanel({
  selection,
  onClose,
  onRevert,
  reverting,
}: {
  selection: HistorySelection
  onClose: () => void
  onRevert: (hours: number) => void
  reverting: boolean
}) {
  const { data: history, isLoading } = useAttendanceHistory(selection.employeeId, selection.date)

  const d = new Date(selection.date + 'T00:00:00')
  const dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="fixed inset-0 z-40 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 h-full border-l border-border shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <History className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Change History</span>
            </div>
            <p className="font-semibold">{selection.employeeName}</p>
            <p className="text-sm text-muted-foreground">{dateLabel}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground mt-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* History list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
          ) : !history || history.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              No changes recorded yet for this cell.
            </div>
          ) : (
            history.map((entry, idx) => (
              <div
                key={entry.id}
                className="border border-border rounded-xl p-3.5 space-y-2 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${cellColor(entry.old_hours)}`}>
                      {entry.old_hours === 0 ? '—' : entry.old_hours}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${cellColor(entry.new_hours)}`}>
                      {entry.new_hours === 0 ? '—' : entry.new_hours}
                    </span>
                  </div>
                  {/* Show revert button only if not the most recent entry */}
                  {idx > 0 && (
                    <button
                      onClick={() => onRevert(entry.new_hours)}
                      disabled={reverting}
                      className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
                      title={`Revert to ${entry.new_hours}`}
                    >
                      <RotateCcw className="w-3 h-3" />
                      Revert
                    </button>
                  )}
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>Changed by <span className="font-medium text-foreground">{entry.changed_by_name}</span></p>
                  <p>{formatDateTime(entry.changed_at)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-border">
          <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}

// ── Attendance Cell ───────────────────────────────────────────────────────────
function AttendanceCell({
  value, employeeId, employeeName, date, onSave, saving, onHistory,
}: {
  value: number
  employeeId: number
  employeeName: string
  date: string
  onSave: (employeeId: number, date: string, hours: number) => void
  saving: boolean
  onHistory: (sel: HistorySelection) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <td className="px-1 py-2 text-center relative">
      <div className="flex items-center justify-center gap-0.5 group">
        {/* Value button */}
        <button
          onClick={() => setOpen(!open)}
          disabled={saving}
          className={`w-10 h-8 rounded-lg text-sm font-semibold transition-all hover:ring-2 hover:ring-primary ${cellColor(value)} ${saving ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
        >
          {value === 0 ? '—' : value}
        </button>

        {/* History icon — visible on hover */}
        <button
          onClick={() => onHistory({ employeeId, employeeName, date })}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent text-muted-foreground"
          title="View history"
        >
          <History className="w-3 h-3" />
        </button>
      </div>

      {/* Value picker popover */}
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 top-full mt-1 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 border border-border rounded-xl shadow-lg p-2 flex gap-1">
            {HOURS_OPTIONS.map((h) => (
              <button
                key={h}
                onClick={() => { onSave(employeeId, date, h); setOpen(false) }}
                className={`w-9 h-8 rounded-lg text-xs font-bold transition-colors ${value === h ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
              >
                {h === 0 ? '0' : h}
              </button>
            ))}
          </div>
        </>
      )}
    </td>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AttendancePage() {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [historySelection, setHistorySelection] = useState<HistorySelection | null>(null)

  const { data, isLoading } = useWeeklyAttendance(weekStart)
  const recordAttendance = useRecordAttendance()

  const handleSave = (employeeId: number, date: string, hours: number) => {
    const key = `${employeeId}-${date}`
    setSavingKey(key)
    recordAttendance.mutate(
      { employee_id: employeeId, date, hours },
      { onSettled: () => setSavingKey(null) }
    )
  }

  const handleRevert = (hours: number) => {
    if (!historySelection) return
    handleSave(historySelection.employeeId, historySelection.date, hours)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Attendance Sheet</h1>
          <p className="text-muted-foreground text-sm mt-1 flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4" />
            {data ? formatWeekRange(data.week_start, data.week_end) : 'Loading...'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekStart(addWeeks(weekStart, -1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(getMonday(new Date()))}>
            This Week
          </Button>
          <Button variant="outline" size="icon" onClick={() => setWeekStart(addWeeks(weekStart, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        {[
          { label: '0 — Absent', cls: 'bg-muted/50 text-muted-foreground' },
          { label: '0.5 — Half Day', cls: 'bg-orange-100 text-orange-700' },
          { label: '1 — Full Day', cls: 'bg-green-100 text-green-700' },
          { label: '2 / 2.5 — Extra', cls: 'bg-purple-100 text-purple-700' },
        ].map(({ label, cls }) => (
          <span key={label} className={`px-2 py-1 rounded-full font-medium ${cls}`}>{label}</span>
        ))}
        <span className="text-muted-foreground flex items-center gap-1 ml-2">
          <History className="w-3.5 h-3.5" /> Hover a cell to view history
        </span>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground min-w-[140px]">Employee</th>
                {isLoading
                  ? [...Array(7)].map((_, i) => (
                      <th key={i} className="px-2 py-3 text-center min-w-[72px]">
                        <Skeleton className="h-4 w-12 mx-auto" />
                      </th>
                    ))
                  : data?.dates.map((d) => {
                      const { day, date } = formatDay(d)
                      return (
                        <th key={d} className="px-2 py-3 text-center min-w-[72px]">
                          <div className="font-medium">{day}</div>
                          <div className="text-xs text-muted-foreground font-normal">{date}</div>
                        </th>
                      )
                    })}
                <th className="px-3 py-3 text-center font-medium text-muted-foreground min-w-[80px]">Total Days</th>
                <th className="px-3 py-3 text-right font-medium text-muted-foreground min-w-[100px]">Per Day</th>
                <th className="px-3 py-3 text-right font-medium text-muted-foreground min-w-[110px]">Total Salary</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {[...Array(11)].map((_, j) => (
                      <td key={j} className="px-2 py-3"><Skeleton className="h-8 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : data?.employees.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-muted-foreground">
                    No active employees. Add employees first.
                  </td>
                </tr>
              ) : (
                data?.employees.map((emp) => (
                  <tr key={emp.id} className="border-b border-border hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-2 font-medium">{emp.full_name}</td>
                    {data.dates.map((d) => (
                      <AttendanceCell
                        key={d}
                        value={emp.attendance[d] ?? 0}
                        employeeId={emp.id}
                        employeeName={emp.full_name}
                        date={d}
                        onSave={handleSave}
                        saving={savingKey === `${emp.id}-${d}`}
                        onHistory={setHistorySelection}
                      />
                    ))}
                    <td className="px-3 py-2 text-center font-bold">{emp.total_days}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{formatCurrency(emp.per_day_income)}</td>
                    <td className="px-3 py-2 text-right font-bold text-green-600">{formatCurrency(emp.total_salary)}</td>
                  </tr>
                ))
              )}
            </tbody>

            {data && data.employees.length > 0 && (
              <tfoot>
                <tr className="bg-amber-50 dark:bg-amber-950/20 border-t-2 border-amber-200 dark:border-amber-800">
                  <td className="px-4 py-3 font-bold text-amber-800 dark:text-amber-400" colSpan={8}>
                    Grand Total
                  </td>
                  <td className="px-3 py-3 text-center font-bold text-amber-800 dark:text-amber-400">
                    {data.grand_total_days}
                  </td>
                  <td className="px-3 py-3" />
                  <td className="px-3 py-3 text-right font-bold text-amber-800 dark:text-amber-400">
                    {formatCurrency(data.grand_total_salary)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>

      {/* History Panel */}
      {historySelection && (
        <HistoryPanel
          selection={historySelection}
          onClose={() => setHistorySelection(null)}
          onRevert={handleRevert}
          reverting={recordAttendance.isPending}
        />
      )}
    </div>
  )
}
