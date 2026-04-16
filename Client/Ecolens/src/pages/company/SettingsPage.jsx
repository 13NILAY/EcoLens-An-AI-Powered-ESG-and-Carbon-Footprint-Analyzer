// pages/company/SettingsPage.jsx
import { useState, useEffect } from 'react'
import { Loader, AlertCircle, CheckCircle, Settings, Building } from 'lucide-react'
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

export default function SettingsPage() {
  const token = getAuthToken()

  const [formData, setFormData] = useState({
    companyName: '',
    country: '',
    marketCap: '',
    industry: ''
  })

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
        console.error('Error fetching profile:', err)
        // Not an error — just means profile is empty
      } finally {
        setLoading(false)
      }
    }

    if (token) fetchProfile()
  }, [token])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
    setSuccess('')
  }

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await updateCompanyProfile(formData, token)
      setSuccess('Profile updated successfully!')
    } catch (err) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
          <Settings className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Company Settings</h1>
          <p className="text-gray-600">Manage your company profile and preferences</p>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Building size={20} className="text-gray-600" />
          <h2 className="text-xl font-bold text-gray-900">Company Profile</h2>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Company Name */}
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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Country — Dropdown */}
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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select a country...</option>
              {COUNTRIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Market Cap */}
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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Use format like 1.5B, 500M, or 10000</p>
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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select an industry...</option> 
              <option value="technology">Tech</option> 
              <option value="finance">Finance</option>
              <option value="fmcg">FMCG</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="energy">Energy</option>
            </select>
          </div>

          <p className="text-sm text-gray-500">* Required fields</p>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-xl transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
