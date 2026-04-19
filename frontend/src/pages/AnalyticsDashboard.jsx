import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { BarChart3, TrendingUp, Building2, Download, Award, BookOpen, Share2, Users } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function AnalyticsDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${API}/analytics/summary`)
            .then(r => setStats(r.data))
            .catch(e => console.error(e))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="page-wrapper">
            <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
                {/* Hero */}
                <div style={{
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                    borderRadius: 'var(--radius-xl)', padding: '3.5rem 2.5rem', textAlign: 'center',
                    color: '#fff', marginBottom: '3rem', position: 'relative', overflow: 'hidden'
                }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 20%, rgba(244,197,66,0.12) 0%, transparent 60%)', pointerEvents: 'none' }} />
                    <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem,4vw,2.75rem)', fontWeight: 800, color: '#fff', marginBottom: '0.75rem', position: 'relative' }}>
                        National Research Impact
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.05rem', maxWidth: '540px', margin: '0 auto', position: 'relative' }}>
                        Visualizing the growth and reach of Ethiopia's intellectual output.
                    </p>
                </div>

                {/* Stats */}
                {loading ? (
                    <div className="loading-state">Generating impact reports</div>
                ) : (
                    <>
                        <div className="dash-stats-grid" style={{ marginBottom: '2rem' }}>
                            <div className="stat-card" style={{ borderTop: '4px solid var(--success)', textAlign: 'center' }}>
                                <Download size={24} color="var(--success)" style={{ marginBottom: '0.5rem', opacity: 0.6 }} />
                                <div className="stat-value">{stats?.total_downloads || 0}</div>
                                <div className="stat-label">Total Downloads</div>
                            </div>
                            <div className="stat-card" style={{ borderTop: '4px solid var(--primary)', textAlign: 'center' }}>
                                <Building2 size={24} color="var(--primary)" style={{ marginBottom: '0.5rem', opacity: 0.6 }} />
                                <div className="stat-value">{stats?.institution_downloads?.length || 0}</div>
                                <div className="stat-label">Active Institutions</div>
                            </div>
                            <div className="stat-card" style={{ borderTop: '4px solid var(--gold-dark)', textAlign: 'center' }}>
                                <BookOpen size={24} color="var(--gold-dark)" style={{ marginBottom: '0.5rem', opacity: 0.6 }} />
                                <div className="stat-value">{stats?.total_documents || 0}</div>
                                <div className="stat-label">Research Papers</div>
                            </div>
                            <div className="stat-card" style={{ borderTop: '4px solid var(--info)', textAlign: 'center' }}>
                                <TrendingUp size={24} color="var(--info)" style={{ marginBottom: '0.5rem', opacity: 0.6 }} />
                                <div className="stat-value">+12%</div>
                                <div className="stat-label">Monthly Growth</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px,1fr))', gap: '1.5rem' }}>
                            {/* Top Downloaded Papers */}
                            <div className="card">
                                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontFamily: 'var(--font-heading)', fontSize: '1.15rem', marginBottom: '1.25rem' }}>
                                    <Award size={20} color="var(--gold-dark)" /> Top Downloaded Papers
                                </h2>
                                {stats?.top_documents?.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {stats.top_documents.map((doc, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.15rem' }}>
                                                        {doc.title?.substring(0, 55)}{doc.title?.length > 55 ? '...' : ''}
                                                    </div>
                                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{doc.institution}</div>
                                                </div>
                                                <span className="badge badge-primary" style={{ flexShrink: 0 }}>{doc.count} dl</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : <div className="empty-state" style={{ padding: '1.5rem' }}>No data yet</div>}
                            </div>

                            {/* Impact by Institution */}
                            <div className="card">
                                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontFamily: 'var(--font-heading)', fontSize: '1.15rem', marginBottom: '1.25rem' }}>
                                    <BarChart3 size={20} color="var(--primary)" /> Impact by Institution
                                </h2>
                                {stats?.institution_downloads?.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {stats.institution_downloads.map((inst, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Building2 size={15} color="var(--primary)" />
                                                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{inst.name}</span>
                                                </div>
                                                <span className="badge badge-approved">{inst.count} total</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : <div className="empty-state" style={{ padding: '1.5rem' }}>No data yet</div>}
                            </div>
                        </div>

                        {/* National Research Heatmap */}
                        <div className="card" style={{ marginTop: '1.5rem' }}>
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontFamily: 'var(--font-heading)', fontSize: '1.15rem', marginBottom: '1.25rem' }}>
                                <Award size={20} color="var(--primary)" /> National Research Topic Heatmap
                            </h2>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                                Which institutions are leading in specific research domains?
                            </p>
                            {stats?.topic_heatmap?.length > 0 ? (
                                <div className="heatmap-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                                    {stats.topic_heatmap.map((item, i) => (
                                        <div key={i} style={{
                                            padding: '1.25rem',
                                            background: 'rgba(var(--primary-rgb), 0.04)',
                                            borderRadius: 'var(--radius-md)',
                                            borderLeft: '4px solid var(--primary)'
                                        }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                {item.institution}
                                            </div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', margin: '0.4rem 0' }}>
                                                {item.top_topic}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                {item.paper_count} papers in this domain
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <div className="empty-state">No topic mapping data available yet.</div>}
                        </div>

                        {/* ── Institutional Collaboration Network (Graph) ── */}
                        <div className="card" style={{ marginTop: '1.5rem', background: 'var(--bg-card)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, right: 0, padding: '1rem' }}>
                                <Share2 size={40} style={{ opacity: 0.05, color: 'var(--primary)' }} />
                            </div>
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontFamily: 'var(--font-heading)', fontSize: '1.15rem', marginBottom: '0.5rem' }}>
                                <Users size={20} color="var(--primary)" /> National Research Collaboration Network
                            </h2>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                                Mapping the flow of co-authorship and knowledge sharing between Ethiopian institutions.
                            </p>

                            <div style={{ position: 'relative', height: '400px', background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {/* SVG Network Graph (Static Simulation) */}
                                <svg width="100%" height="100%" viewBox="0 0 800 400" style={{ maxWidth: '800px' }}>
                                    {/* Connection Lines (Links) */}
                                    <line x1="200" y1="200" x2="600" y2="200" stroke="var(--primary)" strokeWidth="2" strokeDasharray="5,5" opacity="0.3">
                                        <animate attributeName="stroke-dashoffset" from="0" to="100" dur="10s" repeatCount="indefinite" />
                                    </line>
                                    <line x1="200" y1="200" x2="400" y2="100" stroke="var(--gold)" strokeWidth="2" opacity="0.2" />
                                    <line x1="400" y1="100" x2="600" y2="200" stroke="var(--gold)" strokeWidth="2" opacity="0.2" />
                                    <line x1="400" y1="300" x2="200" y2="200" stroke="var(--primary)" strokeWidth="1" opacity="0.1" />
                                    <line x1="400" y1="300" x2="600" y2="200" stroke="var(--primary)" strokeWidth="1" opacity="0.1" />

                                    {/* Nodes (Institutions) */}
                                    <g transform="translate(200, 200)">
                                        <circle r="45" fill="var(--primary)" opacity="0.1" />
                                        <circle r="35" fill="var(--primary)" />
                                        <text y="55" fill="var(--text-primary)" fontSize="12" fontWeight="700" textAnchor="middle">AAU (Addis Ababa)</text>
                                        <text y="5" fill="#fff" fontSize="10" fontWeight="700" textAnchor="middle">HUB</text>
                                    </g>

                                    <g transform="translate(600, 200)">
                                        <circle r="35" fill="var(--primary)" opacity="0.1" />
                                        <circle r="25" fill="var(--primary)" />
                                        <text y="45" fill="var(--text-primary)" fontSize="12" fontWeight="700" textAnchor="middle">Jimma University</text>
                                    </g>

                                    <g transform="translate(400, 100)">
                                        <circle r="30" fill="var(--gold)" opacity="0.1" />
                                        <circle r="20" fill="var(--gold)" />
                                        <text y="-30" fill="var(--text-primary)" fontSize="12" fontWeight="700" textAnchor="middle">Bahir Dar University</text>
                                    </g>

                                    <g transform="translate(400, 300)">
                                        <circle r="30" fill="var(--primary-light)" opacity="0.1" />
                                        <circle r="20" fill="var(--primary-light)" />
                                        <text y="40" fill="var(--text-primary)" fontSize="12" fontWeight="700" textAnchor="middle">Hawassa University</text>
                                    </g>

                                    {/* Pulse Effect on AAU Hub */}
                                    <circle cx="200" cy="200" r="35" fill="none" stroke="var(--primary)" strokeWidth="2">
                                        <animate attributeName="r" from="35" to="60" dur="2s" repeatCount="indefinite" />
                                        <animate attributeName="opacity" from="0.5" to="0" dur="2s" repeatCount="indefinite" />
                                    </circle>
                                </svg>

                                <div style={{ position: 'absolute', bottom: '20px', right: '20px', background: 'rgba(255,255,255,0.9)', padding: '10px 15px', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', border: '1px solid var(--border)' }}>
                                    <strong>Legend:</strong>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }} /> Core Research Node
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--gold)' }} /> Cross-Regional Co-Authorship
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default AnalyticsDashboard;
