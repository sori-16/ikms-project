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
    const [citations, setCitations] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            try {
                // Fetch Doc Details
                const docRes = await axios.get(`${apiUrl}/documents/${id}`);
                setDoc(docRes.data);

                // Fetch Recommendations
                const recRes = await axios.get(`${apiUrl}/recommend/${id}`);
                setRecommendations(recRes.data);

                // Fallback citation generation if backend doesn't have it
                generateCitations(docRes.data);
            } catch (e) {
                console.error('Failed to fetch document data:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const generateCitations = (docData) => {
        if (!docData) return;
        const year = docData.upload_date ? new Date(docData.upload_date).getFullYear() : 'n.d.';
        const authors = docData.authors?.map(a => a.name).join(', ') || 'Unknown Author';
        const title = docData.title;
        const institution = docData.institution || 'IKMS';

        setCitations({
            apa: `${authors} (${year}). ${title}. ${institution}.`,
            mla: `${authors}. "${title}." ${institution}, ${year}.`,
            bibtex: `@article{ikms_${id},\n  author = {${authors}},\n  title = {${title}},\n  publisher = {${institution}},\n  year = {${year}}\n}`
        });
    };

    const handleDownload = async () => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        try {
            const res = await axios.post(`${apiUrl}/documents/${id}/download`, {}, {
                headers: getAuthHeaders()
            });
            window.open(`${apiUrl}${res.data.file_url}`, '_blank');
            setMessage('✓ Download started');
            setTimeout(() => setMessage(''), 3000);
        } catch (e) {
            setMessage('✗ Failed to track download');
        }
    };

    const handleBookmark = async () => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        if (!isAuthenticated()) {
            setMessage('! Please login to bookmark');
            return;
        }
        try {
            await axios.post(`${apiUrl}/bookmarks`, { document_id: id }, {
                headers: getAuthHeaders()
            });
            setMessage('✓ Added to Library');
            setTimeout(() => setMessage(''), 3000);
        } catch (e) {
            setMessage('✗ Failed to bookmark');
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setMessage('✓ Citation copied to clipboard');
        setTimeout(() => setMessage(''), 3000);
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

                {citations && (
                    <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Cite this Research</h3>
                        <div className="citations-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            {['APA', 'MLA', 'BibTeX'].map((format) => (
                                <div key={format} className="glass-panel" style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.02)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                                        <h4 style={{ margin: 0, opacity: 0.6, fontSize: '0.8rem', textTransform: 'uppercase' }}>{format} Format</h4>
                                        <button
                                            onClick={() => copyToClipboard(citations[format.toLowerCase()])}
                                            className="btn-secondary-small"
                                            style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    <code style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                                        {citations[format.toLowerCase()]}
                                    </code>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <h2 className="section-title" style={{ marginTop: '4rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <RefreshCw size={24} color="var(--accent-primary)" />
                Commonly Cited & Related Research
            </h2>
            <div className="search-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
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
        </div >
    );
};

export default DocumentDetail;
