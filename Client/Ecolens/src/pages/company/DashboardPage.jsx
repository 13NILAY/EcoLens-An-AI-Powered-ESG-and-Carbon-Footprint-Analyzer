// pages/company/DashboardPage.jsx
import { useState } from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Download, Calendar } from 'lucide-react'
import { 
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState('1y')

  // Mock data - Replace with real data from your API
  const esgData = {
    overall: 78,
    environmental: 82,
    social: 75,
    governance: 72,
    trend: 'up' // up, down, stable
  }

  const carbonData = [
    { name: 'Scope 1', value: 45, color: '#10B981' },
    { name: 'Scope 2', value: 25, color: '#3B82F6' },
    { name: 'Scope 3', value: 30, color: '#EF4444' },
  ]

  const emissionsTrend = [
    { month: 'Jan', emissions: 120, target: 100 },
    { month: 'Feb', emissions: 115, target: 98 },
    { month: 'Mar', emissions: 105, target: 95 },
    { month: 'Apr', emissions: 98, target: 92 },
    { month: 'May', emissions: 92, target: 90 },
    { month: 'Jun', emissions: 88, target: 88 },
    { month: 'Jul', emissions: 85, target: 85 },
    { month: 'Aug', emissions: 82, target: 83 },
    { month: 'Sep', emissions: 78, target: 80 },
    { month: 'Oct', emissions: 75, target: 78 },
    { month: 'Nov', emissions: 72, target: 75 },
    { month: 'Dec', emissions: 70, target: 72 },
  ]

  const kpiData = [
    { name: 'Carbon Emissions', value: '70 tCO₂', change: -12, trend: 'down' },
    { name: 'Energy Consumption', value: '45 MWh', change: -8, trend: 'down' },
    { name: 'Water Usage', value: '120 m³', change: -5, trend: 'down' },
    { name: 'Waste Generated', value: '85 kg', change: 3, trend: 'up' },
  ]

  const recommendations = [
    {
      title: 'Switch to Renewable Energy',
      description: 'Consider transitioning to solar power to reduce Scope 2 emissions by up to 40%',
      impact: 'High',
      effort: 'Medium',
      status: 'pending'
    },
    {
      title: 'Optimize Supply Chain Logistics',
      description: 'Re-route transportation to reduce Scope 3 emissions from supplier deliveries',
      impact: 'Medium',
      effort: 'Low',
      status: 'in-progress'
    },
    {
      title: 'Implement Waste Segregation',
      description: 'Improve recycling rates and reduce landfill waste through better segregation',
      impact: 'Medium',
      effort: 'Low',
      status: 'pending'
    }
  ]

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <TrendingUp size={16} className="text-red-500" />
    if (trend === 'down') return <TrendingDown size={16} className="text-emerald-500" />
    return <div className="w-4 h-4 bg-gray-400 rounded-full" />
  }

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'High': return 'bg-red-100 text-red-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Low': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ESG Analytics Dashboard</h1>
          <p className="text-lg text-gray-600">Comprehensive overview of your sustainability performance</p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="1m">Last Month</option>
            <option value="3m">Last 3 Months</option>
            <option value="1y">Last Year</option>
            <option value="ytd">Year to Date</option>
          </select>
          <button className="bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* ESG Score Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Overall ESG Score */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Overall ESG Score</h3>
            {getTrendIcon(esgData.trend)}
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold text-emerald-600 mb-2">{esgData.overall}</div>
            <div className="text-sm text-gray-500">out of 100</div>
            <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-1000"
                style={{ width: `${esgData.overall}%` }}
              />
            </div>
          </div>
        </div>

        {/* Environmental Score */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Environmental</h3>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-600 mb-2">{esgData.environmental}</div>
            <div className="text-sm text-gray-500">Carbon, Energy, Waste</div>
          </div>
        </div>

        {/* Social Score */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Social</h3>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{esgData.social}</div>
            <div className="text-sm text-gray-500">Labor, Diversity, Community</div>
          </div>
        </div>

        {/* Governance Score */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Governance</h3>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">{esgData.governance}</div>
            <div className="text-sm text-gray-500">Board, Ethics, Transparency</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Carbon Emissions Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Carbon Emissions Breakdown</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={carbonData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {carbonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4 text-center">
            {carbonData.map((item, index) => (
              <div key={index} className="text-sm">
                <div className="font-semibold" style={{ color: item.color }}>{item.name}</div>
                <div className="text-gray-600">{item.value}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Emissions Trend */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Emissions Trend</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar size={16} />
              <span>Last 12 Months</span>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={emissionsTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="emissions" 
                  stroke="#EF4444" 
                  strokeWidth={3}
                  name="Actual Emissions"
                  dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Target"
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* KPIs and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Key Metrics */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Key Performance Indicators</h3>
          <div className="space-y-4">
            {kpiData.map((kpi, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <div className="font-semibold text-gray-900">{kpi.name}</div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</div>
                </div>
                <div className={`flex items-center gap-1 ${kpi.trend === 'down' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {getTrendIcon(kpi.trend)}
                  <span className="font-semibold">{Math.abs(kpi.change)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">AI-Powered Recommendations</h3>
            <AlertTriangle size={20} className="text-yellow-500" />
          </div>
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-4 p-4 border border-gray-200 rounded-xl hover:border-emerald-200 hover:bg-emerald-50 transition-all duration-200">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-3 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(rec.impact)}`}>
                      {rec.impact} Impact
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {rec.effort} Effort
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{rec.description}</p>
                  <div className="flex items-center gap-4">
                    <button className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                      View Details
                    </button>
                    <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
                      Implement
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}