// Created by: Soreti (Team Leader) - Demo Implementation
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getUser, getToken, logout, getAuthHeaders } from '../utils/auth';
import './Dashboard.css';

function ResearcherDashboard() {
    const [user, setUser] = useState(null);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [myDocuments, setMyDocuments] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const currentUser = getUser();
        if (!currentUser) {
            navigate('/login');
            return;
        }
        setUser(currentUser);
        fetchMyDocuments(currentUser.id);
    }, [navigate]);

    const fetchMyDocuments = async (userId) => {
        try {
            const response = await axios.get('http://localhost:5000/search?q=', {
                headers: getAuthHeaders()
            });
            // Filter by uploader_id (simplified - in production, add a proper endpoint)
            setMyDocuments(response.data);
        } catch (error) {
            console.error('Error fetching documents:', error);
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
                    <p>Welcome back, {user.name}!</p>
                </div>
                <button onClick={logout} className="btn-secondary">Logout</button>
            </div>

            <div className="dashboard-grid">
                {/* Upload Section */}
                <div className="glass-panel">
                    <h2>Upload Document</h2>
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
