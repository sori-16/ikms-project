import React, { useState } from 'react';
import axios from 'axios';
import { Search, ArrowRight, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const SearchPage = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        try {
            const res = await axios.get(`http://127.0.0.1:5000/search?q=${query}`);
            setResults(res.data);
            setSearched(true);
        } catch (error) {
            console.error("Search failed", error);
        }
    };

    return (
        <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 style={{ background: 'linear-gradient(to right, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Intelligent Knowledge System
                </h1>
                <p>Search, Analyze, and Discover Medical Research</p>

                <form onSubmit={handleSearch} style={{ maxWidth: '600px', margin: '2rem auto', position: 'relative' }}>
                    <input
                        className="glass-input"
                        placeholder="Search for 'Cardiology', 'Data', etc..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        style={{ paddingLeft: '3rem' }}
                    />
                    <Search color="var(--text-muted)" size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                </form>
            </div>

            {searched && (
                <div>
                    <h3>Found {results.length} Results</h3>
                    <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                        {results.map((doc) => (
                            <Link to={`/document/${doc.id}`} key={doc.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div className="glass-panel" style={{ padding: '1.5rem', height: '100%', transition: 'transform 0.2s', cursor: 'pointer' }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary-hover)' }}>{doc.title}</h4>
                                    <p style={{ fontSize: '0.9rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {doc.abstract}
                                    </p>
                                    <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        <FileText size={14} /> Read More <ArrowRight size={14} />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                    {results.length === 0 && <p style={{ textAlign: 'center', marginTop: '2rem' }}>No documents found trying falling back to titles.</p>}
                </div>
            )}
        </div>
    );
};

export default SearchPage;
