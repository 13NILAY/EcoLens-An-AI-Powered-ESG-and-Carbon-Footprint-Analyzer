// pages/investor/ComparisonPage.jsx
import { useState } from 'react'
import { Search, TrendingUp, TrendingDown, Download, BarChart3, Target } from 'lucide-react'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'

export default function ComparisonPage() {
  const [company1, setCompany1] = useState('MSFT')
  const [company2, setCompany2] = useState('NEE')
  const [comparisonMode, setComparisonMode] = useState('esg') // esg, environmental, social, governance

  // Comprehensive company data for comparison
  const companiesData = {
    MSFT: {
      name: 'Microsoft Corp',
      ticker: 'MSFT',
      industry: 'Technology',
      marketCap: '2.1T',
      revenue: '198B',
      employees: '221,000',
      founded: 1975,
      esgScore: 82,
      sentiment: 78,
      environmental: {
        score: 85,
        carbonEmissions: 12.3, // million tons CO2
        renewableEnergy: 75, // percentage
        waterUsage: 4.2, // million cubic meters
        wasteRecycled: 82 // percentage
      },
      social: {
        score: 80,
        employeeSatisfaction: 4.2, // out of 5
        diversityScore: 76,
        communityInvestment: 1.2, // billion USD
        trainingHours: 45 // per employee
      },
      governance: {
        score: 81,
        boardDiversity: 45, // percentage
        executivePayRatio: 150, // vs median employee
        shareholderRights: 85,
        ethicsCompliance: 90
      },
      strengths: ['Renewable Energy', 'Data Privacy', 'Board Diversity'],
      weaknesses: ['Supply Chain Emissions', 'Water Usage'],
      lastUpdated: '2024-01-15'
    },
    NEE: {
      name: 'NextEra Energy',
      ticker: 'NEE',
      industry: 'Utilities',
      marketCap: '120B',
      revenue: '28B',
      employees: '15,000',
      founded: 1925,
      esgScore: 88,
      sentiment: 85,
      environmental: {
        score: 92,
        carbonEmissions: 45.6, // million tons CO2
        renewableEnergy: 95, // percentage
        waterUsage: 12.8, // million cubic meters
        wasteRecycled: 78 // percentage
      },
      social: {
        score: 83,
        employeeSatisfaction: 4.1, // out of 5
        diversityScore: 72,
        communityInvestment: 0.8, // billion USD
        trainingHours: 52 // per employee
      },
      governance: {
        score: 89,
        boardDiversity: 52, // percentage
        executivePayRatio: 120, // vs median employee
        shareholderRights: 88,
        ethicsCompliance: 92
      },
      strengths: ['Renewable Energy', 'Emissions Reduction', 'Community Engagement'],
      weaknesses: ['Water Intensity', 'Regulatory Risk'],
      lastUpdated: '2024-01-14'
    },
    JNJ: {
      name: 'Johnson & Johnson',
      ticker: 'JNJ',
      industry: 'Healthcare',
      marketCap: '380B',
      revenue: '95B',
      employees: '135,000',
      founded: 1886,
      esgScore: 85,
      sentiment: 82,
      environmental: {
        score: 83,
        carbonEmissions: 4.8, // million tons CO2
        renewableEnergy: 65, // percentage
        waterUsage: 18.2, // million cubic meters
        wasteRecycled: 75 // percentage
      },
      social: {
        score: 86,
        employeeSatisfaction: 4.3, // out of 5
        diversityScore: 81,
        communityInvestment: 2.1, // billion USD
        trainingHours: 38 // per employee
      },
      governance: {
        score: 86,
        boardDiversity: 48, // percentage
        executivePayRatio: 165, // vs median employee
        shareholderRights: 82,
        ethicsCompliance: 88
      },
      strengths: ['Diversity & Inclusion', 'Community Investment', 'Product Safety'],
      weaknesses: ['Executive Pay Ratio', 'Water Management'],
      lastUpdated: '2024-01-15'
    },
    AAPL: {
      name: 'Apple Inc',
      ticker: 'AAPL',
      industry: 'Technology',
      marketCap: '2.8T',
      revenue: '383B',
      employees: '164,000',
      founded: 1976,
      esgScore: 79,
      sentiment: 75,
      environmental: {
        score: 82,
        carbonEmissions: 22.6, // million tons CO2
        renewableEnergy: 85, // percentage
        waterUsage: 9.3, // million cubic meters
        wasteRecycled: 88 // percentage
      },
      social: {
        score: 76,
        employeeSatisfaction: 4.0, // out of 5
        diversityScore: 68,
        communityInvestment: 0.9, // billion USD
        trainingHours: 42 // per employee
      },
      governance: {
        score: 79,
        boardDiversity: 42, // percentage
        executivePayRatio: 180, // vs median employee
        shareholderRights: 78,
        ethicsCompliance: 85
      },
      strengths: ['Supply Chain Management', 'Product Recycling', 'Renewable Energy'],
      weaknesses: ['Diversity Metrics', 'Executive Pay'],
      lastUpdated: '2024-01-15'
    },
    TSLA: {
      name: 'Tesla Inc',
      ticker: 'TSLA',
      industry: 'Automotive',
      marketCap: '610B',
      revenue: '96B',
      employees: '127,855',
      founded: 2003,
      esgScore: 68,
      sentiment: 65,
      environmental: {
        score: 72,
        carbonEmissions: 1.2, // million tons CO2
        renewableEnergy: 92, // percentage
        waterUsage: 3.1, // million cubic meters
        wasteRecycled: 65 // percentage
      },
      social: {
        score: 62,
        employeeSatisfaction: 3.4, // out of 5
        diversityScore: 58,
        communityInvestment: 0.3, // billion USD
        trainingHours: 28 // per employee
      },
      governance: {
        score: 70,
        boardDiversity: 35, // percentage
        executivePayRatio: 220, // vs median employee
        shareholderRights: 65,
        ethicsCompliance: 75
      },
      strengths: ['Electric Vehicles', 'Renewable Energy', 'Innovation'],
      weaknesses: ['Labor Relations', 'Board Diversity', 'Governance'],
      lastUpdated: '2024-01-14'
    },
    XOM: {
      name: 'Exxon Mobil',
      ticker: 'XOM',
      industry: 'Energy',
      marketCap: '410B',
      revenue: '344B',
      employees: '62,000',
      founded: 1999,
      esgScore: 45,
      sentiment: 38,
      environmental: {
        score: 35,
        carbonEmissions: 115.8, // million tons CO2
        renewableEnergy: 12, // percentage
        waterUsage: 45.6, // million cubic meters
        wasteRecycled: 45 // percentage
      },
      social: {
        score: 52,
        employeeSatisfaction: 3.8, // out of 5
        diversityScore: 65,
        communityInvestment: 1.5, // billion USD
        trainingHours: 35 // per employee
      },
      governance: {
        score: 48,
        boardDiversity: 38, // percentage
        executivePayRatio: 195, // vs median employee
        shareholderRights: 55,
        ethicsCompliance: 68
      },
      strengths: ['Community Investment', 'Safety Record'],
      weaknesses: ['Carbon Emissions', 'Renewable Transition', 'Governance'],
      lastUpdated: '2024-01-13'
    }
  }

  const company1Data = companiesData[company1]
  const company2Data = companiesData[company2]

  // Prepare data for radar chart based on comparison mode
  const getRadarData = () => {
    const metrics = {
      esg: [
        { subject: 'Environmental', company1: company1Data.environmental.score, company2: company2Data.environmental.score },
        { subject: 'Social', company1: company1Data.social.score, company2: company2Data.social.score },
        { subject: 'Governance', company1: company1Data.governance.score, company2: company2Data.governance.score },
        { subject: 'Overall ESG', company1: company1Data.esgScore, company2: company2Data.esgScore },
        { subject: 'Sentiment', company1: company1Data.sentiment, company2: company2Data.sentiment },
      ],
      environmental: [
        { subject: 'Carbon Emissions', company1: 100 - company1Data.environmental.carbonEmissions / 2, company2: 100 - company2Data.environmental.carbonEmissions / 2 },
        { subject: 'Renewable Energy', company1: company1Data.environmental.renewableEnergy, company2: company2Data.environmental.renewableEnergy },
        { subject: 'Water Usage', company1: 100 - company1Data.environmental.waterUsage, company2: 100 - company2Data.environmental.waterUsage },
        { subject: 'Waste Recycled', company1: company1Data.environmental.wasteRecycled, company2: company2Data.environmental.wasteRecycled },
      ],
      social: [
        { subject: 'Employee Satisfaction', company1: company1Data.social.employeeSatisfaction * 20, company2: company2Data.social.employeeSatisfaction * 20 },
        { subject: 'Diversity', company1: company1Data.social.diversityScore, company2: company2Data.social.diversityScore },
        { subject: 'Community Investment', company1: company1Data.social.communityInvestment * 40, company2: company2Data.social.communityInvestment * 40 },
        { subject: 'Training Hours', company1: company1Data.social.trainingHours, company2: company2Data.social.trainingHours },
      ],
      governance: [
        { subject: 'Board Diversity', company1: company1Data.governance.boardDiversity, company2: company2Data.governance.boardDiversity },
        { subject: 'Shareholder Rights', company1: company1Data.governance.shareholderRights, company2: company2Data.governance.shareholderRights },
        { subject: 'Ethics Compliance', company1: company1Data.governance.ethicsCompliance, company2: company2Data.governance.ethicsCompliance },
        { subject: 'Executive Pay Ratio', company1: 100 - company1Data.governance.executivePayRatio / 3, company2: 100 - company2Data.governance.executivePayRatio / 3 },
      ]
    }
    return metrics[comparisonMode]
  }

  const radarData = getRadarData()

  // Prepare data for bar chart comparison
  const barChartData = radarData.map(item => ({
    name: item.subject,
    [company1]: item.company1,
    [company2]: item.company2
  }))

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getDifference = (score1, score2) => {
    const diff = score1 - score2
    return {
      value: Math.abs(diff),
      isPositive: diff > 0,
      isEqual: diff === 0
    }
  }

  const overallDifference = getDifference(company1Data.esgScore, company2Data.esgScore)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Company Comparison</h1>
          <p className="text-lg text-gray-600">Side-by-side ESG analysis and performance metrics</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Download size={16} />
            Export Comparison
          </button>
        </div>
      </div>

      {/* Company Selectors */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Company 1 Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Compare Company</label>
            <select
              value={company1}
              onChange={(e) => setCompany1(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(companiesData).map(([ticker, company]) => (
                <option key={ticker} value={ticker}>
                  {company.name} ({ticker})
                </option>
              ))}
            </select>
          </div>

          {/* Company 2 Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">With Company</label>
            <select
              value={company2}
              onChange={(e) => setCompany2(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(companiesData).map(([ticker, company]) => (
                <option key={ticker} value={ticker}>
                  {company.name} ({ticker})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison Mode Selector */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Comparison Focus:</label>
          <div className="flex gap-2">
            {['esg', 'environmental', 'social', 'governance'].map((mode) => (
              <button
                key={mode}
                onClick={() => setComparisonMode(mode)}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all duration-200 ${
                  comparisonMode === mode
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overall Comparison Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Company 1 Summary */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="text-white" size={24} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{company1Data.name}</h3>
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold border mb-3 ${getScoreColor(company1Data.esgScore)}`}>
            ESG: {company1Data.esgScore}
          </div>
          <div className="text-sm text-gray-600 mb-4">{company1Data.industry} • {company1Data.marketCap} Market Cap</div>
          <div className="space-y-2 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Environmental</span>
              <span className="font-medium">{company1Data.environmental.score}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Social</span>
              <span className="font-medium">{company1Data.social.score}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Governance</span>
              <span className="font-medium">{company1Data.governance.score}</span>
            </div>
          </div>
        </div>

        {/* Comparison Result */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center flex items-center justify-center">
          <div>
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {overallDifference.isEqual ? '=' : overallDifference.isPositive ? '>' : '<'}
            </div>
            <div className={`text-lg font-semibold ${
              overallDifference.isEqual ? 'text-gray-600' : 
              overallDifference.isPositive ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {overallDifference.isEqual 
                ? 'Equal Scores' 
                : `${overallDifference.value} Point${overallDifference.value !== 1 ? 's' : ''} ${overallDifference.isPositive ? 'Higher' : 'Lower'}`
              }
            </div>
            <div className="text-sm text-gray-500 mt-2">ESG Score Difference</div>
          </div>
        </div>

        {/* Company 2 Summary */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Target className="text-white" size={24} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{company2Data.name}</h3>
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold border mb-3 ${getScoreColor(company2Data.esgScore)}`}>
            ESG: {company2Data.esgScore}
          </div>
          <div className="text-sm text-gray-600 mb-4">{company2Data.industry} • {company2Data.marketCap} Market Cap</div>
          <div className="space-y-2 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Environmental</span>
              <span className="font-medium">{company2Data.environmental.score}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Social</span>
              <span className="font-medium">{company2Data.social.score}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Governance</span>
              <span className="font-medium">{company2Data.governance.score}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Radar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6">ESG Performance Radar</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar
                  name={company1Data.name}
                  dataKey="company1"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.3}
                />
                <Radar
                  name={company2Data.name}
                  dataKey="company2"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.3}
                />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Detailed Metrics Comparison</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey={company1} fill="#3B82F6" name={company1Data.name} />
                <Bar dataKey={company2} fill="#10B981" name={company2Data.name} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Company 1 Strengths & Weaknesses */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6">{company1Data.name} - Analysis</h3>
          
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-emerald-600 mb-3 flex items-center gap-2">
              <TrendingUp size={18} />
              Key Strengths
            </h4>
            <div className="space-y-2">
              {company1Data.strengths.map((strength, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">{strength}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-red-600 mb-3 flex items-center gap-2">
              <TrendingDown size={18} />
              Areas for Improvement
            </h4>
            <div className="space-y-2">
              {company1Data.weaknesses.map((weakness, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">{weakness}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Company 2 Strengths & Weaknesses */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6">{company2Data.name} - Analysis</h3>
          
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-emerald-600 mb-3 flex items-center gap-2">
              <TrendingUp size={18} />
              Key Strengths
            </h4>
            <div className="space-y-2">
              {company2Data.strengths.map((strength, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">{strength}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-red-600 mb-3 flex items-center gap-2">
              <TrendingDown size={18} />
              Areas for Improvement
            </h4>
            <div className="space-y-2">
              {company2Data.weaknesses.map((weakness, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">{weakness}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}