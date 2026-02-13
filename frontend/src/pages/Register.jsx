// Created by: Soreti (Team Leader) - Demo Implementation
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { setToken, setUser } from '../utils/auth';
import './Auth.css';

function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'researcher'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const { confirmPassword, ...registerData } = formData;
            const response = await axios.post('http://localhost:5000/register', registerData);

            // Auto-login after registration
            setToken(response.data.token);
            setUser(response.data.user);

            // Redirect based on role
            const role = response.data.user.role;
            if (role === 'moderator' || role === 'sys_admin') {
                navigate('/moderator-dashboard');
            } else {
                navigate('/researcher-dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card glass-panel">
                <h1 className="auth-title">Create Account</h1>
                <p className="auth-subtitle">Join the IKMS research community</p>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="glass-input"
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="glass-input"
                            placeholder="john@example.com"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength="6"
                            className="glass-input"
                            placeholder="At least 6 characters"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            className="glass-input"
                            placeholder="Re-enter password"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="role">Role</label>
                        <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="glass-input"
                        >
                            <option value="researcher">Researcher</option>
                            <option value="moderator">Moderator</option>
                            <option value="inst_admin">Institution Admin</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account? <Link to="/login">Sign in here</Link>
                </p>
            </div>
        </div>
    );
}

export default Register;
