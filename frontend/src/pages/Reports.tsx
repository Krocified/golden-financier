import { useState } from 'react'
import { useMonthlyReport } from '@/hooks/useData'
import { useLanguage } from '@/i18n/context'
import { formatIDR, getCurrentMonth } from '@/lib/format'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

export function Reports() {
  const { t } = useLanguage()
  const month = getCurrentMonth()
  const [selectedMonth, setSelectedMonth] = useState(month)
  const { data: report } = useMonthlyReport(selectedMonth)

  const chartData = report?.items
    ?.filter((i) => i.total_cents < 0)
    .map((i) => ({
      name: i.category_name,
      value: Math.abs(i.total_cents),
      color: i.color,
      icon: i.icon,
    }))
    .sort((a, b) => b.value - a.value) ?? []

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold uppercase tracking-tight">{t('reports.title')}</h2>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="brutal-input px-3 py-2 text-sm font-bold"
        />
      </div>

      {report && (
        <div className="grid grid-cols-2 gap-3">
          <div className="brutal-card p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black/60 mb-1">
              <TrendingUp size={14} />
              {t('reports.income')}
            </div>
            <p className="text-xl font-bold">{formatIDR(report.summary.income_cents)}</p>
          </div>
          <div className="brutal-card p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black/60 mb-1">
              <TrendingDown size={14} />
              {t('reports.expenses')}
            </div>
            <p className="text-xl font-bold">{formatIDR(Math.abs(report.summary.expense_cents))}</p>
          </div>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="brutal-card p-4">
          <h3 className="text-sm font-bold uppercase tracking-wide mb-3">{t('reports.spending_by_category')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="#000"
                  strokeWidth={2}
                >
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatIDR(Number(value))}
                  contentStyle={{ border: '2px solid #000', borderRadius: 0, background: '#FFFDF5' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="brutal-card p-4">
          <h3 className="text-sm font-bold uppercase tracking-wide mb-3">{t('reports.category_breakdown')}</h3>
          <div className="space-y-2">
            {chartData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-3 h-3 border border-black" style={{ backgroundColor: item.color }} />
                  <span className="text-sm font-bold truncate">{item.icon} {item.name}</span>
                </div>
                <span className="text-sm font-bold ml-3">{formatIDR(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {chartData.length === 0 && report && (
        <p className="text-sm font-bold text-center py-8 border-2 border-black p-4 bg-white">
          {t('reports.no_expenses')}
        </p>
      )}

      {!report && (
        <p className="text-sm font-bold text-center py-8 border-2 border-black p-4 bg-white">
          {t('reports.loading')}
        </p>
      )}
    </div>
  )
}
