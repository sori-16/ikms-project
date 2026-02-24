/**
 * IKMS – Researcher Dashboard (Redesigned)
 * Bug Fix: fetchMyDocuments now uses correct endpoint
 * New: Tabs, drag-drop upload, license checkbox, impact stats
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { getUser, logout, getAuthHeaders } from '../utils/auth';
import { Bell, Trash2, Search, UploadCloud, BarChart2, BookOpen, AlertCircle, RefreshCw } from 'lucide-react';
import './Dashboard.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function ResearcherDashboard() {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [myDocuments, setMyDocuments] = useState([]);
    const [savedSearches, setSavedSearches] = useState([]);
    const [stats, setStats] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [licenseAgreed, setLicenseAgreed] = useState(false);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const currentUser = getUser();
        if (!currentUser) { navigate('/login'); return; }
        setUser(currentUser);
        fetchMyDocuments();
        fetchSavedSearches();
        fetchStats();
    }, [navigate]);

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${API}/researcher/stats`, { headers: getAuthHeaders() });
            setStats(res.data);
        } catch (e) { console.error(e); }
    };

    // FIXED: Use /researcher/documents or fall back to filter by uploader
    const fetchMyDocuments = async () => {
        try {
            // Try researcher-specific endpoint first
            const res = await axios.get(`${API}/researcher/documents`, { headers: getAuthHeaders() });
            setMyDocuments(res.data);
        } catch {
            // Fallback: fetch all and filter client-side
            try {
                const allRes = await axios.get(`${API}/search?q=`, { headers: getAuthHeaders() });
                const u = getUser();
                setMyDocuments(allRes.data.filter(d => d.uploader_id === u?.id));
            } catch (e) { console.error(e); }
        }
    };

    const fetchSavedSearches = async () => {
        try {
            const res = await axios.get(`${API}/saved-searches`, { headers: getAuthHeaders() });
            setSavedSearches(res.data);
        } catch (e) { console.error(e); }
    };

    const deleteSearch = async (id) => {
        try {
            await axios.delete(`${API}/saved-searches/${id}`, { headers: getAuthHeaders() });
            fetchSavedSearches();
        } catch (e) { console.error(e); }
    };

    const clearAlerts = async (id) => {
        try {
            await axios.post(`${API}/saved-searches/${id}/clear-alerts`, {}, { headers: getAuthHeaders() });
            fetchSavedSearches();
        } catch (e) { console.error(e); }
    };

    const onFileDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped?.type === 'application/pdf') {
            setFile(dropped);
            setMessage('');
        } else {
            setMessage('Only PDF files are accepted.');
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) { setMessage('Please select a PDF file.'); return; }
        if (!licenseAgreed) { setMessage('Please agree to the CC BY 4.0 license.'); return; }

        setUploading(true);
        setMessage('');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('uploader_id', user.id);
        try {
            await axios.post(`${API}/upload`, formData, {
                headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' }
            });
            setMessage('success:Document submitted successfully! Pending moderation review.');
            setFile(null);
            setLicenseAgreed(false);
            fetchMyDocuments();
            fetchStats();
            setActiveTab('uploads');
        } catch (err) {
            setMessage('error:Upload failed: ' + (err.response?.data?.error || 'Unknown error'));
        } finally {
            setUploading(false);
        }
    };

    const handleRevision = async (docId) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf';
        input.onchange = async (e) => {
            const revFile = e.target.files[0];
            if (!revFile) return;
            setUploading(true);
            const formData = new FormData();
            formData.append('file', revFile);
            try {
                await axios.post(`${API}/documents/${docId}/revision`, formData, {
                    headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' }
                });
                setMessage('success:Revision submitted!');
                fetchMyDocuments();
            } catch (err) {
                setMessage('error:Revision failed: ' + (err.response?.data?.error || 'Unknown error'));
            } finally { setUploading(false); }
        };
        input.click();
    };

    const msgType = message.startsWith('success:') ? 'success' : 'error';
    const msgText = message.replace(/^(success|error):/, '');

    const getStatusBadge = (status) => {
        const map = { pending: 'badge-pending', approved: 'badge-approved', rejected: 'badge-rejected' };
        const labels = { pending: '⏳ Pending', approved: '✓ Approved', rejected: '✗ Rejected' };
        return <span className={`badge ${map[status] || 'badge-pending'}`}>{labels[status] || 'Pending'}</span>;
    };

    if (!user) return null;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <BarChart2 size={16} /> },
        { id: 'uploads', label: `My Uploads (${myDocuments.length})`, icon: <BookOpen size={16} /> },
        { id: 'upload', label: 'Upload New', icon: <UploadCloud size={16} /> },
        { id: 'alerts', label: `Saved Alerts (${savedSearches.length})`, icon: <Bell size={16} /> },
    ];

    return (
        <div className="page-wrapper">
            <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
                {/* Header */}
                <div className="dash-header">
                    <div>
                        <h1 className="dash-title">Researcher Dashboard</h1>
                        <p className="dash-subtitle">Welcome back, {user.name}! <span style={{ opacity: 0.6, fontSize: '0.85rem' }}>— የተመራማሪ ዳሽቦርድ</span></p>
                    </div>
                    <button onClick={logout} className="btn btn-ghost btn-sm">Logout</button>
                </div>

                {/* Message Banner */}
                {message && <div className={`message-banner ${msgType}`}>{msgText}</div>}

                {/* Tabs */}
                <div className="dash-tabs">
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            className={`dash-tab ${activeTab === t.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(t.id)}
                        >
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>

                {/* ── Overview Tab ── */}
                {activeTab === 'overview' && (
                    <div className="animate-slideUp">
                        <div className="dash-stats-grid">
                            <div className="stat-card" style={{ borderTop: '4px solid var(--primary)' }}>
                                <div className="stat-value">{stats?.total_publications || 0}</div>
                                <div className="stat-label">Publications</div>
                            </div>
                            <div className="stat-card" style={{ borderTop: '4px solid var(--success)' }}>
                                <div className="stat-value">{stats?.total_downloads || 0}</div>
                                <div className="stat-label">Total Downloads</div>
                            </div>
                            <div className="stat-card" style={{ borderTop: '4px solid var(--gold-dark)' }}>
                                <div className="stat-value">{stats?.total_views || 0}</div>
                                <div className="stat-label">Total Views</div>
                            </div>
                            <div className="stat-card" style={{ borderTop: '4px solid var(--info)' }}>
                                <div className="stat-value">{savedSearches.filter(s => s.alert_count > 0).length}</div>
                                <div className="stat-label">Active Alerts</div>
                            </div>
                        </div>
                        <div className="dash-quick-actions card" style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
                            <h3 style={{ marginBottom: '1rem' }}>Quick Actions</h3>
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <button className="btn btn-primary" onClick={() => setActiveTab('upload')}>
                                    <UploadCloud size={16} /> Upload New Paper
                                </button>
                                <Link to="/" className="btn btn-secondary">
                                    <Search size={16} /> Search Research
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── My Uploads Tab ── */}
                {activeTab === 'uploads' && (
                    <div className="card animate-slideUp">
                        <div className="section-header">
                            <h2 className="section-title">My Publications</h2>
                            <button className="btn btn-ghost btn-sm" onClick={fetchMyDocuments}>
                                <RefreshCw size={14} /> Refresh
                            </button>
                        </div>
                        {myDocuments.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">📄</div>
                                No documents uploaded yet. Use "Upload New" to add your first paper.
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Uploaded</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myDocuments.map(doc => (
                                        <tr key={doc.id}>
                                            <td><Link to={`/document/${doc.id}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>{doc.title}</Link></td>
                                            <td>{new Date(doc.upload_date).toLocaleDateString()}</td>
                                            <td>{getStatusBadge(doc.status || 'pending')}</td>
                                            <td>
                                                {doc.status === 'rejected' && (
                                                    <button className="btn btn-ghost btn-sm" onClick={() => handleRevision(doc.id)}>
                                                        Submit Revision
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* ── Upload Tab ── */}
                {activeTab === 'upload' && (
                    <div className="card animate-slideUp" style={{ maxWidth: '640px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
                            <div style={{ background: 'var(--primary)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                                <UploadCloud color="#fff" size={22} />
                            </div>
                            <div>
                                <h2 style={{ margin: 0 }}>Upload New Research</h2>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>አዲስ ጥናት ይጫኑ</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpload}>
                            {/* Drag & Drop Zone */}
                            <div
                                className={`dropzone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={onFileDrop}
                                onClick={() => fileInputRef.current.click()}
                            >
                                <input
                                    type="file"
                                    accept=".pdf"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                        const f = e.target.files[0];
                                        if (f?.type === 'application/pdf') setFile(f);
                                        else setMessage('error:Only PDF files are accepted.');
                                    }}
                                />
                                <UploadCloud size={40} color={file ? 'var(--success)' : 'var(--text-muted)'} />
                                {file ? (
                                    <>
                                        <p style={{ color: 'var(--success)', fontWeight: 600 }}>{file.name}</p>
                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                            {(file.size / 1024 / 1024).toFixed(2)} MB — Click to change
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p style={{ fontWeight: 600 }}>Drop your PDF here or click to browse</p>
                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>PDF files only, max 50 MB</p>
                                    </>
                                )}
                            </div>

                            {/* License */}
                            <div className="license-check">
                                <input
                                    type="checkbox"
                                    id="license"
                                    checked={licenseAgreed}
                                    onChange={(e) => setLicenseAgreed(e.target.checked)}
                                />
                                <label htmlFor="license">
                                    I grant IKMS a non-exclusive license to publish this work under{' '}
                                    <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>.
                                    I confirm I have the right to submit this work.
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-full"
                                style={{ marginTop: '1.25rem', padding: '0.9rem' }}
                                disabled={uploading || !file}
                            >
                                {uploading ? 'Processing...' : <><UploadCloud size={17} /> Submit for Moderation Review</>}
                            </button>
                        </form>
                    </div>
                )}

                {/* ── Alerts Tab ── */}
                {activeTab === 'alerts' && (
                    <div className="card animate-slideUp">
                        <div className="section-header">
                            <h2 className="section-title">
                                <Bell size={20} style={{ color: 'var(--primary)' }} /> Saved Search Alerts
                            </h2>
                        </div>
                        {savedSearches.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">🔔</div>
                                No saved searches yet. Search for a topic and click "Save Alert".
                            </div>
                        ) : (
                            <div className="alerts-list">
                                {savedSearches.map(s => (
                                    <div key={s.id} className="alert-item">
                                        <div className="alert-info" onClick={() => navigate(`/?q=${encodeURIComponent(s.query)}`)}>
                                            <Search size={15} color="var(--primary)" />
                                            <span className="alert-query">{s.query}</span>
                                            {s.alert_count > 0 && (
                                                <span
                                                    className="badge badge-new"
                                                    onClick={(e) => { e.stopPropagation(); clearAlerts(s.id); }}
                                                    style={{ cursor: 'pointer' }}
                                                    title="Click to mark as read"
                                                >
                                                    {s.alert_count} New
                                                </span>
                                            )}
                                        </div>
                                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => deleteSearch(s.id)} title="Delete">
                                            <Trash2 size={15} color="var(--danger)" />
                                        </button>
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

export default ResearcherDashboard;
