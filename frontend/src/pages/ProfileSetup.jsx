import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, getAuthHeaders, setUser } from '../utils/auth';
import { Building2, User, Calendar, Briefcase, Tag, Camera, CheckCircle2, AlertCircle, BarChart2, ShieldCheck, RefreshCw } from 'lucide-react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ProfileSetup() {
  const [formData, setFormData] = useState({
    name: '',
    date_of_birth: '',
    occupation: '',
    research_interests: '',
    institution_id: ''
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const user = getUser();
    if (!user) {
      navigate('/login');
      return;
    }
    setFormData(prev => ({ ...prev, name: user.name || '' }));

    axios.get(`${API}/institutions`)
      .then(res => setInstitutions(res.data))
      .catch(err => console.error("Failed to load institutions", err));
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('date_of_birth', formData.date_of_birth);
      data.append('occupation', formData.occupation);
      data.append('research_interests', formData.research_interests);
      data.append('institution_id', formData.institution_id);
      if (photo) data.append('photo', photo);

      const res = await axios.post(`${API}/profile/setup`, data, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.user) {
        setUser(res.data.user);
      }

      setSuccess(true);
      setTimeout(() => navigate('/researcher-dashboard'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Inline Styles for Premium Look
  const styles = {
    page: { minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'system-ui, -apple-system, sans-serif' },
    card: { maxWidth: '800px', width: '100%', background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.5rem', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: window.innerWidth < 768 ? 'column' : 'row' },
    sidebar: { width: '35%', background: 'linear-gradient(135deg, #2563eb, #4338ca)', padding: '2.5rem', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
    content: { width: '65%', padding: '2.5rem', background: 'transparent' },
    title: { fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' },
    subtitle: { fontSize: '0.875rem', color: '#94a3b8', marginBottom: '2rem' },
    label: { display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', marginLeft: '0.25rem' },
    inputWrapper: { position: 'relative', marginBottom: '1.5rem' },
    input: { width: '100%', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(71, 85, 105, 0.5)', borderRadius: '0.75rem', padding: '0.75rem 1rem 0.75rem 2.75rem', color: '#fff', outline: 'none', transition: 'all 0.2s', fontSize: '0.95rem' },
    icon: { position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' },
    photoUpload: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' },
    photoCircle: { width: '100px', height: '100px', borderRadius: '50%', background: '#1e293b', border: '2px solid #334155', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: '0.5rem' },
    photoLabel: { position: 'absolute', bottom: 0, right: 0, background: '#2563eb', padding: '0.4rem', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' },
    button: { width: '100%', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '0.75rem', padding: '1rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontSize: '1rem', marginTop: '1.5rem', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)' },
    error: { background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#f87171', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }
  };

  if (success) {
    return (
      <div style={styles.page}>
        <div style={{...styles.card, flexDirection: 'column', textAlign: 'center', padding: '3rem', maxWidth: '500px'}}>
          <div style={{width: '80px', height: '80px', background: 'rgba(34, 197, 94, 0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem'}}>
            <CheckCircle2 size={40} color="#22c55e" />
          </div>
          <h2 style={{...styles.title, marginBottom: '1rem'}}>Profile Setup Complete!</h2>
          <p style={styles.subtitle}>Your affiliation request has been sent to the institution admin. You will be notified once approved.</p>
          <div style={{color: '#38bdf8', fontSize: '0.875rem', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}>
            <RefreshCw size={16} className="animate-spin" /> Redirecting to dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Left Side */}
        <div style={styles.sidebar} className="hide-on-mobile">
          <div>
            <h2 style={{fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '1.5rem'}}>Complete Your Scholar Identity</h2>
            <p style={{fontSize: '0.9rem', color: '#bfdbfe', opacity: 0.9, lineHeight: 1.6}}>Join the global research network and start publishing your work to verified institutions.</p>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '0.75rem'}}>
              <ShieldCheck size={20} /> <span style={{fontSize: '0.75rem'}}>Verified Publishing</span>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '0.75rem'}}>
              <BarChart2 size={20} /> <span style={{fontSize: '0.75rem'}}>Impact Tracking</span>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div style={styles.content}>
          <h1 style={styles.title}>Scholar Profile</h1>
          <p style={styles.subtitle}>Tell us about your research expertise</p>
          
          {error && <div style={styles.error}><AlertCircle size={18} /> {error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={styles.photoUpload}>
              <div style={styles.photoCircle}>
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                ) : (
                  <User size={40} color="#475569" />
                )}
                <label style={styles.photoLabel}>
                  <Camera size={16} color="#fff" />
                  <input type="file" style={{display: 'none'}} accept="image/*" onChange={handlePhotoChange} />
                </label>
              </div>
              <span style={{fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Profile Image</span>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem'}}>
              <div>
                <label style={styles.label}>Full Name</label>
                <div style={styles.inputWrapper}>
                  <User size={18} style={styles.icon} />
                  <input 
                    type="text" name="name" value={formData.name} onChange={handleChange} required 
                    style={styles.input} placeholder="John Doe" 
                  />
                </div>
              </div>
              <div>
                <label style={styles.label}>Date of Birth</label>
                <div style={styles.inputWrapper}>
                  <Calendar size={18} style={styles.icon} />
                  <input 
                    type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} required 
                    style={styles.input} 
                  />
                </div>
              </div>
            </div>

            <div>
              <label style={styles.label}>Occupation / Title</label>
              <div style={styles.inputWrapper}>
                <Briefcase size={18} style={styles.icon} />
                <input 
                  type="text" name="occupation" value={formData.occupation} onChange={handleChange} required 
                  style={styles.input} placeholder="e.g. Senior Lecturer, Researcher" 
                />
              </div>
            </div>

            <div>
              <label style={styles.label}>Research Interests</label>
              <div style={styles.inputWrapper}>
                <Tag size={18} style={{...styles.icon, top: '1.5rem', transform: 'none'}} />
                <textarea 
                  name="research_interests" value={formData.research_interests} onChange={handleChange} required 
                  style={{...styles.input, height: '80px', paddingLeft: '2.75rem', paddingTop: '0.75rem', resize: 'none'}} placeholder="e.g. Artificial Intelligence, Climate Science..." 
                />
              </div>
            </div>

            <div style={{paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '1.5rem'}}>
              <h3 style={{fontSize: '0.9rem', color: '#fff', fontWeight: 700, marginBottom: '0.25rem'}}>Institutional Affiliation</h3>
              <p style={{fontSize: '0.75rem', color: '#64748b', marginBottom: '1.25rem'}}>Publishing requires verification by a recognized institution.</p>
              
              <div style={styles.inputWrapper}>
                <Building2 size={18} style={styles.icon} />
                <select 
                  name="institution_id" value={formData.institution_id} onChange={handleChange} required 
                  style={{...styles.input, appearance: 'none', cursor: 'pointer'}}
                >
                  <option value="" style={{background: '#0f172a'}}>-- Choose Institution --</option>
                  {institutions.map(inst => (
                    <option key={inst.id} value={inst.id} style={{background: '#0f172a'}}>{inst.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" disabled={isLoading} style={styles.button}>
              {isLoading ? <><RefreshCw size={18} className="animate-spin" /> Processing...</> : 'Complete Setup & Request Access'}
            </button>
          </form>
        </div>
      </div>
      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .hide-on-mobile { display: none !important; }
          div[style*="width: 65%"] { width: 100% !important; }
        }
      `}</style>
    </div>
  );
}
