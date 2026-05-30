import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { getCurrentMonth } from '@/lib/format'

export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: api.accounts.list,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: api.categories.list,
  })
}

export function useTransactions(params?: { account_id?: string; month?: string }) {
  return useQuery({
    queryKey: ['transactions', params],
    queryFn: () => api.transactions.list(params),
  })
}

export function useMonthlyReport(month: string = getCurrentMonth()) {
  return useQuery({
    queryKey: ['report', 'monthly', month],
    queryFn: () => api.reports.monthly(month),
  })
}
