// pages/investor/ComparisonPage.jsx
import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Download, BarChart3, Target, Loader, AlertCircle } from 'lucide-react'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'
import { getAuthToken } from '../../services/auth'
import { getInvestorCompanyList, compareCompanies } from '../../services/investor'

export default function ComparisonPage() {
  const token = getAuthToken()
  const [company1, setCompany1] = useState(null)
  const [company2, setCompany2] = useState(null)
  const [comparisonMode, setComparisonMode] = useState('esg') // esg, environmental, social, governance

  // Data state
  const [companiesList, setCompaniesList] = useState([])
  const [company1Data, setCompany1Data] = useState(null)
  const [company2Data, setCompany2Data] = useState(null)

  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch company list on mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getInvestorCompanyList(token)
        if (response) {
          setCompaniesList(response)
          // Set default companies if available
          if (response.length >= 2) {
            setCompany1(response[0].id)
            setCompany2(response[1].id)
          } else if (response.length === 1) {
            setCompany1(response[0].id)
          }
        }
      } catch (err) {
        console.error('Error fetching companies:', err)
        setError('Failed to load companies list')
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchCompanies()
    }
  }, [token])

  // Fetch comparison data when companies change
  useEffect(() => {
    if (!company1 || !company2) return
    if (company1 === company2) {
      setError('Please select two different companies')
      setCompany1Data(null)
      setCompany2Data(null)
      return
    }

    const fetchComparison = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await compareCompanies(token, company1, company2)
        setCompany1Data(response.company1)
        setCompany2Data(response.company2)
      } catch (err) {
        console.error(err)
        setError('Failed to load comparison data')
      } finally {
        setLoading(false)
      }
    }

    fetchComparison()
  }, [company1, company2, token])

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getDifference = (score1, score2) => {
    const diff = score1 - score2
    return {
      value: Math.abs(diff),
      isPositive: diff > 0,
      isEqual: diff === 0
    }
  }

  // Fallback data objects (used everywhere)
  const c1Data = company1Data || {
    id: company1,
    name: company1 || 'Company A',
    ticker: company1 || 'N/A',
    industry: 'N/A',
    marketCap: 'N/A',
    esgScore: 0,
    environmental: { score: 0 },
    social: { score: 0 },
    governance: { score: 0 },
    strengths: [],
    weaknesses: []
  }

  const c2Data = company2Data || {
    id: company2,
    name: company2 || 'Company B',
    ticker: company2 || 'N/A',
    industry: 'N/A',
    marketCap: 'N/A',
    esgScore: 0,
    environmental: { score: 0 },
    social: { score: 0 },
    governance: { score: 0 },
    strengths: [],
    weaknesses: []
  }

  const radarData = [
    { subject: 'Environmental', company1: c1Data.environmental.score, company2: c2Data.environmental.score },
    { subject: 'Social', company1: c1Data.social.score, company2: c2Data.social.score },
    { subject: 'Governance', company1: c1Data.governance.score, company2: c2Data.governance.score },
    { subject: 'Overall ESG', company1: c1Data.esgScore, company2: c2Data.esgScore }
  ]

  const barChartData = radarData.map(item => ({
    name: item.subject,
    [c1Data.name]: item.company1,
    [c2Data.name]: item.company2
  }))

  // Loading state (only when no companies list yet)
  if (loading && !companiesList.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading comparison data...</p>
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
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Data</h3>
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

  const overallDifference = getDifference(c1Data.esgScore, c2Data.esgScore)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Company Comparison</h1>
          <p className="text-lg text-gray-600">Side-by-side ESG analysis and performance metrics</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Download size={16} />
            Export Comparison
          </button>
        </div>
      </div>

      {/* Company Selectors */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Compare Company</label>
            <select
              value={company1 || ''}
              onChange={(e) => setCompany1(e.target.value)} // no parseInt
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a company</option>
              {companiesList.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name} {company.industry ? `(${company.industry})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">With Company</label>
            <select
              value={company2 || ''}
              onChange={(e) => setCompany2(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a company</option>
              {companiesList.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name} {company.industry ? `(${company.industry})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison Mode Selector */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Comparison Focus:</label>
          <div className="flex gap-2">
            {['esg', 'environmental', 'social', 'governance'].map((mode) => (
              <button
                key={mode}
                onClick={() => setComparisonMode(mode)}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all duration-200 ${
                  comparisonMode === mode
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overall Comparison Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Company 1 Summary */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="text-white" size={24} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{c1Data.name}</h3>
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold border mb-3 ${getScoreColor(c1Data.esgScore)}`}>
            ESG: {c1Data.esgScore}
          </div>
          <div className="text-sm text-gray-600 mb-4">{c1Data.industry} • {c1Data.marketCap} Market Cap</div>
          <div className="space-y-2 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Environmental</span>
              <span className="font-medium">{c1Data.environmental.score}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Social</span>
              <span className="font-medium">{c1Data.social.score}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Governance</span>
              <span className="font-medium">{c1Data.governance.score}</span>
            </div>
          </div>
        </div>

        {/* Comparison Result */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center flex items-center justify-center">
          <div>
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {overallDifference.isEqual ? '=' : overallDifference.isPositive ? '>' : '<'}
            </div>
            <div className={`text-lg font-semibold ${
              overallDifference.isEqual ? 'text-gray-600' :
              overallDifference.isPositive ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {overallDifference.isEqual
                ? 'Equal Scores'
                : `${overallDifference.value} Point${overallDifference.value !== 1 ? 's' : ''} ${overallDifference.isPositive ? 'Higher' : 'Lower'}`
              }
            </div>
            <div className="text-sm text-gray-500 mt-2">ESG Score Difference</div>
          </div>
        </div>

        {/* Company 2 Summary */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Target className="text-white" size={24} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{c2Data.name}</h3>
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold border mb-3 ${getScoreColor(c2Data.esgScore)}`}>
            ESG: {c2Data.esgScore}
          </div>
          <div className="text-sm text-gray-600 mb-4">{c2Data.industry} • {c2Data.marketCap} Market Cap</div>
          <div className="space-y-2 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Environmental</span>
              <span className="font-medium">{c2Data.environmental.score}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Social</span>
              <span className="font-medium">{c2Data.social.score}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Governance</span>
              <span className="font-medium">{c2Data.governance.score}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Radar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6">ESG Performance Radar</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar
                  name={c1Data.name}
                  dataKey="company1"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.3}
                />
                <Radar
                  name={c2Data.name}
                  dataKey="company2"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.3}
                />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Detailed Metrics Comparison</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey={c1Data.name} fill="#3B82F6" name={c1Data.name} />
                <Bar dataKey={c2Data.name} fill="#10B981" name={c2Data.name} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Company 1 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6">{c1Data.name} - Analysis</h3>
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-emerald-600 mb-3 flex items-center gap-2">
              <TrendingUp size={18} />
              Key Strengths
            </h4>
            <div className="space-y-2">
              {c1Data.strengths.map((strength, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">{strength}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-red-600 mb-3 flex items-center gap-2">
              <TrendingDown size={18} />
              Areas for Improvement
            </h4>
            <div className="space-y-2">
              {c1Data.weaknesses.map((weakness, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">{weakness}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Company 2 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6">{c2Data.name} - Analysis</h3>
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-emerald-600 mb-3 flex items-center gap-2">
              <TrendingUp size={18} />
              Key Strengths
            </h4>
            <div className="space-y-2">
              {c2Data.strengths.map((strength, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">{strength}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-red-600 mb-3 flex items-center gap-2">
              <TrendingDown size={18} />
              Areas for Improvement
            </h4>
            <div className="space-y-2">
              {c2Data.weaknesses.map((weakness, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">{weakness}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}