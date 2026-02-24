import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Mail, Lock, Building2, ArrowRight } from 'lucide-react';
import { setToken, setUser } from '../utils/auth';
import './Auth.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function Register() {
    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'researcher', institution_id: '' });
    const [institutions, setInstitutions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        axios.get(`${API}/institutions`).then(r => setInstitutions(r.data)).catch(() => { });
    }, []);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleRegister = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirm) {
            setError('Passwords do not match.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`${API}/register`, {
                name: form.name,
                email: form.email,
                password: form.password,
                role: form.role,
                institution_id: form.institution_id || null
            });
            setToken(res.data.token);
            setUser(res.data.user);
            navigate('/researcher-dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card auth-card-wide card">
                <div className="auth-logo">IK<span>MS</span></div>
                <h1 className="auth-title">Create Account</h1>
                <p className="auth-subtitle">Join the Ethiopian Open Access Research Portal</p>

                {error && <div className="message-banner error">{error}</div>}

                <form onSubmit={handleRegister} className="auth-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label className="input-label" htmlFor="name">
                                <User size={14} style={{ display: 'inline', marginRight: '4px' }} /> Full Name
                            </label>
                            <input id="name" name="name" type="text" className="input-field" placeholder="Dr. Ababu Kebede" value={form.name} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label className="input-label" htmlFor="email">
                                <Mail size={14} style={{ display: 'inline', marginRight: '4px' }} /> Email Address
                            </label>
                            <input id="email" name="email" type="email" className="input-field" placeholder="you@university.edu.et" value={form.email} onChange={handleChange} required autoComplete="email" />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="input-label" htmlFor="password">
                                <Lock size={14} style={{ display: 'inline', marginRight: '4px' }} /> Password
                            </label>
                            <input id="password" name="password" type="password" className="input-field" placeholder="Min. 8 characters" value={form.password} onChange={handleChange} required autoComplete="new-password" />
                        </div>
                        <div className="form-group">
                            <label className="input-label" htmlFor="confirm">
                                <Lock size={14} style={{ display: 'inline', marginRight: '4px' }} /> Confirm Password
                            </label>
                            <input id="confirm" name="confirm" type="password" className="input-field" placeholder="Repeat password" value={form.confirm} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="input-label" htmlFor="role">Account Type</label>
                            <select id="role" name="role" className="input-field" value={form.role} onChange={handleChange}>
                                <option value="researcher">Researcher</option>
                                <option value="inst_admin">Institution Admin</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="input-label" htmlFor="institution_id">
                                <Building2 size={14} style={{ display: 'inline', marginRight: '4px' }} /> Institution (Optional)
                            </label>
                            <select id="institution_id" name="institution_id" className="input-field" value={form.institution_id} onChange={handleChange}>
                                <option value="">Select Institution...</option>
                                {institutions.map(inst => (
                                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="auth-terms-check">
                        <input type="checkbox" id="terms-agree" required />
                        <label htmlFor="terms-agree">
                            I agree to the IKMS <a href="#terms">Terms of Use</a> and{' '}
                            <a href="#open-access">Open Access Policy</a>.
                        </label>
                    </div>

                    <button type="submit" className="btn btn-primary w-full" style={{ marginTop: '0.5rem' }} disabled={loading}>
                        {loading ? 'Creating Account...' : <><ArrowRight size={17} /> Create Account</>}
                    </button>
                </form>

                <div className="auth-divider"><span>Already have an account?</span></div>
                <Link to="/login" className="btn btn-secondary w-full" style={{ justifyContent: 'center' }}>
                    Sign In
                </Link>
            </div>
        </div>
    );
}

export default Register;
