/**
 * Profile Service
 * Handles API calls for profile setup and completion checks
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

/**
 * Get company profile
 * @returns {Promise<Object>} - Company profile data
 */
export const getCompanyProfile = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/company/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch profile')
    }

    return data
  } catch (error) {
    throw error
  }
}

/**
 * Update company profile
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} - Updated profile
 */
export const updateCompanyProfile = async (profileData, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/company/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update profile')
    }

    return data
  } catch (error) {
    throw error
  }
}

/**
 * Get investor profile
 * @returns {Promise<Object>} - Investor profile data
 */
export const getInvestorProfile = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/investor/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch profile')
    }

    return data
  } catch (error) {
    throw error
  }
}

/**
 * Update investor profile
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} - Updated profile
 */
export const updateInvestorProfile = async (profileData, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/investor/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update profile')
    }

    return data
  } catch (error) {
    throw error
  }
}

/**
 * Check if company profile is complete
 * A profile is considered complete if essential fields are filled:
 * - country
 * - market cap (marketCap)
 * - industry
 * @param {Object} profile - Profile object from API
 * @returns {boolean} - True if profile is complete
 */
export const isCompanyProfileComplete = (profile) => {
  if (!profile) return false
  // Profile is complete if it has country, market cap, and industry
  return !!(profile.country && profile.marketCap && profile.industry)
}

/**
 * Check if investor profile is complete
 * A profile is considered complete if essential fields are filled:
 * - risk tolerance
 * - min ESG score
 * @param {Object} profile - Profile object from API
 * @returns {boolean} - True if profile is complete
 */
export const isInvestorProfileComplete = (profile) => {
  if (!profile) return false
  return !!(profile.risk_tolerance && profile.min_esg_score !== undefined)
}
