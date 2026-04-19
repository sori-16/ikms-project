import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Building2, MapPin, BookOpen, Calendar, Download, ArrowRight } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function InstitutionProfile() {
    const { id } = useParams();
    const [institution, setInstitution] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${API}/institutions/${id}`)
            .then(r => setInstitution(r.data))
            .catch(e => console.error(e))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div className="page-wrapper"><div className="container" style={{ paddingTop: '3rem' }}><div className="loading-state">Loading institution profile</div></div></div>
    );
    if (!institution) return (
        <div className="page-wrapper"><div className="container" style={{ paddingTop: '3rem' }}><div className="empty-state"><div className="empty-state-icon">🏛</div> Institution not found.</div></div></div>
    );

    return (
        <div className="page-wrapper">
            <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
                {/* Breadcrumb */}
                <nav className="breadcrumb">
                    <Link to="/">Home</Link>
                    <span className="breadcrumb-sep">›</span>
                    <Link to="/institutions">Institutions</Link>
                    <span className="breadcrumb-sep">›</span>
                    <span>{institution.name}</span>
                </nav>

                {/* Institution Header */}
                <div className="card" style={{ marginBottom: '2rem', padding: '2.5rem', borderTop: '5px solid var(--primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <div style={{
                            width: 80, height: 80, borderRadius: 'var(--radius-md)',
                            background: institution.logo_path ? 'transparent' : 'var(--primary)',
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'center', flexShrink: 0,
                            overflow: 'hidden', border: institution.logo_path ? '2px solid var(--border)' : 'none',
                            boxShadow: 'var(--shadow-sm)'
                        }}>
                            {institution.logo_path
                                ? <img src={institution.logo_path} alt={`${institution.name} logo`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <Building2 size={34} color="#fff" />
                            }
                        </div>
                        <div style={{ flex: 1 }}>
                            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, marginBottom: '0.5rem' }}>
                                {institution.name}
                            </h1>
                            {institution.location && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                                    <MapPin size={15} /> {institution.location}
                                </div>
                            )}
                            {institution.description && (
                                <p style={{ maxWidth: '700px' }}>{institution.description}</p>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', gap: 0, borderTop: '1px solid var(--border)', marginTop: '2rem', paddingTop: '1.5rem' }}>
                        {[
                            { label: 'Publications', value: institution.documents?.length || 0, icon: <BookOpen size={16} /> },
                            { label: 'Total Downloads', value: institution.documents?.reduce((s, d) => s + (d.download_count || 0), 0) || 0, icon: <Download size={16} /> },
                        ].map((m, i) => (
                            <div key={i} style={{ flex: 1, textAlign: 'center', borderRight: i < 1 ? '1px solid var(--border)' : 'none', padding: '0 1rem' }}>
                                <div style={{ color: 'var(--text-muted)', marginBottom: '0.3rem' }}>{m.icon}</div>
                                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>{m.value}</div>
                                <div style={{ fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 600 }}>{m.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Publications */}
                <h2 className="section-title" style={{ marginBottom: '1.25rem' }}>Research Publications</h2>
                {!institution.documents || institution.documents.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📄</div>
                        No public research documents available yet.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {institution.documents.map(doc => (
                            <Link key={doc.id} to={`/document/${doc.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div
                                    className="card"
                                    style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', padding: '1.25rem 1.5rem', borderLeft: '4px solid transparent', transition: 'border-color 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                                >
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.35rem', fontSize: '1rem' }}>{doc.title}</h3>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '0.5rem' }}>
                                            {doc.abstract}
                                        </p>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                            <Calendar size={12} /> {doc.publication_date ? new Date(doc.publication_date).getFullYear() : 'N/A'}
                                        </span>
                                    </div>
                                    <ArrowRight size={18} color="var(--primary)" style={{ flexShrink: 0, opacity: 0.5 }} />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default InstitutionProfile;
