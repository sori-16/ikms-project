// Created by: Soreti (Team Leader) - Demo Implementation
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
    const navigate = useNavigate();

    useEffect(() => {
        const currentUser = getUser();
        if (!currentUser) {
            navigate('/login');
            return;
        }
        setUser(currentUser);
        fetchMyDocuments();
        fetchSavedSearches();
    }, [navigate]);

    const fetchMyDocuments = async () => {
        try {
            const response = await axios.get('http://localhost:5000/search?q=', {
                headers: getAuthHeaders()
            });
            setMyDocuments(response.data);
        } catch (error) {
            console.error('Error fetching documents:', error);
        }
    };

    const fetchSavedSearches = async () => {
        try {
            const response = await axios.get('http://localhost:5000/saved-searches', {
                headers: getAuthHeaders()
            });
            setSavedSearches(response.data);
        } catch (error) {
            console.error('Error fetching saved searches:', error);
        }
    };

    const deleteSearch = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/saved-searches/${id}`, {
                headers: getAuthHeaders()
            });
            fetchSavedSearches();
        } catch (error) {
            console.error('Error deleting search:', error);
        }
    };

    const clearAlerts = async (id) => {
        try {
            await axios.post(`http://localhost:5000/saved-searches/${id}/clear-alerts`, {}, {
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
            await axios.post('http://localhost:5000/upload', formData, {
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

            <div className="dashboard-grid">
                {/* Upload Section */}
                <div className="glass-panel">
                    <h2>Upload Document</h2>
                    <p style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '-10px', marginBottom: '1.5rem' }}>አዲስ ጥናት ይጫኑ</p>
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
                                {file ? file.name : 'Choose PDF file...'}
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={uploading || !file}
                        >
                            {uploading ? 'Uploading...' : 'Upload Document'}
                        </button>

                        {message && (
                            <div className={`message ${message.startsWith('✓') ? 'success' : 'error'}`}>
                                {message}
                            </div>
                        )}
                    </form>
                </div>

                {/* Saved Searches Section */}
                <div className="glass-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ margin: 0 }}>Saved Searches & Alerts</h2>
                        <Bell size={20} className={savedSearches.some(s => s.alert_count > 0) ? "accent-text pulse" : ""} />
                    </div>

                    {savedSearches.length === 0 ? (
                        <p className="empty-state">No saved searches yet</p>
                    ) : (
                        <div className="saved-searches-list">
                            {savedSearches.map((s) => (
                                <div key={s.id} className="search-alert-item" style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div onClick={() => navigate(`/?q=${encodeURIComponent(s.query)}`)} style={{ cursor: 'pointer', flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Search size={14} className="accent-text" />
                                            <span style={{ fontWeight: 600 }}>"{s.query}"</span>
                                        </div>
                                        {s.alert_count > 0 && (
                                            <span className="alert-badge" onClick={(e) => { e.stopPropagation(); clearAlerts(s.id); }} style={{ background: 'var(--accent-primary)', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', marginTop: '4px', display: 'inline-block', cursor: 'pointer' }}>
                                                {s.alert_count} New Papers
                                            </span>
                                        )}
                                    </div>
                                    <button onClick={() => deleteSearch(s.id)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,0,0,0.6)', cursor: 'pointer' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* My Documents Section */}
                <div className="glass-panel">
                    <h2>My Documents</h2>
                    {myDocuments.length === 0 ? (
                        <p className="empty-state">No documents uploaded yet</p>
                    ) : (
                        <div className="documents-list">
                            {myDocuments.map((doc) => (
                                <div key={doc.id} className="document-item">
                                    <div>
                                        <h3>{doc.title}</h3>
                                        <p className="doc-date">
                                            {new Date(doc.upload_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    {getStatusBadge(doc.status || 'pending')}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ResearcherDashboard;
