import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { User, Building2, BookOpen, Calendar, Download, Eye, ArrowRight, MessageSquare, Briefcase } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function AuthorProfile() {
    const { id } = useParams();
    const [author, setAuthor] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAuthor = async () => {
            try {
                const res = await axios.get(`${API}/authors/${id}`);
                setAuthor(res.data);
            } catch (e) {
                console.error('Error fetching author:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchAuthor();
    }, [id]);

    if (loading) return (
        <div className="page-wrapper">
            <div className="container" style={{ paddingTop: '3rem' }}>
                <div className="loading-state">Loading researcher profile</div>
            </div>
        </div>
    );

    if (!author) return (
        <div className="page-wrapper">
            <div className="container" style={{ paddingTop: '3rem' }}>
                <div className="empty-state"><div className="empty-state-icon">👤</div> Author not found.</div>
            </div>
        </div>
    );

    const handleClaim = async () => {
        try {
            const { getAuthHeaders } = await import('../utils/auth');
            await axios.post(`${API}/authors/${author.id}/claim`, {}, { headers: getAuthHeaders() });
            alert('Profile claimed successfully!');
            window.location.reload();
        } catch {
            alert('Failed to claim profile. Please make sure you are logged in.');
        }
    };

    return (
        <div className="page-wrapper">
            <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
                {/* Breadcrumb */}
                <nav className="breadcrumb">
                    <Link to="/">Home</Link>
                    <span className="breadcrumb-sep">›</span>
                    <span>Researcher Profile</span>
                </nav>

                {/* Author Header Card */}
                <div className="card" style={{ marginBottom: '1.5rem', padding: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                            <div style={{
                                width: '72px', height: '72px', borderRadius: '50%',
                                background: 'var(--primary)', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', flexShrink: 0
                            }}>
                                <span style={{ color: '#fff', fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 700 }}>
                                    {author.name?.[0]?.toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <h1 style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>{author.name}</h1>
                                {author.affiliation && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                                        <Building2 size={15} />
                                        {author.affiliation_id ? (
                                            <Link to={`/institution/${author.affiliation_id}`} style={{ color: 'var(--primary)' }}>{author.affiliation}</Link>
                                        ) : author.affiliation}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            {author.user_id ? (
                                <span className="badge badge-approved" style={{ fontSize: '0.85rem', padding: '0.35rem 1rem' }}>
                                    ✓ Verified Researcher
                                </span>
                            ) : (
                                <button className="btn btn-secondary btn-sm" onClick={handleClaim}>
                                    Claim this Profile
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Metrics Row */}
                    <div style={{ display: 'flex', gap: '0', borderTop: '1px solid var(--border)', marginTop: '2rem', paddingTop: '1.5rem' }}>
                        {[
                            { label: 'Publications', value: author.stats?.total_publications || 0, icon: <BookOpen size={18} /> },
                            { label: 'Downloads', value: author.stats?.total_downloads || 0, icon: <Download size={18} /> },
                            { label: 'Views', value: author.stats?.total_views || 0, icon: <Eye size={18} /> },
                        ].map((m, i) => (
                            <div key={i} style={{ flex: 1, textAlign: 'center', borderRight: i < 2 ? '1px solid var(--border)' : 'none', padding: '0 1rem' }}>
                                <div style={{ color: 'var(--text-muted)', marginBottom: '0.4rem' }}>{m.icon}</div>
                                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>{m.value}</div>
                                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 600 }}>{m.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Collaboration Hub Section */}
                    {author.user_id && (
                        <div style={{ borderTop: '1px solid var(--border)', marginTop: '1.5rem', paddingTop: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gold)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                                <Briefcase size={16} /> Collaboration Hub
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem' }}>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Research Interests & Collaboration</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                        {author.collab_interests || `${author.name} hasn't listed specific collaboration interests yet, but is a verified researcher on the platform.`}
                                    </p>
                                </div>
                                <a href={`mailto:${author.email || 'research@ikms.edu.et'}?subject=Collaboration Request via IKMS`} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1.5rem' }}>
                                    <MessageSquare size={18} /> Connect for Collaboration
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                {/* Publications */}
                <div style={{ marginTop: '2rem' }}>
                    <h2 className="section-title" style={{ marginBottom: '1.25rem' }}>Research Output</h2>
                    {!author.documents || author.documents.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📄</div>
                            No approved publications found.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {author.documents.map(doc => (
                                <Link key={doc.id} to={`/document/${doc.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.5rem', borderLeft: '4px solid transparent', transition: 'border-color 0.2s' }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.35rem' }}>{doc.title}</h3>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {doc.abstract}
                                            </p>
                                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    <Calendar size={13} /> {doc.publication_date ? new Date(doc.publication_date).getFullYear() : 'N/A'}
                                                </span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    <Download size={13} /> {doc.download_count || 0}
                                                </span>
                                            </div>
                                        </div>
                                        <ArrowRight size={20} color="var(--primary)" style={{ flexShrink: 0, opacity: 0.5 }} />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AuthorProfile;
