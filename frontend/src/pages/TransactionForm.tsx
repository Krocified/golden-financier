import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, type Transaction } from '@/api/client'
import { useAccounts, useCategories } from '@/hooks/useData'
import { useLanguage } from '@/i18n/context'
import { ArrowLeft, Plus, X } from 'lucide-react'

const defaultIcons = ['🍜', '🛒', '🏠', '🚗', '🏥', '🎓', '✈️', '🎮', '👕', '💼', '📱', '🎵', '🐱', '🎁', '💰']
const defaultColors = ['#6366f1', '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#a855f7']

export function TransactionForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useLanguage()
  const isEdit = !!id

  const { data: accounts } = useAccounts()
  const { data: categories, refetch: refetchCategories } = useCategories()

  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [form, setForm] = useState({
    account_id: '',
    date: '',
    amount_cents: '',
    payee: '',
    category_id: '',
    description: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)

  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [newCategory, setNewCategory] = useState({ name: '', icon: '📦', color: '#6366f1' })
  const [categoryLoading, setCategoryLoading] = useState(false)

  useEffect(() => {
    if (accounts && accounts.length === 0 && !isEdit) {
      toast.error(t('transactions.need_account_first'))
    }
  }, [accounts, isEdit, t])

  useEffect(() => {
    if (isEdit && id) {
      api.transactions.list().then((txns) => {
        const tran = txns.find((tx: Transaction) => tx.id === id)
        if (tran) {
          setType(tran.amount_cents >= 0 ? 'income' : 'expense')
          setForm({
            account_id: tran.account_id,
            date: tran.date,
            amount_cents: String(Math.abs(tran.amount_cents) / 100),
            payee: tran.payee,
            category_id: tran.category_id ?? '',
            description: tran.description ?? '',
            notes: tran.notes,
          })
        }
      })
    }
  }, [id, isEdit])

  const noAccounts = accounts && accounts.length === 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (noAccounts) {
      toast.error(t('transactions.need_account_first'))
      return
    }

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
        amount_cents: type === 'expense' ? -amount : amount,
        payee: form.payee,
        category_id: form.category_id || null,
        description: form.description,
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

  const handleAddCategory = async () => {
    if (!newCategory.name) {
      toast.error(t('categories.name_required'))
      return
    }
    setCategoryLoading(true)
    try {
      await api.categories.create({
        name: newCategory.name,
        icon: newCategory.icon,
        color: newCategory.color,
      })
      await refetchCategories()
      setShowCategoryForm(false)
      setNewCategory({ name: '', icon: '📦', color: '#6366f1' })
      toast.success(t('categories.saved'))
    } catch {
      toast.error(t('categories.save_failed'))
    } finally {
      setCategoryLoading(false)
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

        <div>
          <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block">{t('transactions.fields.type')}</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2.5 text-sm font-bold uppercase tracking-wider border-3 transition-colors ${
                type === 'expense'
                  ? 'bg-hot-red text-white border-hot-red'
                  : 'bg-white text-black border-black hover:bg-soft-violet'
              }`}
            >
              {t('transactions.expense')}
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2.5 text-sm font-bold uppercase tracking-wider border-3 transition-colors ${
                type === 'income'
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-black border-black hover:bg-soft-violet'
              }`}
            >
              {t('transactions.income')}
            </button>
          </div>
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

        <div>
          <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block">{t('transactions.fields.description')}</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder={t('transactions.fields.description_placeholder')}
            className="brutal-input w-full px-3 py-2.5 text-sm font-bold"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block">{t('transactions.fields.category')}</label>
            <div className="flex gap-2">
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="brutal-select flex-1 px-3 py-2.5 text-sm font-bold"
              >
                <option value="">{t('transactions.fields.no_category')}</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowCategoryForm(!showCategoryForm)}
                className="brutal-btn px-3 py-2.5 text-sm font-bold"
                title={t('categories.new_category')}
              >
                <Plus size={16} />
              </button>
            </div>
            {showCategoryForm && (
              <div className="mt-2 border-2 border-black p-3 bg-soft-violet space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    placeholder={t('categories.fields.name_placeholder')}
                    className="brutal-input flex-1 px-3 py-2 text-xs font-bold"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowCategoryForm(false)}
                    className="p-2 hover:bg-white border-2 border-black transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="flex gap-1">
                    {defaultIcons.slice(0, 8).map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setNewCategory({ ...newCategory, icon })}
                        className={`p-1 text-lg border-2 ${
                          newCategory.icon === icon ? 'border-black bg-white' : 'border-transparent'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1">
                  {defaultColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCategory({ ...newCategory, color })}
                      className={`w-6 h-6 border-2 ${
                        newCategory.color === color ? 'border-black' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={categoryLoading}
                  className="brutal-btn w-full py-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                >
                  {categoryLoading ? t('common.saving') : t('common.add')}
                </button>
              </div>
            )}
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

        {noAccounts && (
          <p className="text-xs font-bold text-center text-red-600 border-2 border-red-600 p-3 bg-red-50">
            {t('transactions.need_account_first')}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || noAccounts}
          className="brutal-btn w-full py-3 text-sm font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t('common.saving') : isEdit ? t('common.save_changes') : t('common.save')}
        </button>
      </form>
    </div>
  )
}
