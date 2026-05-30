import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTransactions, useAccounts } from '@/hooks/useData'
import { formatIDR, formatDate, getCurrentMonth } from '@/lib/format'
import { Plus } from 'lucide-react'

export function TransactionList() {
  const navigate = useNavigate()
  const month = getCurrentMonth()
  const [filterMonth, setFilterMonth] = useState(month)
  const [filterAccount, setFilterAccount] = useState('')

  const { data: accounts } = useAccounts()
  const { data: transactions } = useTransactions({
    month: filterMonth,
    account_id: filterAccount || undefined,
  })

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Transaksi</h2>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-white"
        />
        <select
          value={filterAccount}
          onChange={(e) => setFilterAccount(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-white"
        >
          <option value="">Semua rekening</option>
          {accounts?.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {/* Transaction List */}
      <div className="space-y-1">
        {transactions?.map((t) => (
          <Card
            key={t.id}
            className="hover:bg-card-hover cursor-pointer transition-colors"
            onClick={() => navigate(`/transactions/${t.id}/edit`)}
          >
            <CardContent className="py-2.5 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{t.payee}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-muted">{formatDate(t.date)}</span>
                  {t.reconciled && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0">✓</Badge>
                  )}
                </div>
              </div>
              <div className="text-right ml-3">
                <p className={`text-sm font-semibold ${t.amount_cents >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {t.amount_cents >= 0 ? '+' : ''}{formatIDR(t.amount_cents)}
                </p>
                <span className="text-[11px] text-muted">
                  {accounts?.find(a => a.id === t.account_id)?.name ?? ''}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
        {transactions?.length === 0 && (
          <p className="text-sm text-muted text-center py-8">
            Tidak ada transaksi untuk periode ini.
          </p>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/transactions/new')}
        className="fixed bottom-20 right-4 md:bottom-6 z-20 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-dark transition-colors"
      >
        <Plus size={24} />
      </button>
    </div>
  )
}
