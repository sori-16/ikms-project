import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { setToken, setUser } from '../utils/auth';
import './Auth.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`${API}/login`, { email, password });
            setToken(res.data.token);
            setUser(res.data.user);
            const role = res.data.user.role;
            if (role === 'sys_admin') navigate('/admin/sysadmin');
            else if (role === 'moderator') navigate('/admin/moderator');
            else if (role === 'inst_admin') navigate('/admin/institution');
            else navigate('/researcher-dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card card">
                <div className="auth-logo">IK<span>MS</span></div>
                <h1 className="auth-title">Welcome Back</h1>
                <p className="auth-subtitle">Sign in to your IKMS account</p>

                {error && <div className="message-banner error">{error}</div>}

                <form onSubmit={handleLogin} className="auth-form">
                    <div className="form-group">
                        <label className="input-label" htmlFor="email">
                            <Mail size={14} style={{ display: 'inline', marginRight: '4px' }} />
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            className="input-field"
                            placeholder="you@university.edu.et"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>
                    <div className="form-group">
                        <label className="input-label" htmlFor="password">
                            <Lock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            className="input-field"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-full" style={{ marginTop: '0.5rem' }} disabled={loading}>
                        {loading ? 'Signing in...' : <><ArrowRight size={17} /> Sign In</>}
                    </button>
                </form>

                <div className="auth-divider"><span>Don't have an account?</span></div>
                <Link to="/register" className="btn btn-secondary w-full" style={{ justifyContent: 'center' }}>
                    Create Account
                </Link>
                <p className="auth-note">
                    By signing in, you agree to the IKMS{' '}
                    <a href="#terms">Terms of Use</a> and <a href="#open-access">Open Access Policy</a>.
                </p>
            </div>
        </div>
    );
}

export default Login;
