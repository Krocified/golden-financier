import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/i18n/context'

export function Login() {
  const { user, login } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
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
        <p className="text-xs font-bold uppercase tracking-wider mb-6 text-gray-600">{t('auth.login')}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block">{t('auth.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="brutal-input w-full px-3 py-2.5 text-sm font-bold"
              required
              autoFocus
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
            />
          </div>

          {error && (
            <p className="text-xs font-bold text-red-600 border-2 border-red-600 p-2 bg-red-50">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="brutal-btn w-full py-3 text-sm font-bold uppercase tracking-wider disabled:opacity-50"
          >
            {loading ? t('common.loading') : t('auth.login')}
          </button>
        </form>

        <p className="text-xs font-bold text-center mt-6">
          {t('auth.no_account')}{' '}
          <Link to="/register" className="underline hover:text-hot-red">{t('auth.register')}</Link>
        </p>
      </div>
    </div>
  )
}
