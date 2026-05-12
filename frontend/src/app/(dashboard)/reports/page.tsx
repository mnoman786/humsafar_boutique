'use client'
import { useState } from 'react'
import { TrendingUp, ShoppingBag, CreditCard, Users } from 'lucide-react'
import { useDashboardStats, useDashboardCharts } from '@/hooks/useDashboard'
import { RevenueBarChart, SalesChart } from '@/components/dashboard/SalesChart'
import { OrderStatusChart } from '@/components/dashboard/OrderStatusChart'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/types/order'

export default function ReportsPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: charts, isLoading: chartsLoading } = useDashboardCharts()

  const summaryCards = [
    { label: 'Total Revenue', value: formatCurrency(stats?.total_revenue ?? 0), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
    { label: 'Monthly Revenue', value: formatCurrency(stats?.monthly_revenue ?? 0), icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/20' },
    { label: 'Total Orders', value: stats?.orders.total ?? 0, icon: ShoppingBag, color: 'text-boutique-600', bg: 'bg-boutique-50 dark:bg-boutique-950/20' },
    { label: 'Total Customers', value: stats?.total_customers ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/20' },
    { label: 'Pending Payments', value: formatCurrency(stats?.pending_payments ?? 0), icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/20' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of boutique performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label} className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.bg}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="font-bold text-sm">{card.value}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Order Status Breakdown */}
      {stats && (
        <Card>
          <CardHeader><CardTitle>Orders by Status</CardTitle></CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {Object.entries(stats.orders).filter(([k]) => k !== 'total').map(([status, count]) => (
                <div key={status} className="text-center p-4 rounded-xl border border-border">
                  <p className="text-3xl font-bold">{count}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {ORDER_STATUS_LABELS[status as OrderStatus] ?? status}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {stats.orders.total > 0 ? ((count / stats.orders.total) * 100).toFixed(0) : 0}%
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <SalesChart data={charts?.monthly_sales ?? []} loading={chartsLoading} />
        <OrderStatusChart data={charts?.order_status ?? []} loading={chartsLoading} />
      </div>
      <RevenueBarChart data={charts?.monthly_sales ?? []} loading={chartsLoading} />
    </div>
  )
}
