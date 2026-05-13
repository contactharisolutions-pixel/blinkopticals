import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings', {credentials: 'include'})
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    }
  })
}

export const useUpdateSetting = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ key, value }: { key: string, value: any }) => {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key, value })
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    }
  })
}
