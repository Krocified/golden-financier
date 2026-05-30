import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, type Transaction } from '@/api/client'
import { useAccounts, useCategories } from '@/hooks/useData'
import { ArrowLeft } from 'lucide-react'


export function TransactionForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const { data: accounts } = useAccounts()
  const { data: categories } = useCategories()

  const [form, setForm] = useState({
    account_id: '',
    date: '',
    amount_cents: '',
    payee: '',
    category_id: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isEdit && id) {
      api.transactions.list().then((txns) => {
        const t = txns.find((tx: Transaction) => tx.id === id)
        if (t) {
          setForm({
            account_id: t.account_id,
            date: t.date,
            amount_cents: String(Math.abs(t.amount_cents)),
            payee: t.payee,
            category_id: t.category_id ?? '',
            notes: t.notes,
          })
        }
      })
    }
  }, [id, isEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.account_id || !form.payee || !form.amount_cents) {
      toast.error('Lengkapi semua field wajib')
      return
    }

    const amount = Math.round(Number(form.amount_cents))
    if (isNaN(amount) || amount <= 0) {
      toast.error('Jumlah harus angka positif')
      return
    }

    setLoading(true)
    try {
      const payload = {
        account_id: form.account_id,
        date: form.date,
        amount_cents: -amount,
        payee: form.payee,
        category_id: form.category_id || null,
        notes: form.notes,
      }

      if (isEdit && id) {
        await api.transactions.update(id, payload)
        toast.success('Transaksi diperbarui')
      } else {
        await api.transactions.create(payload)
        toast.success('Transaksi ditambahkan')
      }

      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['report'] })
      navigate('/transactions')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-card-hover rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-semibold">
          {isEdit ? 'Edit Transaksi' : 'Transaksi Baru'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Account */}
        <div>
          <label className="text-sm font-medium mb-1 block">Rekening *</label>
          <select
            value={form.account_id}
            onChange={(e) => setForm({ ...form, account_id: e.target.value })}
            className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-white"
            required
          >
            <option value="">Pilih rekening</option>
            {accounts?.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="text-sm font-medium mb-1 block">Tanggal *</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-white"
            required
          />
        </div>

        {/* Amount */}
        <div>
          <label className="text-sm font-medium mb-1 block">Jumlah (IDR) *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">Rp</span>
            <input
              type="number"
              value={form.amount_cents}
              onChange={(e) => setForm({ ...form, amount_cents: e.target.value })}
              placeholder="0"
              className="w-full pl-10 pr-3 py-2.5 text-sm border border-border rounded-lg bg-white"
              min="1"
              required
            />
          </div>
          <p className="text-[11px] text-muted mt-1">Nilai positif. Akan otomatis dicatat sebagai pengeluaran.</p>
        </div>

        {/* Payee */}
        <div>
          <label className="text-sm font-medium mb-1 block">Penerima *</label>
          <input
            type="text"
            value={form.payee}
            onChange={(e) => setForm({ ...form, payee: e.target.value })}
            placeholder="Nama merchant atau penerima"
            className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-white"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-sm font-medium mb-1 block">Kategori</label>
          <select
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-white"
          >
            <option value="">Tanpa kategori</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm font-medium mb-1 block">Catatan</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Catatan tambahan..."
            className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-white resize-none"
            rows={3}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Transaksi'}
        </button>
      </form>
    </div>
  )
}
