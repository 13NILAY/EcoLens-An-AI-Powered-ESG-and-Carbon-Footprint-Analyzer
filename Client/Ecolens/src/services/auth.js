/**
 * Authentication Service
 * Handles API calls for signup and login
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

/**
 * Signup a new user
 * @param {Object} userData - { name, email, password, role }
 * @returns {Promise<Object>} - { token, user }
 */
export const signupUser = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Signup failed')
    }

    return data
  } catch (error) {
    throw error
  }
}

/**
 * Login user
 * @param {Object} credentials - { email, password }
 * @returns {Promise<Object>} - { token, user }
 */
export const loginUser = async (credentials) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Login failed')
    }

    return data
  } catch (error) {
    throw error
  }
}

/**
 * Save auth token to localStorage
 */
export const saveAuthToken = (token, role) => {
  localStorage.setItem('token', token)
  localStorage.setItem('role', role)
}

/**
 * Get auth token from localStorage
 */
export const getAuthToken = () => {
  return localStorage.getItem('token')
}

/**
 * Get user role from localStorage
 */
export const getUserRole = () => {
  return localStorage.getItem('role')
}

/**
 * Clear auth data from localStorage
 */
export const clearAuth = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('role')
}

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getAuthToken()
}
