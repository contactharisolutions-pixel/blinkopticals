import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { User } from '@/types'

export interface StaffMember extends User {
  user_id: string
  showroom_name?: string
  mobile?: string
  last_login?: string
  active_status: boolean
  showroom_id?: string
}

export const useStaff = (businessId?: string) => {
  return useQuery({
    queryKey: ['staff', businessId],
    queryFn: async () => {
      const url = businessId ? `/staff?business_id=${businessId}` : '/staff'
      const response = await api.get<{ success: boolean; data: StaffMember[] }>(url)
      return response.data
    },
    enabled: true,
  })
}

export const useCreateStaff = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post<{ success: boolean; user_id: string }>('/staff', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
  })
}

export const useUpdateStaff = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const response = await api.put<{ success: boolean }>(`/staff/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
  })
}
export const useDeleteStaff = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<{ success: boolean }>(`/staff/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
  })
}
