// pages/investor/NewsPage.jsx
import { useState } from 'react'
import { Calendar, TrendingUp, TrendingDown, ExternalLink, Filter, Search } from 'lucide-react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, BarChart, Bar, Cell 
} from 'recharts'

export default function NewsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [timeRange, setTimeRange] = useState('7d')

  // Mock ESG news data with sentiment
  const esgNews = [
    {
      id: 1,
      title: 'Microsoft Announces 100% Renewable Energy Goal by 2025',
      source: 'ESG Today',
      date: '2024-01-15',
      sentiment: 'positive',
      score: 85,
      category: 'environmental',
      summary: 'Microsoft accelerates its sustainability commitments with new renewable energy targets and carbon removal initiatives.',
      impact: 'high',
      tags: ['Renewable Energy', 'Carbon Neutral', 'Tech'],
      url: '#'
    },
    {
      id: 2,
      title: 'Tesla Faces Labor Controversy at German Factory',
      source: 'Sustainable Biz',
      date: '2024-01-14',
      sentiment: 'negative',
      score: 35,
      category: 'social',
      summary: 'Workers at Tesla Berlin plant raise concerns about working conditions and union representation.',
      impact: 'medium',
      tags: ['Labor', 'Automotive', 'Germany'],
      url: '#'
    },
    {
      id: 3,
      title: 'NextEra Energy Leads Utilities in ESG Performance',
      source: 'Green Investor',
      date: '2024-01-14',
      sentiment: 'positive',
      score: 90,
      category: 'environmental',
      summary: 'NextEra continues to outperform peers in renewable energy adoption and emissions reduction.',
      impact: 'high',
      tags: ['Utilities', 'Renewable', 'Top Performer'],
      url: '#'
    },
    {
      id: 4,
      title: 'Johnson & Johnson Enhances Board Diversity',
      source: 'Governance Weekly',
      date: '2024-01-13',
      sentiment: 'positive',
      score: 78,
      category: 'governance',
      summary: 'J&J appoints two new independent directors, improving board diversity and oversight.',
      impact: 'medium',
      tags: ['Board Diversity', 'Healthcare', 'Governance'],
      url: '#'
    },
    {
      id: 5,
      title: 'Exxon Mobil Faces Climate Litigation Setback',
      source: 'Climate Law Review',
      date: '2024-01-12',
      sentiment: 'negative',
      score: 25,
      category: 'environmental',
      summary: 'Court rules against Exxon in landmark climate disclosure case, requiring more transparency.',
      impact: 'high',
      tags: ['Litigation', 'Oil & Gas', 'Climate'],
      url: '#'
    },
    {
      id: 6,
      title: 'Apple Expands Supplier Sustainability Program',
      source: 'Tech ESG',
      date: '2024-01-12',
      sentiment: 'positive',
      score: 82,
      category: 'social',
      summary: 'Apple launches new initiatives to improve working conditions and environmental practices across its supply chain.',
      impact: 'medium',
      tags: ['Supply Chain', 'Tech', 'Labor'],
      url: '#'
    }
  ]

  // Sentiment trend data
  const sentimentTrend = [
    { day: 'Jan 8', positive: 65, negative: 25, neutral: 10 },
    { day: 'Jan 9', positive: 68, negative: 22, neutral: 10 },
    { day: 'Jan 10', positive: 72, negative: 18, neutral: 10 },
    { day: 'Jan 11', positive: 70, negative: 20, neutral: 10 },
    { day: 'Jan 12', positive: 75, negative: 15, neutral: 10 },
    { day: 'Jan 13', positive: 78, negative: 12, neutral: 10 },
    { day: 'Jan 14', positive: 80, negative: 10, neutral: 10 },
  ]

  // Trending topics
  const trendingTopics = [
    { topic: 'Renewable Energy', count: 142, trend: 'up' },
    { topic: 'Carbon Neutral', count: 128, trend: 'up' },
    { topic: 'Board Diversity', count: 95, trend: 'stable' },
    { topic: 'Supply Chain', count: 87, trend: 'up' },
    { topic: 'Climate Litigation', count: 76, trend: 'up' },
    { topic: 'Labor Rights', count: 65, trend: 'down' },
  ]

  const categories = [
    { id: 'all', name: 'All News', count: esgNews.length },
    { id: 'environmental', name: 'Environmental', count: esgNews.filter(n => n.category === 'environmental').length },
    { id: 'social', name: 'Social', count: esgNews.filter(n => n.category === 'social').length },
    { id: 'governance', name: 'Governance', count: esgNews.filter(n => n.category === 'governance').length },
  ]

  const getSentimentColor = (score) => {
    if (score >= 70) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case 'environmental': return 'text-emerald-600 bg-emerald-50'
      case 'social': return 'text-blue-600 bg-blue-50'
      case 'governance': return 'text-purple-600 bg-purple-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const filteredNews = selectedCategory === 'all' 
    ? esgNews 
    : esgNews.filter(news => news.category === selectedCategory)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ESG News & Sentiment</h1>
          <p className="text-lg text-gray-600">Live ESG news monitoring and sentiment analysis</p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Avg Sentiment</h3>
            <TrendingUp size={20} className="text-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-emerald-600">72.5</div>
          <div className="text-sm text-gray-500 mt-1">+5.2% from last week</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Positive News</h3>
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">+</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-600">68%</div>
          <div className="text-sm text-gray-500 mt-1">of total coverage</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Articles Today</h3>
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">📰</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-600">42</div>
          <div className="text-sm text-gray-500 mt-1">ESG-related articles</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Risk Alerts</h3>
            <TrendingDown size={20} className="text-red-500" />
          </div>
          <div className="text-3xl font-bold text-red-600">8</div>
          <div className="text-sm text-gray-500 mt-1">Negative developments</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sentiment Trend */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Sentiment Trend Over Time</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sentimentTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="positive" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  name="Positive Sentiment"
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="negative" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  name="Negative Sentiment"
                  dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trending Topics */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Trending ESG Topics</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendingTopics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="topic" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" name="Mentions">
                  {trendingTopics.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.trend === 'up' ? '#10B981' : entry.trend === 'down' ? '#EF4444' : '#6B7280'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* News Feed */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">ESG News Feed</h3>
            
            {/* Category Filters */}
            <div className="flex items-center gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category.name} ({category.count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* News List */}
        <div className="divide-y divide-gray-200">
          {filteredNews.map((news) => (
            <div key={news.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(news.category)}`}>
                    {news.category.charAt(0).toUpperCase() + news.category.slice(1)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getImpactColor(news.impact)}`}>
                    {news.impact.toUpperCase()} IMPACT
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSentimentColor(news.score)}`}>
                    Sentiment: {news.score}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar size={14} />
                  {new Date(news.date).toLocaleDateString()}
                </div>
              </div>

              <h4 className="text-lg font-semibold text-gray-900 mb-2">{news.title}</h4>
              <p className="text-gray-600 mb-4">{news.summary}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Source: {news.source}</span>
                  <div className="flex items-center gap-1">
                    {news.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Read Full Article
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}