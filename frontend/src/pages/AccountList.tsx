import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAccounts } from '@/hooks/useData'
import { api, type Account } from '@/api/client'
import { formatIDR } from '@/lib/format'
import { Wallet, Plus, X } from 'lucide-react'

const accountTypes = [
  { value: 'checking', label: 'Tabungan' },
  { value: 'savings', label: 'Deposito' },
  { value: 'credit_card', label: 'Kartu Kredit' },
  { value: 'cash', label: 'Tunai' },
  { value: 'investment', label: 'Investasi' },
  { value: 'loan', label: 'Pinjaman' },
] as const

export function AccountList() {
  const queryClient = useQueryClient()
  const { data: accounts } = useAccounts()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', type: 'checking', balance_cents: '' })
  const [loading, setLoading] = useState(false)

  const resetForm = () => {
    setForm({ name: '', type: 'checking', balance_cents: '' })
    setEditId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) {
      toast.error('Nama rekening wajib diisi')
      return
    }

    setLoading(true)
    try {
      const payload = {
        name: form.name,
        type: form.type as Account['type'],
        balance_cents: form.balance_cents ? Math.round(Number(form.balance_cents)) : 0,
      }

      if (editId) {
        await api.accounts.update(editId, payload)
        toast.success('Rekening diperbarui')
      } else {
        await api.accounts.create(payload)
        toast.success('Rekening ditambahkan')
      }

      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      resetForm()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (id: string) => {
    const a = accounts?.find((a) => a.id === id)
    if (a) {
      setForm({
        name: a.name,
        type: a.type,
        balance_cents: String(Math.abs(a.balance_cents)),
      })
      setEditId(id)
      setShowForm(true)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.accounts.delete(id)
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toast.success('Rekening diarsipkan')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus')
    }
  }

  const totalBalance = accounts?.reduce((sum, a) => {
    return sum + (a.type === 'credit_card' || a.type === 'loan' ? -Math.abs(a.balance_cents) : a.balance_cents)
  }, 0) ?? 0

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Rekening</h2>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-1 text-sm text-primary font-medium"
        >
          <Plus size={16} /> Tambah
        </button>
      </div>

      {/* Total */}
      <Card>
        <CardContent className="py-3">
          <p className="text-xs text-muted">Total Saldo</p>
          <p className="text-xl font-bold">{formatIDR(totalBalance)}</p>
        </CardContent>
      </Card>

      {/* Form */}
      {showForm && (
        <Card>
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">{editId ? 'Edit Rekening' : 'Rekening Baru'}</h3>
              <button onClick={resetForm} className="p-1 hover:bg-card-hover rounded">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nama rekening"
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-white"
                required
              />
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-white"
              >
                {accountTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">Rp</span>
                <input
                  type="number"
                  value={form.balance_cents}
                  onChange={(e) => setForm({ ...form, balance_cents: e.target.value })}
                  placeholder="Saldo awal"
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-border rounded-lg bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : editId ? 'Simpan' : 'Tambah'}
              </button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Account List */}
      <div className="space-y-2">
        {accounts?.map((a) => (
          <Card key={a.id} className="hover:bg-card-hover transition-colors">
            <CardContent className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet size={18} className="text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{a.name}</p>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {accountTypes.find(t => t.value === a.type)?.label ?? a.type}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className={`font-semibold text-sm ${a.balance_cents < 0 ? 'text-negative' : ''}`}>
                  {formatIDR(a.balance_cents)}
                </p>
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => handleEdit(a.id)}
                    className="text-[10px] text-primary text-left"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="text-[10px] text-destructive text-left"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {accounts?.length === 0 && (
          <p className="text-sm text-muted text-center py-8">
            Belum ada rekening. Tambahkan rekening pertama Anda.
          </p>
        )}
      </div>
    </div>
  )
}
