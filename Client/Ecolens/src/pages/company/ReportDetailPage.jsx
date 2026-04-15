// pages/company/ReportDetailPage.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Download, FileText, Calendar, Loader, AlertCircle, 
  Leaf, Users, Shield, BarChart3, Zap, Droplets, Trash2, 
  HeartPulse, AlertTriangle, Lock, MessageSquare
} from 'lucide-react'
import { getAuthToken } from '../../services/auth'
import { getReportById, exportReport, downloadReport } from '../../services/company'

// Metric display config with icons and categories
const METRIC_CONFIG = {
  SCOPE_1: { label: 'Scope 1 Emissions', icon: Leaf, category: 'Environmental', color: 'emerald' },
  SCOPE_2: { label: 'Scope 2 Emissions', icon: Leaf, category: 'Environmental', color: 'emerald' },
  SCOPE_3: { label: 'Scope 3 Emissions', icon: Leaf, category: 'Environmental', color: 'emerald' },
  CARBON_EMISSIONS: { label: 'Total Carbon Emissions', icon: BarChart3, category: 'Environmental', color: 'emerald' },
  ENERGY_CONSUMPTION: { label: 'Energy Consumption', icon: Zap, category: 'Environmental', color: 'emerald' },
  WATER_USAGE: { label: 'Water Usage', icon: Droplets, category: 'Environmental', color: 'emerald' },
  WASTE_GENERATED: { label: 'Waste Generated', icon: Trash2, category: 'Environmental', color: 'emerald' },
  GENDER_DIVERSITY: { label: 'Gender Diversity', icon: Users, category: 'Social', color: 'blue' },
  SAFETY_INCIDENTS: { label: 'Safety Incidents', icon: AlertTriangle, category: 'Social', color: 'blue' },
  EMPLOYEE_WELLBEING: { label: 'Employee Wellbeing', icon: HeartPulse, category: 'Social', color: 'blue' },
  DATA_BREACHES: { label: 'Data Breaches', icon: Lock, category: 'Governance', color: 'purple' },
  COMPLAINTS: { label: 'Complaints', icon: MessageSquare, category: 'Governance', color: 'purple' },
}

const CATEGORY_COLORS = {
  Environmental: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800' },
  Social: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' },
  Governance: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800' },
}

export default function ReportDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const token = getAuthToken()
  
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getReportById(id, token)
        if (response && response.data) {
          setReport(response.data)
        }
      } catch (err) {
        console.error('Error fetching report:', err)
        setError('Failed to load report details.')
      } finally {
        setLoading(false)
      }
    }

    if (token && id) {
      fetchReport()
    }
  }, [token, id])

  const handleExport = async () => {
    try {
      setExporting(true)
      await exportReport(id, token)
    } catch (err) {
      alert('Failed to export report')
    } finally {
      setExporting(false)
    }
  }

  const handleDownload = async () => {
    try {
      await downloadReport(id, token)
    } catch (err) {
      alert('Failed to download report')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  const getScoreColor = (score) => {
    if (score === null || score === undefined) return 'text-gray-400'
    if (score >= 80) return 'text-emerald-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBarColor = (score) => {
    if (score === null || score === undefined) return 'bg-gray-300'
    if (score >= 80) return 'bg-emerald-500'
    if (score >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading report details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Report</h3>
            <p className="text-red-700">{error}</p>
            <button 
              onClick={() => navigate('/company/history')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Back to History
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!report) return null

  // Group metrics by category
  const metricsByCategory = {}
  if (report.metrics) {
    Object.entries(METRIC_CONFIG).forEach(([key, config]) => {
      const metric = report.metrics[key]
      if (!metricsByCategory[config.category]) {
        metricsByCategory[config.category] = []
      }
      metricsByCategory[config.category].push({
        key,
        ...config,
        value: metric?.value ?? null,
        unit: metric?.unit || '',
      })
    })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Back button + Header */}
      <div>
        <button 
          onClick={() => navigate('/company/history')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to History
        </button>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center">
              <FileText size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{report.fileName || 'Report Details'}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>{formatDate(report.uploadedAt)}</span>
                </div>
                <span>•</span>
                <span>{report.fileType}</span>
                <span>•</span>
                <span className="text-emerald-600 font-medium capitalize">{report.status}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {exporting ? <Loader size={16} className="animate-spin" /> : <Download size={16} />}
              {exporting ? 'Exporting...' : 'Export PDF'}
            </button>
            <button
              onClick={handleDownload}
              className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Download size={16} />
              Download Original
            </button>
          </div>
        </div>
      </div>

      {/* ESG Scores Card */}
      {report.scores && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6">ESG Scores</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Overall */}
            <div className="text-center p-6 bg-gray-50 rounded-2xl">
              <div className="text-sm text-gray-500 mb-2">Overall ESG</div>
              <div className={`text-4xl font-bold ${getScoreColor(report.scores.overall)}`}>
                {report.scores.overall ?? 'N/A'}
              </div>
              {report.scores.grade && (
                <div className="mt-2 inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
                  Grade {report.scores.grade}
                </div>
              )}
              {report.scores.overall && (
                <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                  <div className={`${getScoreBarColor(report.scores.overall)} h-2 rounded-full`} style={{ width: `${report.scores.overall}%` }} />
                </div>
              )}
            </div>
            {/* Environmental */}
            <div className="text-center p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100">
              <div className="text-sm text-emerald-700 mb-2">Environmental</div>
              <div className={`text-3xl font-bold ${getScoreColor(report.scores.environmental)}`}>
                {report.scores.environmental ?? 'N/A'}
              </div>
              {report.scores.environmental && (
                <div className="w-full bg-emerald-100 rounded-full h-2 mt-4">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${report.scores.environmental}%` }} />
                </div>
              )}
            </div>
            {/* Social */}
            <div className="text-center p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
              <div className="text-sm text-blue-700 mb-2">Social</div>
              <div className={`text-3xl font-bold ${getScoreColor(report.scores.social)}`}>
                {report.scores.social ?? 'N/A'}
              </div>
              {report.scores.social && (
                <div className="w-full bg-blue-100 rounded-full h-2 mt-4">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${report.scores.social}%` }} />
                </div>
              )}
            </div>
            {/* Governance */}
            <div className="text-center p-6 bg-purple-50/50 rounded-2xl border border-purple-100">
              <div className="text-sm text-purple-700 mb-2">Governance</div>
              <div className={`text-3xl font-bold ${getScoreColor(report.scores.governance)}`}>
                {report.scores.governance ?? 'N/A'}
              </div>
              {report.scores.governance && (
                <div className="w-full bg-purple-100 rounded-full h-2 mt-4">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${report.scores.governance}%` }} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Raw Metrics — ALL 11, grouped by category */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900">Extracted ESG Metrics</h2>
        <p className="text-sm text-gray-500">Raw values extracted from the report — these are unmodified values directly from the AI extraction pipeline.</p>

        {Object.entries(metricsByCategory).map(([category, metrics]) => {
          const colors = CATEGORY_COLORS[category]
          return (
            <div key={category} className={`${colors.bg} rounded-2xl border ${colors.border} p-6`}>
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.badge}`}>{category}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {metrics.map(({ key, label, icon: Icon, value, unit }) => (
                  <div key={key} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon size={16} className={colors.text} />
                      <span className="text-xs font-medium text-gray-500">{label}</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {value !== null && value !== undefined 
                        ? <>{typeof value === 'number' ? value.toLocaleString() : value} <span className="text-sm font-normal text-gray-500">{unit}</span></>
                        : <span className="text-gray-400 text-sm font-normal">Not Available</span>
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Recommendations */}
      {report.recommendations && report.recommendations.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6">AI Recommendations</h2>
          <div className="space-y-4">
            {report.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-4 p-4 border border-gray-200 rounded-xl">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-600 font-bold text-sm">{index + 1}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                  <p className="text-gray-600 text-sm mt-1">{rec.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {rec.impact} Impact
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {rec.effort} Effort
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
