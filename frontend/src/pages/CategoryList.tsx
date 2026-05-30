import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { useCategories } from '@/hooks/useData'
import { api } from '@/api/client'
import { Plus, X } from 'lucide-react'

const defaultColors = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#64748b',
]

const defaultIcons = ['🍜', '🛒', '🏠', '🚗', '🏥', '🎓', '✈️', '🎮', '👕', '💼', '📱', '🎵', '🐱', '🎁', '💰']

export function CategoryList() {
  const queryClient = useQueryClient()
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
      toast.error('Nama kategori wajib diisi')
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
        toast.success('Kategori diperbarui')
      } else {
        await api.categories.create(payload)
        toast.success('Kategori ditambahkan')
      }

      queryClient.invalidateQueries({ queryKey: ['categories'] })
      resetForm()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan')
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
      toast.success('Kategori dihapus')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus')
    }
  }

  const CategoryRow = ({ cat, depth }: { cat: { id: string; name: string; icon: string; color: string; parent_id?: string | null }; depth: number }) => (
    <>
      <div
        className="flex items-center justify-between py-2 px-3 hover:bg-card-hover rounded-lg transition-colors"
        style={{ marginLeft: depth * 20 }}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: cat.color + '20' }}>
            {cat.icon}
          </div>
          <p className="text-sm font-medium truncate">{cat.name}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => handleEdit(cat.id)} className="text-xs text-primary">Edit</button>
          <button onClick={() => handleDelete(cat.id)} className="text-xs text-destructive">Hapus</button>
        </div>
      </div>
      {getChildren(cat.id).map((child) => (
        <CategoryRow key={child.id} cat={child} depth={depth + 1} />
      ))}
    </>
  )

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Kategori</h2>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-1 text-sm text-primary font-medium"
        >
          <Plus size={16} /> Tambah
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">{editId ? 'Edit Kategori' : 'Kategori Baru'}</h3>
              <button onClick={resetForm} className="p-1 hover:bg-card-hover rounded">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nama kategori"
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-white"
                required
              />

              <select
                value={form.parent_id}
                onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-white"
              >
                <option value="">Kategori utama</option>
                {rootCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>

              <div>
                <label className="text-xs text-muted mb-1 block">Ikon</label>
                <div className="flex flex-wrap gap-1.5">
                  {defaultIcons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setForm({ ...form, icon })}
                      className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-colors ${
                        form.icon === icon ? 'ring-2 ring-primary' : 'hover:bg-card-hover'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted mb-1 block">Warna</label>
                <div className="flex flex-wrap gap-1.5">
                  {defaultColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm({ ...form, color })}
                      className={`w-8 h-8 rounded-lg transition-colors ${
                        form.color === color ? 'ring-2 ring-black ring-offset-1' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
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

      {/* Category Tree */}
      <div className="space-y-0.5">
        {rootCategories.map((cat) => (
          <CategoryRow key={cat.id} cat={cat} depth={0} />
        ))}
        {categories?.length === 0 && (
          <p className="text-sm text-muted text-center py-8">Belum ada kategori.</p>
        )}
      </div>
    </div>
  )
}
