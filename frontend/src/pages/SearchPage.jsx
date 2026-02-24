/**
 * IKMS Frontend - Search & Discovery Page
 * Created by: Soreti (Team Leader)
 * DO NOT MODIFY WITHOUT PERMISSION
 * 
 * This file contains:
 * - Search bar with advanced filters
 * - Elasticsearch-powered publication discovery
 * - Institution and Year based filtering
 */
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, RefreshCw, Calendar, Building2, BookOpen, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Search.css';

function SearchPage() {
    // State
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [institutions, setInstitutions] = useState([]);

    // State for initial landing page content
    const [hasSearched, setHasSearched] = useState(false);
    const [latestResearch, setLatestResearch] = useState([]);

    // Fetch institutions and latest research on component mount
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Fetch institutions
                const instResponse = await axios.get(`${import.meta.env.VITE_API_URL}/institutions`);
                setInstitutions(instResponse.data);

                // Fetch latest research for landing page
                const latestResponse = await axios.get(`${import.meta.env.VITE_API_URL}/latest-research`);
                setLatestResearch(latestResponse.data);
            } catch (error) {
                console.error('Failed to fetch initial data:', error);
            }
        };
        fetchInitialData();
    }, []);

    // Placeholder for handleSearch function, assuming it will be implemented later
    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setHasSearched(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/search`, {
                params: {
                    q: query,
                    institution_id: selectedInst,
                    year: selectedYear
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
        setResults([]);
    };

    return (
        <div className="container">
            {/* Hero Section - Dynamic Height */}
            <div className={`hero-section ${hasSearched ? 'hero-compact' : ''}`}>
                <h1 className="hero-title">
                    {hasSearched ? 'IKMS National Portal' : 'Institutional Knowledge Management System'}
                </h1>

                {!hasSearched && (
                    <div className="amharic-title-hero"> የኢትዮጵያ ብሄራዊ የእውቀት እና የመረጃ አያያዝ ስርዓት </div>
                )}

                <p className="hero-subtitle">
                    Search, Analyze, and Discover Knowledge from Ethiopia's Top Research Institutions.
                </p>

                {/* Search Bar in Hero */}
                <form onSubmit={handleSearch} className="search-bar-container" style={{ maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
                    <Search className="search-icon-inside" size={20} style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                    <input
                        type="text"
                        placeholder="Search for research topics..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="search-input"
                        style={{ width: '100%', padding: '1.25rem 1.25rem 1.25rem 3.5rem', borderRadius: '50px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '1.1rem', background: 'rgba(0,0,0,0.3)', color: 'white' }}
                    />
                    <button type="submit" className="search-button" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'var(--accent-primary)', border: 'none', color: 'white', padding: '0.6rem 1.5rem', borderRadius: '30px', cursor: 'pointer', fontWeight: '600' }}>
                        Search
                    </button>
                </form>

                <div className="trending-container">
                    <span className="trending-label">Trending:</span>
                    <button onClick={() => setQuery('AI in Healthcare')} className="trending-tag">#AI-Health</button>
                    <button onClick={() => setQuery('Sustainable Agriculture')} className="trending-tag">#SustainableAgri</button>
                    <button onClick={() => setQuery('Ethereum Blockchain')} className="trending-tag">#Blockchain</button>
                    <button onClick={() => setQuery('Public Health Policy')} className="trending-tag">#PublicHealth</button>
                </div>

                {!hasSearched && (
                    <div className="hero-stats">
                        <div className="stat-item">
                            <span className="stat-value">150+</span>
                            <span className="stat-label">Papers</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{institutions.length}</span>
                            <span className="stat-label">Institutions</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Landing Only: Latest Research Section */}
            {!hasSearched && (
                <div className="featured-research-area">
                    <h2 className="section-title">Latest Research Publications</h2>
                    <div className="featured-grid">
                        {latestResearch.map(doc => (
                            <div key={doc.id} className="doc-card-enhanced featured-card">
                                <Link to={`/document/${doc.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <h3>{doc.title}</h3>
                                    <p className="abstract-short">{doc.abstract?.substring(0, 150)}...</p>
                                    <div className="card-footer">
                                        <span className="inst-badge">{institutions.find(i => i.id === doc.institution_id)?.name || 'JU-CBMP'}</span>
                                        <span className="view-more">View Full Text →</span>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                    <div className="center-actions">
                        <button className="btn-secondary" onClick={() => setHasSearched(true)}>
                            <BookOpen size={18} /> Browse All Publications
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content Area - Only if searched or browsing */}
            {hasSearched && (
                <div className="search-layout animate-in">

                    {/* Sidebar Filters */}
                    <div className="search-sidebar">
                        <div className="sidebar-title">
                            <Filter size={18} />
                            Filters
                        </div>

                        <div className="filter-group">
                            <label className="filter-label">Institution</label>
                            <select
                                className="filter-select"
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
                            <label className="filter-label">Publication Year</label>
                            <select
                                className="filter-select"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                            >
                                <option value="">All Years</option>
                                {/* Hardcoded years for demo */}
                                <option value="2026">2026</option>
                                <option value="2025">2025</option>
                                <option value="2024">2024</option>
                                <option value="2023">2023</option>
                            </select>
                        </div>

                        {(query || selectedInst || selectedYear) && (
                            <button onClick={resetFilters} className="reset-filters">
                                <RefreshCw size={14} />
                                Reset Filters
                            </button>
                        )}
                    </div>

                    {/* Results List */}
                    <div className="results-area">
                        <div className="results-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="results-count">
                                Found <span>{results.length}</span> Results
                            </div>
                            {results.length > 0 && query && (
                                <button
                                    onClick={async () => {
                                        try {
                                            const { getAuthHeaders } = await import('../utils/auth');
                                            await axios.post(`${import.meta.env.VITE_API_URL}/saved-searches`, { query }, {
                                                headers: getAuthHeaders()
                                            });
                                            alert('Search query saved! Check your dashboard for alerts.');
                                        } catch (err) {
                                            alert('Failed to save search. Make sure you are logged in.');
                                        }
                                    }}
                                    className="btn-secondary-small"
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem' }}
                                >
                                    <Bell size={14} /> Save Search & Get Alerts
                                </button>
                            )}
                        </div>

                        {loading ? (
                            <div className="loading-state">Searching...</div>
                        ) : (
                            <div>
                                {results.length === 0 ? (
                                    <div className="empty-state" style={{ border: 'none', background: 'transparent' }}>
                                        {query || selectedInst || selectedYear ? 'No documents found.' : 'Start searching knowledge.'}
                                    </div>
                                ) : (
                                    results.map((doc) => (
                                        <div key={doc.id} className="doc-card-enhanced">
                                            <Link to={`/document/${doc.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                <h3>{doc.title}</h3>
                                                <p className="abstract">{doc.abstract}</p>

                                                <div className="tag-container" style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                                                    {doc.upload_date && (
                                                        <span className="tag tag-year">
                                                            <Calendar size={12} />
                                                            {new Date(doc.upload_date).getFullYear()}
                                                        </span>
                                                    )}
                                                    {doc.institution_id && (
                                                        <span className="tag tag-inst">
                                                            <Building2 size={12} />
                                                            {institutions.find(i => i.id === doc.institution_id)?.name || 'Institution'}
                                                        </span>
                                                    )}

                                                    {/* Author Links */}
                                                    {doc.authors && doc.authors.map(auth => (
                                                        <Link
                                                            key={auth.id}
                                                            to={`/author/${auth.id}`}
                                                            className="tag tag-author"
                                                            onClick={(e) => e.stopPropagation()} // Prevent card click
                                                            style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                        >
                                                            <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>👤 {auth.name}</span>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </Link>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default SearchPage;

