/**
 * IKMS – Researcher Dashboard (Redesigned)
 * Bug Fix: fetchMyDocuments now uses correct endpoint
 * New: Tabs, drag-drop upload, license checkbox, impact stats
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { getUser, logout, getAuthHeaders } from '../utils/auth';
import { Bell, Trash2, Search, UploadCloud, BarChart2, BookOpen, AlertCircle, RefreshCw, Briefcase, ShieldCheck, Database, X } from 'lucide-react';
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
    const [realTimeAlerts, setRealTimeAlerts] = useState([]);
    const [doi, setDoi] = useState('');
    const [doiLoading, setDoiLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [licenseAgreed, setLicenseAgreed] = useState(false);
    const [collabInterests, setCollabInterests] = useState('');
    const [erbFile, setErbFile] = useState(null);
    const [dataFile, setDataFile] = useState(null);
    const [institutions, setInstitutions] = useState([]);
    const [selectedInst, setSelectedInst] = useState('');
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const currentUser = getUser();
        if (!currentUser) { navigate('/login'); return; }
        setUser(currentUser);
        fetchMyDocuments();
        fetchSavedSearches();
        fetchRealTimeAlerts();
        fetchStats();
        fetchCollabInterests();
        fetchNotifications();
        if (!currentUser.is_verified) fetchInstitutions();
    }, [navigate]);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get(`${API}/notifications`, { headers: getAuthHeaders() });
            setNotifications(res.data);
        } catch {} 
    };

    const markNotifRead = async (id) => {
        try {
            await axios.put(`${API}/notifications/${id}/read`, {}, { headers: getAuthHeaders() });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch {}
    };

    const fetchInstitutions = async () => {
        try {
            const res = await axios.get(`${API}/institutions`);
            setInstitutions(res.data);
        } catch (e) { console.error("Could not load institutions", e); }
    };



    const fetchCollabInterests = async () => {
        try {
            const res = await axios.get(`${API}/authors/me`, { headers: getAuthHeaders() });
            setCollabInterests(res.data.collab_interests || '');
        } catch { /* might not have profile yet */ }
    };

    const handleUpdateCollaboration = async () => {
        try {
            await axios.put(`${API}/authors/me/collaboration`, { interests: collabInterests }, { headers: getAuthHeaders() });
            setMessage('success:Collaboration profile updated!');
        } catch {
            setMessage('error:Failed to update collaboration profile.');
        }
    };

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

    const fetchRealTimeAlerts = async () => {
        try {
            const res = await axios.get(`${API}/saved-searches/alerts`, { headers: getAuthHeaders() });
            setRealTimeAlerts(res.data);
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
        if (erbFile) formData.append('erb_letter', erbFile);
        if (dataFile) formData.append('dataset', dataFile);

        // Extract title/abstract/authors if they've been prefilled (assuming common form state if we had it, 
        // but currently we just use the file for title in backend repo. 
        // Let's assume we might want to pass these if we had matching form fields.)
        // For now, the backend uses secure_filename(file.filename) as title.
        // Let's improve the backend upload to accept custom titles if provided!

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

    const handleResubmit = async (docId) => {
        try {
            await axios.put(`${API}/documents/${docId}/resubmit`, {}, { headers: getAuthHeaders() });
            setMessage('success:Document resubmitted for review!');
            fetchMyDocuments();
        } catch (err) {
            setMessage('error:Resubmission failed: ' + (err.response?.data?.error || 'Unknown error'));
        }
    };

    const handleDoiLookup = async () => {
        if (!doi.trim()) return;
        setDoiLoading(true);
        try {
            const res = await axios.get(`${API}/doi-lookup?doi=${encodeURIComponent(doi)}`);
            const metadata = res.data;
            setMessage(`success:Metadata found! Title: ${metadata.title.substring(0, 50)}...`);
            window.lastDoiMetadata = metadata;
        } catch (err) {
            setMessage('error:DOI lookup failed: ' + (err.response?.data?.error || 'Unknown error'));
        } finally {
            setDoiLoading(false);
        }
    };

    const handleRevision = async (docId) => {
        // Existing handleRevision for uploading a new PDF for a document
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
                // Assuming backend /documents/:id/revision is implemented to replace file
                await axios.post(`${API}/documents/${docId}/revision`, formData, {
                    headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' }
                });
                setMessage('success:Revision file uploaded!');
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
        const map = {
            pending: 'badge-pending',
            approved: 'badge-approved',
            rejected: 'badge-rejected',
            revision_requested: 'badge-pending' // Using pending style (yellow) for revision
        };
        const labels = {
            pending: '⏳ Pending',
            approved: '✓ Approved',
            rejected: '✗ Rejected',
            revision_requested: '🔄 Revision Requested'
        };
        return <span className={`badge ${map[status] || 'badge-pending'}`}>{labels[status] || 'Pending'}</span>;
    };

    if (!user) return null;

    // Dynamic Tabs based on verification status
    const tabs = user.is_verified ? [
        { id: 'overview', label: 'Overview', icon: <BarChart2 size={16} /> },
        { id: 'uploads', label: `My Uploads (${myDocuments.length})`, icon: <BookOpen size={16} /> },
        { id: 'upload', label: 'Upload New', icon: <UploadCloud size={16} /> },
        { id: 'networking', label: 'Networking', icon: <Briefcase size={16} /> },
        { id: 'alerts', label: `Alerts (${realTimeAlerts.length})`, icon: <Bell size={16} /> },
        { id: 'saved', label: `Saved Searches`, icon: <Search size={16} /> },
    ] : [
        { id: 'overview', label: 'Overview', icon: <BarChart2 size={16} /> },
        { id: 'alerts', label: `Alerts (${realTimeAlerts.length})`, icon: <Bell size={16} /> },
        { id: 'saved', label: `Saved Searches`, icon: <Search size={16} /> },
    ];

    return (
        <div className="page-wrapper">
            <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
                {/* Header */}
                <div className="dash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 className="dash-title" style={{ marginBottom: '0.25rem' }}>Researcher Dashboard</h1>
                        <p className="dash-subtitle" style={{ margin: 0 }}>Welcome back, {user.name}! <span style={{ opacity: 0.6, fontSize: '0.85rem' }}>— የተመራማሪ ዳሽቦርድ</span></p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {/* Notification Bell */}
                        <div style={{ position: 'relative' }}>
                            <button 
                                onClick={() => setShowNotifications(v => !v)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: '6px' }}
                                title="Notifications"
                            >
                                <Bell size={22} color="var(--text-muted)" />
                                {notifications.filter(n => !n.read).length > 0 && (
                                    <span style={{
                                        position: 'absolute', top: 0, right: 0,
                                        background: '#ef4444', color: '#fff',
                                        borderRadius: '99px', fontSize: '0.65rem',
                                        fontWeight: 700, minWidth: 16, height: 16,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        padding: '0 4px'
                                    }}>
                                        {notifications.filter(n => !n.read).length}
                                    </span>
                                )}
                            </button>
                            {showNotifications && (
                                <div style={{
                                    position: 'absolute', right: 0, top: '110%', zIndex: 1000,
                                    width: 340, background: '#fff',
                                    borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                                    border: '1px solid #e2e8f0', overflow: 'hidden'
                                }}>
                                    <div style={{ padding: '0.85rem 1.2rem', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Notifications</span>
                                        <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
                                    </div>
                                    <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                                        {notifications.length === 0 && (
                                            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem', margin: 0 }}>No notifications yet.</p>
                                        )}
                                        {notifications.map(n => (
                                            <div 
                                                key={n.id}
                                                onClick={() => markNotifRead(n.id)}
                                                style={{
                                                    padding: '0.85rem 1.2rem',
                                                    borderBottom: '1px solid #f1f5f9',
                                                    background: n.read ? '#fff' : '#f0f9ff',
                                                    cursor: 'pointer',
                                                    borderLeft: `3px solid ${n.type === 'success' ? '#22c55e' : n.type === 'error' ? '#ef4444' : '#3b82f6'}`,
                                                    transition: 'background 0.2s'
                                                }}
                                            >
                                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#0f172a', lineHeight: 1.5 }}>{n.message}</p>
                                                <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(n.created_at).toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <button onClick={logout} className="btn btn-ghost btn-sm">Logout</button>
                    </div>
                </div>


                {/* Message Banner */}
                {message && <div className={`message-banner ${msgType}`} style={{ marginBottom: '1.5rem' }}>{msgText}</div>}

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
                        {user.is_verified ? (
                            <>
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
                            </>
                        ) : (
                            // Clean Overview for Unverified "Readers"
                            <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center', background: 'rgba(var(--primary-rgb), 0.03)', border: '1px dashed var(--border)' }}>
                                <ShieldCheck size={56} color="var(--primary)" style={{ opacity: 0.8, marginBottom: '1rem' }} />
                                <h3 style={{ marginBottom: '0.75rem' }}>Ready to Share Your Research?</h3>
                                <p style={{ color: 'var(--text-secondary)', maxWidth: '550px', margin: '0 auto 2.5rem auto', lineHeight: 1.6, fontSize: '0.95rem' }}>
                                    Your account is currently in <strong>Reader Mode</strong>. To maintain the integrity of the Ethiopian Indigenous Knowledge database, we require a brief verification process before publishing.
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                                    <Link to="/profile-setup" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>
                                        Setup Profile & Request Access
                                    </Link>
                                    <Link to="/" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem' }}>
                                        Explore Repository
                                    </Link>
                                </div>
                            </div>
                        )}
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
                                            <td>
                                                <Link to={`/document/${doc.id}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>{doc.title}</Link>
                                                {doc.moderation_notes && (
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--danger)', marginTop: '0.25rem', background: 'rgba(255,0,0,0.05)', padding: '0.4rem', borderRadius: '4px' }}>
                                                        <strong>Moderator Note:</strong> {doc.moderation_notes}
                                                    </div>
                                                )}
                                            </td>
                                            <td>{new Date(doc.upload_date).toLocaleDateString()}</td>
                                            <td>{getStatusBadge(doc.status || 'pending')}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    {doc.status === 'revision_requested' && (
                                                        <>
                                                            <button className="btn btn-secondary btn-xs" onClick={() => handleRevision(doc.id)} title="Upload revised PDF">
                                                                Update PDF
                                                            </button>
                                                            <button className="btn btn-primary btn-xs" onClick={() => handleResubmit(doc.id)}>
                                                                Resubmit
                                                            </button>
                                                        </>
                                                    )}
                                                    {doc.status === 'rejected' && (
                                                        <button className="btn btn-ghost btn-xs" onClick={() => handleRevision(doc.id)}>
                                                            Submit New Version
                                                        </button>
                                                    )}
                                                </div>
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

                        <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid var(--primary-light)', background: 'rgba(var(--primary-rgb), 0.02)' }}>
                            <h4 style={{ margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                                <RefreshCw size={14} color="var(--primary)" /> Smart Import by DOI
                            </h4>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    className="input-field"
                                    style={{ margin: 0 }}
                                    placeholder="Paste DOI (e.g. 10.1016/j.jhep.2020.01.001)"
                                    value={doi}
                                    onChange={(e) => setDoi(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={handleDoiLookup}
                                    disabled={doiLoading}
                                >
                                    {doiLoading ? '...' : 'Lookup'}
                                </button>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                This will automatically pull title, authors, and abstract from CrossRef.
                            </p>
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

                            {/* Supplementary Uploads */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                <div className="card" style={{ padding: '1rem', borderStyle: 'dashed' }}>
                                    <h5 style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <ShieldCheck size={14} color="var(--success)" /> ERB Approval Letter
                                    </h5>
                                    <input type="file" accept=".pdf,.jpg,.png" onChange={e => setErbFile(e.target.files[0])} style={{ fontSize: '0.75rem' }} />
                                    {erbFile && <p style={{ fontSize: '0.7rem', color: 'var(--success)', marginTop: '5px' }}>Attached: {erbFile.name}</p>}
                                </div>
                                <div className="card" style={{ padding: '1rem', borderStyle: 'dashed' }}>
                                    <h5 style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <Database size={14} color="var(--primary)" /> Supplemental Dataset
                                    </h5>
                                    <input type="file" accept=".csv,.xlsx,.zip" onChange={e => setDataFile(e.target.files[0])} style={{ fontSize: '0.75rem' }} />
                                    {dataFile && <p style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '5px' }}>Attached: {dataFile.name}</p>}
                                </div>
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

                {/* ── Networking Tab ── */}
                {activeTab === 'networking' && (
                    <div className="animate-slideUp">
                        <div className="card" style={{ padding: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ background: 'var(--gold)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                                    <Briefcase color="#fff" size={22} />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0 }}>Collaboration Profile</h2>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>ተባባሪ ተመራማሪዎችን ያግኙ</p>
                                </div>
                            </div>

                            <div className="doc-section">
                                <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Research Interests & Collaboration Needs</label>
                                <textarea
                                    className="input-field"
                                    rows="5"
                                    placeholder="E.g., I am looking for a co-author with expertise in Bio-statistics for a study in Jimma. I specialize in Malaria immunology."
                                    value={collabInterests}
                                    onChange={(e) => setCollabInterests(e.target.value)}
                                    style={{ border: '1px solid var(--border)' }}
                                />
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                                    This will be visible on your public author profile to help other researchers connect with you.
                                </p>
                                <button onClick={handleUpdateCollaboration} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                                    Save Collaboration Profile
                                </button>
                            </div>
                        </div>

                        <div className="card" style={{ marginTop: '1.5rem', background: 'rgba(var(--primary-rgb), 0.05)' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                                <RefreshCw size={18} color="var(--primary)" /> Networking Opportunities
                            </h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                Coming soon: An AI-matched list of researchers with complementary interests will appear here.
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Alerts Tab ── */}
                {activeTab === 'alerts' && (
                    <div className="card animate-slideUp">
                        <div className="section-header">
                            <h2 className="section-title">
                                <Bell size={20} style={{ color: 'var(--primary)' }} /> Recent Activity Alerts
                            </h2>
                            <button className="btn btn-ghost btn-sm" onClick={fetchRealTimeAlerts}>
                                <RefreshCw size={14} /> Refresh
                            </button>
                        </div>
                        {realTimeAlerts.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">🔔</div>
                                No new matching documents for your saved searches in the last 30 days.
                            </div>
                        ) : (
                            <div className="alerts-list">
                                {realTimeAlerts.map((alert, idx) => (
                                    <div key={idx} className="alert-item" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '1.25rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                Match for: <strong>"{alert.search_name}"</strong>
                                            </span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                {new Date(alert.upload_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <Link to={`/document/${alert.doc_id}`} style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>
                                            {alert.title}
                                        </Link>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                            {alert.institution}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Saved Searches Tab ── */}
                {activeTab === 'saved' && (
                    <div className="card animate-slideUp">
                        <div className="section-header">
                            <h2 className="section-title">
                                <Search size={20} style={{ color: 'var(--primary)' }} /> My Saved Searches
                            </h2>
                        </div>
                        {savedSearches.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">🔍</div>
                                No saved searches yet. Search for a topic and click "Save Alert".
                            </div>
                        ) : (
                            <div className="alerts-list">
                                {savedSearches.map(s => (
                                    <div key={s.id} className="alert-item">
                                        <div className="alert-info" onClick={() => navigate(`/?q=${encodeURIComponent(s.query)}`)}>
                                            <Search size={15} color="var(--primary)" />
                                            <span className="alert-query">{s.query}</span>
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
