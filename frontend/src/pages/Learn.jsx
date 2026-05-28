import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAuthStore, useTeachStore } from '../store'
import api from '../utils/api'
import toast from 'react-hot-toast'
import {
  Send, BookOpen, ChevronDown, Lightbulb, HelpCircle,
  RefreshCw, Globe, BarChart2, Play, CheckCircle, Circle
} from 'lucide-react'

const ACTIONS = [
  { id: 'ask_doubt', label: 'Ask Doubt', icon: '🤔', color: '#f59e0b' },
  { id: 'explain_again', label: 'Explain Again', icon: '🔄', color: '#0e8de8' },
  { id: 'simplify', label: 'Simplify', icon: '✨', color: '#8b5cf6' },
  { id: 'example', label: 'Real Example', icon: '💡', color: '#10b981' },
  { id: 'diagram', label: 'Show Diagram', icon: '📊', color: '#ec4899' },
]

const PHASE_LABELS = {
  intro: { label: 'Introduction', color: '#0e8de8', bg: 'rgba(14,141,232,0.1)' },
  topic: { label: 'Teaching', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  example: { label: 'Examples', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  practice: { label: 'Practice', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  revision: { label: 'Revision', color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
  completed: { label: 'Completed', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
}

export default function Learn() {
  const { user } = useAuthStore()
  const { messages, isLoading, startSession, sendMessage, clearSession, phase, subtopics, currentSubtopicIndex, progress, suggestions, isSessionActive } = useTeachStore()
  
  const [showSetup, setShowSetup] = useState(!isSessionActive)
  const [classLevel, setClassLevel] = useState(user?.class_level || 6)
  const [subject, setSubject] = useState('')
  const [chapter, setChapter] = useState('')
  const [subjects, setSubjects] = useState([])
  const [chapters, setChapters] = useState([])
  const [input, setInput] = useState('')
  const [loadingChapters, setLoadingChapters] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    fetchSubjects()
  }, [classLevel])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchSubjects = async () => {
    try {
      const res = await api.get(`/resources/subjects?class_level=${classLevel}`)
      setSubjects(res.data.subjects || [])
      setSubject('')
      setChapter('')
    } catch {}
  }

  const fetchChapters = async (subj) => {
    setLoadingChapters(true)
    try {
      const res = await api.get(`/resources/chapters?class_level=${classLevel}&subject=${subj}`)
      setChapters(res.data.chapters || [])
    } catch {
      setChapters([])
    } finally {
      setLoadingChapters(false)
    }
  }

  const handleStart = async () => {
    if (!subject || !chapter) { toast.error('Please select a subject and chapter'); return }
    const result = await startSession(classLevel, subject, chapter)
    if (result.success) {
      setShowSetup(false)
      toast.success(`Starting: ${chapter} 🚀`)
    } else {
      toast.error(result.error || 'Failed to start. Check your API key.')
    }
  }

  const handleSend = async (msg = null) => {
    const text = msg || input.trim()
    if (!text || isLoading) return
    setInput('')
    await sendMessage(text)
    inputRef.current?.focus()
  }

  const handleAction = async (actionId) => {
    await sendMessage(`[${actionId}]`, actionId)
  }

  const phaseInfo = PHASE_LABELS[phase] || PHASE_LABELS.intro

  if (showSetup) {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
            Start Learning 🚀
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Choose what you want to study today
          </p>

          <div className="glass rounded-2xl p-6 space-y-5">
            {/* Class selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>
                Class
              </label>
              <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: 12 }, (_, i) => i + 1).map(cls => (
                  <motion.button
                    key={cls}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setClassLevel(cls)}
                    className="py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: classLevel === cls ? 'linear-gradient(135deg, #0e8de8, #8b5cf6)' : 'rgba(14,141,232,0.07)',
                      color: classLevel === cls ? 'white' : 'var(--text-secondary)',
                      border: classLevel === cls ? 'none' : '1px solid var(--border)'
                    }}
                  >
                    {cls}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>
                Subject
              </label>
              <div className="grid grid-cols-2 gap-2">
                {subjects.map(s => (
                  <motion.button
                    key={s}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setSubject(s); fetchChapters(s) }}
                    className="px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all"
                    style={{
                      background: subject === s ? 'rgba(14,141,232,0.12)' : 'rgba(14,141,232,0.04)',
                      color: subject === s ? '#0e8de8' : 'var(--text-secondary)',
                      border: subject === s ? '1px solid rgba(14,141,232,0.3)' : '1px solid var(--border)'
                    }}
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Chapter */}
            {subject && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Chapter
                </label>
                {loadingChapters ? (
                  <div className="flex items-center gap-2 py-3" style={{ color: 'var(--text-secondary)' }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                    <span className="text-sm">Loading chapters...</span>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {chapters.map((c, i) => (
                      <motion.button
                        key={i}
                        whileHover={{ x: 4 }}
                        onClick={() => setChapter(c)}
                        className="w-full px-3 py-2.5 rounded-xl text-sm text-left transition-all"
                        style={{
                          background: chapter === c ? 'rgba(14,141,232,0.12)' : 'transparent',
                          color: chapter === c ? '#0e8de8' : 'var(--text-secondary)',
                          border: chapter === c ? '1px solid rgba(14,141,232,0.3)' : '1px solid transparent'
                        }}
                      >
                        {c}
                      </motion.button>
                    ))}
                    {/* Manual chapter input */}
                    <input
                      placeholder="Or type chapter name..."
                      value={chapter.startsWith('Chapter') ? '' : chapter}
                      onChange={e => setChapter(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none mt-1"
                      style={{ background: 'rgba(14,141,232,0.05)', border: '1px dashed var(--border)', color: 'var(--text-primary)' }}
                    />
                  </div>
                )}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStart}
              disabled={isLoading || !subject || !chapter}
              className="w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #0e8de8, #8b5cf6)',
                boxShadow: '0 4px 20px rgba(14,141,232,0.3)',
                opacity: (!subject || !chapter) ? 0.5 : 1,
                fontFamily: 'Space Grotesk'
              }}
            >
              {isLoading ? (
                <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Starting...</>
              ) : (
                <><Play size={16} /> Start Learning</>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-5rem)]">
      {/* Subtopics sidebar */}
      <div className="hidden lg:flex flex-col w-56 glass rounded-2xl p-4 overflow-y-auto">
        <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-secondary)' }}>
          Chapter Topics
        </h3>
        <div className="space-y-1">
          {subtopics.map((topic, i) => {
            const done = i < currentSubtopicIndex
            const active = i === currentSubtopicIndex
            return (
              <div
                key={i}
                className="flex items-start gap-2 px-2 py-2 rounded-lg text-xs transition-all"
                style={{
                  background: active ? 'rgba(14,141,232,0.1)' : 'transparent',
                  color: done ? 'var(--text-secondary)' : active ? '#0e8de8' : 'var(--text-secondary)'
                }}
              >
                {done ? <CheckCircle size={12} className="mt-0.5 flex-shrink-0 text-green-500" /> : active ? <motion.div animate={{ scale: [1,1.2,1] }} transition={{ repeat: Infinity, duration: 1 }}><Circle size={12} className="mt-0.5 flex-shrink-0" style={{ color: '#0e8de8' }} /></motion.div> : <Circle size={12} className="mt-0.5 flex-shrink-0 opacity-30" />}
                <span className="leading-tight">{topic}</span>
              </div>
            )
          })}
        </div>

        {/* Progress */}
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
            <span>Progress</span><span>{Math.round(progress)}%</span>
          </div>
          <div className="progress-bar"><motion.div className="progress-fill" animate={{ width: `${progress}%` }} /></div>
        </div>

        <button
          onClick={() => { clearSession(); setShowSetup(true) }}
          className="mt-4 text-xs text-center py-2 rounded-lg transition-all"
          style={{ color: 'var(--text-secondary)', background: 'rgba(14,141,232,0.05)' }}
        >
          Change Topic
        </button>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col glass rounded-2xl overflow-hidden">
        {/* Chat header */}
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <BookOpen size={16} style={{ color: '#0e8de8' }} />
            <div>
              <p className="text-sm font-semibold" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
                {useTeachStore.getState().chapter}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {useTeachStore.getState().subject} • Class {useTeachStore.getState().classLevel}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="phase-badge" style={{ background: phaseInfo.bg, color: phaseInfo.color }}>
              {phaseInfo.label}
            </span>
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs text-white mr-2 flex-shrink-0 mt-1">B</div>
                )}
                <div className={`max-w-[78%] px-4 py-3 text-sm ${msg.role === 'user' ? 'chat-user' : 'chat-ai'}`}>
                  {msg.role === 'assistant' ? (
                    <div className="markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <span>{msg.content}</span>
                  )}
                  {msg.phase && msg.role === 'assistant' && (
                    <div className="mt-2 pt-2 flex" style={{ borderTop: '1px solid var(--border)' }}>
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {PHASE_LABELS[msg.phase]?.label || msg.phase}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs text-white flex-shrink-0">B</div>
                <div className="chat-ai px-4 py-3">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-500"
                        animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Quick suggestions */}
        {suggestions.length > 0 && !isLoading && (
          <div className="px-5 pb-2 flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSend(s)}
                className="text-xs px-3 py-1.5 rounded-full transition-all"
                style={{ background: 'rgba(14,141,232,0.08)', color: '#0e8de8', border: '1px solid rgba(14,141,232,0.2)' }}
              >
                {s}
              </motion.button>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="px-5 pb-2 flex gap-2 overflow-x-auto">
          {ACTIONS.map(action => (
            <motion.button
              key={action.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAction(action.id)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 transition-all"
              style={{
                background: `${action.color}12`,
                color: action.color,
                border: `1px solid ${action.color}25`,
                opacity: isLoading ? 0.5 : 1
              }}
            >
              <span>{action.icon}</span> {action.label}
            </motion.button>
          ))}
        </div>

        {/* Input area */}
        <div className="px-5 pb-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder="Type your message or question..."
                rows={1}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all"
                style={{
                  background: 'rgba(14,141,232,0.06)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  maxHeight: 120
                }}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="p-3 rounded-xl text-white flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #0e8de8, #8b5cf6)',
                opacity: isLoading || !input.trim() ? 0.5 : 1
              }}
            >
              <Send size={16} />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}
