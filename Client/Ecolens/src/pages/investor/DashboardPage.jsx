// pages/investor/DashboardPage.jsx
import { useState } from 'react'
import { Search, Filter, TrendingUp,BarChart3, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react'
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts'

export default function InvestorDashboard() {
  const [timeRange, setTimeRange] = useState('1y')
  const [selectedIndustry, setSelectedIndustry] = useState('all')
  const [scoreRange, setScoreRange] = useState([0, 100])

  // Mock data - Real companies with realistic ESG scores
  const companiesData = [
    {
      id: 1,
      name: 'Microsoft Corp',
      ticker: 'MSFT',
      industry: 'Technology',
      esgScore: 82,
      sentiment: 78,
      trend: 'up',
      marketCap: '2.1T',
      revenue: '198B',
      environmental: 85,
      social: 80,
      governance: 81,
      lastUpdated: '2024-01-15'
    },
    {
      id: 2,
      name: 'Apple Inc',
      ticker: 'AAPL',
      industry: 'Technology',
      esgScore: 79,
      sentiment: 75,
      trend: 'stable',
      marketCap: '2.8T',
      revenue: '383B',
      environmental: 82,
      social: 76,
      governance: 79,
      lastUpdated: '2024-01-15'
    },
    {
      id: 3,
      name: 'Tesla Inc',
      ticker: 'TSLA',
      industry: 'Automotive',
      esgScore: 68,
      sentiment: 65,
      trend: 'down',
      marketCap: '610B',
      revenue: '96B',
      environmental: 72,
      social: 62,
      governance: 70,
      lastUpdated: '2024-01-14'
    },
    {
      id: 4,
      name: 'Johnson & Johnson',
      ticker: 'JNJ',
      industry: 'Healthcare',
      esgScore: 85,
      sentiment: 82,
      trend: 'up',
      marketCap: '380B',
      revenue: '95B',
      environmental: 83,
      social: 86,
      governance: 86,
      lastUpdated: '2024-01-15'
    },
    {
      id: 5,
      name: 'NextEra Energy',
      ticker: 'NEE',
      industry: 'Utilities',
      esgScore: 88,
      sentiment: 85,
      trend: 'up',
      marketCap: '120B',
      revenue: '28B',
      environmental: 92,
      social: 83,
      governance: 89,
      lastUpdated: '2024-01-14'
    },
    {
      id: 6,
      name: 'Exxon Mobil',
      ticker: 'XOM',
      industry: 'Energy',
      esgScore: 45,
      sentiment: 38,
      trend: 'down',
      marketCap: '410B',
      revenue: '344B',
      environmental: 35,
      social: 52,
      governance: 48,
      lastUpdated: '2024-01-13'
    }
  ]

  const esgTrendData = [
    { month: 'Jul', esg: 72, sentiment: 65 },
    { month: 'Aug', esg: 74, sentiment: 68 },
    { month: 'Sep', esg: 76, sentiment: 70 },
    { month: 'Oct', esg: 75, sentiment: 72 },
    { month: 'Nov', esg: 78, sentiment: 74 },
    { month: 'Dec', esg: 80, sentiment: 76 },
    { month: 'Jan', esg: 82, sentiment: 78 },
  ]

  const industryPerformance = [
    { industry: 'Technology', avgScore: 80, companies: 45, trend: 'up' },
    { industry: 'Healthcare', avgScore: 78, companies: 32, trend: 'up' },
    { industry: 'Utilities', avgScore: 75, companies: 28, trend: 'stable' },
    { industry: 'Financials', avgScore: 72, companies: 65, trend: 'up' },
    { industry: 'Consumer', avgScore: 68, companies: 42, trend: 'stable' },
    { industry: 'Energy', avgScore: 52, companies: 38, trend: 'down' },
  ]

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

  const filteredCompanies = companiesData.filter(company => {
    const industryMatch = selectedIndustry === 'all' || company.industry === selectedIndustry
    const scoreMatch = company.esgScore >= scoreRange[0] && company.esgScore <= scoreRange[1]
    return industryMatch && scoreMatch
  })

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
          <div className="text-3xl font-bold text-emerald-600">76.2</div>
          <div className="text-sm text-gray-500 mt-1">+2.4% from last month</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Performer</h3>
            <CheckCircle size={20} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">NEE</div>
          <div className="text-sm text-gray-500 mt-1">ESG Score: 88</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Companies Tracked</h3>
            <BarChart3 size={20} className="text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-blue-600">250</div>
          <div className="text-sm text-gray-500 mt-1">Across 12 sectors</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Risk Alert</h3>
            <AlertCircle size={20} className="text-red-500" />
          </div>
          <div className="text-3xl font-bold text-red-600">12</div>
          <div className="text-sm text-gray-500 mt-1">Companies below 50</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ESG vs Sentiment Trend */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6">ESG vs Sentiment Trend</h3>
          <div className="h-80">
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
          </div>
        </div>

        {/* Industry Performance */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Industry ESG Performance</h3>
          <div className="h-80">
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
                  <option value="Technology">Technology</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Energy">Energy</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Automotive">Automotive</option>
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
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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