'use client'
import { useRouter } from 'next/navigation'
import {
  ShoppingBag, Clock, Play, CheckCircle, Truck,
  XCircle, CreditCard, TrendingUp, Calendar, Users
} from 'lucide-react'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { SalesChart, RevenueBarChart } from '@/components/dashboard/SalesChart'
import { OrderStatusChart } from '@/components/dashboard/OrderStatusChart'
import { useDashboardStats, useDashboardCharts, useDashboardRecent } from '@/hooks/useDashboard'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { OrderStatus } from '@/types/order'

export default function DashboardPage() {
  const router = useRouter()
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: charts, isLoading: chartsLoading } = useDashboardCharts()
  const { data: recent, isLoading: recentLoading } = useDashboardRecent()

  const goToOrders = (status?: string) => {
    const url = status ? `/orders?status=${status}` : '/orders'
    router.push(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Welcome to Hamsafar Boutique management panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Total Orders"
          value={stats?.orders.total ?? 0}
          icon={ShoppingBag}
          color="text-boutique-600"
          bgColor="bg-boutique-50 dark:bg-boutique-900/20"
          onClick={() => goToOrders()}
          loading={statsLoading}
        />
        <StatsCard
          title="Waiting"
          value={stats?.orders.waiting ?? 0}
          icon={Clock}
          color="text-yellow-600"
          bgColor="bg-yellow-50 dark:bg-yellow-900/20"
          onClick={() => goToOrders('waiting')}
          loading={statsLoading}
        />
        <StatsCard
          title="Running"
          value={stats?.orders.running ?? 0}
          icon={Play}
          color="text-blue-600"
          bgColor="bg-blue-50 dark:bg-blue-900/20"
          onClick={() => goToOrders('running')}
          loading={statsLoading}
        />
        <StatsCard
          title="Completed"
          value={stats?.orders.completed ?? 0}
          icon={CheckCircle}
          color="text-green-600"
          bgColor="bg-green-50 dark:bg-green-900/20"
          onClick={() => goToOrders('completed')}
          loading={statsLoading}
        />
        <StatsCard
          title="Delivered"
          value={stats?.orders.delivered ?? 0}
          icon={Truck}
          color="text-teal-600"
          bgColor="bg-teal-50 dark:bg-teal-900/20"
          onClick={() => goToOrders('delivered')}
          loading={statsLoading}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Cancelled"
          value={stats?.orders.cancelled ?? 0}
          icon={XCircle}
          color="text-red-600"
          bgColor="bg-red-50 dark:bg-red-900/20"
          onClick={() => goToOrders('cancelled')}
          loading={statsLoading}
        />
        <StatsCard
          title="Pending Payments"
          value={formatCurrency(stats?.pending_payments ?? 0)}
          icon={CreditCard}
          color="text-orange-600"
          bgColor="bg-orange-50 dark:bg-orange-900/20"
          onClick={() => router.push('/payments')}
          loading={statsLoading}
        />
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(stats?.total_revenue ?? 0)}
          icon={TrendingUp}
          color="text-emerald-600"
          bgColor="bg-emerald-50 dark:bg-emerald-900/20"
          onClick={() => router.push('/reports')}
          loading={statsLoading}
        />
        <StatsCard
          title="Monthly Revenue"
          value={formatCurrency(stats?.monthly_revenue ?? 0)}
          icon={Calendar}
          color="text-violet-600"
          bgColor="bg-violet-50 dark:bg-violet-900/20"
          onClick={() => router.push('/reports')}
          loading={statsLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesChart data={charts?.monthly_sales ?? []} loading={chartsLoading} />
        </div>
        <div>
          <OrderStatusChart data={charts?.order_status ?? []} loading={chartsLoading} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <RevenueBarChart data={charts?.monthly_sales ?? []} loading={chartsLoading} />

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {recentLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {recent?.recent_orders.slice(0, 8).map((order) => (
                  <button
                    key={order.id}
                    onClick={() => router.push(`/orders/${order.id}`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-accent transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-medium">{order.order_number}</p>
                      <p className="text-xs text-muted-foreground">{order.customer.full_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <OrderStatusBadge status={order.status as OrderStatus} />
                      <span className="text-xs text-muted-foreground">{formatDate(order.created_at)}</span>
                    </div>
                  </button>
                ))}
                {!recent?.recent_orders.length && (
                  <p className="text-sm text-muted-foreground text-center py-4">No orders yet</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
