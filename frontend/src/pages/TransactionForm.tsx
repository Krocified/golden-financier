import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, type Transaction } from '@/api/client'
import { useAccounts, useCategories } from '@/hooks/useData'
import { useLanguage } from '@/i18n/context'
import { ArrowLeft } from 'lucide-react'

export function TransactionForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useLanguage()
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
        const tran = txns.find((tx: Transaction) => tx.id === id)
        if (tran) {
          setForm({
            account_id: tran.account_id,
            date: tran.date,
            amount_cents: String(Math.abs(tran.amount_cents) / 100),
            payee: tran.payee,
            category_id: tran.category_id ?? '',
            notes: tran.notes,
          })
        }
      })
    }
  }, [id, isEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.account_id || !form.payee || !form.amount_cents) {
      toast.error(t('transactions.required_fields'))
      return
    }

    const amount = Math.round(Number(form.amount_cents) * 100)
    if (isNaN(amount) || amount <= 0) {
      toast.error(t('transactions.amount_must_be_positive'))
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
        toast.success(t('transactions.updated'))
      } else {
        await api.transactions.create(payload)
        toast.success(t('transactions.saved'))
      }

      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['report'] })
      navigate('/transactions')
    } catch (err) {
      toast.error(t('transactions.save_failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="brutal-border-2 p-2 bg-white hover:bg-soft-violet transition-colors">
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-xl font-bold uppercase tracking-tight">
          {isEdit ? t('transactions.edit_transaction') : t('transactions.new_transaction')}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block">{t('transactions.fields.account')} *</label>
          <select
            value={form.account_id}
            onChange={(e) => setForm({ ...form, account_id: e.target.value })}
            className="brutal-select w-full px-3 py-2.5 text-sm font-bold"
            required
          >
            <option value="">{t('transactions.fields.select_account')}</option>
            {accounts?.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block">{t('transactions.fields.date')} *</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="brutal-input w-full px-3 py-2.5 text-sm font-bold"
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block">{t('transactions.fields.amount')} *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold">Rp</span>
              <input
                type="number"
                value={form.amount_cents}
                onChange={(e) => setForm({ ...form, amount_cents: e.target.value })}
                placeholder="0"
                className="brutal-input w-full pl-10 pr-3 py-2.5 text-sm font-bold"
                min="1"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block">{t('transactions.fields.payee')} *</label>
          <input
            type="text"
            value={form.payee}
            onChange={(e) => setForm({ ...form, payee: e.target.value })}
            placeholder={t('transactions.fields.payee_placeholder')}
            className="brutal-input w-full px-3 py-2.5 text-sm font-bold"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block">{t('transactions.fields.category')}</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="brutal-select w-full px-3 py-2.5 text-sm font-bold"
            >
              <option value="">{t('transactions.fields.no_category')}</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block">{t('transactions.fields.notes')}</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder={t('transactions.fields.notes_placeholder')}
              className="brutal-input w-full px-3 py-2.5 text-sm font-bold"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="brutal-btn w-full py-3 text-sm font-bold uppercase tracking-wider"
        >
          {loading ? t('common.saving') : isEdit ? t('common.save_changes') : t('common.save')}
        </button>
      </form>
    </div>
  )
}
