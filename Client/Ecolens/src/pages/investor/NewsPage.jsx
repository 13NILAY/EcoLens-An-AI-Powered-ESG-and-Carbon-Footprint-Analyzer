// pages/investor/NewsPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, TrendingUp, TrendingDown, AlertTriangle, Building2, 
  Newspaper, ArrowUpRight, ChevronDown, Loader, AlertCircle,
  Activity, BarChart3, Eye, Shield, Filter
} from 'lucide-react'
import { getAuthToken } from '../../services/auth'
import { getNewsOverview, getNewsCompanies, getNewsTopAlerts } from '../../services/investor'

export default function NewsPage() {
  const token = getAuthToken()
  const navigate = useNavigate()

  // Data state
  const [overview, setOverview] = useState(null)
  const [companies, setCompanies] = useState([])
  const [alerts, setAlerts] = useState([])

  // Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [sentimentFilter, setSentimentFilter] = useState('all')
  const [sortBy, setSortBy] = useState('news_count')
  const [sortOrder, setSortOrder] = useState('desc')

  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [overviewData, alertsData] = await Promise.all([
          getNewsOverview(token),
          getNewsTopAlerts(token)
        ])
        setOverview(overviewData)
        setAlerts(alertsData)
      } catch (err) {
        console.error('Error loading news data:', err)
        setError('Failed to load news data. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    if (token) fetchData()
  }, [token])

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const data = await getNewsCompanies(token, {
          search: searchTerm,
          sentiment: sentimentFilter,
          sort: sortBy,
          order: sortOrder
        })
        setCompanies(data)
      } catch (err) {
        console.error('Error fetching companies:', err)
      }
    }
    if (token) {
      const debounce = setTimeout(fetchCompanies, 300)
      return () => clearTimeout(debounce)
    }
  }, [token, searchTerm, sentimentFilter, sortBy, sortOrder])

  const getSentimentBadge = (sentiment) => {
    const styles = {
      positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      negative: 'bg-red-50 text-red-700 border-red-200',
      neutral: 'bg-amber-50 text-amber-700 border-amber-200'
    }
    const icons = {
      positive: <TrendingUp size={14} />,
      negative: <TrendingDown size={14} />,
      neutral: <Activity size={14} />
    }
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${styles[sentiment] || styles.neutral}`}>
        {icons[sentiment] || icons.neutral}
        {(sentiment || 'neutral').charAt(0).toUpperCase() + (sentiment || 'neutral').slice(1)}
      </span>
    )
  }

  const getSeverityColor = (severity) => {
    if (severity === 'high') return 'border-l-red-500 bg-red-50/50'
    if (severity === 'medium') return 'border-l-amber-500 bg-amber-50/50'
    return 'border-l-blue-500 bg-blue-50/50'
  }

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(col)
      setSortOrder('desc')
    }
  }

  const SortIndicator = ({ col }) => {
    if (sortBy !== col) return <ChevronDown size={14} className="text-gray-300" />
    return <ChevronDown size={14} className={`text-blue-600 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading news intelligence...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-12">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 flex items-start gap-4">
          <AlertCircle className="w-7 h-7 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-bold text-red-900 mb-2">Failed to Load News Data</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">News & Sentiment Intelligence</h1>
        <p className="text-gray-500 text-lg">Real-time company news analysis powered by FinBERT sentiment AI</p>
      </div>

      {/* Section 1 — Market Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Companies */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Building2 size={20} className="text-blue-600" />
            </div>
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Tracked</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{overview?.totalCompanies || 0}</div>
          <div className="text-sm text-gray-500 mt-1">{overview?.totalArticles || 0} articles analyzed</div>
        </div>

        {/* Positive Sentiment */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} className="text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Positive</span>
          </div>
          <div className="text-3xl font-bold text-emerald-600">{overview?.positiveCompanies || 0}</div>
          <div className="text-sm text-gray-500 mt-1">{overview?.positiveArticles || 0} positive articles</div>
        </div>

        {/* Negative Sentiment */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <TrendingDown size={20} className="text-red-600" />
            </div>
            <span className="text-xs font-medium text-red-600 uppercase tracking-wide">Negative</span>
          </div>
          <div className="text-3xl font-bold text-red-600">{overview?.negativeCompanies || 0}</div>
          <div className="text-sm text-gray-500 mt-1">{overview?.negativeArticles || 0} negative articles</div>
        </div>

        {/* Neutral */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <Activity size={20} className="text-amber-600" />
            </div>
            <span className="text-xs font-medium text-amber-600 uppercase tracking-wide">Neutral</span>
          </div>
          <div className="text-3xl font-bold text-amber-600">{overview?.neutralCompanies || 0}</div>
          <div className="text-sm text-gray-500 mt-1">{overview?.neutralArticles || 0} neutral articles</div>
        </div>
      </div>

      {/* Extra Insight Row */}
      {overview && (overview.mostDiscussed !== 'N/A' || overview.strongestPositive !== 'N/A') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-5">
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Most Discussed</div>
            <div className="text-lg font-bold text-gray-900">{overview.mostDiscussed}</div>
            <div className="text-sm text-gray-500">{overview.mostDiscussedCount} articles</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-100 p-5">
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">Strongest Positive</div>
            <div className="text-lg font-bold text-gray-900">{overview.strongestPositive}</div>
            <div className="text-sm text-gray-500">Score: {(overview.strongestPositiveScore * 100).toFixed(1)}%</div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl border border-red-100 p-5">
            <div className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">Strongest Negative</div>
            <div className="text-lg font-bold text-gray-900">{overview.strongestNegative}</div>
            <div className="text-sm text-gray-500">Score: {(overview.strongestNegativeScore * 100).toFixed(1)}%</div>
          </div>
        </div>
      )}

      {/* Section 2 — Top Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center">
                <Shield size={18} className="text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Risk Alerts</h2>
                <p className="text-sm text-gray-500">Companies with significant negative sentiment</p>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {alerts.map((alert, i) => (
              <div
                key={i}
                onClick={() => navigate(`/investor/news/${encodeURIComponent(alert.companyName)}`)}
                className={`border-l-4 rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={18} className={alert.severity === 'high' ? 'text-red-600' : 'text-amber-600'} />
                    <div>
                      <span className="font-bold text-gray-900">{alert.companyName}</span>
                      <span className="text-sm text-gray-500 ml-3">{alert.negativeArticles} negative articles</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      alert.severity === 'high' ? 'bg-red-100 text-red-700' : 
                      alert.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <ArrowUpRight size={16} className="text-gray-400" />
                  </div>
                </div>
                {alert.sampleHeadline && (
                  <p className="text-sm text-gray-600 mt-2 ml-7 line-clamp-1">{alert.sampleHeadline}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 3 — Company Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                <BarChart3 size={18} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Company Sentiment Overview</h2>
                <p className="text-sm text-gray-500">{companies.length} companies with active news coverage</p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="news-search"
                  type="text"
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-56 transition-all"
                />
              </div>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
                <Filter size={14} className="text-gray-400" />
                <select
                  id="sentiment-filter"
                  value={sentimentFilter}
                  onChange={(e) => setSentimentFilter(e.target.value)}
                  className="bg-transparent text-sm focus:outline-none text-gray-700"
                >
                  <option value="all">All Sentiment</option>
                  <option value="positive">Positive</option>
                  <option value="negative">Negative</option>
                  <option value="neutral">Neutral</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {companies.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    EIC Score
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                    onClick={() => handleSort('sentiment_score')}
                  >
                    <div className="flex items-center gap-1">
                      Sentiment <SortIndicator col="sentiment_score" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                    onClick={() => handleSort('news_count')}
                  >
                    <div className="flex items-center gap-1">
                      Articles <SortIndicator col="news_count" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {companies.map((company, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {company.companyName}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {company.eicScore !== null ? (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${
                          company.eicScore >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          company.eicScore >= 40 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {Math.round(company.eicScore)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getSentimentBadge(company.dominantSentiment)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              company.dominantSentiment === 'positive' ? 'bg-emerald-500' :
                              company.dominantSentiment === 'negative' ? 'bg-red-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${(company.avgSentimentScore * 100).toFixed(0)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {(company.avgSentimentScore * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Newspaper size={14} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{company.newsCount}</span>
                        <div className="flex gap-1 ml-1">
                          {company.positiveCount > 0 && (
                            <span className="w-2 h-2 bg-emerald-500 rounded-full" title={`${company.positiveCount} positive`} />
                          )}
                          {company.negativeCount > 0 && (
                            <span className="w-2 h-2 bg-red-500 rounded-full" title={`${company.negativeCount} negative`} />
                          )}
                          {company.neutralCount > 0 && (
                            <span className="w-2 h-2 bg-amber-500 rounded-full" title={`${company.neutralCount} neutral`} />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {company.lastUpdated ? new Date(company.lastUpdated).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      }) : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        id={`view-${company.companyName.replace(/\s+/g, '-').toLowerCase()}`}
                        onClick={() => navigate(`/investor/news/${encodeURIComponent(company.companyName)}`)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors"
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-16 text-center">
              <Newspaper size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No News Data Available</h3>
              <p className="text-gray-400 max-w-md mx-auto">
                News data is populated daily via the GDELT pipeline. Run the pipeline to see sentiment analysis here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}