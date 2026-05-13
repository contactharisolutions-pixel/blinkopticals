import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Business } from '@/types'

export const useBusinessMe = () => {
  return useQuery({
    queryKey: ['business-me'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: Business }>('/business/me')
      return response.data
    },
  })
}

export const useUpdateBusiness = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Business> & { business_id: string }) => {
      const { business_id, ...payload } = data
      const response = await api.put<{ success: boolean }>(`/business/${business_id}`, payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-me'] })
    },
  })
}
