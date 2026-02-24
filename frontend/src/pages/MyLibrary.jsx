import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { getAuthHeaders, isAuthenticated } from '../utils/auth';
import { BookMarked, ArrowRight, Calendar, Trash2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function MyLibrary() {
    const [bookmarks, setBookmarks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated()) { setLoading(false); return; }
        axios.get(`${API}/bookmarks`, { headers: getAuthHeaders() })
            .then(r => setBookmarks(r.data))
            .catch(e => console.error(e))
            .finally(() => setLoading(false));
    }, []);

    const removeBookmark = async (docId) => {
        try {
            await axios.delete(`${API}/bookmarks/${docId}`, { headers: getAuthHeaders() });
            setBookmarks(bookmarks.filter(b => b.id !== docId));
        } catch (e) { console.error(e); }
    };

    return (
        <div className="page-wrapper">
            <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
                <div className="section-header" style={{ marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontFamily: 'var(--font-heading)', fontWeight: 800 }}>
                            <BookMarked size={28} color="var(--primary)" /> My Library
                        </h1>
                        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            Papers you've saved for later reading
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-state">Loading your library</div>
                ) : !isAuthenticated() ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🔒</div>
                        Please <Link to="/login" style={{ color: 'var(--primary)' }}>login</Link> to view your saved research.
                    </div>
                ) : bookmarks.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📚</div>
                        <p style={{ marginBottom: '1rem' }}>Your library is empty. Papers you bookmark will appear here.</p>
                        <Link to="/" className="btn btn-primary btn-sm">Browse Research</Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {bookmarks.map(doc => (
                            <div
                                key={doc.id}
                                className="card"
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.5rem' }}
                            >
                                <div style={{ flex: 1 }}>
                                    <Link to={`/document/${doc.id}`} style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--primary)', fontSize: '1rem', display: 'block', marginBottom: '0.35rem', textDecoration: 'none' }}>
                                        {doc.title}
                                    </Link>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '0.5rem' }}>
                                        {doc.abstract}
                                    </p>
                                    {doc.saved_at && (
                                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <Calendar size={12} /> Saved {new Date(doc.saved_at).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                    <Link to={`/document/${doc.id}`} className="btn btn-primary btn-sm">
                                        <ArrowRight size={14} /> View
                                    </Link>
                                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => removeBookmark(doc.id)} title="Remove">
                                        <Trash2 size={15} color="var(--danger)" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MyLibrary;
