import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTransactions, useAccounts } from '@/hooks/useData'
import { useLanguage } from '@/i18n/context'
import { formatIDR, formatDate, getCurrentMonth } from '@/lib/format'
import { Plus } from 'lucide-react'

export function TransactionList() {
  const navigate = useNavigate()
  const { t } = useLanguage()
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
      <h2 className="text-xl font-bold uppercase tracking-tight">{t('transactions.title')}</h2>

      <div className="grid grid-cols-2 gap-2">
        <input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="brutal-input px-3 py-2.5 text-sm font-bold"
        />
        <select
          value={filterAccount}
          onChange={(e) => setFilterAccount(e.target.value)}
          className="brutal-select px-3 py-2.5 text-sm font-bold"
        >
          <option value="">{t('transactions.all_accounts')}</option>
          {accounts?.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {transactions?.map((tran, i) => (
          <div
            key={tran.id}
            onClick={() => navigate(`/transactions/${tran.id}/edit`)}
            className="brutal-card p-3 flex items-center justify-between cursor-pointer"
            style={{ transform: i % 2 === 0 ? 'rotate(0.3deg)' : 'rotate(-0.3deg)' }}
          >
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm truncate">{tran.payee}</p>
              {tran.description && (
                <p className="text-xs text-black/60 truncate mt-0.5">{tran.description}</p>
              )}
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-bold text-black/50">{formatDate(tran.date)}</span>
                {tran.reconciled && (
                  <span className="brutal-badge text-[9px]">&#10003;</span>
                )}
              </div>
            </div>
            <div className="text-right ml-3">
              <p className="font-bold text-sm">{tran.amount_cents >= 0 ? '+' : ''}{formatIDR(tran.amount_cents)}</p>
              <span className="text-xs font-bold text-black/50">
                {accounts?.find(a => a.id === tran.account_id)?.name ?? ''}
              </span>
            </div>
          </div>
        ))}
        {(!transactions || transactions.length === 0) && (
          <p className="text-sm font-bold text-center py-8 border-2 border-black p-4 bg-white">
            {t('transactions.no_transactions')}
          </p>
        )}
      </div>

      <button
        onClick={() => navigate('/transactions/new')}
        className="brutal-btn brutal-btn-yellow fixed bottom-20 right-4 md:bottom-6 z-20 w-14 h-14 flex items-center justify-center"
      >
        <Plus size={24} />
      </button>
    </div>
  )
}
