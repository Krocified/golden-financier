import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useCategories } from '@/hooks/useData'
import { useLanguage } from '@/i18n/context'
import { api } from '@/api/client'
import { Plus, X } from 'lucide-react'

const defaultColors = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#000000',
]

const defaultIcons = ['🍜', '🛒', '🏠', '🚗', '🏥', '🎓', '✈️', '🎮', '👕', '💼', '📱', '🎵', '🐱', '🎁', '💰']

export function CategoryList() {
  const queryClient = useQueryClient()
  const { t } = useLanguage()
  const { data: categories } = useCategories()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', parent_id: '', icon: '📦', color: '#6366f1' })
  const [loading, setLoading] = useState(false)

  const rootCategories = categories?.filter((c) => !c.parent_id) ?? []
  const getChildren = (parentId: string) => categories?.filter((c) => c.parent_id === parentId) ?? []

  const resetForm = () => {
    setForm({ name: '', parent_id: '', icon: '📦', color: '#6366f1' })
    setEditId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) {
      toast.error(t('categories.name_required'))
      return
    }

    setLoading(true)
    try {
      const payload = {
        name: form.name,
        parent_id: form.parent_id || null,
        icon: form.icon,
        color: form.color,
      }

      if (editId) {
        await api.categories.update(editId, payload)
        toast.success(t('categories.saved'))
      } else {
        await api.categories.create(payload)
        toast.success(t('categories.saved'))
      }

      queryClient.invalidateQueries({ queryKey: ['categories'] })
      resetForm()
    } catch (err) {
      toast.error(t('categories.save_failed'))
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (id: string) => {
    const c = categories?.find((c) => c.id === id)
    if (c) {
      setForm({
        name: c.name,
        parent_id: c.parent_id ?? '',
        icon: c.icon,
        color: c.color,
      })
      setEditId(id)
      setShowForm(true)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.categories.delete(id)
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success(t('categories.deleted'))
    } catch (err) {
      toast.error(t('categories.delete_failed'))
    }
  }

  const CategoryRow = ({ cat, depth, idx }: { cat: { id: string; name: string; icon: string; color: string; parent_id?: string | null }; depth: number; idx: number }) => (
    <>
      <div
        className="brutal-card p-2.5 flex items-center justify-between cursor-default"
        style={{ marginLeft: depth * 16, transform: idx % 2 === 0 ? 'rotate(0.2deg)' : 'rotate(-0.2deg)' }}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 border-2 border-black flex items-center justify-center text-sm" style={{ backgroundColor: cat.color + '30' }}>
            {cat.icon}
          </div>
          <p className="font-bold text-sm truncate">{cat.name}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => handleEdit(cat.id)} className="text-[10px] font-bold underline underline-offset-2">{t('common.edit')}</button>
          <button onClick={() => handleDelete(cat.id)} className="text-[10px] font-bold underline underline-offset-2">{t('common.delete')}</button>
        </div>
      </div>
      {getChildren(cat.id).map((child, ci) => (
        <CategoryRow key={child.id} cat={child} depth={depth + 1} idx={ci} />
      ))}
    </>
  )

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold uppercase tracking-tight">{t('categories.title')}</h2>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="brutal-btn brutal-btn-yellow text-xs px-3 py-2 flex items-center gap-1 font-bold uppercase tracking-wider"
        >
          <Plus size={14} /> {t('common.add')}
        </button>
      </div>

      {showForm && (
        <div className="brutal-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wide">{editId ? t('categories.edit_category') : t('categories.new_category')}</h3>
            <button onClick={resetForm} className="brutal-border-2 p-1 bg-white hover:bg-soft-violet transition-colors">
              <X size={14} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t('categories.fields.name_placeholder')}
              className="brutal-input w-full px-3 py-2.5 text-sm font-bold"
              required
            />
            <select
              value={form.parent_id}
              onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
              className="brutal-select w-full px-3 py-2.5 text-sm font-bold"
            >
              <option value="">{t('categories.fields.no_parent')}</option>
              {rootCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block">{t('categories.fields.icon')}</label>
              <div className="flex flex-wrap gap-1.5">
                {defaultIcons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setForm({ ...form, icon })}
                    className={`w-8 h-8 border-2 flex items-center justify-center text-sm transition-all ${
                      form.icon === icon ? 'border-black bg-vivid-yellow' : 'border-black/30 hover:border-black bg-white'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block">{t('categories.fields.color')}</label>
              <div className="flex flex-wrap gap-1.5">
                {defaultColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm({ ...form, color })}
                    className={`w-7 h-7 border-2 transition-all ${
                      form.color === color ? 'border-black scale-110' : 'border-black/30 hover:border-black'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
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
        {rootCategories.map((cat, i) => (
          <CategoryRow key={cat.id} cat={cat} depth={0} idx={i} />
        ))}
        {(!categories || categories.length === 0) && (
          <p className="text-sm font-bold text-center py-8 border-2 border-black p-4 bg-white">
            {t('categories.no_categories')}
          </p>
        )}
      </div>
    </div>
  )
}
