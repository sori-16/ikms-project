// Created by: Soreti (Team Leader) - Demo Implementation
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { getAuthHeaders } from '../utils/auth';
import { BookMarked, ArrowRight } from 'lucide-react';

function MyLibrary() {
    const [bookmarks, setBookmarks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookmarks = async () => {
            try {
                const response = await axios.get('http://localhost:5000/bookmarks', {
                    headers: getAuthHeaders()
                });
                setBookmarks(response.data);
            } catch (error) {
                console.error('Error fetching bookmarks:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBookmarks();
    }, []);

    if (loading) return <div className="loading-state">Loading your library...</div>;

    return (
        <div className="container" style={{ paddingTop: '2rem' }}>
            <div className="sidebar-title" style={{ fontSize: '2rem', marginBottom: '2rem' }}>
                <BookMarked size={32} />
                My Library
            </div>

            {bookmarks.length === 0 ? (
                <div className="empty-state">
                    <p>Your library is empty.</p>
                    <p className="text-small">Papers you bookmark will appear here for easy access.</p>
                    <Link to="/search" className="btn-primary-small" style={{ display: 'inline-block', marginTop: '1rem' }}>
                        Browse Research
                    </Link>
                </div>
            ) : (
                <div className="documents-grid">
                    {bookmarks.map((doc) => (
                        <div key={doc.id} className="doc-card-enhanced">
                            <Link to={`/document/${doc.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <h3>{doc.title}</h3>
                                    <ArrowRight size={20} className="accent-text" />
                                </div>
                                <p className="abstract" style={{ marginBottom: '1rem' }}>{doc.abstract}</p>
                                <div className="text-small" style={{ color: 'var(--text-secondary)' }}>
                                    Saved on: {new Date(doc.saved_at).toLocaleDateString()}
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MyLibrary;
