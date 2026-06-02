import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Tags,
  BarChart3,
  Globe,
  LogOut,
} from 'lucide-react'
import { Toaster } from 'sonner'
import { useLanguage } from '@/i18n/context'
import { useAuth } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Dashboard } from '@/pages/Dashboard'
import { TransactionList } from '@/pages/TransactionList'
import { TransactionForm } from '@/pages/TransactionForm'
import { AccountList } from '@/pages/AccountList'
import { CategoryList } from '@/pages/CategoryList'
import { Reports } from '@/pages/Reports'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'

function LangSwitcher() {
  const { lang, setLang, t } = useLanguage()
  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'id' : 'en')}
      className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider hover:bg-soft-violet border-3 border-transparent transition-colors"
      title={t('common.language')}
    >
      <Globe size={14} />
      {lang === 'en' ? 'ID' : 'EN'}
    </button>
  )
}

const iconMap = {
  dashboard: LayoutDashboard,
  transactions: ArrowLeftRight,
  accounts: Wallet,
  categories: Tags,
  reports: BarChart3,
} as const

function App() {
  const { t } = useLanguage()
  const { user, logout } = useAuth()

  const navItems = [
    { key: 'dashboard' as const, to: '/' },
    { key: 'transactions' as const, to: '/transactions' },
    { key: 'accounts' as const, to: '/accounts' },
    { key: 'categories' as const, to: '/categories' },
    { key: 'reports' as const, to: '/reports' },
  ]

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <div className="flex flex-col min-h-svh pb-16 md:pb-0 md:flex-row">
              {/* Mobile top bar */}
              <header className="md:hidden sticky top-0 z-10 bg-cream border-b-4 border-black px-4 py-3 flex items-center justify-between">
                <h1 className="text-base font-bold uppercase tracking-tight">Golden Financier</h1>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase truncate max-w-24">{user?.email}</span>
                  <LangSwitcher />
                </div>
              </header>

              {/* Desktop sidebar */}
              <nav className="hidden md:flex md:flex-col md:w-64 md:h-svh md:border-r-4 md:border-r-black md:bg-cream md:p-4 md:gap-1">
                <div className="flex items-center justify-between px-3 py-5">
                  <h1 className="text-lg font-bold uppercase tracking-tight">Golden<br />Financier</h1>
                  <LangSwitcher />
                </div>
                {navItems.map((item) => {
                  const Icon = iconMap[item.key]
                  return (
                    <NavLink
                      key={item.key}
                      to={item.to}
                      end={item.to === '/'}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-3 text-sm font-bold uppercase tracking-wide transition-all duration-75 ${
                          isActive
                            ? 'bg-black text-cream border-3 border-black'
                            : 'text-black hover:bg-soft-violet border-3 border-transparent'
                        }`
                      }
                    >
                      <Icon size={18} />
                      {t(`nav.${item.key}`)}
                    </NavLink>
                  )
                })}
                <div className="mt-auto pt-4 border-t-4 border-black">
                  <div className="px-3 py-2 text-[10px] font-bold uppercase truncate">{user?.email}</div>
                  <button
                    onClick={logout}
                    className="flex items-center gap-3 w-full px-3 py-3 text-sm font-bold uppercase tracking-wide text-black hover:bg-soft-violet border-3 border-transparent transition-colors"
                  >
                    <LogOut size={18} />
                    {t('auth.logout')}
                  </button>
                </div>
              </nav>

              {/* Main content */}
              <main className="flex-1 overflow-auto">
                <div className="max-w-4xl mx-auto">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/transactions" element={<TransactionList />} />
                    <Route path="/transactions/new" element={<TransactionForm />} />
                    <Route path="/transactions/:id/edit" element={<TransactionForm />} />
                    <Route path="/accounts" element={<AccountList />} />
                    <Route path="/categories" element={<CategoryList />} />
                    <Route path="/reports" element={<Reports />} />
                  </Routes>
                </div>
              </main>

              {/* Mobile bottom nav */}
              <nav className="md:hidden fixed bottom-0 left-0 right-0 z-10 border-t-4 border-black bg-vivid-yellow">
                <div className="flex items-center justify-around py-1">
                  {navItems.map((item) => {
                    const Icon = iconMap[item.key]
                    return (
                      <NavLink
                        key={item.key}
                        to={item.to}
                        end={item.to === '/'}
                        className={({ isActive }) =>
                          `flex flex-col items-center gap-0.5 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                            isActive ? 'bg-hot-red text-white' : 'text-black'
                          }`
                        }
                      >
                        <Icon size={18} />
                        {t(`nav.${item.key}`)}
                      </NavLink>
                    )
                  })}
                  <button
                    onClick={logout}
                    className="flex flex-col items-center gap-0.5 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-black"
                  >
                    <LogOut size={18} />
                    {t('auth.logout')}
                  </button>
                </div>
              </nav>
            </div>
          </ProtectedRoute>
        } />
      </Routes>
      <Toaster position="top-center" />
    </BrowserRouter>
  )
}

export default App
