import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowLeft, Download, Bookmark, BookOpen, Calendar, Building2,
    RefreshCw, ArrowRight, Share2, Mail, ExternalLink, Copy, Check
} from 'lucide-react';
import { getAuthHeaders, isAuthenticated, getUser } from '../utils/auth';
import './DocumentDetail.css';
import { UserCheck, Heart, Languages, ShieldCheck, Database } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DocumentDetail = () => {
    const { id } = useParams();
    const [doc, setDoc] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [citations, setCitations] = useState(null);
    const [copiedFormat, setCopiedFormat] = useState(null);
    const [localSummary, setLocalSummary] = useState(null);
    const [loadingSummary, setLoadingSummary] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch document first — independent from recommendations
                const docRes = await axios.get(`${API}/documents/${id}`);
                setDoc(docRes.data);
                generateCitations(docRes.data);

                // Fetch recommendations separately — failures won't break the page
                try {
                    const recRes = await axios.get(`${API}/recommend/${id}`);
                    setRecommendations(recRes.data);
                } catch {
                    setRecommendations([]); // Silently ignore missing recommendations
                }
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
        const displayDate = docData.publication_date || docData.upload_date;
        const year = displayDate ? new Date(displayDate).getFullYear() : 'n.d.';
        const authors = docData.authors?.map(a => a.name).join(', ') || 'Unknown Author';
        const { title } = docData;
        const institution = docData.institution || 'IKMS';

        setCitations({
            apa: `${authors} (${year}). ${title}. ${institution}. IKMS National Research Portal.`,
            mla: `${authors}. "${title}." ${institution}, ${year}.`,
            bibtex: `@article{ikms_${id},\n  author = {${authors}},\n  title  = {${title}},\n  year   = {${year}},\n  publisher = {${institution}}\n}`
        });
    };

    const handleLike = async () => {
        if (!isAuthenticated()) {
            showMessage('Please login to endorse research.', 'error');
            return;
        }
        try {
            const res = await axios.post(`${API}/documents/${id}/like`, {}, { headers: getAuthHeaders() });
            setDoc({ ...doc, like_count: res.data.count });
            showMessage(res.data.liked ? 'Research endorsed!' : 'Endorsement removed.', 'success');
        } catch {
            showMessage('Failed to process endorsement.', 'error');
        }
    };

    const handleSummarize = async () => {
        setLoadingSummary(true);
        try {
            const res = await axios.post(`${API}/documents/${id}/summarize`);
            setLocalSummary(res.data);
            showMessage('Summaries generated in Amharic & Afaan Oromoo!', 'success');
        } catch {
            showMessage('Failed to generate summaries.', 'error');
        } finally {
            setLoadingSummary(false);
        }
    };

    const handleDownload = async () => {
        try {
            const res = await axios.post(`${API}/documents/${id}/download`, {}, { headers: getAuthHeaders() });
            window.open(res.data.file_url, '_blank');
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

    const handleClaimAuthorship = async () => {
        if (!isAuthenticated()) {
            showMessage('Please login to claim authorship.', 'error');
            return;
        }
        try {
            // Check if there's a primary author to claim or just the doc
            // For now, let's just claim the profile based on the first author or the doc generally
            const authorId = doc.authors && doc.authors.length > 0 ? doc.authors[0].id : null;
            if (!authorId) {
                showMessage('No author profile found to claim.', 'error');
                return;
            }
            await axios.post(`${API}/authors/${authorId}/claim`, {}, { headers: getAuthHeaders() });
            showMessage('Claim request submitted for moderation!', 'success');
        } catch (err) {
            showMessage(err.response?.data?.error || 'Failed to submit claim.', 'error');
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
                        {doc.erb_status === 'verified' && (
                            <span className="badge badge-success" style={{ fontSize: '0.82rem', padding: '0.35rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                <ShieldCheck size={14} /> Ethically Cleared
                            </span>
                        )}
                        <span className="badge badge-primary" style={{ fontSize: '0.82rem', padding: '0.35rem 1rem' }}>
                            <Calendar size={13} /> {new Date(doc.publication_date || doc.upload_date).getFullYear()}
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
                            <span className="doc-metric-value">{doc.like_count || 0}</span>
                            <span className="doc-metric-label">Endorsements</span>
                        </div>
                        <div className="doc-metric">
                            <span className="doc-metric-value">{new Date(doc.publication_date || doc.upload_date).getFullYear()}</span>
                            <span className="doc-metric-label">Year</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="doc-actions">
                        <button onClick={handleDownload} className="btn btn-success btn-lg">
                            <Download size={20} /> Download PDF
                        </button>
                        <button onClick={handleLike} className="btn btn-lg" style={{ background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', border: '1px solid rgba(231, 76, 60, 0.2)' }}>
                            <Heart size={20} fill={doc.user_has_liked ? '#e74c3c' : 'none'} /> Endorse
                        </button>
                        <button onClick={handleBookmark} className="btn btn-secondary btn-lg">
                            <Bookmark size={20} /> Save Research
                        </button>
                        {doc.has_dataset && (
                            <button className="btn btn-primary btn-lg" style={{ background: '#3498db', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Database size={20} /> Download Dataset
                            </button>
                        )}
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
                        {isAuthenticated() && getUser()?.role === 'researcher' && (
                            <button onClick={handleClaimAuthorship} className="btn btn-ghost btn-lg" style={{ color: 'var(--primary)', border: '1px solid var(--primary)' }}>
                                <UserCheck size={20} /> Claim Authorship
                            </button>
                        )}
                    </div>

                    <div className="doc-secondary-actions" style={{ marginTop: '20px', padding: '0 2rem' }}>
                        <button onClick={handleSummarize} className="btn btn-ghost" style={{ color: 'var(--primary)', border: '1px solid rgba(30, 58, 95, 0.2)', padding: '0.5rem 1.5rem' }} disabled={loadingSummary}>
                            <Languages size={18} /> {loadingSummary ? 'Generating...' : 'Translate Abstract to Local Languages (Amharic/Oromiffa)'}
                        </button>
                    </div>

                    {localSummary && (
                        <div style={{ padding: '0 2rem 2rem 2rem' }}>
                            <div className="card" style={{ background: 'rgba(241, 196, 15, 0.05)', border: '1px solid rgba(241, 196, 15, 0.2)', padding: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Languages size={20} className="text-gold" /> የጥናት ማጠቃለያ (AI Summaries)
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    <div>
                                        <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>አማርኛ (Amharic)</h4>
                                        <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>{localSummary.amharic}</p>
                                    </div>
                                    <div style={{ borderLeft: '1px solid rgba(0,0,0,0.1)', paddingLeft: '2rem' }}>
                                        <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>Afaan Oromoo</h4>
                                        <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>{localSummary.oromiffa}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

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

                    {/* ── Citation Export ── */}
                    {citations && (
                        <div className="doc-section">
                            <h2 className="doc-section-title">
                                <Copy size={18} /> Cite This Research
                            </h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                                Select a citation format and copy to your bibliography.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                {[
                                    { key: 'apa', label: 'APA', color: '#4f46e5' },
                                    { key: 'mla', label: 'MLA', color: '#0891b2' },
                                    { key: 'bibtex', label: 'BibTeX', color: '#059669' }
                                ].map(({ key, label, color }) => (
                                    <div key={key} style={{
                                        background: 'var(--surface)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius)',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '0.6rem 1rem',
                                            background: `${color}12`,
                                            borderBottom: '1px solid var(--border)'
                                        }}>
                                            <span style={{ fontWeight: 700, fontSize: '0.8rem', color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                {label}
                                            </span>
                                            <button
                                                onClick={() => copyToClipboard(citations[key], key)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                    background: copiedFormat === key ? '#22c55e' : color,
                                                    color: '#fff', border: 'none', borderRadius: '6px',
                                                    padding: '0.3rem 0.85rem', fontSize: '0.8rem',
                                                    cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s'
                                                }}
                                            >
                                                {copiedFormat === key ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
                                            </button>
                                        </div>
                                        <pre style={{
                                            margin: 0, padding: '0.85rem 1rem',
                                            fontSize: '0.82rem', lineHeight: 1.6,
                                            color: 'var(--text-secondary)',
                                            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                                            fontFamily: key === 'bibtex' ? 'monospace' : 'inherit'
                                        }}>
                                            {citations[key]}
                                        </pre>
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
