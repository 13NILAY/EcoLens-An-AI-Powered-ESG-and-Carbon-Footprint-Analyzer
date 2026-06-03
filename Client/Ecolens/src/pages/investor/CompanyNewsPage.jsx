// pages/investor/CompanyNewsPage.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ExternalLink, TrendingUp, TrendingDown, Activity,
  Newspaper, Loader, AlertCircle, Lightbulb, Clock, Globe, Shield
} from 'lucide-react'
import { getAuthToken } from '../../services/auth'
import { getCompanyNews } from '../../services/investor'

export default function CompanyNewsPage() {
  const { companyName } = useParams()
  const decodedName = decodeURIComponent(companyName)
  const token = getAuthToken()
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await getCompanyNews(token, decodedName)
        setData(result)
      } catch (err) {
        console.error('Error:', err)
        setError('Failed to load company news.')
      } finally {
        setLoading(false)
      }
    }
    if (token && decodedName) fetchData()
  }, [token, decodedName])

  const getSentimentConfig = (label) => {
    const configs = {
      positive: { color: 'emerald', icon: TrendingUp, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
      negative: { color: 'red', icon: TrendingDown, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
      neutral: { color: 'amber', icon: Activity, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' }
    }
    return configs[label] || configs.neutral
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now - d) / 1000)
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`
    if (diff < 172800) return 'Yesterday'
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading company news...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-12">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 flex items-start gap-4">
          <AlertCircle className="w-7 h-7 text-red-600 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-bold text-red-900 mb-2">Error</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button onClick={() => navigate('/investor/news')} className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors">
              Back to News
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const sentimentCfg = getSentimentConfig(data.dominantSentiment)
  const SentimentIcon = sentimentCfg.icon
  const summary = data.articles?.[0]?.summary || 'No recent analysis available for this company.'

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Back Button */}
      <button
        onClick={() => navigate('/investor/news')}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
      >
        <ArrowLeft size={18} />
        Back to News Dashboard
      </button>

      {/* Section 1 — Company Header */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{data.companyName}</h1>
              <div className="flex items-center gap-4 flex-wrap">
                {data.eicScore !== null && (
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold text-sm ${
                    data.eicScore >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    data.eicScore >= 40 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    <Shield size={16} />
                    EIC Score: {Math.round(data.eicScore)}
                  </div>
                )}
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold text-sm ${sentimentCfg.bg} ${sentimentCfg.text} ${sentimentCfg.border}`}>
                  <SentimentIcon size={16} />
                  Sentiment: {(data.dominantSentiment || 'neutral').charAt(0).toUpperCase() + (data.dominantSentiment || 'neutral').slice(1)}
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border bg-gray-50 text-gray-700 border-gray-200 font-semibold text-sm">
                  <Newspaper size={16} />
                  {data.totalArticles} Recent Articles
                </div>
              </div>
            </div>

            {/* Sentiment Breakdown */}
            <div className="flex items-center gap-6 bg-white/80 rounded-xl p-4 border border-gray-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{data.positiveCount}</div>
                <div className="text-xs text-gray-500 font-medium">Positive</div>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{data.negativeCount}</div>
                <div className="text-xs text-gray-500 font-medium">Negative</div>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{data.neutralCount}</div>
                <div className="text-xs text-gray-500 font-medium">Neutral</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2 — Investor Insight Box */}
      <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-slate-50 rounded-2xl border border-indigo-100 p-7">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
            <Lightbulb size={20} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">AI Investor Insight</h3>
            <p className="text-gray-700 leading-relaxed">{summary}</p>
            <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
              <Clock size={12} />
              Analysis based on {data.totalArticles} recent articles • Updated via daily FinBERT pipeline
            </p>
          </div>
        </div>
      </div>

      {/* Section 3 — News Feed */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Recent News Coverage</h2>
          <p className="text-sm text-gray-500 mt-1">Latest articles analyzed for sentiment</p>
        </div>

        {data.articles && data.articles.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {data.articles.map((article) => {
              const cfg = getSentimentConfig(article.sentimentLabel)
              const ArticleIcon = cfg.icon
              return (
                <div key={article.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Sentiment + Source Header */}
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          <ArticleIcon size={12} />
                          {(article.sentimentLabel || 'neutral').charAt(0).toUpperCase() + (article.sentimentLabel || 'neutral').slice(1)}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Globe size={12} />
                          {article.source}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={12} />
                          {formatDate(article.publishedAt)}
                        </span>
                      </div>

                      {/* Headline */}
                      <h4 className="text-base font-semibold text-gray-900 mb-2 leading-snug">
                        {article.headline}
                      </h4>

                      {/* Confidence Bar */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Confidence:</span>
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${cfg.dot}`}
                            style={{ width: `${(article.confidence * 100).toFixed(0)}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-500">
                          {(article.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Read Article Button */}
                    {article.url && (
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors flex-shrink-0"
                      >
                        Read Article
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-16 text-center">
            <Newspaper size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Articles Found</h3>
            <p className="text-gray-400">No recent news articles are available for this company.</p>
          </div>
        )}
      </div>
    </div>
  )
}
