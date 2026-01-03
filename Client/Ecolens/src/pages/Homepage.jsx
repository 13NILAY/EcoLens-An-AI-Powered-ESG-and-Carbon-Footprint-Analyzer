import React, { useState, useEffect } from 'react';
import { 
  Leaf, TrendingUp, BarChart3, Brain, Globe, Zap, ArrowRight, 
  Upload, PieChart, Menu, X, Shield, Target, Users, CheckCircle,
  FileText, Building, LineChart, Filter, Download, Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EcoLensHomepage() {
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePortal, setActivePortal] = useState('company');

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
   const companyFeatures = [
    {
      icon: Upload,
      title: "Upload Sustainability Reports",
      desc: "PDF/CSV upload with AI-powered data extraction",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: BarChart3,
      title: "Carbon Footprint Analysis",
      desc: "Scope 1, 2, 3 emissions breakdown and tracking",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: PieChart,
      title: "ESG Score Calculation",
      desc: "Comprehensive Environmental, Social, Governance scoring",
      color: "from-purple-500 to-indigo-500"
    },
    {
      icon: Brain,
      title: "AI Recommendations",
      desc: "ML-powered suggestions to reduce emissions",
      color: "from-orange-500 to-red-500"
    }
  ];

   const investorFeatures = [
    {
      icon: TrendingUp,
      title: "Live ESG Rankings",
      desc: "Dynamic company rankings based on ESG performance",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Globe,
      title: "Sentiment Analysis",
      desc: "NLP-powered news and social media monitoring",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Filter,
      title: "Ethical Portfolio Builder",
      desc: "Filter and build sustainable investment portfolios",
      color: "from-purple-500 to-indigo-500"
    },
    {
      icon: LineChart,
      title: "Company Comparison",
      desc: "Side-by-side ESG performance analysis",
      color: "from-orange-500 to-red-500"
    }
  ];
    const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };
  return (
     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30 text-gray-900 font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 transition-all duration-300" 
           style={{
             background: scrollY > 50 ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
             backdropFilter: scrollY > 50 ? 'blur(10px)' : 'none',
             boxShadow: scrollY > 50 ? '0 4px 20px rgba(0,0,0,0.08)' : 'none'
           }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 text-2xl font-bold">
            <div className="relative">
              <Leaf className="text-emerald-600" size={32} strokeWidth={2.5} />
              <div className="absolute inset-0 text-emerald-600 animate-ping opacity-20">
                <Leaf size={32} strokeWidth={2.5} />
              </div>
            </div>
            <span className="bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
              EcoLens
            </span>
          </Link>
          
         {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => scrollToSection('home')}
              className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors duration-200"
            >
              Home
            </button>
            <button 
              onClick={() => scrollToSection('portals')}
              className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors duration-200"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection('workflow')}
              className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors duration-200"
            >
              How It Works
            </button>
            <button 
              onClick={() => scrollToSection('contact')}
              className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors duration-200"
            >
              Contact
            </button>
          </div>

          {/* CTA Button */}
         <div className="hidden md:flex items-center gap-4">
            <Link 
                to="/auth" 
                className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors duration-200"
            >
                Sign In
            </Link>
            <Link 
                to="/auth" 
                className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-6 py-2.5 rounded-full font-semibold text-sm hover:shadow-lg hover:scale-105 transition-all duration-300"
                onClick={() => {/* You can set state to show signup by default */}}
            >
                Get Started
            </Link>
            </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-emerald-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-lg border-t border-emerald-100">
            <div className="px-6 py-4 flex flex-col gap-4">
              <button 
                onClick={() => scrollToSection('home')}
                className="text-sm font-medium text-gray-700 hover:text-emerald-600 py-2 text-left"
              >
                Home
              </button>
              <button 
                onClick={() => scrollToSection('portals')}
                className="text-sm font-medium text-gray-700 hover:text-emerald-600 py-2 text-left"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('workflow')}
                className="text-sm font-medium text-gray-700 hover:text-emerald-600 py-2 text-left"
              >
                How It Works
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="text-sm font-medium text-gray-700 hover:text-emerald-600 py-2 text-left"
              >
                Contact
              </button>
              <Link 
                to="/company"
                className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-4 py-2.5 rounded-full font-semibold text-sm mt-2 text-center"
              >
                Company Portal
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background with nature image and overlay */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url("https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2013&q=80")',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-slate-900/40"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-slate-900/20"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center text-white">
          <div className="mb-6 inline-block">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-sm border border-white/20">
              <Leaf size={16} className="text-emerald-300" />
              <span className="text-emerald-100">AI-Powered ESG & Carbon Footprint Analyzer</span>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Measure Your Impact,
            <br />
            <span className="text-emerald-300">Build Your Future</span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-12 text-gray-200 max-w-3xl mx-auto leading-relaxed">
            Transform sustainability data into strategic advantage. AI-powered ESG analytics for companies and investors.
          </p>

          {/* Dual Portal CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link to="/company">
              <button className="group bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold text-lg flex items-center gap-2 hover:shadow-2xl hover:scale-105 transition-all duration-300 shadow-lg">
                <Building size={20} />
                Company Portal
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
  
            <Link to="/investor">
              <button className="group bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-xl font-semibold text-lg flex items-center gap-2 border-2 border-white/30 hover:bg-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-300">
                <TrendingUp size={20} />
                Investor Portal
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-300" />
              <span>AI-Powered Data Extraction</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-300" />
              <span>Live ESG Scoring</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-300" />
              <span>Carbon Footprint Analysis</span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-10">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-white/70 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Dual Portals Section */}
      <section id="portals" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
              Why EcoLens?
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-emerald-500 to-emerald-300 mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Whether you're measuring your environmental impact or investing in sustainable companies, 
              EcoLens provides the AI-powered tools you need.
            </p>
          </div>

          {/* Portal Selector */}
          <div className="flex justify-center mb-12">
            <div className="bg-gray-100 rounded-2xl p-2 flex">
              <button
                onClick={() => setActivePortal('company')}
                className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
                  activePortal === 'company'
                    ? 'bg-white text-emerald-600 shadow-lg'
                    : 'text-gray-600 hover:text-emerald-600'
                }`}
              >
                <Building size={24} className="inline-block mr-2" />
                For Companies
              </button>
              <button
                onClick={() => setActivePortal('investor')}
                className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
                  activePortal === 'investor'
                    ? 'bg-white text-emerald-600 shadow-lg'
                    : 'text-gray-600 hover:text-emerald-600'
                }`}
              >
                <TrendingUp size={24} className="inline-block mr-2" />
                For Investors
              </button>
            </div>
          </div>

          {/* Portal Content */}
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Features */}
            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-gray-800 mb-6">
                {activePortal === 'company' ? 'Company Portal Features' : 'Investor Portal Features'}
              </h3>
              
              {(activePortal === 'company' ? companyFeatures : investorFeatures).map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-start gap-4 group">
                    <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-md`}>
                      <Icon className="text-white" size={24} />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-800 mb-2">{feature.title}</h4>
                      <p className="text-gray-600">{feature.desc}</p>
                    </div>
                  </div>
                );
              })}

              {activePortal === 'company' ? (
                <Link to="/company">
                  <button className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl hover:scale-105 transition-all duration-300 mt-6">
                    Start Company Analysis
                    <ArrowRight size={20} className="inline-block ml-2" />
                  </button>
                </Link>
              ) : (
                <button className="bg-gradient-to-r from-gray-400 to-gray-500 text-white px-8 py-4 rounded-xl font-semibold text-lg mt-6 opacity-70 cursor-not-allowed">
                  Coming Soon
                  <ArrowRight size={20} className="inline-block ml-2" />
                </button>
              )}
            </div>

            {/* Visual Demo */}
            <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-3xl p-8 border border-emerald-100">
              <div className="bg-white rounded-2xl shadow-2xl p-6">
                {activePortal === 'company' ? (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <BarChart3 className="text-emerald-600" size={32} />
                      <div>
                        <h4 className="font-bold text-lg">Company ESG Dashboard</h4>
                        <p className="text-gray-600 text-sm">Sample analytics preview</p>
                      </div>
                    </div>
                    
                    {/* Mock Dashboard */}
                    <div className="space-y-4">
                      <div className="bg-emerald-100 h-32 rounded-lg flex items-center justify-center">
                        <PieChart size={32} className="text-emerald-600" />
                        <span className="ml-2 text-emerald-600 font-semibold">Carbon Emissions Breakdown</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-100 h-20 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">ESG Score: 82</span>
                        </div>
                        <div className="bg-green-100 h-20 rounded-lg flex items-center justify-center">
                          <span className="text-green-600 font-semibold">Scope 1: 45%</span>
                        </div>
                      </div>
                      <div className="bg-gray-100 h-16 rounded-lg flex items-center justify-center">
                        <span className="text-gray-600">AI Recommendations Panel</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <TrendingUp className="text-emerald-600" size={32} />
                      <div>
                        <h4 className="font-bold text-lg">Investor ESG Dashboard</h4>
                        <p className="text-gray-600 text-sm">Portfolio analysis preview</p>
                      </div>
                    </div>
                    
                    {/* Mock Dashboard */}
                    <div className="space-y-4">
                      <div className="bg-purple-100 h-32 rounded-lg flex items-center justify-center">
                        <LineChart size={32} className="text-purple-600" />
                        <span className="ml-2 text-purple-600 font-semibold">ESG Performance Trends</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-orange-100 h-20 rounded-lg flex items-center justify-center">
                          <span className="text-orange-600 font-semibold">Top Rated: Tech</span>
                        </div>
                        <div className="bg-cyan-100 h-20 rounded-lg flex items-center justify-center">
                          <span className="text-cyan-600 font-semibold">Sentiment: 78%</span>
                        </div>
                      </div>
                      <div className="bg-gray-100 h-16 rounded-lg flex items-center justify-center">
                        <span className="text-gray-600">Portfolio Builder Tools</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      
      {/* Final CTA Section */}
     {/* Data Processing Pipeline Section */}
 <section id="workflow" className="py-24 px-6 bg-gradient-to-br from-slate-900 to-emerald-900 text-white">  <div className="max-w-6xl mx-auto">
    <div className="text-center mb-16">
      <h2 className="text-4xl md:text-5xl font-bold mb-4">
        How EcoLens Transforms Data into <span className="text-emerald-300">Actionable Insights</span>
      </h2>
      <div className="w-24 h-1 bg-gradient-to-r from-emerald-400 to-cyan-400 mx-auto mb-6"></div>
      <p className="text-xl text-gray-300 max-w-3xl mx-auto">
        From sustainability reports to ESG intelligence - our AI-powered pipeline processes data for both companies and investors
      </p>
    </div>

    {/* Data Flow Visualization */}
    <div className="relative">
      {/* Connection Lines */}
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hidden lg:block"></div>
      
      <div className="grid lg:grid-cols-5 gap-8 relative z-10">
        {/* Step 1: Data Input */}
        <div className="text-center group">
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <Upload className="text-white" size={32} />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              1
            </div>
          </div>
          <h3 className="text-xl font-bold mb-3">Data Input</h3>
          <p className="text-gray-300 text-sm">
            Companies upload PPE/CSV reports with carbon, energy, water, and waste data
          </p>
        </div>

        {/* Step 2: Processing */}
        <div className="text-center group">
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <Brain className="text-white" size={32} />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              2
            </div>
          </div>
          <h3 className="text-xl font-bold mb-3">AI Processing</h3>
          <p className="text-gray-300 text-sm">
            Extract Scope 1, 2, 3 emissions. Handle missing data with proxy estimation
          </p>
        </div>

        {/* Step 3: Sentiment Analysis */}
        <div className="text-center group">
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <Globe className="text-white" size={32} />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              3
            </div>
          </div>
          <h3 className="text-xl font-bold mb-3">Sentiment Analysis</h3>
          <p className="text-gray-300 text-sm">
            NLP processes news for Environmental, Social, and Governance sentiment
          </p>
        </div>

        {/* Step 4: ESG Scoring */}
        <div className="text-center group">
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <BarChart3 className="text-white" size={32} />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              4
            </div>
          </div>
          <h3 className="text-xl font-bold mb-3">ESG Scoring</h3>
          <p className="text-gray-300 text-sm">
            Calculate E (CO₂ + Energy), S & G (Sentiment) scores with weighted formula
          </p>
        </div>

        {/* Step 5: Insights & Actions */}
        <div className="text-center group">
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <Zap className="text-white" size={32} />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-cyan-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              5
            </div>
          </div>
          <h3 className="text-xl font-bold mb-3">Intelligent Output</h3>
          <p className="text-gray-300 text-sm">
            AI recommendations for companies, portfolio insights for investors
          </p>
        </div>
      </div>
    </div>

    {/* Detailed Breakdown */}
    <div className="mt-20 grid md:grid-cols-2 gap-12">
      {/* Company Side */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
        <div className="flex items-center gap-3 mb-6">
          <Building className="text-emerald-300" size={32} />
          <h3 className="text-2xl font-bold text-white">For Companies</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle size={20} className="text-emerald-300 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-white">Carbon Footprint Analysis</h4>
              <p className="text-gray-300 text-sm">Scope 1, 2, 3 emissions breakdown with industry benchmarking</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle size={20} className="text-emerald-300 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-white">AI Recommendations</h4>
              <p className="text-gray-300 text-sm">Personalized suggestions to reduce emissions and improve ESG scores</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle size={20} className="text-emerald-300 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-white">Progress Tracking</h4>
              <p className="text-gray-300 text-sm">Monitor improvements and compliance with regulatory requirements</p>
            </div>
          </div>
        </div>
      </div>

      {/* Investor Side */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="text-cyan-300" size={32} />
          <h3 className="text-2xl font-bold text-white">For Investors</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle size={20} className="text-cyan-300 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-white">Live ESG Rankings</h4>
              <p className="text-gray-300 text-sm">Dynamic scoring based on emissions data and news sentiment</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle size={20} className="text-cyan-300 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-white">Sentiment Monitoring</h4>
              <p className="text-gray-300 text-sm">Track environmental, social, and governance news in Live</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle size={20} className="text-cyan-300 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-white">Portfolio Analytics</h4>
              <p className="text-gray-300 text-sm">Build and analyze sustainable investment portfolios</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>


{/* Unified Call-to-Action */}
<section className="py-24 px-6 bg-gradient-to-br from-emerald-50 to-cyan-50">
  <div className="max-w-6xl mx-auto text-center">
    <div className="bg-white rounded-3xl p-12 shadow-2xl border border-emerald-100">
      <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
        Start Your Data-Driven Sustainability Journey
      </h2>
      <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
        Whether you're measuring environmental impact or building sustainable portfolios, 
        EcoLens turns complex data into clear, actionable intelligence.
      </p>

      {/* Dual Portal Cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
        {/* Company Portal Card */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-8 rounded-2xl text-left group hover:shadow-2xl hover:scale-105 transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Building size={24} />
            </div>
            <h3 className="text-2xl font-bold">Company Portal</h3>
          </div>
          <p className="text-emerald-100 mb-6">
            Upload sustainability reports, analyze your carbon footprint, and get AI-powered recommendations to improve your ESG performance.
          </p>
          <ul className="space-y-2 mb-6">
            <li className="flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-200" />
              <span className="text-sm">Scope 1, 2, 3 emissions analysis</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-200" />
              <span className="text-sm">AI-powered improvement recommendations</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-200" />
              <span className="text-sm">Industry benchmarking and compliance</span>
            </li>
          </ul>
          <button className="w-full bg-white text-emerald-600 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors group-hover:scale-105 group-hover:shadow-lg transition-transform">
            Start Company Analysis
          </button>
        </div>

        {/* Investor Portal Card */}
        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white p-8 rounded-2xl text-left group hover:shadow-2xl hover:scale-105 transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <h3 className="text-2xl font-bold">Investor Portal</h3>
          </div>
          <p className="text-cyan-100 mb-6">
            Access Live ESG scores, sentiment analysis, and build sustainable investment portfolios with AI-driven insights.
          </p>
          <ul className="space-y-2 mb-6">
            <li className="flex items-center gap-2">
              <CheckCircle size={16} className="text-cyan-200" />
              <span className="text-sm">Live ESG rankings and scores</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle size={16} className="text-cyan-200" />
              <span className="text-sm">News sentiment analysis</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle size={16} className="text-cyan-200" />
              <span className="text-sm">Portfolio builder with ethical filters</span>
            </li>
          </ul>
          <button className="w-full bg-white text-cyan-600 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors group-hover:scale-105 group-hover:shadow-lg transition-transform">
            Explore Investments
          </button>
        </div>
      </div>

      {/* Unified Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
        {[
          { value: "500+", label: "Companies Analyzed" },
          { value: "50K+", label: "Reports Processed" },
          { value: "99.2%", label: "Data Accuracy" },
          { value: "24/7", label: "Live Monitoring" }
        ].map((stat, index) => (
          <div key={index} className="text-center">
            <div className="text-3xl font-bold text-emerald-600 mb-2">{stat.value}</div>
            <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
</section>
      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 to-slate-900 text-white py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 text-2xl font-bold mb-4">
                <Leaf className="text-emerald-400" size={32} />
                <span>EcoLens</span>
              </div>
              <p className="text-gray-400 mb-4">
                Empowering sustainable decisions through AI-driven ESG analytics.
              </p>
              <div className="flex gap-4">
                {/* Social icons would go here */}
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4 text-white">Product</h3>
              <div className="space-y-2 text-gray-400">
                <a href="#" className="block hover:text-emerald-400 transition-colors">Features</a>
                <a href="#" className="block hover:text-emerald-400 transition-colors">Pricing</a>
                <a href="#" className="block hover:text-emerald-400 transition-colors">Case Studies</a>
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4 text-white">Resources</h3>
              <div className="space-y-2 text-gray-400">
                <a href="#" className="block hover:text-emerald-400 transition-colors">Blog</a>
                <a href="#" className="block hover:text-emerald-400 transition-colors">Documentation</a>
                <a href="#" className="block hover:text-emerald-400 transition-colors">Support</a>
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4 text-white">Company</h3>
              <div className="space-y-2 text-gray-400">
                <a href="#" className="block hover:text-emerald-400 transition-colors">About</a>
                <a href="#" className="block hover:text-emerald-400 transition-colors">Careers</a>
                <a href="#" className="block hover:text-emerald-400 transition-colors">Contact</a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-lg font-medium mb-2 text-emerald-400 italic">
              "Empowering a Greener Tomorrow with Data"
            </p>
            <p className="text-sm text-gray-500">
              © 2025 EcoLens. All rights reserved. Built for a sustainable future.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}