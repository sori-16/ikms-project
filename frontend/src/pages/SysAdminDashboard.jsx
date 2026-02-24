import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getUser, getAuthHeaders, logout } from '../utils/auth';
import { Users, Database, Shield, Activity, Search, Edit2, Check, X } from 'lucide-react';
import './Dashboard.css';

function SysAdminDashboard() {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        const user = getUser();
        if (!user || user.role !== 'sys_admin') {
            navigate('/login');
            return;
        }
        setCurrentUser(user);
        fetchData();
    }, [navigate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, usersRes] = await Promise.all([
                axios.get(`${apiUrl}/admin/stats`, { headers: getAuthHeaders() }),
                axios.get(`${apiUrl}/admin/users`, { headers: getAuthHeaders() })
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data);
        } catch (error) {
            console.error('Error fetching admin data:', error);
            setMessage('✗ Failed to load system data');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleUpdate = async (userId, newRole) => {
        try {
            await axios.put(`${apiUrl}/admin/users/${userId}/role`, { role: newRole }, {
                headers: getAuthHeaders()
            });
            setMessage(`✓ Role updated successfully`);
            fetchData();
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('✗ Failed to update role');
        }
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!currentUser) return null;

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Shield className="accent-text" size={32} />
                        System Administration
                    </h1>
                    <p>Global oversight and platform governance</p>
                </div>
                <button onClick={logout} className="btn-secondary">Logout</button>
            </div>

            {message && (
                <div className={`message ${message.startsWith('✓') ? 'success' : 'error'}`} style={{ marginBottom: '1.5rem' }}>
                    {message}
                </div>
            )}

            {/* Platform Stats Grid */}
            <div className="dashboard-grid" style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                <div className="glass-panel" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ opacity: 0.6, fontSize: '0.8rem', textTransform: 'uppercase' }}>Total Users</p>
                            <h2 style={{ fontSize: '2rem', margin: '0.5rem 0' }}>{stats?.users || 0}</h2>
                        </div>
                        <Users size={40} opacity={0.2} />
                    </div>
                </div>
                <div className="glass-panel" style={{ borderLeft: '4px solid #10b981' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ opacity: 0.6, fontSize: '0.8rem', textTransform: 'uppercase' }}>Approved Knowledge</p>
                            <h2 style={{ fontSize: '2rem', margin: '0.5rem 0' }}>{stats?.documents?.approved || 0}</h2>
                        </div>
                        <Database size={40} opacity={0.2} />
                    </div>
                </div>
                <div className="glass-panel" style={{ borderLeft: '4px solid #f59e0b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ opacity: 0.6, fontSize: '0.8rem', textTransform: 'uppercase' }}>Pending Review</p>
                            <h2 style={{ fontSize: '2rem', margin: '0.5rem 0' }}>{stats?.documents?.pending || 0}</h2>
                        </div>
                        <Activity size={40} opacity={0.2} />
                    </div>
                </div>
            </div>

            {/* User Management Section */}
            <div className="glass-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2>User Accounts</h2>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                        <input
                            type="text"
                            placeholder="Find user..."
                            className="search-input"
                            style={{ paddingLeft: '2.5rem', width: '100%' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-container">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <th style={{ padding: '1rem' }}>Username</th>
                                <th style={{ padding: '1rem' }}>Email</th>
                                <th style={{ padding: '1rem' }}>Current Role</th>
                                <th style={{ padding: '1rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '1rem' }}>{user.username}</td>
                                    <td style={{ padding: '1rem' }}>{user.email}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span className={`status-badge badge-${user.role}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                                            style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '4px' }}
                                        >
                                            <option value="public">Public</option>
                                            <option value="researcher">Researcher</option>
                                            <option value="moderator">Moderator</option>
                                            <option value="inst_admin">Inst Admin</option>
                                            <option value="sys_admin">Sys Admin</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default SysAdminDashboard;
