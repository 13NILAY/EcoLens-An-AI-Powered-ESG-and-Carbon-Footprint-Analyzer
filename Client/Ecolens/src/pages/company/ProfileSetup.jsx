import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader, Leaf, AlertCircle, CheckCircle } from 'lucide-react'
import { getAuthToken } from '../../services/auth'
import { getCompanyProfile, updateCompanyProfile } from '../../services/profile'

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France',
  'India', 'Japan', 'China', 'Brazil', 'South Korea', 'Singapore', 'Netherlands',
  'Switzerland', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Ireland', 'New Zealand',
  'Spain', 'Italy', 'Mexico', 'South Africa', 'United Arab Emirates', 'Saudi Arabia',
  'Indonesia', 'Thailand', 'Malaysia', 'Philippines', 'Vietnam', 'Poland', 'Turkey',
  'Argentina', 'Chile', 'Colombia', 'Peru', 'Nigeria', 'Kenya', 'Egypt', 'Other'
]

export default function CompanyProfileSetup() {
  const navigate = useNavigate()
  const token = getAuthToken()

  // Form state
  const [formData, setFormData] = useState({
    companyName: '',
    country: '',
    marketCap: '',
    industry: ''
  })

  // UI state
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Fetch existing profile on load
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const response = await getCompanyProfile(token)
        if (response && response.data) {
          setFormData({
            companyName: response.data.companyName || '',
            country: response.data.country || '',
            marketCap: response.data.marketCap || '',
            industry: response.data.industry || ''
          })
        }
      } catch (err) {
        // Profile may not exist yet for new users — that's OK
        console.log('No existing profile found, starting fresh')
      } finally {
        setLoading(false)
      }
    }

    if (token) fetchProfile()
  }, [token])

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  // Validate form
  const validateForm = () => {
    if (!formData.companyName.trim()) {
      setError('Company name is required')
      return false
    }
    if (!formData.country.trim()) {
      setError('Country is required')
      return false
    }
    if (formData.marketCap && !/^[\d.,]+[BMKbmk]?$/.test(formData.marketCap.trim())) {
      setError('Market Cap should be numeric (e.g., 1.5B, 500M, 10000)')
      return false
    }
    if (!formData.industry.trim()) {
      setError('Industry is required')
      return false
    }
    return true
  }

  // Submit profile
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await updateCompanyProfile(formData, token)
      setSuccess('Profile updated successfully! Redirecting to dashboard...')

      // Redirect to dashboard after 1 second
      setTimeout(() => {
        navigate('/company/dashboard')
      }, 1000)
    } catch (err) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Leaf className="w-8 h-8 text-emerald-600" />
            <h1 className="text-3xl font-bold text-gray-900">EcoLens</h1>
          </div>
          <p className="text-gray-600 text-lg">Complete Your Company Profile</p>
        </div>

        {/* Profile Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-800">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Company Name (required) */}
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                placeholder="e.g., Acme Corporation"
                disabled={submitting}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Country — Dropdown instead of free text */}
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                Country *
              </label>
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                disabled={submitting}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select a country...</option>
                {COUNTRIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Market Cap — with validation hint */}
            <div>
              <label htmlFor="marketCap" className="block text-sm font-medium text-gray-700 mb-1">
                Market Cap (USD)
              </label>
              <input
                type="text"
                id="marketCap"
                name="marketCap"
                value={formData.marketCap}
                onChange={handleInputChange}
                placeholder="e.g., 1.5B, 500M"
                disabled={submitting}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Numeric format: 1.5B, 500M, or 10000</p>
            </div>

            {/* Industry */}
            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                Industry *
              </label>
              <select
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
                disabled={submitting}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select an industry...</option>
                <option value="energy">Energy & Utilities</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="technology">Technology</option>
                <option value="finance">Finance & Banking</option>
                <option value="retail">Retail & Consumer</option>
                <option value="healthcare">Healthcare</option>
                <option value="agriculture">Agriculture</option>
                <option value="transportation">Transportation & Logistics</option>
                <option value="construction">Construction & Real Estate</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Info Text */}
            <p className="text-sm text-gray-500">
              * Required fields
            </p>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Saving Profile...
                </>
              ) : (
                'Complete Profile & Continue'
              )}
            </button>
          </form>
        </div>

        {/* Footer Note */}
        <p className="text-center text-gray-500 text-sm mt-6">
          You can update your profile anytime from the dashboard settings
        </p>
      </div>
    </div>
  )
}
