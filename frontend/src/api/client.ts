const BASE_URL = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_URL || '')

export const TOKEN_KEY = 'auth_token'
export const REFRESH_TOKEN_KEY = 'refresh_token'

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || ''
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) return false
    const data = await res.json()
    localStorage.setItem(TOKEN_KEY, data.access_token)
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token)
    return true
  } catch {
    return false
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })

  if (res.status === 401) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      const newToken = getToken()
      const retryRes = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${newToken}`,
          ...options?.headers,
        },
      })
      if (retryRes.status === 401) {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(REFRESH_TOKEN_KEY)
        window.location.href = '/login'
        throw new Error('unauthorized')
      }
      if (!retryRes.ok) {
        const body = await retryRes.json().catch(() => ({}))
        throw new Error(body.error || `HTTP ${retryRes.status}`)
      }
      if (retryRes.status === 204) return undefined as T
      return retryRes.json()
    }
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    window.location.href = '/login'
    throw new Error('unauthorized')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `HTTP ${res.status}`)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  auth: {
    register: (data: { email: string; password: string; name: string }) =>
      request<{ access_token: string; refresh_token: string; user: { id: string; email: string; name: string } }>(
        '/api/v1/auth/register', { method: 'POST', body: JSON.stringify(data) },
      ),
    login: (data: { email: string; password: string }) =>
      request<{ access_token: string; refresh_token: string; user: { id: string; email: string; name: string } }>(
        '/api/v1/auth/login', { method: 'POST', body: JSON.stringify(data) },
      ),
    me: () => request<{ id: string; email: string; name: string }>('/api/v1/me'),
  },
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
