import axios from 'axios'

// 1. Ensure fallback combines the domain with the necessary routing prefix
const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://tutor-brightmind-1.onrender.com/api'

const api = axios.create({
  baseURL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' }
})

// Intercept requests to add auth token
api.interceptors.request.use(config => {
  try {
    const stored = localStorage.getItem('auth-storage')
    if (stored) {
      const { state } = JSON.parse(stored)
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`
      }
    }
  } catch (error) {
    console.error("Auth token parse error:", error)
  }
  return config
})

// Intercept responses for error handling
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth-storage')
      // Safely redirect to /login relative to the frontend origin
      window.location.href = '/auth' // Update to match your Auth.jsx route name if needed
    }
    return Promise.reject(err)
  }
)

export default api