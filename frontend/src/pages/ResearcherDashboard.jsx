/**
 * IKMS Frontend - Researcher Dashboard
 * Created by: Soreti (Team Leader)
 * DO NOT MODIFY WITHOUT PERMISSION
 * 
 * This file contains:
 * - Publication upload management
 * - Saved searches and alerts feed
 * - Personalized activity tracking
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getUser, getToken, logout, getAuthHeaders } from '../utils/auth';
import { Bell, Trash2, Search, UploadCloud } from 'lucide-react';
import './Dashboard.css';

function ResearcherDashboard() {
    const [user, setUser] = useState(null);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [myDocuments, setMyDocuments] = useState([]);
    const [savedSearches, setSavedSearches] = useState([]);
    const [stats, setStats] = useState(null);
    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        const currentUser = getUser();
        if (!currentUser) {
            navigate('/login');
            return;
        }
        setUser(currentUser);
        fetchMyDocuments();
        fetchSavedSearches();
        fetchStats();
    }, [navigate]);

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${apiUrl}/researcher/stats`, {
                headers: getAuthHeaders()
            });
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchMyDocuments = async () => {
        try {
            const response = await axios.get(`${apiUrl}/search?q=`, {
                headers: getAuthHeaders()
            });
            setMyDocuments(response.data);
        } catch (error) {
            console.error('Error fetching documents:', error);
        }
    };

    const fetchSavedSearches = async () => {
        try {
            const response = await axios.get(`${apiUrl}/saved-searches`, {
                headers: getAuthHeaders()
            });
            setSavedSearches(response.data);
        } catch (error) {
            console.error('Error fetching saved searches:', error);
        }
    };

    const deleteSearch = async (id) => {
        try {
            await axios.delete(`${apiUrl}/saved-searches/${id}`, {
                headers: getAuthHeaders()
            });
            fetchSavedSearches();
        } catch (error) {
            console.error('Error deleting search:', error);
        }
    };

    const clearAlerts = async (id) => {
        try {
            await axios.post(`${apiUrl}/saved-searches/${id}/clear-alerts`, {}, {
                headers: getAuthHeaders()
            });
            fetchSavedSearches();
        } catch (error) {
            console.error('Error clearing alerts:', error);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setMessage('');
        } else {
            setMessage('Please select a PDF file');
            setFile(null);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            setMessage('Please select a file');
            return;
        }

        setUploading(true);
        setMessage('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('uploader_id', user.id);

        try {
            await axios.post(`${apiUrl}/upload`, formData, {
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'multipart/form-data'
                }
            });
            setMessage('✓ Document uploaded successfully! Pending moderation.');
            setFile(null);
            document.getElementById('file-input').value = '';
            fetchMyDocuments(user.id);
        } catch (error) {
            setMessage('✗ Upload failed: ' + (error.response?.data?.error || 'Unknown error'));
        } finally {
            setUploading(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { class: 'badge-pending', text: 'Pending' },
            approved: { class: 'badge-approved', text: 'Approved' },
            rejected: { class: 'badge-rejected', text: 'Rejected' }
        };
        const badge = badges[status] || badges.pending;
        return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
    };

    const handleRevision = async (docId) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf';
        input.onchange = async (e) => {
            const revFile = e.target.files[0];
            if (!revFile) return;

            setUploading(true);
            setMessage('Submitting revision...');

            const formData = new FormData();
            formData.append('file', revFile);

            try {
                await axios.post(`${apiUrl}/documents/${docId}/revision`, formData, {
                    headers: {
                        ...getAuthHeaders(),
                        'Content-Type': 'multipart/form-data'
                    }
                });
                setMessage('✓ Revision submitted successfully!');
                fetchMyDocuments();
                fetchStats();
            } catch (error) {
                setMessage('✗ Revision failed: ' + (error.response?.data?.error || 'Unknown error'));
            } finally {
                setUploading(false);
            }
        };
        input.click();
    };

    if (!user) return null;

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>Researcher Dashboard</h1>
                    <p style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '-5px' }}>የተመራማሪ ዳሽቦርድ</p>
                    <p>Welcome back, {user.name}!</p>
                </div>
                <button onClick={logout} className="btn-secondary">Logout</button>
            </div>

            <div className="dashboard-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '2rem' }}>
                {/* Main Content: Document Management */}
                <div className="main-panels" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Impact Analytics Panel */}
                    <div className="glass-panel" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.4rem' }}>Research Impact Analysis</h2>
                        <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
                            <div className="stat-card-mini">
                                <span style={{ display: 'block', fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                                    {stats?.total_publications || 0}
                                </span>
                                <span style={{ opacity: 0.6, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '1px' }}>Publications</span>
                            </div>
                            <div className="stat-card-mini" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '3rem' }}>
                                <span style={{ display: 'block', fontSize: '2.5rem', fontWeight: 800, color: '#10b981' }}>
                                    {stats?.total_downloads || 0}
                                </span>
                                <span style={{ opacity: 0.6, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '1px' }}>Total Downloads</span>
                            </div>
                            <div className="stat-card-mini" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '3rem' }}>
                                <span style={{ display: 'block', fontSize: '2.5rem', fontWeight: 800, color: '#3b82f6' }}>
                                    {stats?.total_views || 0}
                                </span>
                                <span style={{ opacity: 0.6, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '1px' }}>Total Views</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ background: 'var(--accent-primary)', padding: '0.8rem', borderRadius: '12px' }}>
                                <UploadCloud color="white" size={24} />
                            </div>
                            <div>
                                <h2 style={{ margin: 0 }}>Upload New Research</h2>
                                <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>አዲስ ጥናት ይጫኑ</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpload} className="upload-form">
                            <div className="file-input-wrapper">
                                <input
                                    type="file"
                                    id="file-input"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    className="file-input"
                                />
                                <label htmlFor="file-input" className="file-label">
                                    {file ? file.name : 'Drop your paper here or click to browse'}
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={uploading || !file}
                                style={{ width: '100%', padding: '1rem', borderRadius: '12px', fontSize: '1rem' }}
                            >
                                {uploading ? 'Processing Architecture...' : 'Submit for Verification'}
                            </button>

                            {message && (
                                <div className={`message ${message.startsWith('✓') ? 'success' : 'error'}`} style={{ marginTop: '1rem' }}>
                                    {message}
                                </div>
                            )}
                        </form>
                    </div>

                    <div className="glass-panel">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2>My Publications</h2>
                            <span style={{ fontSize: '0.9rem', background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '20px' }}>
                                {myDocuments.length} Total
                            </span>
                        </div>
                        {myDocuments.length === 0 ? (
                            <p className="empty-state">No documents uploaded yet</p>
                        ) : (
                            <div className="documents-list">
                                {myDocuments.map((doc) => (
                                    <div key={doc.id} className="document-item">
                                        <div>
                                            <h3 style={{ fontSize: '1.1rem' }}>{doc.title}</h3>
                                            <p className="doc-date">
                                                Uploaded on {new Date(doc.upload_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            {getStatusBadge(doc.status || 'pending')}
                                            {doc.status === 'rejected' && (
                                                <button
                                                    onClick={() => handleRevision(doc.id)}
                                                    className="btn-primary-small"
                                                    style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                                                >
                                                    Submit Revision
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar: Alerts & Discovery */}
                <div className="sidebar-panels">
                    <div className="glass-panel">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0 }}>Saved Alerts</h2>
                            <Bell size={20} className={savedSearches.some(s => s.alert_count > 0) ? "accent-text pulse" : ""} />
                        </div>

                        {savedSearches.length === 0 ? (
                            <p className="empty-state">No alerts configured</p>
                        ) : (
                            <div className="saved-searches-list">
                                {savedSearches.map((s) => (
                                    <div key={s.id} className="search-alert-item" style={{ marginBottom: '1rem' }}>
                                        <div onClick={() => navigate(`/?q=${encodeURIComponent(s.query)}`)} style={{ cursor: 'pointer' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                <Search size={14} className="accent-text" />
                                                <span style={{ fontWeight: 600 }}>{s.query}</span>
                                            </div>
                                            {s.alert_count > 0 && (
                                                <div onClick={(e) => { e.stopPropagation(); clearAlerts(s.id); }} className="alert-badge" style={{ background: 'var(--accent-primary)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', cursor: 'pointer', display: 'inline-block' }}>
                                                    {s.alert_count} New Matches
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                            <button onClick={() => deleteSearch(s.id)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ResearcherDashboard;
