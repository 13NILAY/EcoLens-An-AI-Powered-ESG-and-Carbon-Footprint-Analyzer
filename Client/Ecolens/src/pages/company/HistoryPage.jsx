// pages/company/HistoryPage.jsx
import { useState, useEffect } from 'react'
import { FileText, Download, Calendar, Eye, Filter, Loader, AlertCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getAuthToken } from '../../services/auth'
import { getCompanyReports, downloadReport } from '../../services/company'

export default function HistoryPage() {
  const token = getAuthToken()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Pagination state
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const limit = 9

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1) // Reset to page 1 on search
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch reports when page, search, or token changes
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await getCompanyReports(token, { 
          page, 
          limit, 
          search: debouncedSearch 
        })
        
        if (response && response.data) {
          setReports(response.data)
          setPagination(response.pagination || null)
        }
      } catch (err) {
        console.error('Error fetching reports:', err)
        setError('Failed to load reports. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchReports()
    }
  }, [token, page, debouncedSearch])

  // Client-side type filter (applied on top of server results)
  const filteredReports = filter === 'all' 
    ? reports 
    : reports.filter(report => report.type?.toUpperCase() === filter.toUpperCase())

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getScoreColor = (score) => {
    if (!score) return 'text-gray-600 bg-gray-50 border-gray-200'
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const handleViewAnalysis = (reportId) => {
    navigate(`/company/report/${reportId}`)
  }

  const handleDownload = async (reportId) => {
    try {
      await downloadReport(reportId, token)
    } catch (err) {
      console.error('Download error:', err)
      alert('Failed to download report')
    }
  }

  // Loading state
  if (loading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading reports...</p>
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
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Reports</h3>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Report History</h1>
          <p className="text-lg text-gray-600">View and manage your previously analyzed sustainability reports</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-xl px-4 py-2">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports..."
              className="bg-transparent focus:outline-none text-sm w-40"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-xl px-4 py-2">
            <Filter size={16} className="text-gray-400" />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-transparent focus:outline-none text-sm"
            >
              <option value="all">All Files</option>
              <option value="pdf">PDF Reports</option>
              <option value="csv">CSV Data</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      {filteredReports.length > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <div key={report.id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:border-emerald-200">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <FileText size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{report.name || 'Unnamed Report'}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Calendar size={14} />
                        <span>{formatDate(report.date)}</span>
                      </div>
                    </div>
                  </div>
                  {report.esgScore && (
                    <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getScoreColor(report.esgScore)}`}>
                      {report.esgScore}
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">File Type</span>
                    <span className="font-medium text-gray-900">{report.type || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Grade</span>
                    <span className="font-medium text-gray-900">{report.grade || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Status</span>
                    <span className="font-medium text-emerald-600 capitalize">{report.status || 'processed'}</span>
                  </div>
                </div>

                {/* ESG Score Bars */}
                {(report.environmental || report.social || report.governance) && (
                  <div className="mb-6 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Environmental</span>
                      <span className="font-medium">{report.environmental ?? 'N/A'}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${report.environmental ?? 0}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Social</span>
                      <span className="font-medium">{report.social ?? 'N/A'}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${report.social ?? 0}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Governance</span>
                      <span className="font-medium">{report.governance ?? 'N/A'}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${report.governance ?? 0}%` }} />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <button 
                    onClick={() => handleViewAnalysis(report.id)}
                    className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 justify-center"
                  >
                    <Eye size={16} />
                    View Analysis
                  </button>
                  <button 
                    onClick={() => handleDownload(report.id)}
                    className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 justify-center"
                  >
                    <Download size={16} />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-gray-500">
                Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, pagination.totalReports)} of {pagination.totalReports} reports
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrev}
                  className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-gray-400">…</span>}
                      <button
                        onClick={() => setPage(p)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium ${
                          p === page 
                            ? 'bg-emerald-600 text-white' 
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  ))
                }

                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!pagination.hasNext}
                  className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <FileText size={64} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
          <p className="text-gray-500 mb-6">
            {debouncedSearch
              ? `No reports matching "${debouncedSearch}".`
              : filter === 'all' 
                ? "You haven't uploaded any sustainability reports yet."
                : `No ${filter.toUpperCase()} files found.`
            }
          </p>
          <a href="/company/upload" className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors inline-block">
            Upload Your First Report
          </a>
        </div>
      )}
    </div>
  )
}