// App.js - Updated with Report Detail, Settings, and Investor Portal
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import EcoLensHomepage from './pages/Homepage'
import CompanyPortal from './pages/CompanyPortal'
import UploadPage from './pages/company/UploadPage'
import DashboardPage from './pages/company/DashboardPage'
import HistoryPage from './pages/company/HistoryPage'
import ReportDetailPage from './pages/company/ReportDetailPage'
import SettingsPage from './pages/company/SettingsPage'
import CompanyProfileSetup from './pages/company/ProfileSetup'
import InvestorPortal from './pages/InvestorPortal'
import InvestorDashboard from './pages/investor/DashboardPage'
import NewsPage from './pages/investor/NewsPage'
import PortfolioBuilder from './pages/investor/PortfolioBuilder'
import ComparisonPage from './pages/investor/ComparisonPage'
import InvestorProfileSetup from './pages/investor/ProfileSetup'
import WBSDiagram from './pages/WBSNode'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import ProtectedRoute from './components/ProtectedRoute'


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<EcoLensHomepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/WBS" element={<WBSDiagram/>} />
        <Route path="/company" element={<ProtectedRoute roles={['company']}><CompanyPortal /></ProtectedRoute>}>
          <Route path="upload" element={<UploadPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="report/:id" element={<ReportDetailPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route index element={<DashboardPage />} />
        </Route>
        <Route path="/company/profile" element={<ProtectedRoute roles={['company']}><CompanyProfileSetup /></ProtectedRoute>} />
        <Route path="/investor" element={<ProtectedRoute roles={['investor']}><InvestorPortal /></ProtectedRoute>}>
          <Route path="dashboard" element={<InvestorDashboard />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="portfolio" element={<PortfolioBuilder />} />
          <Route path="compare" element={<ComparisonPage />} />
          <Route index element={<InvestorDashboard />} />
        </Route>
        <Route path="/investor/profile" element={<ProtectedRoute roles={['investor']}><InvestorProfileSetup /></ProtectedRoute>} />
      </Routes>
    </Router>
  )
}

export default App