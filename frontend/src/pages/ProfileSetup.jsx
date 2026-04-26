import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../utils/auth';

export default function ProfileSetup() {
  const [formData, setFormData] = useState({
    date_of_birth: '',
    occupation: '',
    research_interests: '',
    institution_id: ''
  });
  const [photo, setPhoto] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const user = getUser();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch institutions for dropdown
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/institutions`)
      .then(res => res.json())
      .then(data => setInstitutions(data))
      .catch(err => console.error("Failed to load institutions", err));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const data = new FormData();
      if (formData.date_of_birth) data.append('date_of_birth', formData.date_of_birth);
      if (formData.occupation) data.append('occupation', formData.occupation);
      if (formData.research_interests) data.append('research_interests', formData.research_interests);
      if (formData.institution_id) data.append('institution_id', formData.institution_id);
      if (photo) data.append('photo', photo);

      const token = localStorage.getItem('supabase.auth.token'); // Or however you store it
      // Get real token from localStorage depending on Supabase setup
      // For this app we use getAuthToken() from auth utils if it exists.
      // Let's assume localStorage.getItem('session') has it.
      let authSession = JSON.parse(localStorage.getItem('sb-htihrdbrmpjryfyuybbq-auth-token') || '{}');
      let accessToken = authSession.access_token || '';

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/profile/setup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: data
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to setup profile');
      
      alert('Profile Setup Complete! Your Affiliation Request is pending approval.');
      navigate('/researcher-dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="glass-panel p-8">
        <h1 className="text-3xl font-bold mb-2">Scholar Profile Setup</h1>
        <p className="text-gray-400 mb-8">Complete your academic profile and request publishing access.</p>

        {error && <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input type="text" value={user?.name || ''} disabled className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-gray-400 cursor-not-allowed" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Date of Birth <span className="text-xs text-gray-500">(Kept Private)</span></label>
            <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} required className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-blue-500 outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Occupation / Title</label>
            <input type="text" name="occupation" placeholder="e.g. Senior Lecturer" value={formData.occupation} onChange={handleChange} required className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-blue-500 outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Research Interests</label>
            <textarea name="research_interests" placeholder="e.g. Artificial Intelligence, Data Science..." value={formData.research_interests} onChange={handleChange} required className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-blue-500 outline-none h-24"></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Profile Photo</label>
            <input type="file" accept="image/*" onChange={handlePhotoChange} className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-gray-300" />
          </div>

          <div className="pt-4 border-t border-gray-700 mt-6">
            <h2 className="text-xl font-semibold mb-4">Request Publishing Access</h2>
            <p className="text-sm text-gray-400 mb-4">To publish research on IKMS, you must be affiliated with a verified institution. Select your institution below to request access.</p>
            
            <label className="block text-sm font-medium mb-1">Select Institution</label>
            <select name="institution_id" value={formData.institution_id} onChange={handleChange} required className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-blue-500 outline-none">
              <option value="">-- Choose an Institution --</option>
              {institutions.map(inst => (
                <option key={inst.id} value={inst.id}>{inst.name}</option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded transition-colors mt-8">
            {isLoading ? 'Submitting...' : 'Complete Profile & Request Access'}
          </button>
        </form>
      </div>
    </div>
  );
}
