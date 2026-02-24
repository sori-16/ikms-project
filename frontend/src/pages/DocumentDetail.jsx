import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowLeft, Download, Bookmark, BookOpen, Calendar, Building2,
    RefreshCw, ArrowRight, Share2, Mail, ExternalLink, Copy, Check
} from 'lucide-react';
import { getAuthHeaders, isAuthenticated } from '../utils/auth';
import './DocumentDetail.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DocumentDetail = () => {
    const { id } = useParams();
    const [doc, setDoc] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [citations, setCitations] = useState(null);
    const [copiedFormat, setCopiedFormat] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [docRes, recRes] = await Promise.all([
                    axios.get(`${API}/documents/${id}`),
                    axios.get(`${API}/recommend/${id}`)
                ]);
                setDoc(docRes.data);
                setRecommendations(recRes.data);
                generateCitations(docRes.data);
            } catch (e) {
                console.error('Failed to fetch document:', e);
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
        const { title } = docData;
        const institution = docData.institution || 'IKMS';

        setCitations({
            apa: `${authors} (${year}). ${title}. ${institution}. IKMS National Research Portal.`,
            mla: `${authors}. "${title}." ${institution}, ${year}.`,
            bibtex: `@article{ikms_${id},\n  author = {${authors}},\n  title  = {${title}},\n  year   = {${year}},\n  publisher = {${institution}}\n}`
        });
    };

    const handleDownload = async () => {
        try {
            const res = await axios.post(`${API}/documents/${id}/download`, {}, { headers: getAuthHeaders() });
            window.open(`${API}${res.data.file_url}`, '_blank');
            showMessage('Download started!', 'success');
        } catch {
            showMessage('Failed to start download.', 'error');
        }
    };

    const handleBookmark = async () => {
        if (!isAuthenticated()) {
            showMessage('Please login to save research.', 'error');
            return;
        }
        try {
            await axios.post(`${API}/bookmarks`, { document_id: id }, { headers: getAuthHeaders() });
            showMessage('Added to My Library!', 'success');
        } catch {
            showMessage('Failed to bookmark.', 'error');
        }
    };

    const copyToClipboard = (text, format) => {
        navigator.clipboard.writeText(text);
        setCopiedFormat(format);
        setTimeout(() => setCopiedFormat(null), 2000);
    };

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage(''), 3000);
    };

    const shareUrl = window.location.href;

    if (loading) return (
        <div className="page-wrapper">
            <div className="container" style={{ paddingTop: '3rem' }}>
                <div className="loading-state">Retrieving research details</div>
            </div>
        </div>
    );

    if (!doc) return (
        <div className="page-wrapper">
            <div className="container" style={{ paddingTop: '3rem' }}>
                <div className="empty-state"><div className="empty-state-icon">📄</div> Document not found</div>
            </div>
        </div>
    );

    return (
        <div className="page-wrapper">
            <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>

                {/* Breadcrumb */}
                <nav className="breadcrumb" aria-label="Breadcrumb">
                    <Link to="/">Home</Link>
                    <span className="breadcrumb-sep">›</span>
                    <Link to="/?browse=true">Search</Link>
                    <span className="breadcrumb-sep">›</span>
                    <span style={{ color: 'var(--text-secondary)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {doc.title}
                    </span>
                </nav>

                {/* Message */}
                {message && (
                    <div className={`message-banner ${message.type}`}>{message.text}</div>
                )}

                {/* ── Main Document Panel ── */}
                <div className="doc-detail-card card">
                    {/* Top stripe */}
                    <div className="doc-top-stripe" />

                    {/* Institution & Verified badge */}
                    <div className="doc-badges-row">
                        <span className="badge badge-primary" style={{ fontSize: '0.85rem', padding: '0.35rem 1rem' }}>
                            <Building2 size={14} /> {doc.institution}
                        </span>
                        {doc.institutional_status === 'verified' && (
                            <span className="badge badge-approved" style={{ fontSize: '0.82rem', padding: '0.35rem 1rem' }}>
                                ✓ Verified Institution
                            </span>
                        )}
                        <span className="badge badge-primary" style={{ fontSize: '0.82rem', padding: '0.35rem 1rem' }}>
                            <Calendar size={13} /> {new Date(doc.upload_date).getFullYear()}
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="doc-title">{doc.title}</h1>

                    {/* Authors */}
                    {doc.authors && doc.authors.length > 0 && (
                        <div className="doc-authors">
                            <span className="doc-authors-label">Research Team</span>
                            <div className="doc-authors-list">
                                {doc.authors.map(auth => (
                                    <Link key={auth.id} to={`/author/${auth.id}`} className="author-pill">
                                        <span className="author-avatar">{auth.name[0]}</span>
                                        {auth.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Metrics */}
                    <div className="doc-metrics">
                        <div className="doc-metric">
                            <span className="doc-metric-value">{doc.view_count || 0}</span>
                            <span className="doc-metric-label">Views</span>
                        </div>
                        <div className="doc-metric">
                            <span className="doc-metric-value">{doc.download_count || 0}</span>
                            <span className="doc-metric-label">Downloads</span>
                        </div>
                        <div className="doc-metric">
                            <span className="doc-metric-value">{new Date(doc.upload_date).getFullYear()}</span>
                            <span className="doc-metric-label">Year</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="doc-actions">
                        <button onClick={handleDownload} className="btn btn-success btn-lg">
                            <Download size={20} /> Download PDF
                        </button>
                        <button onClick={handleBookmark} className="btn btn-secondary btn-lg">
                            <Bookmark size={20} /> Save Research
                        </button>
                        <div className="share-dropdown">
                            <span className="btn btn-ghost btn-lg" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'default' }}>
                                <Share2 size={18} /> Share:
                            </span>
                            <a href={`mailto:?subject=${encodeURIComponent(doc.title)}&body=${encodeURIComponent(shareUrl)}`} className="btn btn-ghost btn-sm" title="Share via Email">
                                <Mail size={16} />
                            </a>
                            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(doc.title)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" title="Share on X/Twitter">
                                <ExternalLink size={16} />
                            </a>
                            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" title="Share on LinkedIn">
                                <ExternalLink size={16} />
                            </a>
                        </div>
                    </div>

                    <hr className="divider" />

                    {/* Abstract */}
                    <div className="doc-section">
                        <h2 className="doc-section-title"><BookOpen size={20} /> Abstract</h2>
                        <p className="doc-abstract-text">{doc.abstract || 'No abstract available.'}</p>
                    </div>

                    {/* Keywords/Topics */}
                    {doc.topic_scores && doc.topic_scores.length > 0 && (
                        <div className="doc-section">
                            <h2 className="doc-section-title">Research Topics</h2>
                            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                {doc.topic_scores.slice(0, 8).map((ts, i) => (
                                    <span key={i} className="chip chip-active">{ts.topic}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Citations */}
                    {citations && (
                        <div className="doc-section">
                            <h2 className="doc-section-title">Cite This Research</h2>
                            <div className="citations-grid">
                                {['apa', 'mla', 'bibtex'].map((fmt) => (
                                    <div key={fmt} className="citation-card">
                                        <div className="citation-header">
                                            <span className="citation-format">{fmt.toUpperCase()}</span>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => copyToClipboard(citations[fmt], fmt)}
                                            >
                                                {copiedFormat === fmt ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                                                {copiedFormat === fmt ? 'Copied!' : 'Copy'}
                                            </button>
                                        </div>
                                        <code className="citation-text">{citations[fmt]}</code>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Recommendations ── */}
                <div style={{ marginTop: '3rem' }}>
                    <div className="section-header">
                        <div>
                            <h2 className="section-title">
                                <RefreshCw size={22} style={{ display: 'inline', marginRight: '0.5rem', color: 'var(--primary)' }} />
                                Related Research
                            </h2>
                            <p className="section-subtitle">Papers similar to this one, based on content similarity</p>
                        </div>
                    </div>
                    {recommendations.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📚</div>
                            No related research found yet.
                        </div>
                    ) : (
                        <div className="recs-scroll">
                            {recommendations.map(rec => (
                                <div key={rec.id} className="rec-card card">
                                    <Link to={`/document/${rec.id}`} className="rec-title">{rec.title}</Link>
                                    <p className="rec-abstract">{rec.abstract?.substring(0, 140)}...</p>
                                    <Link to={`/document/${rec.id}`} className="rec-link">
                                        View Details <ArrowRight size={14} />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocumentDetail;
