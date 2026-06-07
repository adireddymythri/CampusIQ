import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from './api'

interface User {
  _id: string
  name: string
  email: string
  role: string
  [key: string]: any
}

interface AuthContextType {
  user: User | null
  loading: boolean
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get<{ ok: boolean; user: User }>('/auth/me')
      if (data.ok) setUser(data.user)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  function logout() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
    window.location.assign('/login')
  }

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      refreshUser()
    } else {
      setLoading(false)
    }
  }, [refreshUser])

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
