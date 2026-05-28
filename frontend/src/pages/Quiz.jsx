import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore, useQuizStore } from '../store'
import api from '../utils/api'
import toast from 'react-hot-toast'
import {
  Brain, Clock, CheckCircle, XCircle, ChevronRight,
  ChevronLeft, Trophy, RefreshCw, Play, Star, Zap
} from 'lucide-react'

const QUIZ_TYPES = [
  { id: 'practice', label: 'Practice', icon: '📝', desc: '10 questions • 15 min', color: '#0e8de8' },
  { id: 'final', label: 'Final Test', icon: '🏆', desc: '20 questions • 30 min', color: '#8b5cf6' },
  { id: 'revision', label: 'Quick Revision', icon: '⚡', desc: '5 questions • 10 min', color: '#10b981' },
]

export default function Quiz() {
  const { user } = useAuthStore()
  const { questions, answers, currentQuestion, result, isLoading, generateQuiz, setAnswer, nextQuestion, prevQuestion, submitQuiz, resetQuiz } = useQuizStore()

  const [setup, setSetup] = useState({ classLevel: user?.class_level || 6, subject: '', chapter: '', quizType: 'practice' })
  const [stage, setStage] = useState('setup') // setup, quiz, result
  const [subjects, setSubjects] = useState([])
  const [startTime, setStartTime] = useState(null)
  const [showExplanation, setShowExplanation] = useState(false)

  const fetchSubjects = async (cls) => {
    try {
      const res = await api.get(`/resources/subjects?class_level=${cls}`)
      setSubjects(res.data.subjects || [])
    } catch {}
  }

  const handleStart = async () => {
    if (!setup.subject || !setup.chapter) { toast.error('Please fill all fields'); return }
    const result = await generateQuiz(setup.classLevel, setup.subject, setup.chapter, setup.quizType)
    if (result.success) {
      setStage('quiz')
      setStartTime(Date.now())
      toast.success('Quiz generated! Good luck! 🍀')
    } else {
      toast.error(result.error || 'Failed to generate quiz')
    }
  }

  const handleSubmit = async () => {
    const timeTaken = Math.floor((Date.now() - startTime) / 1000)
    const res = await submitQuiz(timeTaken)
    if (res.success) {
      setStage('result')
    } else {
      toast.error('Failed to submit quiz')
    }
  }

  const handleReset = () => {
    resetQuiz()
    setStage('setup')
    setShowExplanation(false)
  }

  if (stage === 'setup') return <QuizSetup setup={setup} setSetup={setSetup} subjects={subjects} fetchSubjects={fetchSubjects} onStart={handleStart} isLoading={isLoading} />
  if (stage === 'quiz' && questions.length > 0) return (
    <QuizQuestion
      questions={questions} answers={answers} current={currentQuestion}
      onAnswer={setAnswer} onNext={nextQuestion} onPrev={prevQuestion}
      onSubmit={handleSubmit} isLoading={isLoading} showExplanation={showExplanation}
      setShowExplanation={setShowExplanation}
    />
  )
  if (stage === 'result' && result) return <QuizResult result={result} questions={questions} answers={answers} onRetry={handleReset} />

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-10 h-10 border-3 rounded-full" style={{ borderColor: '#0e8de8', borderTopColor: 'transparent', borderWidth: 3 }} />
    </div>
  )
}

function QuizSetup({ setup, setSetup, subjects, fetchSubjects, onStart, isLoading }) {
  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
          Quiz Time 🧠
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Test your knowledge with AI-generated questions</p>

        <div className="glass rounded-2xl p-6 space-y-5">
          {/* Quiz type */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-secondary)' }}>Quiz Type</label>
            <div className="grid grid-cols-3 gap-3">
              {QUIZ_TYPES.map(type => (
                <motion.button key={type.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setSetup(p => ({ ...p, quizType: type.id }))}
                  className="p-3 rounded-xl text-center transition-all"
                  style={{
                    background: setup.quizType === type.id ? `${type.color}15` : 'rgba(14,141,232,0.04)',
                    border: setup.quizType === type.id ? `2px solid ${type.color}50` : '1px solid var(--border)',
                  }}>
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="text-xs font-bold" style={{ color: setup.quizType === type.id ? type.color : 'var(--text-primary)' }}>{type.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{type.desc}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Class */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Class</label>
            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: 12 }, (_, i) => i + 1).map(cls => (
                <motion.button key={cls} whileTap={{ scale: 0.95 }}
                  onClick={() => { setSetup(p => ({ ...p, classLevel: cls, subject: '', chapter: '' })); fetchSubjects(cls) }}
                  className="py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: setup.classLevel === cls ? 'linear-gradient(135deg,#0e8de8,#8b5cf6)' : 'rgba(14,141,232,0.07)',
                    color: setup.classLevel === cls ? 'white' : 'var(--text-secondary)',
                    border: setup.classLevel === cls ? 'none' : '1px solid var(--border)'
                  }}>{cls}</motion.button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Subject</label>
            <div className="grid grid-cols-2 gap-2">
              {subjects.map(s => (
                <button key={s} onClick={() => setSetup(p => ({ ...p, subject: s }))}
                  className="px-3 py-2 rounded-lg text-sm text-left transition-all"
                  style={{
                    background: setup.subject === s ? 'rgba(14,141,232,0.12)' : 'rgba(14,141,232,0.04)',
                    color: setup.subject === s ? '#0e8de8' : 'var(--text-secondary)',
                    border: setup.subject === s ? '1px solid rgba(14,141,232,0.3)' : '1px solid var(--border)'
                  }}>{s}</button>
              ))}
            </div>
          </div>

          {/* Chapter input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Chapter / Topic</label>
            <input value={setup.chapter} onChange={e => setSetup(p => ({ ...p, chapter: e.target.value }))}
              placeholder="e.g. Fractions, Photosynthesis, French Revolution..."
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: 'rgba(14,141,232,0.05)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onStart}
            disabled={isLoading || !setup.subject || !setup.chapter}
            className="w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg,#0e8de8,#8b5cf6)', fontFamily: 'Space Grotesk', opacity: (!setup.subject || !setup.chapter) ? 0.5 : 1 }}>
            {isLoading ? <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Generating Quiz...</> : <><Play size={16} /> Generate Quiz</>}
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}

function QuizQuestion({ questions, answers, current, onAnswer, onNext, onPrev, onSubmit, isLoading, showExplanation, setShowExplanation }) {
  const q = questions[current]
  if (!q) return null
  const answered = answers[q.id]
  const progress = ((current + 1) / questions.length) * 100

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={current}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Question {current + 1} of {questions.length}</span>
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: 'rgba(14,141,232,0.1)', color: '#0e8de8' }}>{q.type}</span>
          </div>
          <span className="text-xs px-2 py-1 rounded-full capitalize" style={{
            background: q.difficulty === 'easy' ? 'rgba(16,185,129,0.1)' : q.difficulty === 'hard' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
            color: q.difficulty === 'easy' ? '#10b981' : q.difficulty === 'hard' ? '#ef4444' : '#f59e0b'
          }}>{q.difficulty}</span>
        </div>

        <div className="progress-bar mb-5"><motion.div className="progress-fill" animate={{ width: `${progress}%` }} /></div>

        <div className="glass rounded-2xl p-6 space-y-5">
          {/* Topic badge */}
          {q.topic && <div className="text-xs px-2 py-1 rounded-full inline-block" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>📌 {q.topic}</div>}

          {/* Question */}
          <p className="text-base font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>{q.question}</p>

          {/* MCQ options */}
          {q.type === 'mcq' && q.options && (
            <div className="space-y-2">
              {q.options.map((opt, i) => {
                const optLetter = opt.charAt(0)
                const isSelected = answered === optLetter || answered === opt
                return (
                  <motion.button key={i} whileHover={{ x: 4 }} whileTap={{ scale: 0.99 }}
                    onClick={() => onAnswer(q.id, optLetter)}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all"
                    style={{
                      background: isSelected ? 'rgba(14,141,232,0.12)' : 'rgba(14,141,232,0.04)',
                      border: isSelected ? '1.5px solid rgba(14,141,232,0.4)' : '1px solid var(--border)',
                      color: isSelected ? '#0e8de8' : 'var(--text-primary)',
                      fontWeight: isSelected ? 600 : 400
                    }}>
                    {opt}
                  </motion.button>
                )
              })}
            </div>
          )}

          {/* True/False */}
          {q.type === 'tf' && (
            <div className="flex gap-3">
              {['True', 'False'].map(opt => (
                <motion.button key={opt} whileTap={{ scale: 0.95 }}
                  onClick={() => onAnswer(q.id, opt.toLowerCase())}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all"
                  style={{
                    background: answers[q.id]?.toLowerCase() === opt.toLowerCase() ? (opt === 'True' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)') : 'rgba(14,141,232,0.05)',
                    border: answers[q.id]?.toLowerCase() === opt.toLowerCase() ? (opt === 'True' ? '1.5px solid #10b981' : '1.5px solid #ef4444') : '1px solid var(--border)',
                    color: answers[q.id]?.toLowerCase() === opt.toLowerCase() ? (opt === 'True' ? '#10b981' : '#ef4444') : 'var(--text-secondary)'
                  }}>{opt === 'True' ? '✅ True' : '❌ False'}</motion.button>
              ))}
            </div>
          )}

          {/* Fill in blank / Short answer */}
          {(q.type === 'fill' || q.type === 'short') && (
            <textarea value={answers[q.id] || ''}
              onChange={e => onAnswer(q.id, e.target.value)}
              placeholder={q.type === 'fill' ? 'Fill in the blank...' : 'Write your answer...'}
              rows={q.type === 'short' ? 3 : 2}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={{ background: 'rgba(14,141,232,0.05)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
          )}

          {/* Explanation toggle */}
          {answered && q.explanation && (
            <div>
              <button onClick={() => setShowExplanation(!showExplanation)}
                className="text-xs font-medium flex items-center gap-1"
                style={{ color: '#8b5cf6' }}>
                💡 {showExplanation ? 'Hide' : 'Show'} Explanation
              </button>
              <AnimatePresence>
                {showExplanation && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="mt-2 p-3 rounded-xl text-xs leading-relaxed"
                    style={{ background: 'rgba(139,92,246,0.08)', color: 'var(--text-secondary)', border: '1px solid rgba(139,92,246,0.2)' }}>
                    {q.explanation}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-4">
          <button onClick={onPrev} disabled={current === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-all btn-secondary"
            style={{ opacity: current === 0 ? 0.4 : 1 }}>
            <ChevronLeft size={14} /> Prev
          </button>

          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {Object.keys(answers).length}/{questions.length} answered
          </span>

          {current < questions.length - 1 ? (
            <button onClick={onNext}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg,#0e8de8,#8b5cf6)' }}>
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onSubmit} disabled={isLoading}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg,#10b981,#0e8de8)', fontFamily: 'Space Grotesk' }}>
              {isLoading ? 'Submitting...' : <><CheckCircle size={14} /> Submit Quiz</>}
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

function QuizResult({ result, questions, answers, onRetry }) {
  const pct = Math.round(result.percentage)
  const gradeColors = { 'A+': '#10b981', 'A': '#10b981', 'B+': '#0e8de8', 'B': '#0e8de8', 'C': '#f59e0b', 'D': '#ef4444' }
  const gradeColor = gradeColors[result.grade] || '#0e8de8'

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
        {/* Score card */}
        <div className="glass rounded-2xl p-8 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
            className="text-6xl mb-3">{pct >= 90 ? '🏆' : pct >= 70 ? '🌟' : pct >= 50 ? '📚' : '💪'}</motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="text-5xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk', color: gradeColor }}>
            {pct}%
          </motion.div>
          <div className="text-lg font-semibold mb-1" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
            Grade: {result.grade}
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {result.correct} out of {result.total} correct
          </p>
          {result.feedback && (
            <p className="text-sm mt-3 p-3 rounded-xl" style={{ background: 'rgba(14,141,232,0.06)', color: 'var(--text-secondary)' }}>
              {result.feedback}
            </p>
          )}
          <div className="flex items-center justify-center gap-2 mt-3">
            <Zap size={14} style={{ color: '#eab308' }} />
            <span className="text-sm font-semibold" style={{ color: '#eab308' }}>+{result.xp_earned} XP earned!</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Correct', value: result.correct, color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
            { label: 'Wrong', value: result.total - result.correct, color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
            { label: 'Score', value: `${pct}%`, color: gradeColor, bg: `${gradeColor}12` },
          ].map(stat => (
            <div key={stat.label} className="glass rounded-xl p-4 text-center" style={{ background: stat.bg }}>
              <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk', color: stat.color }}>{stat.value}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Weak/Strong areas */}
        {(result.weak_areas?.length > 0 || result.strong_areas?.length > 0) && (
          <div className="glass rounded-2xl p-5 space-y-3">
            {result.strong_areas?.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-2 text-green-500">✅ Strong Areas</p>
                <div className="flex flex-wrap gap-2">
                  {result.strong_areas.map((a, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>{a}</span>
                  ))}
                </div>
              </div>
            )}
            {result.weak_areas?.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-2 text-orange-500">⚠️ Needs Improvement</p>
                <div className="flex flex-wrap gap-2">
                  {result.weak_areas.map((a, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316' }}>{a}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Question review */}
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>Question Review</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {result.question_results?.map((qr, i) => {
              const q = questions.find(q => q.id === qr.question_id)
              return (
                <div key={i} className="p-3 rounded-xl" style={{ background: qr.correct ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${qr.correct ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}` }}>
                  <div className="flex items-start gap-2">
                    {qr.correct ? <CheckCircle size={14} className="text-green-500 flex-shrink-0 mt-0.5" /> : <XCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{q?.question?.slice(0, 80)}...</p>
                      {!qr.correct && (
                        <p className="text-xs mt-1" style={{ color: '#10b981' }}>✓ {qr.correct_answer}</p>
                      )}
                      {qr.explanation && <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{qr.explanation?.slice(0, 100)}</p>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onRetry}
          className="w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg,#0e8de8,#8b5cf6)', fontFamily: 'Space Grotesk' }}>
          <RefreshCw size={16} /> Try Another Quiz
        </motion.button>
      </motion.div>
    </div>
  )
}
