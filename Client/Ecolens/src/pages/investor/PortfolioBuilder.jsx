// pages/investor/PortfolioBuilder.jsx
import { useState, useEffect } from 'react'
import { Plus, Minus, Filter, Download, TrendingUp, AlertTriangle, CheckCircle, Loader, AlertCircle } from 'lucide-react'
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts'
import { getAuthToken } from '../../services/auth'
import { getInvestorCompanies, getInvestorPortfolio, buildInvestorPortfolio, saveInvestorPortfolio, ALLOWED_INDUSTRIES } from '../../services/investor'

export default function PortfolioBuilder() {
  const token = getAuthToken()
  const [selectedCompanies, setSelectedCompanies] = useState([])
  const [filters, setFilters] = useState({
    minEsgScore: 70,
    industries: [],
    ethicalPreferences: []
  })
  
  // Data state
  const [availableCompanies, setAvailableCompanies] = useState([])
  const [portfolioData, setPortfolioData] = useState(null)
  
  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Fetch companies and portfolio on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [companiesResponse, portfolioResponse] = await Promise.all([
          getInvestorCompanies(token),
          getInvestorPortfolio(token).catch(() => null) // Portfolio might not exist yet
        ])

        // Transform companies data
        if (companiesResponse?.data) {
          const transformed = companiesResponse.data.map(company => ({
            id: company.id,
            name: company.company_name || company.name,
            ticker: company.ticker || 'N/A',
            industry: company.industry || 'N/A',
            esgScore: company.esg_score ?? company.esgScore ?? null,
            marketCap: company.market_cap || 'N/A',
            risk: company.risk || 'Medium',
            environmental: company.environmental_score ?? company.environmental ?? null,
            social: company.social_score ?? company.social ?? null,
            governance: company.governance_score ?? company.governance ?? null,
            price: company.price || '0.00',
            change: company.price_change || '+0.0%'
          }))
          setAvailableCompanies(transformed)
        }

        // Set portfolio data if exists
        if (portfolioResponse?.data) {
          setPortfolioData(portfolioResponse.data)
          // Load selected companies from existing portfolio
          if (portfolioResponse.data.companies) {
            setSelectedCompanies(portfolioResponse.data.companies)
          }
        }
      } catch (err) {
        console.error('Error fetching portfolio data:', err)
        setError('Failed to load portfolio builder data')
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchData()
    }
  }, [token])

 

  // Ethical preferences
  const ethicalOptions = [
    { id: 'renewable', name: 'Renewable Energy', description: 'Companies with clean energy commitments' },
    { id: 'diversity', name: 'Diversity & Inclusion', description: 'Strong diversity policies and metrics' },
    { id: 'low_carbon', name: 'Low Carbon', description: 'Below industry average emissions' },
    { id: 'sustainable_supply', name: 'Sustainable Supply Chain', description: 'Ethical sourcing and suppliers' },
    { id: 'board_independence', name: 'Board Independence', description: 'Majority independent directors' },
    { id: 'water_positive', name: 'Water Positive', description: 'Water conservation and recycling' }
  ]

  const industries = ALLOWED_INDUSTRIES.map(i => i.charAt(0).toUpperCase() + i.slice(1))

  const toggleCompany = (company) => {
    if (selectedCompanies.find(c => c.id === company.id)) {
      setSelectedCompanies(selectedCompanies.filter(c => c.id !== company.id))
    } else {
      setSelectedCompanies([...selectedCompanies, company])
    }
  }

  const toggleEthicalPreference = (preferenceId) => {
    setFilters(prev => ({
      ...prev,
      ethicalPreferences: prev.ethicalPreferences.includes(preferenceId)
        ? prev.ethicalPreferences.filter(id => id !== preferenceId)
        : [...prev.ethicalPreferences, preferenceId]
    }))
  }

  const toggleIndustry = (industry) => {
    setFilters(prev => ({
      ...prev,
      industries: prev.industries.includes(industry)
        ? prev.industries.filter(ind => ind !== industry)
        : [...prev.industries, industry]
    }))
  }

  // Portfolio statistics
  const portfolioStats = {
    totalCompanies: selectedCompanies.length,
    avgEsgScore: selectedCompanies.length > 0 
      ? Math.round(selectedCompanies.reduce((sum, c) => sum + c.esgScore, 0) / selectedCompanies.length)
      : 0,
    riskDistribution: selectedCompanies.reduce((acc, company) => {
      acc[company.risk] = (acc[company.risk] || 0) + 1
      return acc
    }, {}),
    industryDistribution: selectedCompanies.reduce((acc, company) => {
      acc[company.industry] = (acc[company.industry] || 0) + 1
      return acc
    }, {})
  }

  const riskData = Object.entries(portfolioStats.riskDistribution).map(([risk, count]) => ({
    name: risk,
    value: count,
    color: risk === 'Low' ? '#10B981' : risk === 'Medium' ? '#F59E0B' : '#EF4444'
  }))

  const industryData = Object.entries(portfolioStats.industryDistribution).map(([industry, count]) => ({
    name: industry,
    companies: count
  }))

const generatePortfolio = async () => {
  try {
    setLoading(true)
    setError(null)

    const response = await buildInvestorPortfolio(token)

    setPortfolioData(response)
    setSelectedCompanies(response.portfolio)

  } catch (err) {
    console.error(err)
    setError('Failed to build portfolio')
  } finally {
    setLoading(false)
  }
}

const savePortfolio = async () => {
  try {
    setLoading(true)
    setError(null)

    if (!portfolioData || !portfolioData.portfolio) {
      setError('No portfolio to save. Please generate a portfolio first.')
      setLoading(false)
      return
    }

    const resp = await saveInvestorPortfolio(token, portfolioData)
    
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
    
  } catch (err) {
    console.error(err)
    setError('Failed to save portfolio')
  } finally {
    setLoading(false)
  }
}

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading portfolio builder...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Portfolio</h3>
            <p className="text-red-700">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Success Message */}
      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3 animate-pulse">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <p className="text-emerald-700 font-medium">Portfolio saved successfully!</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Portfolio Builder</h1>
          <p className="text-lg text-gray-600">Build sustainable investment portfolios with AI-powered ESG insights</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={savePortfolio}
            disabled={!portfolioData || loading}
            className="bg-emerald-600 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <CheckCircle size={16} />
            Save Portfolio
          </button>
          <button className="bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Download size={16} />
            Export Portfolio
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Filters */}
        <div className="lg:col-span-1 space-y-6">
          {/* ESG Score Filter */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ESG Score Range</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum ESG Score: {filters.minEsgScore}
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.minEsgScore}
                  onChange={(e) => setFilters(prev => ({ ...prev, minEsgScore: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>
            </div>
          </div>

          {/* Industry Filter */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Industries</h3>
            <div className="space-y-2">
              {industries.map((industry) => (
                <label key={industry} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={filters.industries.includes(industry)}
                    onChange={() => toggleIndustry(industry)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{industry}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Ethical Preferences */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ethical Preferences</h3>
            <div className="space-y-3">
              {ethicalOptions.map((option) => (
                <label key={option.id} className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.ethicalPreferences.includes(option.id)}
                    onChange={() => toggleEthicalPreference(option.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                      {option.name}
                    </div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generatePortfolio}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            Generate Portfolio
          </button>
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Portfolio Stats */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Portfolio Overview</h3>
            
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{portfolioStats.totalCompanies}</div>
                <div className="text-sm text-gray-500">Companies</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600 mb-2">{portfolioStats.avgEsgScore}</div>
                <div className="text-sm text-gray-500">Avg ESG Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600 mb-2">
                  {selectedCompanies.length > 0 ? 'A-' : 'N/A'}
                </div>
                <div className="text-sm text-gray-500">Sustainability Rating</div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Risk Distribution */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Risk Distribution</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {riskData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Industry Distribution */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Industry Distribution</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={industryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="companies" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Companies */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Selected Companies ({selectedCompanies.length})</h3>
            </div>

            <div className="divide-y divide-gray-200">
              {selectedCompanies.map((company) => (
                <div key={company.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleCompany(company)}
                        className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      <div>
                        <div className="font-semibold text-gray-900">{company.name}</div>
                        <div className="text-sm text-gray-500">{company.ticker} • {company.industry}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">{company.price}</div>
                        <div className={`text-sm ${company.change.startsWith('+') ? 'text-emerald-600' : 'text-red-600'}`}>
                          {company.change}
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium border ${
                        company.esgScore >= 80 
                          ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                          : company.esgScore >= 60
                          ? 'text-yellow-600 bg-yellow-50 border-yellow-200'
                          : 'text-red-600 bg-red-50 border-red-200'
                      }`}>
                        ESG: {company.esgScore}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-sm text-gray-500">Environmental</div>
                      <div className="font-semibold text-emerald-600">{company.environmental}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Social</div>
                      <div className="font-semibold text-blue-600">{company.social}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Governance</div>
                      <div className="font-semibold text-purple-600">{company.governance}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Risk</div>
                      <div className={`font-semibold ${
                        company.risk === 'Low' ? 'text-emerald-600' :
                        company.risk === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {company.risk}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {selectedCompanies.length === 0 && (
                <div className="p-12 text-center">
                  <Filter size={48} className="text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No companies selected</h4>
                  <p className="text-gray-500 mb-6">
                    Use the filters to generate a sustainable investment portfolio
                  </p>
                  <button
                    onClick={generatePortfolio}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                  >
                    Generate Portfolio
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}