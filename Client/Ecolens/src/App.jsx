// App.js - Updated with Investor Portal
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import EcoLensHomepage from './pages/Homepage'
import CompanyPortal from './pages/CompanyPortal'
import UploadPage from './pages/company/UploadPage'
import DashboardPage from './pages/company/DashboardPage'
import HistoryPage from './pages/company/HistoryPage'
import InvestorPortal from './pages/InvestorPortal'
import InvestorDashboard from './pages/investor/DashboardPage'
import NewsPage from './pages/investor/NewsPage'
import PortfolioBuilder from './pages/investor/PortfolioBuilder'
import ComparisonPage from './pages/investor/ComparisonPage'
import WBSDiagram from './pages/WBSNode'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<EcoLensHomepage />} />
        <Route path="/WBS" element={<WBSDiagram/>} />
        <Route path="/company" element={<CompanyPortal />}>
          <Route path="upload" element={<UploadPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route index element={<DashboardPage />} />
        </Route>
        <Route path="/investor" element={<InvestorPortal />}>
          <Route path="dashboard" element={<InvestorDashboard />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="portfolio" element={<PortfolioBuilder />} />
          <Route path="compare" element={<ComparisonPage />} />
          <Route index element={<InvestorDashboard />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App