import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../store'
import api from '../utils/api'
import toast from 'react-hot-toast'
import {
  Search, BookOpen, Youtube, FileText, Globe,
  ExternalLink, X, Loader, Download, Sparkles
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function Resources() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState('search') // search, notes
  const [classLevel, setClassLevel] = useState(user?.class_level || 6)
  const [subject, setSubject] = useState('')
  const [chapter, setChapter] = useState('')
  const [loading, setLoading] = useState(false)
  const [resources, setResources] = useState(null)
  const [notes, setNotes] = useState(null)
  const [notesStyle, setNotesStyle] = useState('detailed')
  const [subjects, setSubjects] = useState([])

  const fetchSubjects = async (cls) => {
    try {
      const res = await api.get(`/resources/subjects?class_level=${cls}`)
      setSubjects(res.data.subjects || [])
    } catch {}
  }

  const handleSearch = async () => {
    if (!subject || !chapter) { toast.error('Please fill all fields'); return }
    setLoading(true)
    try {
      const res = await api.get(`/resources/search?class_level=${classLevel}&subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(chapter)}`)
      setResources(res.data.resources)
      toast.success(`Found ${res.data.total} resources!`)
    } catch (err) {
      toast.error('Search failed')
    } finally { setLoading(false) }
  }

  const handleNotes = async () => {
    if (!subject || !chapter) { toast.error('Please fill all fields'); return }
    setLoading(true)
    try {
      const res = await api.get(`/resources/notes?class_level=${classLevel}&subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(chapter)}&style=${notesStyle}`)
      setNotes(res.data)
      toast.success('Notes generated! 📝')
    } catch (err) {
      toast.error('Failed to generate notes')
    } finally { setLoading(false) }
  }

  const RESOURCE_ICONS = {
    youtube: { icon: <Youtube size={14} />, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    article: { icon: <Globe size={14} />, color: '#0e8de8', bg: 'rgba(14,141,232,0.1)' },
    pdf: { icon: <FileText size={14} />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    notes: { icon: <BookOpen size={14} />, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
          Resources & Notes 📚
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Search web resources or generate AI study notes</p>
      </motion.div>

      {/* Tab switcher */}
      <div className="flex gap-2 p-1 rounded-xl w-fit" style={{ background: 'rgba(14,141,232,0.08)' }}>
        {[{ id: 'search', label: '🔍 Web Search' }, { id: 'notes', label: '✨ AI Notes' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: tab === t.id ? 'linear-gradient(135deg,#0e8de8,#8b5cf6)' : 'transparent',
              color: tab === t.id ? 'white' : 'var(--text-secondary)'
            }}>{t.label}</button>
        ))}
      </div>

      {/* Search form */}
      <motion.div layout className="glass rounded-2xl p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {/* Class */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>Class</label>
            <select value={classLevel} onChange={e => { setClassLevel(parseInt(e.target.value)); fetchSubjects(parseInt(e.target.value)) }}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'rgba(14,141,232,0.06)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>Subject</label>
            <select value={subject} onChange={e => setSubject(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'rgba(14,141,232,0.06)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
              <option value="">Select subject</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Chapter */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>Chapter</label>
            <input value={chapter} onChange={e => setChapter(e.target.value)}
              placeholder="e.g. Photosynthesis"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'rgba(14,141,232,0.06)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
          </div>

          {/* Style (notes only) */}
          {tab === 'notes' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>Style</label>
              <select value={notesStyle} onChange={e => setNotesStyle(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'rgba(14,141,232,0.06)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                <option value="brief">Brief</option>
                <option value="detailed">Detailed</option>
                <option value="visual">Visual</option>
              </select>
            </div>
          )}
        </div>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={tab === 'search' ? handleSearch : handleNotes}
          disabled={loading || !subject || !chapter}
          className="px-6 py-2.5 rounded-xl font-semibold text-white flex items-center gap-2 text-sm"
          style={{ background: 'linear-gradient(135deg,#0e8de8,#8b5cf6)', opacity: (!subject || !chapter) ? 0.5 : 1, fontFamily: 'Space Grotesk' }}>
          {loading ? <><Loader size={14} className="animate-spin" /> Loading...</> : tab === 'search' ? <><Search size={14} /> Search Resources</> : <><Sparkles size={14} /> Generate Notes</>}
        </motion.button>
      </motion.div>

      {/* Search Results */}
      <AnimatePresence>
        {resources && tab === 'search' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {Object.entries(resources).map(([type, items]) => {
              if (!items?.length) return null
              const info = RESOURCE_ICONS[type] || RESOURCE_ICONS.article
              return (
                <div key={type}>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 capitalize" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>
                    <span style={{ color: info.color }}>{info.icon}</span> {type} ({items.length})
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {items.map((r, i) => (
                      <motion.a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                        whileHover={{ scale: 1.01, y: -2 }}
                        className="glass rounded-xl p-4 flex gap-3 transition-all cursor-pointer group"
                        style={{ textDecoration: 'none' }}>
                        {r.thumbnail ? (
                          <img src={r.thumbnail} alt="" className="w-16 h-12 rounded-lg object-cover flex-shrink-0" onError={e => e.target.style.display = 'none'} />
                        ) : (
                          <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: info.bg, color: info.color }}>
                            {info.icon}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight line-clamp-2" style={{ color: 'var(--text-primary)' }}>{r.title}</p>
                          <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{r.description}</p>
                          <div className="flex items-center gap-1 mt-1.5">
                            <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: info.bg, color: info.color }}>{r.source}</span>
                            <ExternalLink size={10} style={{ color: 'var(--text-secondary)' }} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </motion.a>
                    ))}
                  </div>
                </div>
              )
            })}
          </motion.div>
        )}

        {/* AI Notes */}
        {notes && tab === 'notes' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>{notes.title}</h2>
              <button onClick={() => {
                const blob = new Blob([notes.content], { type: 'text/markdown' })
                const a = document.createElement('a')
                a.href = URL.createObjectURL(blob)
                a.download = `${notes.title}.md`
                a.click()
              }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: 'rgba(14,141,232,0.1)', color: '#0e8de8' }}>
                <Download size={12} /> Download
              </button>
            </div>

            {/* Key points */}
            {notes.key_points?.length > 0 && (
              <div className="mb-4 p-4 rounded-xl" style={{ background: 'rgba(14,141,232,0.06)', border: '1px solid rgba(14,141,232,0.15)' }}>
                <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#0e8de8' }}>🎯 Key Points</h3>
                <ul className="space-y-1">
                  {notes.key_points.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <span className="text-blue-500 mt-0.5">•</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Formulas */}
            {notes.formulas?.length > 0 && (
              <div className="mb-4 p-4 rounded-xl" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
                <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#8b5cf6' }}>📐 Formulas</h3>
                {notes.formulas.map((f, i) => (
                  <code key={i} className="block text-sm font-mono mb-1 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>{f}</code>
                ))}
              </div>
            )}

            {/* Memory tricks */}
            {notes.memory_tricks?.length > 0 && (
              <div className="mb-4 p-4 rounded-xl" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#10b981' }}>🧠 Memory Tricks</h3>
                {notes.memory_tricks.map((t, i) => (
                  <p key={i} className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>💡 {t}</p>
                ))}
              </div>
            )}

            {/* Full content */}
            <div className="markdown-content text-sm leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{notes.content}</ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
