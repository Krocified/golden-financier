import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAccounts, useTransactions, useMonthlyReport } from '@/hooks/useData'
import { formatIDR, formatDate, getCurrentMonth } from '@/lib/format'
import { Plus, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function Dashboard() {
  const navigate = useNavigate()
  const month = getCurrentMonth()
  const { data: accounts } = useAccounts()
  const { data: transactions } = useTransactions({ month })
  const { data: report } = useMonthlyReport(month)

  const totalNetWorth = accounts?.reduce((sum, a) => sum + a.balance_cents, 0) ?? 0

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Dashboard</h2>
        <span className="text-sm text-muted">{month}</span>
      </div>

      {/* Net Worth Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted font-normal">
            Total Kekayaan Bersih
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatIDR(totalNetWorth)}</p>
        </CardContent>
      </Card>

      {/* Month Summary Cards */}
      {report && (
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-muted mb-1">
                <TrendingUp size={16} className="text-positive" />
                Pemasukan
              </div>
              <p className="text-lg font-semibold text-positive">
                {formatIDR(report.summary.income_cents)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-muted mb-1">
                <TrendingDown size={16} className="text-negative" />
                Pengeluaran
              </div>
              <p className="text-lg font-semibold text-negative">
                {formatIDR(Math.abs(report.summary.expense_cents))}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Account List */}
      <div>
        <h3 className="text-sm font-semibold text-muted mb-2">Rekening</h3>
        <div className="space-y-2">
          {accounts?.map((a) => (
            <Card key={a.id} className="hover:bg-card-hover cursor-pointer transition-colors" onClick={() => navigate('/accounts')}>
              <CardContent className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Wallet size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{a.name}</p>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {a.type.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                <p className="font-semibold text-sm">{formatIDR(a.balance_cents)}</p>
              </CardContent>
            </Card>
          ))}
          {accounts?.length === 0 && (
            <p className="text-sm text-muted text-center py-4">
              Belum ada rekening. Tambahkan rekening pertama Anda.
            </p>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-muted">Transaksi Terbaru</h3>
          <button
            onClick={() => navigate('/transactions')}
            className="text-xs text-primary font-medium"
          >
            Lihat Semua
          </button>
        </div>
        <div className="space-y-1">
          {transactions?.slice(0, 5).map((t) => (
            <Card key={t.id} className="hover:bg-card-hover cursor-pointer transition-colors" onClick={() => navigate(`/transactions/${t.id}/edit`)}>
              <CardContent className="py-2.5 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{t.payee}</p>
                  <p className="text-[11px] text-muted">{formatDate(t.date)}</p>
                </div>
                <p className={`text-sm font-semibold ml-3 ${t.amount_cents >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {t.amount_cents >= 0 ? '+' : ''}{formatIDR(t.amount_cents)}
                </p>
              </CardContent>
            </Card>
          ))}
          {transactions?.length === 0 && (
            <p className="text-sm text-muted text-center py-4">
              Belum ada transaksi bulan ini.
            </p>
          )}
        </div>
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
