// services/investor.js
const API_BASE_URL = 'http://localhost:5000/api'

// Get investor dashboard summary
export const getInvestorDashboardSummary = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/investor/dashboard/summary`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard summary: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching dashboard summary:', error)
    throw error
  }
}

// Get industry performance metrics
export const getInvestorIndustryPerformance = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/investor/dashboard/industry-performance`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch industry performance: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching industry performance:', error)
    throw error
  }
}

// Get ESG sentiment trend
export const getInvestorESGSentimentTrend = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/investor/dashboard/esg-sentiment-trend`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch ESG sentiment trend: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching ESG sentiment trend:', error)
    throw error
  }
}

// Get list of companies for investor viewing with optional filters
export const getInvestorCompanies = async (token, filters = {}) => {
  try {
    const { industry, minScore, maxScore, search } = filters
    const params = new URLSearchParams()
    
    if (minScore !== undefined) params.append('minScore', minScore)
    if (maxScore !== undefined) params.append('maxScore', maxScore)
    if (industry && industry !== 'all') params.append('industry', industry)
    if (search) params.append('search', search)

    const queryString = params.toString()
    const url = `${API_BASE_URL}/investor/companies${queryString ? '?' + queryString : ''}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch companies: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching companies:', error)
    throw error
  }
}

// Get company list for comparison/selection
export const getInvestorCompanyList = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/investor/companies/list`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch company list: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching company list:', error)
    throw error
  }
}

// Compare companies (accepts company IDs or names)
export const compareCompanies = async (token, company1, company2) => {
  try {
    const params = new URLSearchParams({
      company1: String(company1),
      company2: String(company2)
    })

    const response = await fetch(
      `${API_BASE_URL}/investor/compare?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to compare companies: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error comparing companies:', error)
    throw error
  }
}

// Build/suggest portfolio based on investor preferences
export const buildInvestorPortfolio = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/investor/portfolio/build`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to build portfolio: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error building portfolio:', error)
    throw error
  }
}

// Get existing saved portfolio
export const getInvestorPortfolio = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/investor/portfolio`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch portfolio: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching portfolio:', error)
    throw error
  }
}

// Save or update investor portfolio
export const saveInvestorPortfolio = async (token, portfolioData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/investor/portfolio`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(portfolioData)
    })

    if (!response.ok) {
      throw new Error(`Failed to save portfolio: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error saving portfolio:', error)
    throw error
  }
}
