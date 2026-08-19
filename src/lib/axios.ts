import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5011/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to attach token
api.interceptors.request.use((config) => {
  // Try to get token from localStorage (assuming token-based auth)
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Response interceptor to extract human-readable error messages from server
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const serverMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      (typeof error.response?.data === 'string' ? error.response.data : null)

    if (serverMessage && typeof serverMessage === 'string') {
      error.message = serverMessage
    }
    return Promise.reject(error)
  }
)

export default api
