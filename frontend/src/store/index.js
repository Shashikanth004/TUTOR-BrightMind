import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../utils/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      
      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const res = await api.post('/auth/login', { email, password })
          const { access_token, user } = res.data
          set({ token: access_token, user, isLoading: false })
          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
          return { success: true }
        } catch (err) {
          set({ isLoading: false })
          return { success: false, error: err.response?.data?.detail || 'Login failed' }
        }
      },
      
      register: async (name, email, password, class_level) => {
        set({ isLoading: true })
        try {
          const res = await api.post('/auth/register', { name, email, password, class_level })
          const { access_token, user } = res.data
          set({ token: access_token, user, isLoading: false })
          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
          return { success: true }
        } catch (err) {
          set({ isLoading: false })
          return { success: false, error: err.response?.data?.detail || 'Registration failed' }
        }
      },
      
      logout: () => {
        set({ user: null, token: null })
        delete api.defaults.headers.common['Authorization']
      },
      
      updateUser: (updates) => set(state => ({ user: { ...state.user, ...updates } })),
      
      initAuth: () => {
        const { token } = get()
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        }
      }
    }),
    { name: 'auth-storage', partialize: (state) => ({ token: state.token, user: state.user }) }
  )
)

export const useTeachStore = create((set, get) => ({
  sessionId: null,
  subject: '',
  chapter: '',
  classLevel: null,
  subtopics: [],
  currentSubtopicIndex: 0,
  phase: 'intro',
  progress: 0,
  messages: [],
  isLoading: false,
  suggestions: [],
  isSessionActive: false,
  
  startSession: async (classLevel, subject, chapter) => {
    set({ isLoading: true, messages: [] })
    try {
      const res = await api.post('/teach/start', {
        class_level: classLevel,
        subject,
        chapter,
        user_id: useAuthStore.getState().user?.id
      })
      const { session_id, subtopics, teaching_response } = res.data
      
      set({
        sessionId: session_id,
        subject,
        chapter,
        classLevel,
        subtopics,
        currentSubtopicIndex: 0,
        phase: 'intro',
        progress: 0,
        isLoading: false,
        isSessionActive: true,
        messages: [{
          id: Date.now(),
          role: 'assistant',
          content: teaching_response.response,
          phase: 'intro',
          timestamp: new Date()
        }],
        suggestions: teaching_response.suggestions || []
      })
      return { success: true }
    } catch (err) {
      set({ isLoading: false })
      return { success: false, error: err.response?.data?.detail || 'Failed to start session' }
    }
  },
  
  sendMessage: async (message, action = null) => {
    const { sessionId, messages } = get()
    if (!sessionId) return
    
    const userMsg = { id: Date.now(), role: 'user', content: message, timestamp: new Date() }
    set(state => ({ messages: [...state.messages, userMsg], isLoading: true }))
    
    try {
      const res = await api.post('/teach/chat', {
        session_id: sessionId,
        message,
        action
      })
      
      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: res.data.response,
        phase: res.data.phase,
        timestamp: new Date()
      }
      
      set(state => ({
        messages: [...state.messages, aiMsg],
        phase: res.data.phase,
        currentSubtopicIndex: res.data.subtopic_index,
        progress: res.data.progress,
        suggestions: res.data.suggestions || [],
        isLoading: false,
        subtopics: res.data.subtopics || state.subtopics
      }))
    } catch (err) {
      const errMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: '⚠️ Something went wrong. Please check your API keys in the backend .env file.',
        timestamp: new Date()
      }
      set(state => ({ messages: [...state.messages, errMsg], isLoading: false }))
    }
  },
  
  clearSession: () => set({
    sessionId: null, messages: [], phase: 'intro', progress: 0,
    isSessionActive: false, subtopics: [], suggestions: []
  })
}))

export const useQuizStore = create((set, get) => ({
  attemptId: null,
  questions: [],
  answers: {},
  currentQuestion: 0,
  result: null,
  isLoading: false,
  timeRemaining: 0,
  quizType: 'practice',
  
  generateQuiz: async (classLevel, subject, chapter, quizType, topic = null) => {
    set({ isLoading: true, questions: [], answers: {}, currentQuestion: 0, result: null })
    try {
      const res = await api.post('/quiz/generate', {
        user_id: useAuthStore.getState().user?.id,
        class_level: classLevel,
        subject,
        chapter,
        quiz_type: quizType,
        difficulty: 'adaptive',
        topic
      })
      set({
        attemptId: res.data.attempt_id,
        questions: res.data.questions,
        timeRemaining: res.data.time_limit_minutes * 60,
        quizType,
        isLoading: false
      })
      return { success: true }
    } catch (err) {
      set({ isLoading: false })
      return { success: false, error: err.response?.data?.detail || 'Failed to generate quiz' }
    }
  },
  
  setAnswer: (questionId, answer) => {
    set(state => ({ answers: { ...state.answers, [questionId]: answer } }))
  },
  
  nextQuestion: () => set(state => ({
    currentQuestion: Math.min(state.currentQuestion + 1, state.questions.length - 1)
  })),
  
  prevQuestion: () => set(state => ({
    currentQuestion: Math.max(state.currentQuestion - 1, 0)
  })),
  
  submitQuiz: async (timeTaken) => {
    const { attemptId, answers } = get()
    set({ isLoading: true })
    try {
      const res = await api.post(`/quiz/submit/${attemptId}`, {
        attempt_id: attemptId,
        answers,
        time_taken_seconds: timeTaken
      })
      set({ result: res.data, isLoading: false })
      return { success: true, result: res.data }
    } catch (err) {
      set({ isLoading: false })
      return { success: false, error: 'Failed to submit quiz' }
    }
  },
  
  resetQuiz: () => set({
    attemptId: null, questions: [], answers: {}, currentQuestion: 0,
    result: null, timeRemaining: 0
  })
}))

export const useUIStore = create((set) => ({
  darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
  sidebarOpen: true,
  activeTab: 'dashboard',
  
  toggleDarkMode: () => set(state => {
    const newMode = !state.darkMode
    if (newMode) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    return { darkMode: newMode }
  }),
  
  setSidebar: (open) => set({ sidebarOpen: open }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  initDarkMode: () => {
    const store = useUIStore.getState()
    if (store.darkMode) document.documentElement.classList.add('dark')
  }
}))
