import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Download, Bookmark, BookOpen, Calendar, Building2, RefreshCw, ArrowRight } from 'lucide-react';
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
                <div className={`message-banner ${message.startsWith('✓') ? 'success' : 'error'}`}>
                    {message}
                </div>
            )}

            <div className="glass-panel" style={{ padding: '3.5rem', marginBottom: '3rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(to right, var(--accent-primary), #a855f7)' }}></div>

                <div className="doc-header-main">
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
                        <span className="tag tag-inst" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                            <Building2 size={16} /> {doc.institution}
                        </span>
                        {doc.institutional_status === 'verified' && (
                            <span className="badge-approved" style={{ fontSize: '0.8rem', padding: '6px 14px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                                ✓ Verified Institution
                            </span>
                        )}
                    </div>

                    <h1 style={{ fontSize: '3rem', marginBottom: '1.5rem', lineHeight: '1.1', fontWeight: '800' }}>{doc.title}</h1>

                    <div className="doc-meta-detail" style={{ display: 'flex', gap: '2.5rem', color: 'var(--text-secondary)', marginBottom: '2.5rem', flexWrap: 'wrap', fontSize: '1.1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Building2 size={20} /> {doc.institution}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={20} /> {new Date(doc.upload_date).getFullYear()}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BookOpen size={20} /> Academic Research</div>
                    </div>

                    <div className="authors-explorer" style={{ marginBottom: '3rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h4 style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Research Team</h4>
                        <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap' }}>
                            {doc.authors && doc.authors.map(auth => (
                                <Link
                                    key={auth.id}
                                    to={`/author/${auth.id}`}
                                    className="glass-panel-hover"
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 1.25rem', borderRadius: '50px', fontSize: '1rem', textDecoration: 'none', color: 'white', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                                >
                                    <span style={{ fontSize: '1.2rem' }}>👤</span> {auth.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="action-buttons" style={{ display: 'flex', gap: '1.5rem' }}>
                        <button onClick={handleDownload} className="btn-primary" style={{ padding: '1rem 2.5rem', borderRadius: '12px', fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Download size={22} /> Download PDF
                        </button>
                        <button onClick={handleBookmark} className="btn-secondary" style={{ padding: '1rem 2.5rem', borderRadius: '12px', fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Bookmark size={22} /> Save Research
                        </button>
                    </div>
                </div>

                <div style={{ marginTop: '4rem', paddingTop: '2rem' }}>
                    <h2 style={{ marginBottom: '1.5rem', fontSize: '2rem' }}>Abstract</h2>
                    <p style={{ lineHeight: '2', fontSize: '1.2rem', color: 'var(--text-secondary)', fontWeight: '300' }}>
                        {doc.abstract}
                    </p>
                </div>
            </div>

            <h2 className="section-title" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <RefreshCw size={24} color="var(--accent-primary)" />
                Commonly Cited & Related Research
            </h2>
            <div className="search-layout" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {recommendations.map(rec => (
                    <div key={rec.id} className="doc-card-enhanced" style={{ margin: 0 }}>
                        <Link to={`/document/${rec.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>{rec.title}</h3>
                            <p className="abstract" style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineClamp: 3, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {rec.abstract}
                            </p>
                            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontWeight: '600' }}>
                                View Details <ArrowRight size={16} />
                            </div>
                        </Link>
                    </div>
                ))}
                {recommendations.length === 0 && <p className="empty-state">No similar research found for this architecture.</p>}
            </div>
        </div>
    );
};

export default DocumentDetail;
