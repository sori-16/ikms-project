/**
 * IKMS – Search & Discovery Page (Redesigned)
 * Light theme, Ethiopian identity, fixed filter state bugs
 */
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Search, Filter, RefreshCw, Calendar, Building2, Download, ArrowRight, Bell, ChevronDown, ChevronUp, BookOpen, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Search.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function SearchPage() {
    const [searchParams] = useSearchParams();

    // Core state
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(!!searchParams.get('q'));

    // Filter state
    const [selectedInst, setSelectedInst] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedAuthor, setSelectedAuthor] = useState('');
    const [sortBy, setSortBy] = useState('relevance');
    const [filtersOpen, setFiltersOpen] = useState(false);

    // Landing page data
    const [institutions, setInstitutions] = useState([]);
    const [latestResearch, setLatestResearch] = useState([]);
    const [trendingResearch, setTrendingResearch] = useState([]);
    const [topics] = useState([
        'Malaria', 'Maternal Health', 'HIV/AIDS', 'Tuberculosis',
        'Nutrition', 'Public Health', 'Sustainable Agriculture', 'AI in Healthcare',
        'Environmental Science', 'Water & Sanitation', 'Epidemiology', 'Blockchain'
    ]);

    // Fetch initial data
    useEffect(() => {
        const fetchInitialData = async () => {
            // Fetch institutions independently
            axios.get(`${API}/institutions`)
                .then(res => setInstitutions(res.data))
                .catch(err => console.error('Institutions fetch failed:', err));

            // Fetch latest research independently
            axios.get(`${API}/latest-research`)
                .then(res => setLatestResearch(res.data))
                .catch(err => console.error('Latest research fetch failed:', err));

            // Fetch trending independently
            axios.get(`${API}/documents/trending`)
                .then(res => setTrendingResearch(res.data || []))
                .catch(err => console.error('Trending fetch failed:', err));
        };
        fetchInitialData();

        // If URL has a search query, auto-search
        if (searchParams.get('q')) {
            handleSearch(null, searchParams.get('q'));
        }
    }, []);

    const handleSearch = async (e, overrideQuery) => {
        if (e) e.preventDefault();
        const searchQuery = overrideQuery ?? query;
        setLoading(true);
        setHasSearched(true);
        try {
            const response = await axios.get(`${API}/search`, {
                params: {
                    q: searchQuery,
                    institution_id: selectedInst,
                    year: selectedYear,
                    author: selectedAuthor
                }
            });
            setResults(response.data);
        } catch (error) {
            console.error('Search failed:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const resetFilters = () => {
        setQuery('');
        setSelectedInst('');
        setSelectedYear('');
        setSelectedAuthor('');
        setResults([]);
        setHasSearched(false);
        setSortBy('relevance');
    };

    const handleTopicClick = (topic) => {
        setQuery(topic);
        setHasSearched(true);
        setLoading(true);
        axios.get(`${API}/search`, { params: { q: topic } })
            .then(res => setResults(res.data))
            .catch(() => setResults([]))
            .finally(() => setLoading(false));
    };

    const getSortedResults = () => {
        const r = [...results];
        if (sortBy === 'date') return r.sort((a, b) => new Date(b.upload_date) - new Date(a.upload_date));
        if (sortBy === 'downloads') return r.sort((a, b) => (b.download_count || 0) - (a.download_count || 0));
        return r; // relevance – keep original order from backend
    };

    const isNewPaper = (dateStr) => {
        if (!dateStr) return false;
        return (Date.now() - new Date(dateStr)) < 7 * 24 * 60 * 60 * 1000;
    };

    return (
        <div className="page-wrapper">
            <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>

                {/* ── Hero / Search Header ── */}
                <div className={`search-hero ${hasSearched ? 'search-hero-compact' : ''}`}>
                    {!hasSearched && (
                        <div className="hero-badge">
                            <span className="eth-dot green" />
                            <span className="eth-dot yellow" />
                            <span className="eth-dot red" />
                            <span>Ethiopia's National Open Access Portal</span>
                        </div>
                    )}

                    <h1 className="hero-title">
                        {hasSearched
                            ? 'Search Results'
                            : 'Discover Ethiopian Health Research'}
                    </h1>

                    {!hasSearched && (
                        <p className="hero-subtitle">
                            Free & Open Access to research from Ethiopia's top universities and institutions.
                        </p>
                    )}

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="search-form">
                        <div className="search-input-wrap">
                            <Search className="search-icon" size={20} />
                            <input
                                type="text"
                                placeholder="Search by title, author, keywords, institution..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="search-input"
                            />
                            {query && (
                                <button type="button" className="search-clear" onClick={() => setQuery('')}>
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        <button type="submit" className="search-submit-btn">
                            <Search size={18} /> Search
                        </button>
                        <button
                            type="button"
                            className="search-filter-toggle"
                            onClick={() => setFiltersOpen(!filtersOpen)}
                        >
                            <Filter size={16} />
                            Filters
                            {filtersOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                    </form>

                    {/* Advanced Filters Slide-Down */}
                    {filtersOpen && (
                        <div className="advanced-filters animate-slideUp">
                            <div className="filter-row">
                                <div className="filter-group">
                                    <label className="input-label">
                                        <Building2 size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                        Institution
                                    </label>
                                    <select
                                        className="input-field"
                                        value={selectedInst}
                                        onChange={(e) => setSelectedInst(e.target.value)}
                                    >
                                        <option value="">All Institutions</option>
                                        {institutions.map(inst => (
                                            <option key={inst.id} value={inst.id}>{inst.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="filter-group">
                                    <label className="input-label">
                                        <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                        Publication Year
                                    </label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        placeholder="e.g. 2023"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                    />
                                </div>
                                <div className="filter-group">
                                    <label className="input-label">
                                        <BookOpen size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                        Author
                                    </label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="e.g. Abebe"
                                        value={selectedAuthor}
                                        onChange={(e) => setSelectedAuthor(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="filter-actions">
                                <button type="button" className="btn-secondary" onClick={resetFilters}>
                                    Clear Filters
                                </button>
                                <button type="button" className="btn-primary" onClick={handleSearch}>
                                    Apply Filters
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Trending Tags */}
                    {!hasSearched && (
                        <div className="trending-row">
                            <span className="trending-label">Trending:</span>
                            {['#AI-Health', '#Malaria', '#PublicHealth', '#SustainableAgri', '#Blockchain'].map(t => (
                                <button
                                    key={t}
                                    className="chip"
                                    onClick={() => handleTopicClick(t.replace('#', ''))}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Hero Stats (landing only) */}
                    {!hasSearched && (
                        <div className="hero-stats-row">
                            <div className="hero-stat">
                                <span className="hero-stat-value">150+</span>
                                <span className="hero-stat-label">Research Papers</span>
                            </div>
                            <div className="hero-stat-divider" />
                            <div className="hero-stat">
                                <span className="hero-stat-value">{institutions.length || '10+'}</span>
                                <span className="hero-stat-label">Institutions</span>
                            </div>
                            <div className="hero-stat-divider" />
                            <div className="hero-stat">
                                <span className="hero-stat-value">Free</span>
                                <span className="hero-stat-label">Open Access</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Landing Mode: Featured Content ── */}
                {!hasSearched && (
                    <>
                        {/* Trending Research */}
                        {trendingResearch.length > 0 && (
                            <section className="landing-section">
                                <div className="section-header">
                                    <div>
                                        <h2 className="section-title">🔥 Trending Research</h2>
                                        <p className="section-subtitle">Most downloaded papers this month from Ethiopian research institutions</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                    {trendingResearch.map((doc, index) => (
                                        <Link key={doc.id} to={`/document/${doc.id}`}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '1rem',
                                                padding: '1rem 1.25rem', borderRadius: 'var(--radius)',
                                                background: 'var(--surface)', border: '1px solid var(--border)',
                                                textDecoration: 'none', color: 'inherit',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                                            onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
                                        >
                                            <span style={{
                                                fontWeight: 800, fontSize: '1.4rem', minWidth: '2rem',
                                                color: index === 0 ? 'var(--warning)' : index === 1 ? 'var(--text-secondary)' : 'var(--text-muted)'
                                            }}>#{index + 1}</span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{doc.title}</div>
                                                <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
                                                    {doc.institution || 'Ethiopian Institution'}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success)', fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                                                <Download size={15} />
                                                {doc.download_count || 0} downloads
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Latest Research */}
                        <section className="landing-section">
                            <div className="section-header">
                                <div>
                                    <h2 className="section-title">Latest Research Publications</h2>
                                    <p className="section-subtitle">Recently added open access papers from Ethiopian institutions</p>
                                </div>
                                <button className="btn btn-secondary btn-sm" onClick={() => setHasSearched(true)}>
                                    <BookOpen size={15} /> Browse All
                                </button>
                            </div>
                            <div className="featured-grid">
                                {latestResearch.length === 0
                                    ? Array(3).fill(null).map((_, i) => (
                                        <div key={i} className="featured-card skeleton">
                                            <div className="skeleton-line wide" />
                                            <div className="skeleton-line" />
                                            <div className="skeleton-line short" />
                                        </div>
                                    ))
                                    : latestResearch.slice(0, 6).map(doc => (
                                        <Link key={doc.id} to={`/document/${doc.id}`} className="featured-card card">
                                            <div className="featured-card-top">
                                                {isNewPaper(doc.upload_date) && (
                                                    <span className="badge badge-new" style={{ marginBottom: '0.75rem' }}>✦ New</span>
                                                )}
                                                <h3 className="featured-card-title">{doc.title}</h3>
                                                <p className="featured-card-abstract">{doc.abstract?.substring(0, 130)}...</p>
                                            </div>
                                            <div className="featured-card-footer">
                                                <span className="badge badge-primary">
                                                    <Building2 size={11} />
                                                    {institutions.find(i => i.id === doc.institution_id)?.name || 'Institution'}
                                                </span>
                                                <span className="featured-read-more">
                                                    View <ArrowRight size={13} />
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                            </div>
                        </section>

                        {/* Explore by Institution */}
                        <section className="landing-section">
                            <h2 className="section-title" style={{ marginBottom: '1.25rem' }}>Explore by Institution</h2>
                            <div className="institution-scroll">
                                {institutions.map(inst => (
                                    <Link key={inst.id} to={`/institution/${inst.id}`} className="inst-scroll-card">
                                        <div className="inst-scroll-icon">🏛</div>
                                        <span className="inst-scroll-name">{inst.name}</span>
                                    </Link>
                                ))}
                            </div>
                        </section>

                        {/* Explore by Topic */}
                        <section className="landing-section">
                            <h2 className="section-title" style={{ marginBottom: '1.25rem' }}>Explore by Research Topic</h2>
                            <div className="topics-grid">
                                {topics.map(topic => (
                                    <button key={topic} className="topic-chip chip" onClick={() => handleTopicClick(topic)}>
                                        {topic}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Why Open Access */}
                        <section className="landing-section open-access-banner">
                            <div className="open-access-icon">📖</div>
                            <h2>Why Open Access?</h2>
                            <p>IKMS makes Ethiopian research freely available to everyone — students, policymakers, health workers, and the global community.</p>
                            <div className="open-access-benefits">
                                <div className="benefit-item"><span>✅</span> Free to Read</div>
                                <div className="benefit-item"><span>✅</span> Free to Download</div>
                                <div className="benefit-item"><span>✅</span> Ethiopian-Owned</div>
                                <div className="benefit-item"><span>✅</span> CC BY 4.0 License</div>
                            </div>
                            <Link to="/register" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
                                Share Your Research →
                            </Link>
                        </section>
                    </>
                )}

                {/* ── Search Results Mode ── */}
                {hasSearched && (
                    <div className="search-layout animate-fadeIn">
                        {/* Results Header */}
                        <div className="results-header-bar">
                            <div className="results-count">
                                {loading ? 'Searching...' : (
                                    <><strong>{results.length}</strong> result{results.length !== 1 ? 's' : ''} found{query ? ` for "${query}"` : ''}</>
                                )}
                            </div>
                            <div className="results-controls">
                                <select
                                    className="input-field"
                                    style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    <option value="relevance">Sort: Relevance</option>
                                    <option value="date">Sort: Newest</option>
                                    <option value="downloads">Sort: Most Downloaded</option>
                                </select>
                                {(query || selectedInst || selectedYear) && (
                                    <button className="btn btn-ghost btn-sm" onClick={resetFilters}>
                                        <RefreshCw size={13} /> Reset
                                    </button>
                                )}
                                {results.length > 0 && query && (
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={async () => {
                                            try {
                                                const { getAuthHeaders } = await import('../utils/auth');
                                                await axios.post(`${API}/saved-searches`, { query }, { headers: getAuthHeaders() });
                                                alert('Search saved! Check your dashboard for alerts.');
                                            } catch {
                                                alert('Please login to save searches.');
                                            }
                                        }}
                                    >
                                        <Bell size={13} /> Save Alert
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Results List */}
                        {loading ? (
                            <div className="loading-state">Searching publications</div>
                        ) : results.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">🔍</div>
                                {query || selectedInst || selectedYear
                                    ? 'No documents found for your search. Try different keywords.'
                                    : 'Use the search bar or filters above to find research.'}
                            </div>
                        ) : (
                            <div className="results-list">
                                {getSortedResults().map((doc) => (
                                    <div key={doc.id} className="result-card card">
                                        <div className="result-card-body">
                                            <Link to={`/document/${doc.id}`} className="result-title">{doc.title}</Link>
                                            <p className="result-abstract">{doc.abstract?.substring(0, 200)}{doc.abstract?.length > 200 ? '...' : ''}</p>

                                            <div className="result-meta">
                                                {doc.upload_date && (
                                                    <span className="meta-item">
                                                        <Calendar size={13} />
                                                        {new Date(doc.upload_date).getFullYear()}
                                                    </span>
                                                )}
                                                {doc.institution_id && (
                                                    <span className="meta-item">
                                                        <Building2 size={13} />
                                                        {institutions.find(i => i.id === doc.institution_id)?.name || 'Institution'}
                                                    </span>
                                                )}
                                                {doc.download_count > 0 && (
                                                    <span className="meta-item">
                                                        <Download size={13} />
                                                        {doc.download_count} downloads
                                                    </span>
                                                )}
                                                {doc.authors?.map(auth => (
                                                    <Link
                                                        key={auth.id}
                                                        to={`/author/${auth.id}`}
                                                        className="chip"
                                                        style={{ fontSize: '0.75rem', padding: '0.15rem 0.6rem' }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        👤 {auth.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="result-card-actions">
                                            <Link to={`/document/${doc.id}`} className="btn btn-success btn-sm">
                                                <Download size={14} /> Download PDF
                                            </Link>
                                            <Link to={`/document/${doc.id}`} className="btn btn-ghost btn-sm">
                                                View Details
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default SearchPage;
