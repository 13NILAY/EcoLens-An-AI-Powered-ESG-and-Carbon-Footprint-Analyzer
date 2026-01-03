// pages/company/HistoryPage.jsx
import { useState } from 'react'
import { FileText, Download, Calendar, BarChart3, Eye, Filter } from 'lucide-react'

export default function HistoryPage() {
  const [filter, setFilter] = useState('all')
  
  // Mock data - Replace with real data from your API
  const reportHistory = [
    {
      id: 1,
      name: 'Sustainability Report 2024',
      date: '2024-12-01',
      type: 'PDF',
      size: '2.4 MB',
      score: 82,
      status: 'processed',
      emissions: {
        scope1: 45,
        scope2: 25,
        scope3: 30
      }
    },
    {
      id: 2,
      name: 'Carbon Emissions Q3 2024',
      date: '2024-09-15',
      type: 'CSV',
      size: '1.2 MB',
      score: 78,
      status: 'processed',
      emissions: {
        scope1: 48,
        scope2: 28,
        scope3: 32
      }
    },
    {
      id: 3,
      name: 'Environmental Compliance 2024',
      date: '2024-06-30',
      type: 'PDF',
      size: '3.1 MB',
      score: 75,
      status: 'processed',
      emissions: {
        scope1: 52,
        scope2: 30,
        scope3: 35
      }
    },
    {
      id: 4,
      name: 'Q2 Energy Consumption',
      date: '2024-04-15',
      type: 'CSV',
      size: '0.8 MB',
      score: 80,
      status: 'processed',
      emissions: {
        scope1: 50,
        scope2: 28,
        scope3: 33
      }
    }
  ]

  const filteredReports = filter === 'all' 
    ? reportHistory 
    : reportHistory.filter(report => report.type.toLowerCase() === filter)

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
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
                  <h3 className="font-semibold text-gray-900">{report.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <Calendar size={14} />
                    <span>{formatDate(report.date)}</span>
                  </div>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getScoreColor(report.score)}`}>
                {report.score}
              </div>
            </div>

            {/* File Info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">File Type</span>
                <span className="font-medium text-gray-900">{report.type}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">File Size</span>
                <span className="font-medium text-gray-900">{report.size}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span className="font-medium text-emerald-600 capitalize">{report.status}</span>
              </div>
            </div>

            {/* Emissions Breakdown */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Emissions Breakdown</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Scope 1</span>
                  <span className="font-medium text-gray-900">{report.emissions.scope1}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Scope 2</span>
                  <span className="font-medium text-gray-900">{report.emissions.scope2}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Scope 3</span>
                  <span className="font-medium text-gray-900">{report.emissions.scope3}%</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              <button className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 justify-center">
                <Eye size={16} />
                View Analysis
              </button>
              <button className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 justify-center">
                <Download size={16} />
                Download
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredReports.length === 0 && (
        <div className="text-center py-12">
          <FileText size={64} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
          <p className="text-gray-500 mb-6">
            {filter === 'all' 
              ? "You haven't uploaded any sustainability reports yet."
              : `No ${filter.toUpperCase()} files found.`
            }
          </p>
          <button className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors">
            Upload Your First Report
          </button>
        </div>
      )}
    </div>
  )
}