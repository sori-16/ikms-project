import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Download, Bookmark, BookOpen, Calendar, Building2 } from 'lucide-react';
import { getAuthHeaders, isAuthenticated } from '../utils/auth';

const DocumentDetail = () => {
    const { id } = useParams();
    const [doc, setDoc] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Doc Details
                const docRes = await axios.get(`http://localhost:5000/documents/${id}`);
                setDoc(docRes.data);

                // Fetch Recommendations
                const recRes = await axios.get(`http://localhost:5000/recommend/${id}`);
                setRecommendations(recRes.data);
            } catch (e) {
                console.error('Failed to fetch document data:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleDownload = async () => {
        try {
            const res = await axios.post(`http://localhost:5000/documents/${id}/download`, {}, {
                headers: getAuthHeaders()
            });
            window.open(`http://localhost:5000${res.data.file_url}`, '_blank');
            setMessage('✓ Download started');
        } catch (e) {
            setMessage('✗ Failed to track download');
        }
    };

    const handleBookmark = async () => {
        if (!isAuthenticated()) {
            setMessage('! Please login to bookmark');
            return;
        }
        try {
            await axios.post('http://localhost:5000/bookmarks', { document_id: id }, {
                headers: getAuthHeaders()
            });
            setMessage('✓ Added to Library');
        } catch (e) {
            setMessage('✗ Failed to bookmark');
        }
    };

    if (loading) return <div className="loading-state">Retrieving research details...</div>;
    if (!doc) return <div className="empty-state">Document not found</div>;

    return (
        <div className="container" style={{ marginTop: '2rem' }}>
            <Link to="/" className="nav-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
                <ArrowLeft size={18} /> Back to Search
            </Link>

            {message && (
                <div className={`message-banner ${message.startsWith('✓') ? 'success' : 'error'}`} style={{ marginBottom: '1rem', padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
                    {message}
                </div>
            )}

            <div className="glass-panel" style={{ padding: '3rem', marginBottom: '3rem' }}>
                <div className="doc-header-main">
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <span className="tag tag-inst" style={{ fontSize: '0.9rem' }}>
                            <Building2 size={16} /> {doc.institution}
                        </span>
                        {doc.institutional_status === 'verified' && (
                            <span className="badge-approved" style={{ fontSize: '0.8rem', padding: '4px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                ✓ Institutional Verified
                            </span>
                        )}
                    </div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', lineHeight: '1.2' }}>{doc.title}</h1>

                    <div className="doc-meta-detail" style={{ display: 'flex', gap: '2rem', color: 'var(--text-secondary)', marginBottom: '2rem', flexWrap: 'wrap' }}>
                        <div className="meta-item"><Building2 size={18} /> {doc.institution}</div>
                        <div className="meta-item"><Calendar size={18} /> {new Date(doc.upload_date).getFullYear()}</div>
                        <div className="meta-item"><BookOpen size={18} /> Research Paper</div>
                    </div>

                    <div className="authors-list" style={{ marginBottom: '2rem' }}>
                        <h4 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Principal Researchers</h4>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            {doc.authors && doc.authors.map(auth => (
                                <Link
                                    key={auth.id}
                                    to={`/author/${auth.id}`}
                                    className="accent-link"
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '1rem' }}
                                >
                                    👤 {auth.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="action-buttons" style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={handleDownload} className="btn-primary-small" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Download size={18} /> Download PDF
                        </button>
                        <button onClick={handleBookmark} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer' }}>
                            <Bookmark size={18} /> Save to Library
                        </button>
                    </div>
                </div>

                <div style={{ marginTop: '3rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
                    <h2 style={{ marginBottom: '1rem' }}>Abstract</h2>
                    <p style={{ lineHeight: '1.8', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                        {doc.abstract}
                    </p>
                </div>
            </div>

            <h2 className="section-title">Commonly Cited & Related</h2>
            <div className="grid-cols-2">
                {recommendations.map(rec => (
                    <Link to={`/document/${rec.id}`} key={rec.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="glass-panel" style={{ padding: '1.5rem', transition: 'all 0.2s' }}>
                            <h4 style={{ marginBottom: '0.5rem' }}>{rec.title}</h4>
                            <p className="abstract" style={{ fontSize: '0.9rem' }}>{rec.abstract.substring(0, 120)}...</p>
                        </div>
                    </Link>
                ))}
                {recommendations.length === 0 && <p className="empty-state">No similar research found.</p>}
            </div>
        </div>
    );
};

export default DocumentDetail;
