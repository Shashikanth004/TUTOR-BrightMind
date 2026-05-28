import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts'
import { User, Edit2, Save, Trophy, Flame, Star, Clock, BookOpen, Brain } from 'lucide-react'

export default function Profile() {
  const { user, updateUser } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: user?.name || '', class_level: user?.class_level || 6, daily_goal_minutes: user?.daily_goal_minutes || 30 })
  const [progress, setProgress] = useState(null)
  const [activity, setActivity] = useState([])
  const [quizHistory, setQuizHistory] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [prog, act, quiz] = await Promise.all([
        api.get('/dashboard/progress'),
        api.get('/dashboard/activity?days=14'),
        api.get('/quiz/history?limit=10')
      ])
      setProgress(prog.data)
      setActivity(act.data)
      setQuizHistory(quiz.data)
    } catch {}
  }

  const handleSave = async () => {
    try {
      await api.put(`/auth/me/update?name=${encodeURIComponent(form.name)}&class_level=${form.class_level}&daily_goal_minutes=${form.daily_goal_minutes}`)
      updateUser(form)
      setEditing(false)
      toast.success('Profile updated! ✅')
    } catch { toast.error('Failed to update') }
  }

  const subjectData = progress ? Object.entries(progress.progress_by_subject || {}).map(([subj, data]) => ({
    subject: subj.slice(0, 8), completion: Math.round(data.avg_completion || 0)
  })) : []

  const activityData = activity.map(a => ({ date: a.date.slice(5), minutes: Math.round(a.minutes) }))

  const avatars = ['🎓', '🚀', '⭐', '🦁', '🐉', '🎯', '🌟', '🦅', '🏆', '🧠', '💎', '🔥']

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>My Profile</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Track your learning journey</p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass rounded-2xl p-6">
          <div className="text-center mb-5">
            <div className="text-6xl mb-3">{user?.avatar || '🎓'}</div>
            {!editing ? (
              <>
                <h2 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>{user?.name}</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
                <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: 'rgba(14,141,232,0.1)', color: '#0e8de8' }}>Class {user?.class_level}</span>
              </>
            ) : (
              <div className="space-y-3 text-left">
                <div>
                  <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Name</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm mt-1 outline-none"
                    style={{ background: 'rgba(14,141,232,0.06)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Class</label>
                  <select value={form.class_level} onChange={e => setForm(p => ({ ...p, class_level: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-lg text-sm mt-1 outline-none"
                    style={{ background: 'rgba(14,141,232,0.06)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Daily Goal (min)</label>
                  <input type="number" min={10} max={240} value={form.daily_goal_minutes}
                    onChange={e => setForm(p => ({ ...p, daily_goal_minutes: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-lg text-sm mt-1 outline-none"
                    style={{ background: 'rgba(14,141,232,0.06)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-secondary)' }}>Avatar</label>
                  <div className="grid grid-cols-6 gap-1">
                    {avatars.map(a => (
                      <button key={a} onClick={() => updateUser({ avatar: a })}
                        className="text-xl p-1 rounded-lg transition-all"
                        style={{ background: user?.avatar === a ? 'rgba(14,141,232,0.15)' : 'transparent' }}>{a}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <button onClick={() => editing ? handleSave() : setEditing(true)}
            className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: editing ? 'linear-gradient(135deg,#10b981,#0e8de8)' : 'rgba(14,141,232,0.08)', color: editing ? 'white' : '#0e8de8' }}>
            {editing ? <><Save size={14} /> Save</> : <><Edit2 size={14} /> Edit Profile</>}
          </button>

          {editing && (
            <button onClick={() => setEditing(false)} className="w-full mt-2 py-2 rounded-xl text-sm" style={{ color: 'var(--text-secondary)' }}>
              Cancel
            </button>
          )}

          {/* Stats */}
          <div className="mt-5 pt-5 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
            {[
              { icon: Flame, label: 'Day Streak', value: `${user?.streak_days || 0} days`, color: '#f97316' },
              { icon: Star, label: 'Total XP', value: user?.total_xp || 0, color: '#eab308' },
              { icon: BookOpen, label: 'Chapters', value: progress?.total_records || 0, color: '#0e8de8' },
              { icon: Brain, label: 'Quizzes', value: quizHistory.length, color: '#8b5cf6' },
            ].map(stat => (
              <div key={stat.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <stat.icon size={14} style={{ color: stat.color }} />
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{stat.label}</span>
                </div>
                <span className="text-sm font-semibold" style={{ color: stat.color }}>{stat.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Charts */}
        <div className="lg:col-span-2 space-y-5">
          {/* Activity chart */}
          {activityData.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-5">
              <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>Study Activity (Last 14 Days)</h3>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={activityData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="minutes" fill="url(#actGrad)" radius={[3, 3, 0, 0]} />
                  <defs>
                    <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0e8de8" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Subject progress */}
          {subjectData.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass rounded-2xl p-5">
              <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>Subject Progress</h3>
              <div className="space-y-3">
                {subjectData.slice(0, 6).map((s, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: 'var(--text-primary)' }}>{s.subject}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{s.completion}%</span>
                    </div>
                    <div className="progress-bar">
                      <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${s.completion}%` }} transition={{ delay: i * 0.1, duration: 0.8 }} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Quiz history */}
          {quizHistory.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
                <Trophy size={14} style={{ color: '#eab308' }} /> Recent Quiz Scores
              </h3>
              <div className="space-y-2">
                {quizHistory.slice(0, 6).map((q, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl"
                    style={{ background: q.score >= 70 ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)' }}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                      style={{ background: q.score >= 90 ? '#10b98120' : q.score >= 70 ? '#0e8de820' : '#ef444420', color: q.score >= 90 ? '#10b981' : q.score >= 70 ? '#0e8de8' : '#ef4444' }}>
                      {q.grade}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{q.chapter}</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{q.subject} • {q.quiz_type}</p>
                    </div>
                    <div className="text-sm font-bold" style={{ color: q.score >= 70 ? '#10b981' : '#ef4444' }}>
                      {Math.round(q.score)}%
                    </div>
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
