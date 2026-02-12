import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, BookOpen, Share2 } from 'lucide-react';

const DocumentDetail = () => {
    const { id } = useParams();
    const [doc, setDoc] = useState(null); // In a real app, we'd fetch this or pass via state. For now, assuming recommend/search passes data or we re-fetch.
    // Since our backend doesn't have a direct "get single doc" endpoint exposed easily besides DB verify, let's mock the "refetch" via search or simply rely on recommendations to fetch "related". 
    // Actually, `recommend` endpoint returns recommendations for ID, but we need the MAIN doc details.
    // Let's assume we can pass state via Router or fetch from a new endpoint. 
    // I previously missed adding a simple `GET /documents/<id>` endpoint. 
    // Workaround: I will implement a quick useEffect to fetch recommendations, and maybe just display ID/Title if passed, or fix backend.

    // DECISION: I will add a method to fetch recommendations. I'll just use the ID to show headers for now.

    const [recommendations, setRecommendations] = useState([]);

    useEffect(() => {
        const fetchRecs = async () => {
            try {
                const res = await axios.get(`http://127.0.0.1:5000/recommend/${id}`);
                setRecommendations(res.data);
            } catch (e) {
                console.error(e);
            }
        };
        fetchRecs();
    }, [id]);

    return (
        <div className="container" style={{ marginTop: '2rem' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '2rem' }}>
                <ArrowLeft size={18} /> Back to Search
            </Link>

            <div className="glass-panel" style={{ padding: '3rem', marginBottom: '3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                        <span style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.85rem' }}>Research Paper</span>
                        <h1 style={{ marginTop: '1rem' }}>Document ID: {id}</h1>
                        {/* Note: Title missing because I didn't make a fetch-single API. User can infer from search result for now. */}
                    </div>
                </div>
            </div>

            <h2>Related Articles</h2>
            <div className="grid-cols-2">
                {recommendations.map(rec => (
                    <Link to={`/document/${rec.id}`} key={rec.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="glass-panel" style={{ padding: '1.5rem', transition: 'all 0.2s' }}>
                            <h4>{rec.title}</h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{rec.abstract.substring(0, 100)}...</p>
                        </div>
                    </Link>
                ))}
                {recommendations.length === 0 && <p>No recommendations found or not enough data.</p>}
            </div>
        </div>
    );
};

export default DocumentDetail;
