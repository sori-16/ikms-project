// Created by: Soreti (Team Leader) - Phase 11 Implementation
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Shield, Check, X, FileText, User, Calendar, Building } from 'lucide-react';
import { getUser, getAuthHeaders, logout } from '../utils/auth';
import './Dashboard.css';

function InstitutionDashboard() {
    const [pendingDocs, setPendingDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);
    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        const currentUser = getUser();
        if (!currentUser || (currentUser.role !== 'inst_admin' && currentUser.role !== 'sys_admin')) {
            navigate('/login');
            return;
        }
        setUser(currentUser);
        fetchPending();
        fetchStats();
    }, [navigate]);

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${apiUrl}/institutions/my/analytics`, {
                headers: getAuthHeaders()
            });
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching institutional stats:', error);
        }
    };

    const fetchPending = async () => {
        try {
            const response = await axios.get(`${apiUrl}/institutions/my/pending`, {
                headers: getAuthHeaders()
            });
            setPendingDocs(response.data);
        } catch (error) {
            console.error('Error fetching institutional pending docs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (docId, status) => {
        try {
            await axios.post(`${apiUrl}/documents/${docId}/institutional-verify`, { status }, {
                headers: getAuthHeaders()
            });
            fetchPending();
        } catch (error) {
            alert('Failed to update status');
        }
    };

    if (!user) return null;

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Shield className="accent-text" size={32} />
                        Institutional Admin Portal
                    </h1>
                    <p>Managing research quality for <strong>{user.institution?.name || 'Your Institution'}</strong></p>
                </div>
                <button onClick={logout} className="btn-secondary">Logout</button>
            </div>

            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr', gap: '2rem' }}>
                {/* Analytics Snapshot */}
                <div className="glass-panel" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <h2 style={{ marginBottom: '1.5rem', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Building size={20} /> Institutional Performance Snapshot
                    </h2>
                    <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
                        <div className="stat-card-mini">
                            <span style={{ display: 'block', fontSize: '2.5rem', fontWeight: 800, color: '#3b82f6' }}>
                                {stats?.total_documents || 0}
                            </span>
                            <span style={{ opacity: 0.6, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '1px' }}>Research Papers</span>
                        </div>
                        <div className="stat-card-mini" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '3rem' }}>
                            <span style={{ display: 'block', fontSize: '2.5rem', fontWeight: 800, color: '#10b981' }}>
                                {stats?.total_downloads || 0}
                            </span>
                            <span style={{ opacity: 0.6, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '1px' }}>Global Downloads</span>
                        </div>
                        <div className="stat-card-mini" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '3rem' }}>
                            <span style={{ display: 'block', fontSize: '2.5rem', fontWeight: 800, color: '#a855f7' }}>
                                {stats?.active_researchers || 0}
                            </span>
                            <span style={{ opacity: 0.6, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '1px' }}>Active Researchers</span>
                        </div>
                    </div>
                </div>

                <div className="glass-panel">
                    <h2 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={20} /> Pending Institutional Verification
                    </h2>

                    {loading ? (
                        <div className="loading-state">Loading verification queue...</div>
                    ) : pendingDocs.length === 0 ? (
                        <div className="empty-state">
                            <Check size={48} className="accent-text" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <p>No documents pending verification at this time.</p>
                        </div>
                    ) : (
                        <div className="moderation-list">
                            {pendingDocs.map((doc) => (
                                <div key={doc.id} className="moderation-card glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ margin: '0 0 0.5rem 0' }}>{doc.title}</h3>
                                        <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <User size={14} /> Researcher: {doc.uploader_name}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <Calendar size={14} /> Uploaded: {new Date(doc.upload_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button
                                            onClick={() => handleAction(doc.id, 'verified')}
                                            className="btn-primary-small"
                                            style={{ background: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                        >
                                            <Check size={16} /> Verify Affiliation
                                        </button>
                                        <button
                                            onClick={() => handleAction(doc.id, 'rejected')}
                                            className="btn-outline"
                                            style={{ color: '#ef4444', borderColor: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                        >
                                            <X size={16} /> Reject Claim
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default InstitutionDashboard;
