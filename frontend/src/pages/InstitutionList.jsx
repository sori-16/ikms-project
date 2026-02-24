import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Building2, MapPin, BookOpen, ArrowRight } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function InstitutionList() {
    const [institutions, setInstitutions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${API}/institutions`)
            .then(r => setInstitutions(r.data))
            .catch(e => console.error(e))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="page-wrapper">
            <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
                {/* Page Header */}
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem,4vw,2.5rem)', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.75rem' }}>
                        Research Institutions
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '540px', margin: '0 auto' }}>
                        Discover knowledge from top universities and research centers across Ethiopia.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '1rem' }}>
                        <span style={{ width: 24, height: 4, borderRadius: 2, background: 'var(--eth-green)' }} />
                        <span style={{ width: 24, height: 4, borderRadius: 2, background: 'var(--eth-yellow)' }} />
                        <span style={{ width: 24, height: 4, borderRadius: 2, background: 'var(--eth-red)' }} />
                    </div>
                </div>

                {loading ? (
                    <div className="loading-state">Loading institutions</div>
                ) : institutions.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🏛</div>
                        No institutions registered yet.
                    </div>
                ) : (
                    <div className="grid-auto">
                        {institutions.map(inst => (
                            <Link to={`/institution/${inst.id}`} key={inst.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div
                                    className="card"
                                    style={{ height: '100%', display: 'flex', flexDirection: 'column', borderTop: '4px solid var(--primary)', transition: 'all 0.2s' }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                                >
                                    <div style={{
                                        width: 52, height: 52, borderRadius: '50%', background: 'var(--primary-soft)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem'
                                    }}>
                                        <Building2 size={24} color="var(--primary)" />
                                    </div>
                                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', flex: 1 }}>
                                        {inst.name}
                                    </h2>
                                    {inst.location && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
                                            <MapPin size={13} /> {inst.location}
                                        </div>
                                    )}
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.25rem', flex: 1 }}>
                                        {inst.description || 'A leading center for research and education in Ethiopia.'}
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            <BookOpen size={13} /> View Research
                                        </span>
                                        <ArrowRight size={16} color="var(--primary)" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default InstitutionList;
