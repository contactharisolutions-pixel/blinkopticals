import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export interface MediaItem {
  id: string
  file_name: string
  file_type: string
  file_url: string
  thumbnail_url: string
  size: number
}

export const useMedia = (businessId: string) => {
  return useQuery({
    queryKey: ['media', businessId],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: MediaItem[] }>(`/media?business_id=${businessId}`)
      return response.data
    },
    enabled: !!businessId,
  })
}
