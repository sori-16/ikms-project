/**
 * IKMS – Collaborator Discovery
 * Find researchers by name or research interest
 */
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Users, Building2, BookOpen, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const INTEREST_TAGS = [
    'Public Health', 'Malaria', 'HIV/AIDS', 'Tuberculosis',
    'Maternal Health', 'Nutrition', 'Water & Sanitation',
    'Sustainable Agriculture', 'AI in Healthcare', 'Epidemiology',
    'Environmental Science', 'Blockchain', 'Data Science'
];

function Collaborators() {
    const [researchers, setResearchers] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [query, setQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${API}/researchers`)
            .then(res => {
                setResearchers(res.data);
                setFiltered(res.data);
            })
            .catch(() => setResearchers([]))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        let results = researchers;
        if (query.trim()) {
            const q = query.toLowerCase();
            results = results.filter(r =>
                r.name?.toLowerCase().includes(q) ||
                r.research_interests?.toLowerCase().includes(q) ||
                r.occupation?.toLowerCase().includes(q)
            );
        }
        if (selectedTag) {
            results = results.filter(r =>
                r.research_interests?.toLowerCase().includes(selectedTag.toLowerCase())
            );
        }
        setFiltered(results);
    }, [query, selectedTag, researchers]);

    const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
    const getAvatarColor = (name) => {
        const colors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed'];
        const idx = (name?.charCodeAt(0) || 0) % colors.length;
        return colors[idx];
    };

    return (
        <div className="page-wrapper">
            <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
                {/* Hero */}
                <div style={{
                    background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
                    borderRadius: '16px', padding: '2.5rem 2rem',
                    marginBottom: '2rem', color: '#fff', textAlign: 'center'
                }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🤝</div>
                    <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                        Find Research Collaborators
                    </h1>
                    <p style={{ opacity: 0.85, fontSize: '1rem', marginBottom: '1.5rem' }}>
                        Connect with Ethiopian researchers sharing your interests
                    </p>
                    {/* Search */}
                    <div style={{ display: 'flex', gap: '0.75rem', maxWidth: '540px', margin: '0 auto' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search by name or interest..."
                                style={{
                                    width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.6rem',
                                    borderRadius: '8px', border: 'none', fontSize: '0.95rem',
                                    boxSizing: 'border-box', outline: 'none'
                                }}
                            />
                        </div>
                        <button
                            onClick={() => setQuery('')}
                            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: '8px', padding: '0 1rem', cursor: 'pointer', fontWeight: 600 }}
                        >
                            Clear
                        </button>
                    </div>
                </div>

                {/* Filter Tags */}
                <div style={{ marginBottom: '2rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: 600 }}>
                        <BookOpen size={14} style={{ display: 'inline', marginRight: '4px' }} />
                        Filter by Research Interest:
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {INTEREST_TAGS.map(tag => (
                            <button
                                key={tag}
                                onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                                style={{
                                    padding: '0.35rem 0.9rem', borderRadius: '99px', fontSize: '0.82rem',
                                    fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                                    background: selectedTag === tag ? 'var(--primary)' : 'var(--surface)',
                                    color: selectedTag === tag ? '#fff' : 'var(--text-secondary)',
                                    border: `1px solid ${selectedTag === tag ? 'var(--primary)' : 'var(--border)'}`
                                }}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results count */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    <Users size={16} />
                    <span>
                        {loading ? 'Loading researchers...' : `${filtered.length} researcher${filtered.length !== 1 ? 's' : ''} found`}
                        {selectedTag && ` in "${selectedTag}"`}
                    </span>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="loading-state">Loading researchers...</div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🔍</div>
                        No researchers found. Try a different search or filter.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                        {filtered.map(r => (
                            <div key={r.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                {/* Avatar + Name */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    {r.photo_url ? (
                                        <img src={r.photo_url} alt={r.name} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
                                    ) : (
                                        <div style={{
                                            width: 52, height: 52, borderRadius: '50%',
                                            background: getAvatarColor(r.name),
                                            color: '#fff', display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0
                                        }}>
                                            {getInitials(r.name)}
                                        </div>
                                    )}
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {r.name}
                                        </div>
                                        {r.occupation && (
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                                                {r.occupation}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Institution */}
                                {r.institution && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.83rem' }}>
                                        <Building2 size={13} />
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.institution}</span>
                                    </div>
                                )}

                                {/* Research Interests */}
                                {r.research_interests && (
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Research Interests
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                            {r.research_interests.split(',').slice(0, 4).map((interest, i) => (
                                                <span key={i} style={{
                                                    background: 'var(--primary-light)', color: 'var(--primary)',
                                                    fontSize: '0.75rem', padding: '0.2rem 0.6rem',
                                                    borderRadius: '99px', fontWeight: 600,
                                                    border: '1px solid rgba(37,99,235,0.2)'
                                                }}>
                                                    {interest.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '0.6rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
                                    {r.publications > 0 && (
                                        <span style={{
                                            fontSize: '0.78rem', color: 'var(--text-muted)',
                                            display: 'flex', alignItems: 'center', gap: '0.3rem'
                                        }}>
                                            <BookOpen size={12} /> {r.publications} paper{r.publications !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                    <a
                                        href={`mailto:${r.email}`}
                                        style={{
                                            marginLeft: 'auto', display: 'flex', alignItems: 'center',
                                            gap: '0.35rem', background: 'var(--primary)', color: '#fff',
                                            padding: '0.4rem 0.85rem', borderRadius: '6px',
                                            fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none'
                                        }}
                                    >
                                        <Mail size={13} /> Connect
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Collaborators;
