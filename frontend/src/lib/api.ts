import axios from 'axios'

const raw = import.meta.env.VITE_API_BASE_URL as string | undefined

export const apiBase = raw?.replace(/\/$/, '') || 'http://localhost:8090'

export const api = axios.create({
  baseURL: `${apiBase}/api`,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    // If the error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) throw new Error('No refresh token')
        
        // Use standard axios to avoid interceptor loop
        const { data } = await axios.post(`${apiBase}/api/auth/refresh`, { refreshToken })
        
        if (data.ok && data.accessToken) {
          localStorage.setItem('accessToken', data.accessToken)
          if (data.refreshToken) {
            localStorage.setItem('refreshToken', data.refreshToken)
          }
          // Update the original request header and retry
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
          return api(originalRequest)
        }
      } catch (e) {
        // Refresh token failed, clear everything
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  }
)

export function apiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const msg = (err.response?.data as { error?: { message?: string } } | undefined)?.error
      ?.message
    if (msg) return msg
    if (err.message) return err.message
  }
  if (err instanceof Error) return err.message
  return 'Something went wrong'
}
