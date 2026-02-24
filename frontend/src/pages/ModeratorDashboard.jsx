/**
 * IKMS – Moderator Dashboard (Redesigned)
 * Bug Fix: Uses VITE_API_URL instead of hardcoded localhost
 * New: Abstract preview, reject-with-reason, request revision
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getUser, logout, getAuthHeaders } from '../utils/auth';
import { Shield, CheckCircle, XCircle, MessageSquare, Eye, EyeOff } from 'lucide-react';
import './Dashboard.css';

// FIXED: Use env var, not hardcoded localhost
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function ModeratorDashboard() {
    const [user, setUser] = useState(null);
    const [pendingDocs, setPendingDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [rejectModal, setRejectModal] = useState(null); // { docId, reason }
    const navigate = useNavigate();

    useEffect(() => {
        const u = getUser();
        if (!u) { navigate('/login'); return; }
        if (u.role !== 'moderator' && u.role !== 'sys_admin') { navigate('/researcher-dashboard'); return; }
        setUser(u);
        fetchPendingDocuments();
    }, [navigate]);

    const fetchPendingDocuments = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/documents/pending`, { headers: getAuthHeaders() });
            setPendingDocs(res.data);
        } catch {
            setMessage('error:Failed to load pending documents.');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (docId) => {
        try {
            await axios.put(`${API}/documents/${docId}/status`, { status: 'approved' }, { headers: getAuthHeaders() });
            setMessage('success:Document approved successfully!');
            setPendingDocs(pendingDocs.filter(d => d.id !== docId));
        } catch {
            setMessage('error:Failed to approve document.');
        }
        setTimeout(() => setMessage(''), 3000);
    };

    const handleReject = async () => {
        if (!rejectModal) return;
        try {
            await axios.put(`${API}/documents/${rejectModal.docId}/status`,
                { status: 'rejected', notes: rejectModal.reason },
                { headers: getAuthHeaders() }
            );
            setMessage('success:Document rejected with reason provided.');
            setPendingDocs(pendingDocs.filter(d => d.id !== rejectModal.docId));
            setRejectModal(null);
        } catch {
            setMessage('error:Failed to reject document.');
        }
        setTimeout(() => setMessage(''), 3000);
    };

    const msgType = message.startsWith('success:') ? 'success' : 'error';
    const msgText = message.replace(/^(success|error):/, '');

    if (!user) return null;

    return (
        <div className="page-wrapper">
            <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
                <div className="dash-header">
                    <div>
                        <h1 className="dash-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Shield size={28} color="var(--primary)" /> Moderator Dashboard
                        </h1>
                        <p className="dash-subtitle">Welcome, {user.name} — Review and moderate submitted research papers.</p>
                    </div>
                    <button onClick={logout} className="btn btn-ghost btn-sm">Logout</button>
                </div>

                {message && <div className={`message-banner ${msgType}`}>{msgText}</div>}

                {/* Stats */}
                <div className="dash-stats-grid" style={{ marginBottom: '2rem' }}>
                    <div className="stat-card" style={{ borderTop: '4px solid var(--warning)' }}>
                        <div className="stat-value">{pendingDocs.length}</div>
                        <div className="stat-label">Pending Review</div>
                    </div>
                </div>

                {/* Queue */}
                <div className="card">
                    <div className="section-header">
                        <h2 className="section-title">Review Queue</h2>
                        <button className="btn btn-ghost btn-sm" onClick={fetchPendingDocuments}>Refresh</button>
                    </div>

                    {loading ? (
                        <div className="loading-state">Loading pending documents</div>
                    ) : pendingDocs.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">🎉</div>
                            No pending documents — the queue is clear!
                        </div>
                    ) : (
                        <div className="mod-grid">
                            {pendingDocs.map(doc => (
                                <div key={doc.id} className="mod-card card" style={{ borderLeft: '4px solid var(--warning)' }}>
                                    <div className="mod-card-info">
                                        <div className="mod-card-title">{doc.title}</div>
                                        <div className="mod-card-meta">
                                            Uploaded: {new Date(doc.upload_date).toLocaleDateString()}
                                            {doc.uploader_id && ` · Uploader ID: ${doc.uploader_id}`}
                                        </div>
                                        {expandedId === doc.id && doc.abstract && (
                                            <p className="mod-card-abstract" style={{ '-webkitLineClamp': 'unset', marginTop: '0.5rem' }}>
                                                {doc.abstract}
                                            </p>
                                        )}
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            style={{ marginTop: '0.5rem', padding: '0.25rem 0.6rem' }}
                                            onClick={() => setExpandedId(expandedId === doc.id ? null : doc.id)}
                                        >
                                            {expandedId === doc.id ? <EyeOff size={13} /> : <Eye size={13} />}
                                            {expandedId === doc.id ? ' Hide' : ' Preview Abstract'}
                                        </button>
                                    </div>
                                    <div className="mod-actions">
                                        <button className="btn btn-success btn-sm" onClick={() => handleApprove(doc.id)}>
                                            <CheckCircle size={15} /> Approve
                                        </button>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => setRejectModal({ docId: doc.id, reason: '' })}
                                        >
                                            <XCircle size={15} /> Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Reject Modal */}
                {rejectModal && (
                    <div className="modal-backdrop">
                        <div className="modal-box card">
                            <h3 style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <MessageSquare size={20} color="var(--danger)" /> Reject Document
                            </h3>
                            <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                                Provide a reason so the researcher can improve their submission:
                            </p>
                            <textarea
                                className="input-field"
                                rows={4}
                                placeholder="Reason for rejection (required)..."
                                value={rejectModal.reason}
                                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                            />
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                                <button className="btn btn-ghost btn-sm" onClick={() => setRejectModal(null)}>Cancel</button>
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={handleReject}
                                    disabled={!rejectModal.reason.trim()}
                                >
                                    Confirm Rejection
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ModeratorDashboard;
