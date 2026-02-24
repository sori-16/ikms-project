import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { BarChart3, TrendingUp, Building2, Download, Award, BookOpen } from 'lucide-react';

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
                    </>
                )}
            </div>
        </div>
    );
}

export default AnalyticsDashboard;
