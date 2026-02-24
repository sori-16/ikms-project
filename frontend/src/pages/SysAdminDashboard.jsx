/**
 * IKMS – System Admin Dashboard (Redesigned)
 * Bug Fix: u.username → u.name
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getUser, getAuthHeaders, logout } from '../utils/auth';
import { Users, Database, Activity, Shield, Search } from 'lucide-react';
import './Dashboard.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function SysAdminDashboard() {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const u = getUser();
        if (!u || u.role !== 'sys_admin') { navigate('/login'); return; }
        fetchData();
    }, [navigate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, usersRes] = await Promise.all([
                axios.get(`${API}/admin/stats`, { headers: getAuthHeaders() }),
                axios.get(`${API}/admin/users`, { headers: getAuthHeaders() })
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data);
        } catch {
            setMessage('error:Failed to load system data.');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleUpdate = async (userId, newRole) => {
        try {
            await axios.put(`${API}/admin/users/${userId}/role`, { role: newRole }, { headers: getAuthHeaders() });
            setMessage('success:Role updated successfully.');
            fetchData();
        } catch {
            setMessage('error:Failed to update role.');
        }
        setTimeout(() => setMessage(''), 3000);
    };

    // FIXED: filter on u.name (not u.username which doesn't exist on model)
    const filteredUsers = users.filter(u =>
        (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const msgType = message.startsWith('success:') ? 'success' : 'error';
    const msgText = message.replace(/^(success|error):/, '');

    const ROLES = ['public', 'researcher', 'moderator', 'inst_admin', 'sys_admin'];

    return (
        <div className="page-wrapper">
            <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
                <div className="dash-header">
                    <div>
                        <h1 className="dash-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Shield size={28} color="var(--primary)" /> System Administration
                        </h1>
                        <p className="dash-subtitle">Platform governance, user management, and system oversight.</p>
                    </div>
                    <button onClick={logout} className="btn btn-ghost btn-sm">Logout</button>
                </div>

                {message && <div className={`message-banner ${msgType}`}>{msgText}</div>}

                {/* Platform Stats */}
                <div className="dash-stats-grid" style={{ marginBottom: '2rem' }}>
                    <div className="stat-card" style={{ borderTop: '4px solid var(--primary)' }}>
                        <Users size={22} color="var(--primary)" style={{ marginBottom: '0.5rem', opacity: 0.6 }} />
                        <div className="stat-value">{stats?.users || 0}</div>
                        <div className="stat-label">Total Users</div>
                    </div>
                    <div className="stat-card" style={{ borderTop: '4px solid var(--success)' }}>
                        <Database size={22} color="var(--success)" style={{ marginBottom: '0.5rem', opacity: 0.6 }} />
                        <div className="stat-value">{stats?.documents?.approved || 0}</div>
                        <div className="stat-label">Approved Knowledge</div>
                    </div>
                    <div className="stat-card" style={{ borderTop: '4px solid var(--warning)' }}>
                        <Activity size={22} color="var(--warning)" style={{ marginBottom: '0.5rem', opacity: 0.6 }} />
                        <div className="stat-value">{stats?.documents?.pending || 0}</div>
                        <div className="stat-label">Pending Review</div>
                    </div>
                    <div className="stat-card" style={{ borderTop: '4px solid var(--info)' }}>
                        <div className="stat-value">{stats?.institutions || 0}</div>
                        <div className="stat-label">Institutions</div>
                    </div>
                </div>

                {/* System Status */}
                {stats?.system && (
                    <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
                        <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>System Status</h3>
                        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                            <span>
                                🔌 Elasticsearch:{' '}
                                <strong style={{ color: stats.system.elasticsearch === 'connected' ? 'var(--success)' : 'var(--danger)' }}>
                                    {stats.system.elasticsearch}
                                </strong>
                            </span>
                            <span>
                                🗄 Database:{' '}
                                <strong style={{ color: 'var(--success)' }}>{stats.system.database}</strong>
                            </span>
                        </div>
                    </div>
                )}

                {/* User Management */}
                <div className="card">
                    <div className="section-header">
                        <h2 className="section-title">User Accounts</h2>
                        <div style={{ position: 'relative', width: '260px' }}>
                            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Search users..."
                                className="input-field"
                                style={{ paddingLeft: '2.5rem' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading-state">Loading users</div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        {/* FIXED: header says "Name" not "Username" */}
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Current Role</th>
                                        <th>Change Role</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(u => (
                                        <tr key={u.id} className="user-table-row">
                                            {/* FIXED: render u.name not u.username */}
                                            <td style={{ fontWeight: 600 }}>{u.name || '—'}</td>
                                            <td>{u.email}</td>
                                            <td>
                                                <span className={`badge badge-${u.role === 'sys_admin' ? 'primary' : u.role === 'moderator' ? 'new' : 'approved'}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td>
                                                <select
                                                    className="user-role-select"
                                                    value={u.role}
                                                    onChange={(e) => handleRoleUpdate(u.id, e.target.value)}
                                                >
                                                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <tr>
                                            <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                                No users match your search.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SysAdminDashboard;
