import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Tags,
  BarChart3,
} from 'lucide-react'
import { Toaster } from '@/components/ui/sonner'
import { Dashboard } from '@/pages/Dashboard'
import { TransactionList } from '@/pages/TransactionList'
import { TransactionForm } from '@/pages/TransactionForm'
import { AccountList } from '@/pages/AccountList'
import { CategoryList } from '@/pages/CategoryList'
import { Reports } from '@/pages/Reports'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transaksi', icon: ArrowLeftRight },
  { to: '/accounts', label: 'Rekening', icon: Wallet },
  { to: '/categories', label: 'Kategori', icon: Tags },
  { to: '/reports', label: 'Laporan', icon: BarChart3 },
]

function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-svh pb-16 md:pb-0 md:flex-row">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-10 bg-white border-b border-border px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-primary">Golden Financier</h1>
        </header>

        {/* Desktop sidebar */}
        <nav className="hidden md:flex md:flex-col md:w-64 md:h-svh md:border-r md:border-border md:bg-white md:p-4 md:gap-2">
          <h1 className="text-xl font-bold text-primary px-3 py-4">Golden Financier</h1>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-muted hover:bg-card-hover'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
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
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-border">
          <div className="flex items-center justify-around py-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs font-medium ${
                    isActive ? 'text-primary' : 'text-muted'
                  }`
                }
              >
                <item.icon size={20} />
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
      <Toaster position="top-center" />
    </BrowserRouter>
  )
}

export default App
