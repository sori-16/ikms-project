import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Shield, CheckCircle, XCircle, FileText, User, Calendar, Building2, Download, BarChart2 } from 'lucide-react';
import { getUser, getAuthHeaders, logout } from '../../utils/auth';
import '../Dashboard.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function InstitutionDashboard() {
    const [pendingDocs, setPendingDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const navigate = useNavigate();

    useEffect(() => {
        const u = getUser();
        if (!u || (u.role !== 'inst_admin' && u.role !== 'sys_admin')) {
            navigate('/login');
            return;
        }
        setUser(u);
        fetchStats();
        fetchPending();
    }, [navigate]);

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${API}/institutions/my/analytics`, { headers: getAuthHeaders() });
            setStats(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchPending = async () => {
        try {
            const res = await axios.get(`${API}/institutions/my/pending`, { headers: getAuthHeaders() });
            setPendingDocs(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleAction = async (docId, status) => {
        try {
            await axios.post(`${API}/documents/${docId}/institutional-verify`, { status }, { headers: getAuthHeaders() });
            setMessage(`success:Document ${status === 'verified' ? 'verified' : 'rejected'}.`);
            fetchPending();
        } catch {
            setMessage('error:Failed to update status.');
        }
        setTimeout(() => setMessage(''), 3000);
    };

    const msgType = message.startsWith('success:') ? 'success' : 'error';
    const msgText = message.replace(/^(success|error):/, '');

    if (!user) return null;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <BarChart2 size={16} /> },
        { id: 'pending', label: `Pending (${pendingDocs.length})`, icon: <FileText size={16} /> },
    ];

    return (
        <div className="page-wrapper">
            <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
                <div className="dash-header">
                    <div>
                        <h1 className="dash-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Building2 size={28} color="var(--primary)" /> Institution Dashboard
                        </h1>
                        <p className="dash-subtitle">{user.institution?.name || 'Your Institution'}</p>
                    </div>
                    <button onClick={logout} className="btn btn-ghost btn-sm">Logout</button>
                </div>

                {message && <div className={`message-banner ${msgType}`}>{msgText}</div>}

                <div className="dash-tabs">
                    {tabs.map(t => (
                        <button key={t.id} className={`dash-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'overview' && (
                    <div className="animate-slideUp">
                        <div className="dash-stats-grid">
                            <div className="stat-card" style={{ borderTop: '4px solid var(--primary)' }}>
                                <div className="stat-value">{stats?.total_documents || 0}</div>
                                <div className="stat-label">Research Papers</div>
                            </div>
                            <div className="stat-card" style={{ borderTop: '4px solid var(--success)' }}>
                                <div className="stat-value">{stats?.total_downloads || 0}</div>
                                <div className="stat-label">Total Downloads</div>
                            </div>
                            <div className="stat-card" style={{ borderTop: '4px solid var(--gold-dark)' }}>
                                <div className="stat-value">{stats?.active_researchers || 0}</div>
                                <div className="stat-label">Active Researchers</div>
                            </div>
                            <div className="stat-card" style={{ borderTop: '4px solid var(--warning)' }}>
                                <div className="stat-value">{pendingDocs.length}</div>
                                <div className="stat-label">Pending Verification</div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'pending' && (
                    <div className="card animate-slideUp">
                        <div className="section-header">
                            <h2 className="section-title">Pending Institutional Verification</h2>
                            <button className="btn btn-ghost btn-sm" onClick={fetchPending}>Refresh</button>
                        </div>

                        {loading ? (
                            <div className="loading-state">Loading verification queue</div>
                        ) : pendingDocs.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">✅</div>
                                No documents pending verification at this time.
                            </div>
                        ) : (
                            <div className="mod-grid">
                                {pendingDocs.map(doc => (
                                    <div key={doc.id} className="mod-card card" style={{ borderLeft: '4px solid var(--warning)' }}>
                                        <div className="mod-card-info">
                                            <div className="mod-card-title">{doc.title}</div>
                                            <div className="mod-card-meta" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    <User size={13} /> {doc.uploader_name}
                                                </span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    <Calendar size={13} /> {new Date(doc.upload_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mod-actions">
                                            <button className="btn btn-success btn-sm" onClick={() => handleAction(doc.id, 'verified')}>
                                                <CheckCircle size={14} /> Verify
                                            </button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleAction(doc.id, 'rejected')}>
                                                <XCircle size={14} /> Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default InstitutionDashboard;
