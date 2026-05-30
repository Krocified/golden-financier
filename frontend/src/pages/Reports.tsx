import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMonthlyReport } from '@/hooks/useData'
import { formatIDR, getCurrentMonth } from '@/lib/format'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

export function Reports() {
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
        <h2 className="text-lg font-semibold">Laporan</h2>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-3 py-1.5 text-sm border border-border rounded-lg bg-white"
        />
      </div>

      {/* Summary */}
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

      {/* Donut Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-medium">Pengeluaran per Kategori</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
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
                  >
                    {chartData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatIDR(Number(value))}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Breakdown List */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rincian Kategori</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {chartData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm truncate">
                    {item.icon} {item.name}
                  </span>
                </div>
                <span className="text-sm font-medium ml-3">{formatIDR(item.value)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {chartData.length === 0 && report && (
        <p className="text-sm text-muted text-center py-8">
          Tidak ada data pengeluaran untuk bulan ini.
        </p>
      )}

      {!report && (
        <p className="text-sm text-muted text-center py-8">
          Memuat data...
        </p>
      )}
    </div>
  )
}
