const TOKEN = import.meta.env.VITE_AUTH_TOKEN || ''

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `HTTP ${res.status}`)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  accounts: {
    list: () => request<Account[]>('/api/v1/accounts'),
    get: (id: string) => request<Account>(`/api/v1/accounts/${id}`),
    create: (data: Partial<Account>) =>
      request<Account>('/api/v1/accounts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Account>) =>
      request<Account>(`/api/v1/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/api/v1/accounts/${id}`, { method: 'DELETE' }),
  },
  categories: {
    list: () => request<Category[]>('/api/v1/categories'),
    create: (data: Partial<Category>) =>
      request<Category>('/api/v1/categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Category>) =>
      request<Category>(`/api/v1/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/api/v1/categories/${id}`, { method: 'DELETE' }),
  },
  transactions: {
    list: (params?: { account_id?: string; month?: string }) => {
      const qs = new URLSearchParams()
      if (params?.account_id) qs.set('account_id', params.account_id)
      if (params?.month) qs.set('month', params.month)
      const q = qs.toString()
      return request<Transaction[]>(`/api/v1/transactions${q ? `?${q}` : ''}`)
    },
    create: (data: Partial<Transaction>) =>
      request<Transaction>('/api/v1/transactions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Transaction>) =>
      request<Transaction>(`/api/v1/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/api/v1/transactions/${id}`, { method: 'DELETE' }),
  },
  reports: {
    monthly: (month: string) =>
      request<MonthlyReport>(`/api/v1/reports/monthly?month=${month}`),
    netWorth: () =>
      request<NetWorthPoint[]>('/api/v1/reports/net-worth'),
  },
}

export interface Account {
  id: string
  name: string
  type: 'checking' | 'savings' | 'credit_card' | 'cash' | 'investment' | 'loan'
  balance_cents: number
  currency: string
  created_at: string
  archived: boolean
}

export interface Category {
  id: string
  name: string
  parent_id?: string | null
  icon: string
  color: string
}

export interface Transaction {
  id: string
  account_id: string
  date: string
  amount_cents: number
  payee: string
  category_id?: string | null
  notes: string
  reconciled: boolean
  created_at: string
}

export interface MonthlyReport {
  summary: { income_cents: number; expense_cents: number }
  items: Array<{
    category_id: string
    category_name: string
    color: string
    icon: string
    total_cents: number
    count: number
  }>
}

export interface NetWorthPoint {
  date: string
  total_cents: number
}
