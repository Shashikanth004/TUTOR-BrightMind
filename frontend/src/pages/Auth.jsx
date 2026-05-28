import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../store'
import toast from 'react-hot-toast'

export default function Auth() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '', class_level: 6 })
  const { login, register, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    let result
    if (mode === 'login') {
      result = await login(form.email, form.password)
    } else {
      result = await register(form.name, form.email, form.password, form.class_level)
    }
    if (result.success) {
      toast.success(mode === 'login' ? 'Welcome back! 🎓' : 'Account created! Let\'s learn! 🚀')
      navigate('/')
    } else {
      toast.error(result.error)
    }
  }

  const subjects = ['Mathematics', 'Science', 'History', 'English', 'Geography']
  const floatingItems = [
    { emoji: '📚', x: 10, y: 15 }, { emoji: '🧮', x: 80, y: 20 },
    { emoji: '🔬', x: 15, y: 70 }, { emoji: '✏️', x: 85, y: 65 },
    { emoji: '🌍', x: 45, y: 85 }, { emoji: '🎯', x: 70, y: 10 },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}>
      
      {/* Animated background */}
      <div className="absolute inset-0 dot-grid opacity-40" />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(14,141,232,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(139,92,246,0.06) 0%, transparent 60%)' }} />
      
      {/* Floating emojis */}
      {floatingItems.map((item, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl select-none pointer-events-none"
          style={{ left: `${item.x}%`, top: `${item.y}%` }}
          animate={{ y: [0, -12, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
        >
          {item.emoji}
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Card */}
        <div className="glass rounded-3xl p-8" style={{ boxShadow: 'var(--shadow-lg)' }}>
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-5xl mb-3 inline-block"
            >
              🎓
            </motion.div>
            <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: 'Space Grotesk' }}>
              BrightMind AI Tutor
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              CBSE Classes 1-12 • All Subjects
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex rounded-xl p-1 mb-6" style={{ background: 'rgba(14,141,232,0.08)' }}>
            {['login', 'register'].map(tab => (
              <button
                key={tab}
                onClick={() => setMode(tab)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize"
                style={{
                  background: mode === tab ? 'linear-gradient(135deg, #0e8de8, #0259a1)' : 'transparent',
                  color: mode === tab ? 'white' : 'var(--text-secondary)',
                  boxShadow: mode === tab ? '0 2px 8px rgba(14,141,232,0.3)' : 'none'
                }}
              >
                {tab === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence>
              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    required={mode === 'register'}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: 'rgba(14,141,232,0.05)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                Email
              </label>
              <input
                type="email"
                placeholder="student@example.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ background: 'rgba(14,141,232,0.05)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ background: 'rgba(14,141,232,0.05)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>

            <AnimatePresence>
              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                    Class (1-12)
                  </label>
                  <select
                    value={form.class_level}
                    onChange={e => setForm(p => ({ ...p, class_level: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{ background: 'rgba(14,141,232,0.05)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(cls => (
                      <option key={cls} value={cls}>Class {cls}</option>
                    ))}
                  </select>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-semibold text-white relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #0e8de8, #8b5cf6)',
                boxShadow: '0 4px 20px rgba(14,141,232,0.3)',
                opacity: isLoading ? 0.7 : 1,
                fontFamily: 'Space Grotesk'
              }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  Loading...
                </span>
              ) : (
                mode === 'login' ? '🚀 Start Learning' : '✨ Create Account'
              )}
            </motion.button>
          </form>

          {/* Demo hint */}
          <p className="text-center text-xs mt-4" style={{ color: 'var(--text-secondary)' }}>
            Demo: use any email and 8+ char password
          </p>
        </div>
      </motion.div>
    </div>
  )
}
