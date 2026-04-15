/**
 * Company Service
 * Handles all company-specific API calls with JWT authentication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

/**
 * Get company dashboard data with time range filtering
 * @param {string} token - JWT token
 * @param {string} range - Time range: 1m, 3m, 1y, ytd
 */
export const getCompanyDashboard = async (token, range = '1y') => {
  const response = await fetch(`${API_BASE_URL}/api/company/dashboard?range=${range}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch dashboard');
  }

  return await response.json();
};

/**
 * Upload sustainability report
 * @param {FormData} formData - Form data with file
 * @param {string} token - JWT token
 * @returns {Promise<Object>} - Upload result
 */
export const uploadCompanyReport = async (formData, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/company/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Don't set Content-Type - browser will set it as multipart/form-data
      },
      body: formData
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Upload failed')
    }

    return data
  } catch (error) {
    throw error
  }
}

/**
 * Get company reports with pagination and search
 * @param {string} token - JWT token
 * @param {Object} options - { page, limit, search }
 * @returns {Promise<Object>} - List of uploaded reports with pagination info
 */
export const getCompanyReports = async (token, { page = 1, limit = 10, search = '' } = {}) => {
  try {
    const params = new URLSearchParams({ page, limit })
    if (search) params.append('search', search)

    const response = await fetch(`${API_BASE_URL}/api/company/reports?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch reports')
    }

    return await response.json()
  } catch (error) {
    throw error
  }
}

/**
 * Get single report with all metrics and scores
 * @param {string|number} id - Report ID
 * @param {string} token - JWT token
 */
export const getReportById = async (id, token) => {
  const response = await fetch(`${API_BASE_URL}/api/company/reports/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch report details')
  }

  return await response.json()
}

/**
 * Export report as PDF
 * @param {string|number} id - Report ID
 * @param {string} token - JWT token
 */
export const exportReport = async (id, token) => {
  const response = await fetch(`${API_BASE_URL}/api/company/reports/${id}/export`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error('Failed to export report')
  }

  // Download the PDF blob
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `ESG_Report_${id}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * Download original report file
 * @param {string|number} id - Report ID
 * @param {string} token - JWT token
 */
export const downloadReport = async (id, token) => {
  const response = await fetch(`${API_BASE_URL}/api/company/reports/${id}/download`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error('Failed to download report')
  }

  const data = await response.json()
  
  // Open Cloudinary URL in new tab to trigger download
  window.open(data.data.downloadUrl, '_blank')
}

/**
 * Export dashboard as PDF (latest report)
 * Uses the latest report's export endpoint
 * @param {string} token - JWT token
 */
export const exportDashboardReport = async (token) => {
  // First get the latest report ID
  const reportsData = await getCompanyReports(token, { page: 1, limit: 1 })
  
  if (reportsData.data && reportsData.data.length > 0) {
    const latestId = reportsData.data[0].id
    await exportReport(latestId, token)
  } else {
    throw new Error('No reports available to export')
  }
}
