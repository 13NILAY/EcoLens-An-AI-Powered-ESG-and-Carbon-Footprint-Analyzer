import { createContext, useContext, useState, useEffect } from 'react'
import { getAuthToken, getUserRole, clearAuth } from '../services/auth'

/**
 * AuthContext - Provides global authentication state
 * Usage: wrap your app with <AuthProvider> and use useAuth() hook
 */
const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null)
  const [role, setRole] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const savedToken = getAuthToken()
    const savedRole = getUserRole()
    
    if (savedToken && savedRole) {
      setToken(savedToken)
      setRole(savedRole)
    }
    
    setIsLoading(false)
  }, [])

  // Logout function
  const logout = () => {
    clearAuth()
    setToken(null)
    setRole(null)
  }

  // Login function (called after successful login/signup)
  const login = (newToken, newRole) => {
    setToken(newToken)
    setRole(newRole)
  }

  const value = {
    token,
    role,
    isLoading,
    isAuthenticated: !!token,
    logout,
    login
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * useAuth Hook - Use this to access auth state anywhere in the app
 * Example:
 *   const { token, role, isAuthenticated, logout } = useAuth()
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  
  return context
}
