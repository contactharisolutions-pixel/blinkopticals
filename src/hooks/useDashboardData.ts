import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export interface DashboardStats {
  today_revenue: number
  today_orders: number
  period_revenue: number
  period_orders: number
  month_revenue: number
  month_orders: number
  pending_orders: number
  low_stock_alerts: number
  total_stock_units: number
  total_stock_value: number
}

export interface DashboardRichData {
  brands: any[]
  categories: any[]
  genders: any[]
  showrooms: any[]
  ecommerce_trend: { month: string; revenue: number }[]
  frequent_pos?: any[]
  frequent_ecom?: any[]
}

export const useDashboardStats = (period: string = 'Today', showroomId: string | null = null) => {
  return useQuery({
    queryKey: ['dashboard-stats', period, showroomId],
    queryFn: async () => {
      const srParam = showroomId ? `&showroom_id=${showroomId}` : ''
      const response = await api.get<{ success: boolean; data: DashboardStats }>(`/reports/dashboard?period=${period}${srParam}`)
      return response.data
    },
  })
}

export const useDashboardRich = (showroomId: string | null = null) => {
  return useQuery({
    queryKey: ['dashboard-rich', showroomId],
    queryFn: async () => {
      const srParam = showroomId ? `?showroom_id=${showroomId}` : ''
      const response = await api.get<{ success: boolean; data: DashboardRichData }>(`/reports/dashboard-rich${srParam}`)
      return response.data
    },
  })
}
