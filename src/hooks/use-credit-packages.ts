import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"

export interface CreditPackage {
  id: string
  name: string
  description: string
  credits: number
  price: number | string
  currency: string
  isActive: boolean
  sortOrder: number
}

export function useCreditPackages() {
  return useQuery<CreditPackage[]>({
    queryKey: ['credit-packages'],
    queryFn: () => apiFetch<CreditPackage[]>('/billing/credit-packages'),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  })
}

