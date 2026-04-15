// pages/investor/DashboardPage.jsx
import { useState, useEffect } from 'react'
import { Search, Filter, TrendingUp,BarChart3, TrendingDown, AlertCircle, CheckCircle, Loader } from 'lucide-react'
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts'
import { getAuthToken } from '../../services/auth'
import { 
  getInvestorDashboardSummary, 
  getInvestorIndustryPerformance, 
  getInvestorESGSentimentTrend,
  getInvestorCompanies 
} from '../../services/investor'

export default function InvestorDashboard() {
  const token = getAuthToken()
  const [timeRange, setTimeRange] = useState('1y')
  const [selectedIndustry, setSelectedIndustry] = useState('all')
  const [scoreRange, setScoreRange] = useState([0, 100])
  
  // Data state
  const [companiesData, setCompaniesData] = useState([])
  const [esgTrendData, setEsgTrendData] = useState([])
  const [industryPerformance, setIndustryPerformance] = useState([])
  const [portfolioSummary, setPortfolioSummary] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')


  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch all dashboard data on mount and when filters change
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Prepare filters for API call
        const companiesFilters = {
          industry: selectedIndustry,
          minScore: scoreRange[0],
          maxScore: scoreRange[1],
          search: searchTerm
        }

        const [summary, performanceData, trendData, companiesListData] = await Promise.all([
          getInvestorDashboardSummary(token),
          getInvestorIndustryPerformance(token),
          getInvestorESGSentimentTrend(token),
          getInvestorCompanies(token, companiesFilters)
        ])

        // Transform and set summary data
        if (summary) {
          setPortfolioSummary(summary)
        }

        // Transform industry performance data
        if (performanceData) {
          const transformed = performanceData.map(item => ({
            industry: item.industry || item.name,
            avgScore: item.avg_score || item.avgScore || item.score || 0,
            companies: item.company_count || item.companies || 0,
            trend: item.trend || 'stable'
          }))
          setIndustryPerformance(transformed)
        }

        // Transform ESG trend data
        if (trendData) {
          const transformed = trendData.map(item => ({
            month: item.month || item.date?.substring(0, 3) || '',
            esg: item.esg_score || item.esgScore || item.esg || 0,
            sentiment: item.sentiment_score || item.sentimentScore || item.sentiment || 0
          }))
          setEsgTrendData(transformed)
        }

        // Transform companies data
        if (companiesListData) {
          const transformed = companiesListData.map(item => ({
            id: item.id,
            name: item.company_name || item.name,
            ticker: item.ticker || 'N/A',
            industry: item.industry || 'N/A',
            esgScore: item.esg_score || item.esgScore || 0,
            sentiment: item.sentiment_score || item.sentimentScore || 0,
            trend: item.trend || 'stable',
            marketCap: item.market_cap || 'N/A',
            revenue: item.revenue || 'N/A',
            environmental: item.environmental_score || item.environmental || 0,
            social: item.social_score || item.social || 0,
            governance: item.governance_score || item.governance || 0,
            lastUpdated: item.last_updated || item.lastUpdated || new Date().toISOString().split('T')[0]
          }))
          setCompaniesData(transformed)
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError('Failed to load dashboard. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchDashboardData()
    }
  }, [token, selectedIndustry, scoreRange, searchTerm])

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <TrendingUp size={16} className="text-emerald-500" />
    if (trend === 'down') return <TrendingDown size={16} className="text-red-500" />
    return <div className="w-4 h-4 bg-gray-400 rounded-full" />
  }

  // No need for client-side filtering - data is already filtered server-side
  const filteredCompanies = companiesData

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
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
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Dashboard</h3>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ESG Investment Dashboard</h1>
          <p className="text-lg text-gray-600">Live ESG rankings and sustainable investment insights</p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1m">Last Month</option>
            <option value="3m">Last 3 Months</option>
            <option value="1y">Last Year</option>
            <option value="ytd">Year to Date</option>
          </select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Avg ESG Score</h3>
            <TrendingUp size={20} className="text-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-emerald-600">
            {portfolioSummary?.avg_esg_score || portfolioSummary?.avgEsgScore || '76.2'}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {portfolioSummary?.score_change || portfolioSummary?.scoreChange || '+2.4%'} from last month
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Performer</h3>
            <CheckCircle size={20} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {portfolioSummary?.top_company || portfolioSummary?.topCompany || 'NEE'}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            ESG Score: {portfolioSummary?.top_company_score || portfolioSummary?.topCompanyScore || '88'}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Companies Tracked</h3>
            <BarChart3 size={20} className="text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-blue-600">
            {portfolioSummary?.total_companies || portfolioSummary?.totalCompanies || companiesData.length}
          </div>
          <div className="text-sm text-gray-500 mt-1">Across 12 sectors</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Risk Alert</h3>
            <AlertCircle size={20} className="text-red-500" />
          </div>
          <div className="text-3xl font-bold text-red-600">
            {portfolioSummary?.low_score_companies || portfolioSummary?.lowScoreCompanies || '12'}
          </div>
          <div className="text-sm text-gray-500 mt-1">Companies below 50</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ESG vs Sentiment Trend */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6">ESG vs Sentiment Trend</h3>
          <div className="h-80">
            {esgTrendData && esgTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={esgTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="esg" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    name="ESG Score"
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sentiment" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Sentiment Score"
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">No trend data available</div>
            )}
          </div>
        </div>

        {/* Industry Performance */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Industry ESG Performance</h3>
          <div className="h-80">
            {industryPerformance && industryPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={industryPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="industry" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="avgScore" name="Average ESG Score">
                    {industryPerformance.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.trend === 'up' ? '#10B981' : entry.trend === 'down' ? '#EF4444' : '#6B7280'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">No industry data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Company Rankings */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Company ESG Rankings</h3>
            
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
                <Filter size={16} className="text-gray-400" />
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="bg-transparent text-sm focus:outline-none"
                >
                  <option value="all">All Industries</option>
                  {[...new Set(companiesData.map(c => c.industry))].map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={scoreRange[0]}
                  onChange={(e) => setScoreRange([parseInt(e.target.value), scoreRange[1]])}
                  className="w-20"
                />
                <span className="text-sm text-gray-500">to</span>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={scoreRange[1]}
                  onChange={(e) => setScoreRange([scoreRange[0], parseInt(e.target.value)])}
                  className="w-20"
                />
              </div>

              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
               <input
                  type="text"
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm"
                />

              </div>
            </div>
          </div>
        </div>

        {/* Companies Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Industry</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ESG Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sentiment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Environmental</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Social</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Governance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCompanies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900">{company.name}</div>
                      <div className="text-sm text-gray-500">{company.ticker}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{company.industry}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getScoreColor(company.esgScore)}`}>
                      {company.esgScore}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-gray-900">{company.sentiment}</div>
                      {getTrendIcon(company.trend)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{company.environmental}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{company.social}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{company.governance}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getTrendIcon(company.trend)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}