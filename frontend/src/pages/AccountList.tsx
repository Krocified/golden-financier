import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAccounts } from '@/hooks/useData'
import { useLanguage } from '@/i18n/context'
import { api, type Account } from '@/api/client'
import { formatIDR } from '@/lib/format'
import { Plus, Wallet, X } from 'lucide-react'

export function AccountList() {
  const queryClient = useQueryClient()
  const { t } = useLanguage()
  const { data: accounts } = useAccounts()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', type: 'checking', balance_cents: '' })
  const [loading, setLoading] = useState(false)

  const accountTypes = [
    { value: 'checking', label: t('accounts.types.checking') },
    { value: 'savings', label: t('accounts.types.savings') },
    { value: 'credit_card', label: t('accounts.types.credit_card') },
    { value: 'cash', label: t('accounts.types.cash') },
    { value: 'investment', label: t('accounts.types.investment') },
    { value: 'loan', label: t('accounts.types.loan') },
  ] as const

  const resetForm = () => {
    setForm({ name: '', type: 'checking', balance_cents: '' })
    setEditId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) {
      toast.error(t('accounts.name_required'))
      return
    }

    setLoading(true)
    try {
      const payload = {
        name: form.name,
        type: form.type as Account['type'],
        balance_cents: form.balance_cents ? Math.round(Number(form.balance_cents) * 100) : 0,
      }

      if (editId) {
        await api.accounts.update(editId, payload)
        toast.success(t('accounts.saved'))
      } else {
        await api.accounts.create(payload)
        toast.success(t('accounts.saved'))
      }

      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      resetForm()
    } catch (err) {
      toast.error(t('accounts.save_failed'))
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
        balance_cents: String(Math.abs(a.balance_cents) / 100),
      })
      setEditId(id)
      setShowForm(true)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.accounts.delete(id)
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toast.success(t('accounts.deleted'))
    } catch (err) {
      toast.error(t('accounts.delete_failed'))
    }
  }

  const totalBalance = accounts?.reduce((sum, a) => {
    return sum + (a.type === 'credit_card' || a.type === 'loan' ? -Math.abs(a.balance_cents) : a.balance_cents)
  }, 0) ?? 0

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold uppercase tracking-tight">{t('accounts.title')}</h2>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="brutal-btn brutal-btn-yellow text-xs px-3 py-2 flex items-center gap-1 font-bold uppercase tracking-wider"
        >
          <Plus size={14} /> {t('common.add')}
        </button>
      </div>

      <div className="brutal-card p-4 bg-soft-violet">
        <p className="text-xs font-bold uppercase tracking-wider text-black/60">{t('accounts.total_balance')}</p>
        <p className="text-2xl font-bold mt-1">{formatIDR(totalBalance)}</p>
      </div>

      {showForm && (
        <div className="brutal-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wide">{editId ? t('accounts.edit_account') : t('accounts.new_account')}</h3>
            <button onClick={resetForm} className="brutal-border-2 p-1 bg-white hover:bg-soft-violet transition-colors">
              <X size={14} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t('accounts.fields.name_placeholder')}
              className="brutal-input w-full px-3 py-2.5 text-sm font-bold"
              required
            />
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="brutal-select w-full px-3 py-2.5 text-sm font-bold"
            >
              {accountTypes.map((at) => (
                <option key={at.value} value={at.value}>{at.label}</option>
              ))}
            </select>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold">Rp</span>
              <input
                type="number"
                value={form.balance_cents}
                onChange={(e) => setForm({ ...form, balance_cents: e.target.value })}
                placeholder={t('accounts.fields.balance_placeholder')}
                className="brutal-input w-full pl-10 pr-3 py-2.5 text-sm font-bold"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="brutal-btn w-full py-2.5 text-sm font-bold uppercase tracking-wider"
            >
              {loading ? t('common.saving') : editId ? t('common.save') : t('common.add')}
            </button>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {accounts?.map((a, i) => (
          <div
            key={a.id}
            className="brutal-card p-3 flex items-center justify-between"
            style={{ transform: i % 2 === 0 ? 'rotate(-0.5deg)' : 'rotate(0.5deg)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-vivid-yellow border-2 border-black flex items-center justify-center">
                <Wallet size={18} />
              </div>
              <div>
                <p className="font-bold text-sm">{a.name}</p>
                <span className="text-[10px] font-bold uppercase tracking-wider text-black/50">
                  {accountTypes.find(at => at.value === a.type)?.label ?? a.type}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-sm">{formatIDR(a.balance_cents)}</p>
              <div className="flex flex-col gap-0.5 ml-2">
                <button onClick={() => handleEdit(a.id)} className="text-[10px] font-bold underline underline-offset-2 text-left">{t('common.edit')}</button>
                <button onClick={() => handleDelete(a.id)} className="text-[10px] font-bold underline underline-offset-2 text-left">{t('common.delete')}</button>
              </div>
            </div>
          </div>
        ))}
        {(!accounts || accounts.length === 0) && (
          <p className="text-sm font-bold text-center py-8 border-2 border-black p-4 bg-white">
            {t('accounts.no_accounts')}
          </p>
        )}
      </div>
    </div>
  )
}
