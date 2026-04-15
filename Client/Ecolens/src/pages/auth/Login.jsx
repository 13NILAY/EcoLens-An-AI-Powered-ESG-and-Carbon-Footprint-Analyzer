import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Leaf, Loader } from 'lucide-react'
import { loginUser, saveAuthToken } from '../../services/auth'

export default function Login() {
  const navigate = useNavigate()
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  
  // UI state
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear errors on input change
    setError('')
  }

  // Validate form data
  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('Email is required')
      return false
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email')
      return false
    }
    if (!formData.password) {
      setError('Password is required')
      return false
    }
    return true
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Call login API
      const response = await loginUser({
        email: formData.email,
        password: formData.password
      })

      // Save token and role to localStorage
      saveAuthToken(response.token, response.user.role)

      setSuccess('Login successful!')

      // Redirect directly to dashboard based on role
      setTimeout(() => {
        if (response.user.role === 'company') {
          navigate('/company/dashboard')
        } else if (response.user.role === 'investor') {
          navigate('/investor/dashboard')
        }
      }, 500)
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Leaf className="w-8 h-8 text-emerald-600" />
            <h1 className="text-3xl font-bold text-gray-900">EcoLens</h1>
          </div>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  disabled={loading}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
                <span className="ml-2 text-gray-700">Remember me</span>
              </label>
              <a href="#" className="text-emerald-600 hover:text-emerald-700">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Signup Link */}
          <p className="text-center text-gray-600 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Sign up here
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-6">
          Protected by industry-standard security protocols
        </p>
      </div>
    </div>
  )
}
