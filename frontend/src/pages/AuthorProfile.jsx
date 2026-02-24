// Created by: Soreti (Team Leader) - Demo Implementation
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { User, Building2, BookOpen, Calendar, ArrowRight, ArrowLeft } from 'lucide-react';
import './Author.css';

function AuthorProfile() {
    const { id } = useParams();
    const [author, setAuthor] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAuthor = async () => {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            try {
                const response = await axios.get(`${apiUrl}/authors/${id}`);
                setAuthor(response.data);
            } catch (error) {
                console.error('Error fetching author:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAuthor();
    }, [id]);

    if (loading) return <div className="loading-state">Loading researcher profile...</div>;
    if (!author) return <div className="empty-state">Author not found.</div>;

    return (
        <div className="container author-profile-container" style={{ paddingTop: '2rem' }}>
            <Link to="/search" className="nav-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
                <ArrowLeft size={18} /> Back to Search
            </Link>

            <div className="glass-panel author-header" style={{ padding: '3rem' }}>
                <div className="author-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <User size={48} className="accent-text" />
                        <h1>{author.name}</h1>
                    </div>
                    {!author.user_id && (
                        <button
                            onClick={async () => {
                                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                                try {
                                    const { getAuthHeaders } = await import('../utils/auth');
                                    await axios.post(`${apiUrl}/authors/${author.id}/claim`, {}, {
                                        headers: getAuthHeaders()
                                    });
                                    alert('Profile claimed successfully!');
                                    window.location.reload();
                                } catch (err) {
                                    alert('Failed to claim profile. Are you logged in?');
                                }
                            }}
                            className="btn-primary-small"
                        >
                            Claim this Profile
                        </button>
                    )}
                    {author.user_id && (
                        <span className="badge-approved" style={{ fontSize: '0.9rem', padding: '6px 15px', borderRadius: '30px' }}>
                            ✓ Verified Researcher
                        </span>
                    )}
                </div>

                <div className="author-affiliation">
                    <Building2 size={20} />
                    {author.affiliation_id ? (
                        <Link to={`/institution/${author.affiliation_id}`} className="accent-link">
                            {author.affiliation}
                        </Link>
                    ) : (
                        <span>{author.affiliation}</span>
                    )}
                </div>

                <div className="author-stats" style={{ display: 'flex', gap: '2rem', marginTop: '2rem' }}>
                    <div className="author-stat-box">
                        <span className="stat-num">{author.stats?.total_publications || 0}</span>
                        <span className="stat-label">Publications</span>
                    </div>
                    <div className="author-stat-box">
                        <span className="stat-num">{author.stats?.total_downloads || 0}</span>
                        <span className="stat-label">Downloads</span>
                    </div>
                    <div className="author-stat-box">
                        <span className="stat-num">{author.stats?.total_views || 0}</span>
                        <span className="stat-label">Views</span>
                    </div>
                    {author.stats?.most_popular_paper && (
                        <div className="author-stat-box most-popular" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '2rem' }}>
                            <span className="stat-label" style={{ opacity: 0.6, fontSize: '0.7rem', textTransform: 'uppercase' }}>Most Popular</span>
                            <Link to={`/document/${author.stats.most_popular_paper.id}`} className="accent-link" style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {author.stats.most_popular_paper.title}
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            <div className="author-papers-section">
                <h2 className="section-title">Research Output</h2>
                <div className="author-papers-grid">
                    {author.documents?.length === 0 ? (
                        <p className="empty-state">No approved publications found for this author.</p>
                    ) : (
                        author.documents.map((doc) => (
                            <Link to={`/document/${doc.id}`} key={doc.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div className="glass-panel author-paper-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h3>{doc.title}</h3>
                                            <p className="abstract" style={{ marginTop: '0.5rem' }}>
                                                {doc.abstract?.substring(0, 180)}...
                                            </p>
                                            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <Calendar size={16} /> {doc.publication_date ? new Date(doc.publication_date).getFullYear() : 'N/A'}
                                                </span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <BookOpen size={16} /> Research Paper
                                                </span>
                                            </div>
                                        </div>
                                        <ArrowRight size={24} className="accent-text" />
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default AuthorProfile;
