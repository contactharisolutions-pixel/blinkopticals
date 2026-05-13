import { useQuery } from '@tanstack/react-query'

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/catalog/categories', { credentials: 'include' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    }
  })
}
