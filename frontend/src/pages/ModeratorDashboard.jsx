// Created by: Soreti (Team Leader) - Demo Implementation
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getUser, logout, getAuthHeaders } from '../utils/auth';
import './Dashboard.css';

function ModeratorDashboard() {
    const [user, setUser] = useState(null);
    const [pendingDocs, setPendingDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const currentUser = getUser();
        if (!currentUser) {
            navigate('/login');
            return;
        }

        // Check if user is moderator or admin
        if (currentUser.role !== 'moderator' && currentUser.role !== 'sys_admin') {
            navigate('/researcher-dashboard');
            return;
        }

        setUser(currentUser);
        fetchPendingDocuments();
    }, [navigate]);

    const fetchPendingDocuments = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:5000/documents/pending', {
                headers: getAuthHeaders()
            });
            setPendingDocs(response.data);
        } catch (error) {
            console.error('Error fetching pending documents:', error);
            setMessage('Failed to load pending documents');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (docId, status) => {
        try {
            await axios.put(
                `http://localhost:5000/documents/${docId}/status`,
                { status },
                { headers: getAuthHeaders() }
            );

            setMessage(`✓ Document ${status} successfully`);

            // Remove from pending list
            setPendingDocs(pendingDocs.filter(doc => doc.id !== docId));

            // Clear message after 3 seconds
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('✗ Failed to update document status');
        }
    };

    if (!user) return null;

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>Moderator Dashboard</h1>
                    <p>Welcome, {user.name} ({user.role})</p>
                </div>
                <button onClick={logout} className="btn-secondary">Logout</button>
            </div>

            {message && (
                <div className={`message ${message.startsWith('✓') ? 'success' : 'error'}`}>
                    {message}
                </div>
            )}

            <div className="glass-panel">
                <h2>Pending Documents ({pendingDocs.length})</h2>

                {loading ? (
                    <p className="loading-state">Loading...</p>
                ) : pendingDocs.length === 0 ? (
                    <p className="empty-state">No pending documents to review</p>
                ) : (
                    <div className="moderation-grid">
                        {pendingDocs.map((doc) => (
                            <div key={doc.id} className="moderation-card glass-panel">
                                <div className="doc-info">
                                    <h3>{doc.title}</h3>
                                    <p className="doc-abstract">{doc.abstract || 'No abstract available'}</p>
                                    <p className="doc-meta">
                                        Uploaded: {new Date(doc.upload_date).toLocaleDateString()}
                                    </p>
                                </div>

                                <div className="moderation-actions">
                                    <button
                                        onClick={() => handleStatusUpdate(doc.id, 'approved')}
                                        className="btn-approve"
                                    >
                                        ✓ Approve
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(doc.id, 'rejected')}
                                        className="btn-reject"
                                    >
                                        ✗ Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ModeratorDashboard;
