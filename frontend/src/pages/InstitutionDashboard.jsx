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
    const navigate = useNavigate();

    useEffect(() => {
        const currentUser = getUser();
        if (!currentUser || (currentUser.role !== 'inst_admin' && currentUser.role !== 'sys_admin')) {
            navigate('/login');
            return;
        }
        setUser(currentUser);
        fetchPending();
    }, [navigate]);

    const fetchPending = async () => {
        try {
            const response = await axios.get('http://localhost:5000/institutions/my/pending', {
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
            await axios.post(`http://localhost:5000/documents/${docId}/institutional-verify`, { status }, {
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

            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
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
