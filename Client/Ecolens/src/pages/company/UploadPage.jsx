// pages/company/UploadPage.jsx
import { useState, useRef } from 'react'
import { Upload, FileText, X, CheckCircle, AlertCircle, Cloud } from 'lucide-react'

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState({})
  const fileInputRef = useRef(null)

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
  }

  const handleFiles = (files) => {
    const validFiles = files.filter(file => 
      file.type === 'application/pdf' || 
      file.name.endsWith('.csv') ||
      file.type === 'text/csv'
    )

    const newFiles = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading', // uploading, processing, completed, error
      progress: 0
    }))

    setUploadedFiles(prev => [...prev, ...newFiles])
    
    // Simulate upload progress
    newFiles.forEach(file => {
      simulateUpload(file.id)
    })
  }

  const simulateUpload = (fileId) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 10
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === fileId 
              ? { ...f, status: 'processing', progress: 100 }
              : f
          )
        )

        // Simulate processing
        setTimeout(() => {
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === fileId 
                ? { ...f, status: 'completed' }
                : f
            )
          )
        }, 1500)
      } else {
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === fileId 
              ? { ...f, progress }
              : f
          )
        )
      }
    }, 200)
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

  const getFileIcon = (fileType) => {
    if (fileType === 'application/pdf') return '📄'
    if (fileType === 'text/csv' || fileType.endsWith('.csv')) return '📊'
    return '📁'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-emerald-500" />
      case 'processing':
        return <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      case 'error':
        return <AlertCircle size={16} className="text-red-500" />
      default:
        return <Cloud size={16} className="text-gray-400" />
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Sustainability Reports</h1>
        <p className="text-lg text-gray-600">
          Upload your PDF or CSV reports for AI-powered ESG analysis and carbon footprint calculation.
        </p>
      </div>

      {/* Upload Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 mb-8
          ${isDragging 
            ? 'border-emerald-500 bg-emerald-50 scale-105' 
            : 'border-gray-300 hover:border-emerald-400 hover:bg-gray-50'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Upload className="text-white" size={32} />
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Drag & Drop Your Files
          </h3>
          
          <p className="text-gray-600 mb-6 text-lg">
            Upload sustainability reports in PDF or CSV format. 
            We'll extract carbon emissions, energy usage, and other ESG metrics automatically.
          </p>

          <div className="space-y-3 text-sm text-gray-500 mb-8">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle size={16} className="text-emerald-500" />
              <span>Supports PDF and CSV files</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle size={16} className="text-emerald-500" />
              <span>Automatic data extraction with AI</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle size={16} className="text-emerald-500" />
              <span>Secure and confidential</span>
            </div>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg hover:scale-105 transition-all duration-300 inline-flex items-center gap-3"
          >
            <FileText size={20} />
            Choose Files
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.csv"
            onChange={handleFileInput}
            className="hidden"
          />

          <p className="text-sm text-gray-500 mt-4">
            Maximum file size: 50MB per file
          </p>
        </div>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Uploaded Files</h3>
          
          <div className="space-y-4">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="text-2xl">{getFileIcon(file.type)}</div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="font-medium text-gray-900 truncate">{file.name}</div>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(file.status)}
                      <span className="text-sm text-gray-500 capitalize">{file.status}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span>{file.type === 'application/pdf' ? 'PDF Document' : 'CSV Data'}</span>
                  </div>

                  {/* Progress bar */}
                  {file.status === 'uploading' && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1 text-right">
                        {Math.round(file.progress)}% uploaded
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => removeFile(file.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            ))}
          </div>

          {/* Process Button */}
          {uploadedFiles.some(f => f.status === 'completed') && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg hover:scale-105 transition-all duration-300">
                Process All Reports
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}