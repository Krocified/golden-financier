import { useNavigate } from 'react-router-dom'
import { useAccounts, useTransactions, useMonthlyReport } from '@/hooks/useData'
import { formatIDR, formatDate, getCurrentMonth } from '@/lib/format'
import { useLanguage } from '@/i18n/context'
import { Plus, TrendingDown, TrendingUp, Wallet } from 'lucide-react'

export function Dashboard() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const month = getCurrentMonth()
  const { data: accounts } = useAccounts()
  const { data: transactions } = useTransactions({ month })
  const { data: report } = useMonthlyReport(month)

  const totalNetWorth = accounts?.reduce((sum, a) => sum + a.balance_cents, 0) ?? 0

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold uppercase tracking-tight">{t('dashboard.title')}</h2>
        <span className="brutal-badge">{month}</span>
      </div>

      <div className="brutal-card p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-black/60">{t('dashboard.net_worth')}</p>
        <p className="text-3xl font-bold mt-1">{formatIDR(totalNetWorth)}</p>
      </div>

      {report && (
        <div className="grid grid-cols-2 gap-3">
          <div className="brutal-card p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black/60 mb-1">
              <TrendingUp size={14} />
              {t('dashboard.income')}
            </div>
            <p className="text-xl font-bold text-hot-red">{formatIDR(report.summary.income_cents)}</p>
          </div>
          <div className="brutal-card p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black/60 mb-1">
              <TrendingDown size={14} />
              {t('dashboard.expenses')}
            </div>
            <p className="text-xl font-bold">{formatIDR(Math.abs(report.summary.expense_cents))}</p>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide mb-3">{t('dashboard.accounts')}</h3>
        <div className="space-y-3">
          {accounts?.map((a, i) => (
            <div
              key={a.id}
              onClick={() => navigate('/accounts')}
              className="brutal-card p-3 flex items-center justify-between cursor-pointer"
              style={{ transform: i % 2 === 0 ? 'rotate(-0.5deg)' : 'rotate(0.5deg)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-soft-violet border-2 border-black flex items-center justify-center">
                  <Wallet size={18} />
                </div>
                <div>
                  <p className="font-bold text-sm">{a.name}</p>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-black/50">
                    {a.type.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <p className="font-bold text-sm">{formatIDR(a.balance_cents)}</p>
            </div>
          ))}
          {(!accounts || accounts.length === 0) && (
            <p className="text-sm font-bold text-center py-6 border-2 border-black p-4 bg-white">
              {t('dashboard.no_accounts')}
            </p>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wide">{t('dashboard.recent_transactions')}</h3>
          <button
            onClick={() => navigate('/transactions')}
            className="text-xs font-bold underline underline-offset-2"
          >
            {t('common.view_all')}
          </button>
        </div>
        <div className="space-y-3">
          {transactions?.slice(0, 5).map((tran, i) => (
            <div
              key={tran.id}
              onClick={() => navigate(`/transactions/${tran.id}/edit`)}
              className="brutal-card p-3 flex items-center justify-between cursor-pointer"
              style={{ transform: i % 2 === 0 ? 'rotate(0.3deg)' : 'rotate(-0.3deg)' }}
            >
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm truncate">{tran.payee}</p>
                <p className="text-xs font-bold text-black/50">{formatDate(tran.date)}</p>
              </div>
              <p className="font-bold text-sm ml-3">
                {tran.amount_cents >= 0 ? '+' : ''}{formatIDR(tran.amount_cents)}
              </p>
            </div>
          ))}
          {(!transactions || transactions.length === 0) && (
            <p className="text-sm font-bold text-center py-6 border-2 border-black p-4 bg-white">
              {t('dashboard.no_transactions')}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={() => navigate('/transactions/new')}
        className="brutal-btn brutal-btn-yellow fixed bottom-20 right-4 md:bottom-6 z-20 w-14 h-14 flex items-center justify-center text-xl"
      >
        <Plus size={24} />
      </button>
    </div>
  )
}
