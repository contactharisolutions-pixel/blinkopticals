import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Showroom } from '@/types'

export const useShowrooms = (businessId?: string) => {
  return useQuery({
    queryKey: ['showrooms', businessId],
    queryFn: async () => {
      const url = businessId ? `/showrooms?business_id=${businessId}` : '/showrooms'
      const response = await api.get<{ success: boolean; data: Showroom[] }>(url)
      return response.data
    },
    enabled: true,
  })
}

export const useCreateShowroom = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Showroom>) => {
      const response = await api.post<{ success: boolean; showroom_id: string }>('/showrooms', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['showrooms'] })
    },
  })
}

export const useUpdateShowroom = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Showroom> & { showroom_id: string }) => {
      const { showroom_id, ...payload } = data
      const response = await api.put<{ success: boolean }>(`/showrooms/${showroom_id}`, payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['showrooms'] })
    },
  })
}
