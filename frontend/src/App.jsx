import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore, useUIStore } from './store'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'
import Learn from './pages/Learn'
import Quiz from './pages/Quiz'
import Resources from './pages/Resources'
import Profile from './pages/Profile'
import Auth from './pages/Auth'

function ProtectedRoute({ children }) {
  const token = useAuthStore(s => s.token)
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const initAuth = useAuthStore(s => s.initAuth)
  const initDarkMode = useUIStore(s => s.initDarkMode)
  
  useEffect(() => {
    initAuth()
    initDarkMode()
  }, [])
  
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            fontFamily: 'DM Sans, sans-serif',
          }
        }}
      />
      <Routes>
        <Route path="/login" element={<Auth />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="learn" element={<Learn />} />
          <Route path="quiz" element={<Quiz />} />
          <Route path="resources" element={<Resources />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
