import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/i18n/context'

export function Register() {
  const { user, register } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      setError(t('auth.password_too_short'))
      return
    }
    setError('')
    setLoading(true)
    try {
      await register(email, password, name)
      navigate('/', { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-svh p-4">
      <div className="w-full max-w-sm border-4 border-black p-6 bg-white">
        <h1 className="text-xl font-bold uppercase tracking-tight mb-1">Golden Financier</h1>
        <p className="text-xs font-bold uppercase tracking-wider mb-6 text-gray-600">{t('auth.register')}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block">{t('auth.name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="brutal-input w-full px-3 py-2.5 text-sm font-bold"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block">{t('auth.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="brutal-input w-full px-3 py-2.5 text-sm font-bold"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block">{t('auth.password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="brutal-input w-full px-3 py-2.5 text-sm font-bold"
              required
              minLength={8}
            />
            <p className="text-[10px] font-bold mt-1 text-gray-500">{t('auth.password_hint')}</p>
          </div>

          {error && (
            <p className="text-xs font-bold text-red-600 border-2 border-red-600 p-2 bg-red-50">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="brutal-btn w-full py-3 text-sm font-bold uppercase tracking-wider disabled:opacity-50"
          >
            {loading ? t('common.loading') : t('auth.register')}
          </button>
        </form>

        <p className="text-xs font-bold text-center mt-6">
          {t('auth.has_account')}{' '}
          <Link to="/login" className="underline hover:text-hot-red">{t('auth.login')}</Link>
        </p>
      </div>
    </div>
  )
}
