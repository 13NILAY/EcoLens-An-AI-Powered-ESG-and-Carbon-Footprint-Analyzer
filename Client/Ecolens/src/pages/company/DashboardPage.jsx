  // pages/company/DashboardPage.jsx
  import { useState, useEffect } from 'react'
  import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Download, Calendar, Loader, AlertCircle } from 'lucide-react'
  import { 
    PieChart, Pie, Cell, LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
  } from 'recharts'
  import { getAuthToken } from '../../services/auth'
  import { getCompanyDashboard, exportDashboardReport } from '../../services/company'

  export default function DashboardPage() {
    const token = getAuthToken()
    const [timeRange, setTimeRange] = useState('1y')
    // Data states
    const [esgData, setEsgData] = useState(null)
    const [carbonData, setCarbonData] = useState(null)
    const [esgTrendData, setEsgTrendData] = useState([])
    const [kpiData, setKpiData] = useState(null)
    const [recommendations, setRecommendations] = useState([])
    
    // Loading and error states
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [exporting, setExporting] = useState(false)

    // Fetch dashboard data when token or timeRange changes
    useEffect(() => {
      const fetchDashboardData = async () => {
        try {
          setLoading(true)
          setError(null)

          const response = await getCompanyDashboard(token, timeRange);
          const data = response.data;

          // Process summary data with safe defaults
          if (response && data) {
            setEsgData({
              overall: data.esgScore ?? 0,
              environmental: data.environmentalScore ?? 0,
              social: data.socialScore ?? 0,
              governance: data.governanceScore ?? 0
            });

            // KPI data — no fake trend/change fields
            setKpiData([
              { name: 'Carbon Emissions', value: data.carbonEmissions ?? 'N/A' },
              { name: 'Energy Consumption', value: data.energyConsumption ?? 'N/A' },
              { name: 'Water Usage', value: data.waterUsage ?? 'N/A' },
              { name: 'Waste Generated', value: data.wasteGenerated ?? 'N/A' },
            ]);

            // Recommendations with safe default
            setRecommendations(data.recommendations || [])
          }

          // Process emissions breakdown with safe defaults
          if (data.emissionsBreakdown) {
            const breakdown = data.emissionsBreakdown;
            setCarbonData([
              { name: 'Scope 1', value: breakdown.scope1 ?? 0, color: '#10B981' },
              { name: 'Scope 2', value: breakdown.scope2 ?? 0, color: '#3B82F6' },
              { name: 'Scope 3', value: breakdown.scope3 ?? 0, color: '#EF4444' },
            ])
          } else {
            setCarbonData([
              { name: 'Scope 1', value: 0, color: '#10B981' },
              { name: 'Scope 2', value: 0, color: '#3B82F6' },
              { name: 'Scope 3', value: 0, color: '#EF4444' },
            ])
          }

          // ESG trend — always fallback to empty array
          setEsgTrendData(data.trend || []);

        } catch (err) {
          console.error('Error fetching dashboard data:', err)
          setError('Failed to load dashboard data. Please try again later.')
        } finally {
          setLoading(false)
        }
      }

      if (token) {
        fetchDashboardData()
      }
    }, [token, timeRange])

    const handleExport = async () => {
      try {
        setExporting(true)
        await exportDashboardReport(token)
      } catch (err) {
        console.error('Export error:', err)
        alert(err.message || 'Failed to export report')
      } finally {
        setExporting(false)
      }
    }

    const getImpactColor = (impact) => {
      switch (impact) {
        case 'High': return 'bg-red-100 text-red-800'
        case 'Medium': return 'bg-yellow-100 text-yellow-800'
        case 'Low': return 'bg-blue-100 text-blue-800'
        default: return 'bg-gray-100 text-gray-800'
      }
    }

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
            <button 
              onClick={handleExport}
              disabled={exporting}
              className="bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {exporting ? (
                <Loader size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              {exporting ? 'Exporting...' : 'Export Report'}
            </button>
          </div>
        </div>

        {/* ESG Score Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Overall ESG Score */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Overall ESG Score</h3>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-emerald-600 mb-2">{esgData?.overall ?? 0}</div>
              <div className="text-sm text-gray-500">out of 100</div>
              <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${esgData?.overall ?? 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Environmental Score */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Environmental</h3>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600 mb-2">{esgData?.environmental ?? 0}</div>
              <div className="text-sm text-gray-500">Carbon, Energy, Waste</div>
            </div>
          </div>

          {/* Social Score */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Social</h3>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{esgData?.social ?? 0}</div>
              <div className="text-sm text-gray-500">Labor, Diversity, Community</div>
            </div>
          </div>

          {/* Governance Score */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Governance</h3>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">{esgData?.governance ?? 0}</div>
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
              {carbonData && carbonData.some(d => d.value > 0) ? (
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
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No emissions data available
                </div>
              )}
            </div>
            {carbonData && (
              <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                {carbonData.map((item, index) => (
                  <div key={index} className="text-sm">
                    <div className="font-semibold" style={{ color: item.color }}>{item.name}</div>
                    <div className="text-gray-600">{item.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ESG Score Trend Chart */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">ESG Score Trend</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar size={16} />
                <span>Last 12 Reports</span>
              </div>
            </div>
            <div className="h-80">
              {esgTrendData && esgTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={esgTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} label={{ value: 'ESG Score', angle: -90, position: 'insideLeft' }} />
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
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No trend data available yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KPIs and Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Key Metrics — no fake trend/change fields */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Key Performance Indicators</h3>
            <div className="space-y-4">
              {kpiData && kpiData.map((kpi, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <div className="font-semibold text-gray-900">{kpi.name}</div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</div>
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
              {recommendations && recommendations.length > 0 ? (
                recommendations.map((rec, index) => (
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
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No recommendations available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }