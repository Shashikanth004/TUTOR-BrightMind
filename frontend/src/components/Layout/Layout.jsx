import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore, useUIStore } from '../../store'
import {
  LayoutDashboard, BookOpen, Brain, Library, User,
  Moon, Sun, LogOut, Menu, X, Flame, Star, Zap
} from 'lucide-react'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/learn', icon: BookOpen, label: 'Learn' },
  { path: '/quiz', icon: Brain, label: 'Quiz' },
  { path: '/resources', icon: Library, label: 'Resources' },
  { path: '/profile', icon: User, label: 'Profile' },
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { darkMode, toggleDarkMode, sidebarOpen, setSidebar } = useUIStore()

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 bottom-0 w-64 z-50 flex flex-col glass"
            style={{ borderRight: '1px solid var(--border)' }}
          >
            {/* Logo */}
            <div className="p-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  B
                </div>
                <div>
                  <h1 className="font-bold text-base" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
                    BrightMind
                  </h1>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>AI Tutor</p>
                </div>
              </div>
            </div>

            {/* User Card */}
            {user && (
              <div className="mx-4 mb-4 p-3 rounded-xl" style={{ background: 'rgba(14,141,232,0.08)', border: '1px solid rgba(14,141,232,0.15)' }}>
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{user.avatar || '🎓'}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Class {user.class_level}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2 pt-2" style={{ borderTop: '1px solid rgba(14,141,232,0.1)' }}>
                  <span className="flex items-center gap-1 text-xs font-medium text-orange-500">
                    <Flame size={12} /> {user.streak_days || 0}d
                  </span>
                  <span className="flex items-center gap-1 text-xs font-medium text-yellow-500">
                    <Star size={12} /> {user.total_xp || 0} XP
                  </span>
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1">
              {navItems.map(item => {
                const active = location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path))
                return (
                  <motion.button
                    key={item.path}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(item.path)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                    style={{
                      background: active ? 'linear-gradient(135deg, rgba(14,141,232,0.15), rgba(139,92,246,0.1))' : 'transparent',
                      color: active ? '#0e8de8' : 'var(--text-secondary)',
                      border: active ? '1px solid rgba(14,141,232,0.2)' : '1px solid transparent',
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    <item.icon size={18} />
                    <span className="text-sm">{item.label}</span>
                    {active && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500"
                      />
                    )}
                  </motion.button>
                )
              })}
            </nav>

            {/* Bottom actions */}
            <div className="p-4 space-y-2">
              <button
                onClick={toggleDarkMode}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all btn-secondary text-sm"
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                {darkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
              <button
                onClick={() => { logout(); navigate('/login') }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all"
                style={{ color: '#ef4444', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Topbar */}
        <header className="sticky top-0 z-40 h-14 flex items-center px-4 gap-4 glass" style={{ borderBottom: '1px solid var(--border)' }}>
          <button
            onClick={() => setSidebar(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-blue-500/10 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: 'rgba(14,141,232,0.1)', color: '#0e8de8' }}
            >
              <Zap size={12} />
              {user?.total_xp || 0} XP
            </motion.div>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-base">
              {user?.avatar || '🎓'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
