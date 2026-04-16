import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, AlertCircle, CheckCircle, Leaf, Shield, Target } from 'lucide-react';
import { getAuthToken } from '../../services/auth';
import { getInvestorProfile, updateInvestorProfile } from '../../services/profile';
import { ALLOWED_INDUSTRIES } from '../../services/investor';

export default function InvestorProfileSetup() {
  const navigate = useNavigate();
  const token = getAuthToken();

  const [formData, setFormData] = useState({
    riskTolerance: 'Medium',
    minEsgScore: 50,
    preferredIndustries: []
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!token) return navigate('/login');
        const data = await getInvestorProfile(token);
        setFormData({
          riskTolerance: data.risk_tolerance || 'Medium',
          minEsgScore: data.min_esg_score || 50,
          preferredIndustries: data.preferred_industries || []
        });
      } catch (err) {
        // Profile not found – ignore, will create new
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token, navigate]);

  const toggleIndustry = (industry) => {
    setFormData(prev => ({
      ...prev,
      preferredIndustries: prev.preferredIndustries.includes(industry)
        ? prev.preferredIndustries.filter(i => i !== industry)
        : [...prev.preferredIndustries, industry]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.preferredIndustries.length === 0) {
      setError('Please select at least one preferred industry.');
      return;
    }

    setSubmitting(true);
    try {
      await updateInvestorProfile(formData, token);
      setSuccess('Profile saved successfully!');
      setTimeout(() => navigate('/investor/dashboard'), 1200);
    } catch (err) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Leaf className="text-white" size={28} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Investor Profile</h1>
          <p className="text-gray-600">Set up your ESG investment preferences</p>
        </div>

        {/* Success message */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 mb-6">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <p className="text-emerald-700 font-medium">{success}</p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Preferred Industries */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Target size={20} className="text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Preferred Industries</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">Select industries you're interested in investing in</p>
            <div className="grid grid-cols-2 gap-3">
              {ALLOWED_INDUSTRIES.map(industry => (
                <label
                  key={industry}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    formData.preferredIndustries.includes(industry)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.preferredIndustries.includes(industry)}
                    onChange={() => toggleIndustry(industry)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 capitalize">{industry}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Risk Tolerance */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield size={20} className="text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-900">Risk Appetite</h3>
            </div>
            <select
              value={formData.riskTolerance}
              onChange={e => setFormData({ ...formData, riskTolerance: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            >
              <option value="Low">Low – Conservative</option>
              <option value="Medium">Medium – Balanced</option>
              <option value="High">High – Aggressive</option>
            </select>
          </div>

          {/* Minimum ESG Score */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Minimum ESG Score</h3>
              <span className="text-2xl font-bold text-blue-600">{formData.minEsgScore}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.minEsgScore}
              onChange={e => setFormData({ ...formData, minEsgScore: +e.target.value })}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>0 – Any</span>
              <span>50 – Moderate</span>
              <span>100 – Best Only</span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}