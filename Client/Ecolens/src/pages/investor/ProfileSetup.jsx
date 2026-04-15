import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { getAuthToken } from '../../services/auth';
import { getInvestorProfile, updateInvestorProfile } from '../../services/profile';

export default function InvestorProfileSetup() {
  const navigate = useNavigate();
  const token = getAuthToken();

  const [formData, setFormData] = useState({
    riskTolerance: 'Medium',
    minEsgScore: 50
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
          minEsgScore: data.min_esg_score || 50
        });
      } catch (err) {
        // Profile not found – ignore, will create new
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await updateInvestorProfile(formData, token);
      setSuccess('Profile saved!');
      setTimeout(() => navigate('/investor/dashboard'), 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <form onSubmit={handleSubmit}>
      <label>Risk Tolerance</label>
      <select value={formData.riskTolerance} onChange={e => setFormData({...formData, riskTolerance: e.target.value})}>
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>

      <label>Minimum ESG Score: {formData.minEsgScore}</label>
      <input type="range" min="0" max="100" value={formData.minEsgScore} onChange={e => setFormData({...formData, minEsgScore: +e.target.value})} />

      <button type="submit" disabled={submitting}>Save Profile</button>
    </form>
  );
}