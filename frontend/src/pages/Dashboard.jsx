import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { RadialBarChart, RadialBar, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuthStore } from '../store'
import api from '../utils/api'
import {
  Flame, Star, BookOpen, Brain, Clock, TrendingUp,
  ChevronRight, AlertCircle, RefreshCw, Zap, Trophy
} from 'lucide-react'

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function StatCard({ icon: Icon, label, value, sub, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass rounded-2xl p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-xl" style={{ background: `${color}20` }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
        {value}
      </div>
      <div className="text-xs font-semibold mt-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</div>
      {sub && <div className="text-xs mt-1" style={{ color }}>{sub}</div>}
    </motion.div>
  )
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard/')
      setData(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const weeklyData = (data?.weekly_xp || Array(7).fill(0)).map((xp, i) => ({
    day: days[i], xp
  }))

  const goalPct = data ? Math.min((data.today_minutes / data.today_goal) * 100, 100) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full"
          style={{ borderWidth: 3 }}
        />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
          Good {getGreeting()}, {user?.name?.split(' ')[0]}! {user?.avatar || '🎓'}
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Class {user?.class_level} • Ready to learn today?
        </p>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Flame} label="Day Streak" value={`${data?.streak || 0}d`} sub="Keep it up! 🔥" color="#f97316" delay={0.05} />
        <StatCard icon={Star} label="Total XP" value={data?.user?.total_xp || 0} sub="XP earned" color="#eab308" delay={0.1} />
        <StatCard icon={Clock} label="Today" value={`${Math.round(data?.today_minutes || 0)}m`} sub={`Goal: ${data?.today_goal || 30}m`} color="#0e8de8" delay={0.15} />
        <StatCard icon={BookOpen} label="Chapters" value={data?.total_chapters_started || 0} sub="Started" color="#8b5cf6" delay={0.2} />
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Weekly activity chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 glass rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
              Weekly XP Activity
            </h2>
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(14,141,232,0.1)', color: '#0e8de8' }}>
              This Week
            </span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weeklyData}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 8, fontSize: 11, color: 'var(--text-primary)'
                }}
              />
              <Bar dataKey="xp" fill="url(#barGrad)" radius={[4, 4, 0, 0]} />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0e8de8" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Daily goal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass rounded-2xl p-5 flex flex-col items-center justify-center"
        >
          <h2 className="font-semibold text-sm mb-4" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
            Daily Goal
          </h2>
          <div className="relative w-32 h-32">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(14,141,232,0.1)" strokeWidth="2.5" />
              <motion.circle
                cx="18" cy="18" r="15" fill="none"
                stroke="url(#goalGrad)" strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={`${goalPct * 0.942} 94.2`}
                initial={{ strokeDasharray: '0 94.2' }}
                animate={{ strokeDasharray: `${goalPct * 0.942} 94.2` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
              <defs>
                <linearGradient id="goalGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0e8de8" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
                {Math.round(goalPct)}%
              </span>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {Math.round(data?.today_minutes || 0)}/{data?.today_goal || 30}m
              </span>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/learn')}
            className="mt-4 px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #0e8de8, #8b5cf6)', fontFamily: 'Space Grotesk' }}
          >
            Study Now →
          </motion.button>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Continue Learning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
              Continue Learning
            </h2>
            <button onClick={() => navigate('/learn')} className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1">
              New session <ChevronRight size={12} />
            </button>
          </div>

          {(data?.active_sessions?.length > 0 || data?.recent_subjects?.length > 0) ? (
            <div className="space-y-2">
              {(data?.active_sessions?.length > 0 ? data.active_sessions : data?.recent_subjects?.slice(0, 3) || []).map((item, i) => (
                <motion.div
                  key={i}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                  style={{ background: 'rgba(14,141,232,0.05)', border: '1px solid rgba(14,141,232,0.1)' }}
                  onClick={() => navigate('/learn')}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold ${getSubjectClass(item.subject)}`}>
                    {item.subject?.[0] || '📚'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {item.chapter || item.subject}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {item.subject} {item.completion !== undefined ? `• ${Math.round(item.completion)}%` : ''}
                    </p>
                  </div>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(14,141,232,0.1)' }}>
                    <ChevronRight size={12} style={{ color: '#0e8de8' }} />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BookOpen size={32} style={{ color: 'var(--text-secondary)', opacity: 0.4 }} className="mb-2" />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No sessions yet</p>
              <button onClick={() => navigate('/learn')} className="mt-3 text-sm text-blue-500 font-medium">
                Start your first session →
              </button>
            </div>
          )}
        </motion.div>

        {/* Achievements + Weak Areas */}
        <div className="space-y-4">
          {/* Achievements */}
          {data?.achievements?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="glass rounded-2xl p-5"
            >
              <h2 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
                <Trophy size={14} style={{ color: '#eab308' }} /> Achievements
              </h2>
              <div className="flex flex-wrap gap-2">
                {data.achievements.map((a, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)', color: '#ca8a04' }}
                  >
                    <span>{a.icon}</span> {a.title}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Weak areas */}
          {data?.weak_areas?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass rounded-2xl p-5"
            >
              <h2 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
                <AlertCircle size={14} style={{ color: '#f97316' }} /> Needs Revision
              </h2>
              <div className="space-y-2">
                {data.weak_areas.slice(0, 3).map((area, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.1)' }}>
                    <div>
                      <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{area.topic}</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{area.subject} • {area.chapter}</p>
                    </div>
                    <button onClick={() => navigate('/quiz')} className="p-1.5 rounded-lg text-orange-500 hover:bg-orange-500/10">
                      <RefreshCw size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Upcoming revisions */}
          {data?.upcoming_revisions?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="glass rounded-2xl p-4"
            >
              <h2 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
                <Zap size={14} style={{ color: '#8b5cf6' }} /> Due for Revision
              </h2>
              <div className="space-y-1.5">
                {data.upcoming_revisions.slice(0, 3).map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg" style={{ background: 'rgba(139,92,246,0.05)' }}>
                    <span style={{ color: 'var(--text-primary)' }}>{r.chapter}</span>
                    <span style={{ color: '#8b5cf6' }}>{r.days_since}d ago</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function getSubjectClass(subject = '') {
  const s = subject.toLowerCase()
  if (s.includes('math')) return 'subject-math'
  if (s.includes('science') || s.includes('physics') || s.includes('chemistry') || s.includes('biology')) return 'subject-science'
  if (s.includes('english')) return 'subject-english'
  if (s.includes('hindi')) return 'subject-hindi'
  if (s.includes('social') || s.includes('history') || s.includes('geo')) return 'subject-social'
  return 'subject-default'
}
