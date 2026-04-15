import { useState, useRef, useEffect } from 'react'
import { Upload, FileText, X, CheckCircle, AlertCircle, Cloud, Loader2, TrendingUp, RefreshCw, WifiOff, ServerCrash, FileWarning } from 'lucide-react'
import { getAuthToken } from '../../services/auth'
import { uploadCompanyReport } from '../../services/company'
import { useNavigate } from 'react-router-dom'

// All 11 ESG metric display labels + units
const METRIC_LABELS = {
  scope1: { label: 'Scope 1 Emissions', unit: 'tCO₂e' },
  scope2: { label: 'Scope 2 Emissions', unit: 'tCO₂e' },
  scope3: { label: 'Scope 3 Emissions', unit: 'tCO₂e' },
  carbonFootprint: { label: 'Carbon Footprint', unit: 'tCO₂e' },
  energy: { label: 'Energy Consumption', unit: 'MJ' },
  water: { label: 'Water Usage', unit: 'KL' },
  waste: { label: 'Waste Generated', unit: 'MT' },
  genderDiversity: { label: 'Gender Diversity', unit: '%' },
  safetyIncidents: { label: 'Safety Incidents', unit: '' },
  employeeWellbeing: { label: 'Employee Wellbeing', unit: '%' },
  dataBreaches: { label: 'Data Breaches', unit: '' },
  complaints: { label: 'Complaints', unit: '' },
}

/**
 * Classify error type for user-friendly messaging
 */
const classifyError = (err) => {
  if (!navigator.onLine || err.message?.includes('fetch') || err.message?.includes('network') || err.message?.includes('Failed to fetch')) {
    return { type: 'network', message: 'Network error — please check your internet connection and try again.', icon: WifiOff }
  }
  if (err.response?.status === 500 || err.message?.includes('Server') || err.message?.includes('500')) {
    return { type: 'server', message: 'Server error — our servers are having trouble. Please try again later.', icon: ServerCrash }
  }
  if (err.message?.includes('extraction') || err.message?.includes('Flask') || err.message?.includes('processing')) {
    return { type: 'extraction', message: 'Extraction failed — the file could not be processed. Please check the file format and try again.', icon: FileWarning }
  }
  return { type: 'unknown', message: err.response?.data?.message || err.message || 'Upload failed. Please try again.', icon: AlertCircle }
}

export default function UploadPage() {
  const token = getAuthToken()
  const navigate = useNavigate()
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [autoRedirectTimer, setAutoRedirectTimer] = useState(null)
  const fileInputRef = useRef(null)

  // Auto-redirect when all files are processed
  useEffect(() => {
    if (uploadedFiles.length === 0) return

    const allCompleted = uploadedFiles.every(f => f.status === 'completed')
    const hasCompleted = uploadedFiles.some(f => f.status === 'completed')

    if (allCompleted && hasCompleted) {
      // Start 3-second countdown
      setAutoRedirectTimer(3)
      
      const interval = setInterval(() => {
        setAutoRedirectTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            navigate('/company/dashboard')
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [uploadedFiles, navigate])

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files)
    handleFiles(files)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  const handleFiles = (files) => {
    const validFiles = files.filter(file => 
      file.type === 'application/pdf' || 
      file.name.endsWith('.csv') ||
      file.type === 'text/csv'
    )

    if (validFiles.length === 0) {
      alert('Please upload PDF or CSV files only')
      return
    }

    // Duplicate prevention: filter out files with names already uploaded
    const existingNames = new Set(uploadedFiles.map(f => f.name))
    const uniqueFiles = validFiles.filter(file => {
      if (existingNames.has(file.name)) {
        alert(`File "${file.name}" has already been uploaded.`)
        return false
      }
      return true
    })

    if (uniqueFiles.length === 0) return

    const newFiles = uniqueFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      progress: 0,
      error: null,
      errorInfo: null,
      metrics: null
    }))

    setUploadedFiles(prev => [...prev, ...newFiles])
    
    // Upload each file
    newFiles.forEach(file => {
      uploadFileToBackend(file.id, file.file)
    })
  }

  const uploadFileToBackend = async (fileId, file) => {
    try {
      // Reset error state if retrying
      setUploadedFiles(prev =>
        prev.map(f =>
          f.id === fileId
            ? { ...f, status: 'uploading', progress: 0, error: null, errorInfo: null }
            : f
        )
      )

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === fileId && f.progress < 90
              ? { ...f, progress: Math.min(f.progress + 10, 90) }
              : f
          )
        )
      }, 200)

      const formData = new FormData()
      formData.append('report', file)

      // Call backend API
      const response = await uploadCompanyReport(formData, token)

      clearInterval(progressInterval)

      // Update with success
      setUploadedFiles(prev =>
        prev.map(f =>
          f.id === fileId
            ? { 
                ...f, 
                status: 'completed', 
                progress: 100,
                metrics: response.data?.metrics,
                scores: response.data?.scores
              }
            : f
        )
      )

    } catch (err) {
      console.error('Upload error:', err)
      const errorInfo = classifyError(err)
      
      setUploadedFiles(prev =>
        prev.map(f =>
          f.id === fileId
            ? { 
                ...f, 
                status: 'error', 
                progress: 0,
                error: errorInfo.message,
                errorInfo
              }
            : f
        )
      )
    }
  }

  const retryUpload = (fileId) => {
    const fileEntry = uploadedFiles.find(f => f.id === fileId)
    if (fileEntry && fileEntry.file) {
      uploadFileToBackend(fileId, fileEntry.file)
    }
  }

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={18} className="text-emerald-500" />
      case 'uploading':
        return <Loader2 size={18} className="text-emerald-500 animate-spin" />
      case 'error':
        return <AlertCircle size={18} className="text-red-500" />
      default:
        return <Cloud size={18} className="text-gray-400" />
    }
  }

  const getFileIcon = (type) => {
    if (type === 'application/pdf') return '📄'
    return '📊'
  }

  const renderFileStatus = (file) => {
    if (file.error) {
      const ErrorIcon = file.errorInfo?.icon || AlertCircle
      return (
        <div className="flex items-center gap-2">
          <ErrorIcon size={18} className="text-red-500" />
          <span className="text-sm text-red-600 font-medium">{file.error}</span>
        </div>
      )
    }

    if (file.status === 'uploading') {
      return (
        <div className="flex items-center gap-2">
          {getStatusIcon(file.status)}
          <span className="text-sm text-emerald-600 font-medium">Processing... {file.progress}%</span>
        </div>
      )
    }

    if (file.status === 'completed') {
      return (
        <div className="flex items-center gap-2">
          {getStatusIcon(file.status)}
          <div className="flex flex-col">
            <span className="text-sm text-emerald-600 font-semibold">✓ Processed Successfully</span>
            {file.scores && (
              <span className="text-xs text-gray-500">
                ESG Score: {file.scores.overall?.toFixed(1) || 'N/A'} ({file.scores.grade || 'N/A'})
              </span>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2">
        {getStatusIcon(file.status)}
        <span className="text-sm text-gray-500 capitalize">{file.status}</span>
      </div>
    )
  }

  /**
   * Render ALL 11 ESG metrics from upload response
   * Uses raw values exactly as returned — NO normalization
   */
  const renderMetricsPreview = (file) => {
    if (file.status !== 'completed' || !file.metrics) return null

    const metricsToShow = Object.entries(METRIC_LABELS)
      .map(([key, config]) => ({
        key,
        label: config.label,
        unit: config.unit,
        value: file.metrics[key],
      }))
      .filter(m => m.value !== null && m.value !== undefined)

    if (metricsToShow.length === 0) return null

    return (
      <div className="mt-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Extracted Metrics ({metricsToShow.length} of 11)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {metricsToShow.map(({ key, label, unit, value }) => (
            <div key={key} className="bg-white rounded-lg p-2 border border-gray-200">
              <div className="text-xs text-gray-500 truncate">{label}</div>
              <div className="text-sm font-bold text-gray-900">
                {typeof value === 'number' ? value.toLocaleString() : value}
                {unit ? ` ${unit}` : ''}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const hasCompletedFiles = uploadedFiles.some(f => f.status === 'completed')

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <Upload className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Upload ESG Reports</h1>
            <p className="text-gray-600 text-lg mt-1">
              AI-powered analysis of your sustainability data
            </p>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-3xl p-16 text-center transition-all duration-300 mb-8
          ${isDragging 
            ? 'border-emerald-500 bg-emerald-50/50 scale-[1.02] shadow-lg' 
            : 'border-gray-300 hover:border-emerald-400 hover:bg-gray-50/50'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="max-w-2xl mx-auto">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
            <Upload className="text-white" size={40} />
          </div>
          
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Drop Your Reports Here
          </h3>
          
          <p className="text-gray-600 mb-8 text-lg leading-relaxed">
            Upload sustainability reports in PDF or CSV format. Our AI will automatically extract 
            carbon emissions, energy consumption, water usage, and calculate your ESG scores.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <CheckCircle size={24} className="text-emerald-500 mx-auto mb-3" />
              <div className="font-semibold text-gray-900 mb-1">Multi-format Support</div>
              <div className="text-sm text-gray-600">PDF & CSV files</div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <TrendingUp size={24} className="text-emerald-500 mx-auto mb-3" />
              <div className="font-semibold text-gray-900 mb-1">AI Extraction</div>
              <div className="text-sm text-gray-600">All 11 ESG metrics</div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <Cloud size={24} className="text-emerald-500 mx-auto mb-3" />
              <div className="font-semibold text-gray-900 mb-1">Secure Storage</div>
              <div className="text-sm text-gray-600">Encrypted & confidential</div>
            </div>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:shadow-xl hover:scale-105 transition-all duration-300 inline-flex items-center gap-3"
          >
            <FileText size={22} />
            Select Files
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.csv"
            onChange={handleFileInput}
            className="hidden"
          />

          <p className="text-sm text-gray-500 mt-6">
            Maximum file size: 50MB per file • Supported formats: PDF, CSV
          </p>
        </div>
      </div>

      {/* Auto-redirect notification */}
      {autoRedirectTimer !== null && autoRedirectTimer > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle size={24} className="text-emerald-600" />
            <div>
              <div className="font-semibold text-emerald-900">All reports processed successfully!</div>
              <div className="text-sm text-emerald-700">Redirecting to dashboard in {autoRedirectTimer} seconds...</div>
            </div>
          </div>
          <button
            onClick={() => navigate('/company/dashboard')}
            className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
          >
            Go Now
          </button>
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Processing Queue</h3>
            <div className="text-sm text-gray-600">
              {uploadedFiles.filter(f => f.status === 'completed').length} / {uploadedFiles.length} completed
            </div>
          </div>
          
          <div className="space-y-4">
            {uploadedFiles.map((file) => (
              <div 
                key={file.id} 
                className={`
                  flex flex-col p-6 rounded-2xl border-2 transition-all duration-300
                  ${file.status === 'completed' 
                    ? 'bg-emerald-50/50 border-emerald-200' 
                    : file.status === 'error'
                    ? 'bg-red-50/50 border-red-200'
                    : 'bg-gray-50 border-gray-200'
                  }
                `}
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{getFileIcon(file.type)}</div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="font-semibold text-gray-900 truncate text-lg">{file.name}</div>
                      {renderFileStatus(file)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span>{file.type === 'application/pdf' ? 'PDF Document' : 'CSV Data'}</span>
                    </div>

                    {/* Progress bar */}
                    {file.status === 'uploading' && (
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Retry button for failed uploads */}
                    {file.status === 'error' && (
                      <button
                        onClick={() => retryUpload(file.id)}
                        className="p-3 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-all flex items-center gap-1 text-sm font-medium"
                        title="Retry upload"
                      >
                        <RefreshCw size={18} />
                        Retry
                      </button>
                    )}
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* All 11 metrics preview — raw values, no normalization */}
                {renderMetricsPreview(file)}
              </div>
            ))}
          </div>

          {/* Manual redirect button */}
          {hasCompletedFiles && !autoRedirectTimer && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => navigate('/company/dashboard')}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-5 rounded-2xl font-bold text-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-3"
              >
                <TrendingUp size={22} />
                View Dashboard & Analytics
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
