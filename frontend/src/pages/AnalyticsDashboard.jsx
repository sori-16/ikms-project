// Created by: Soreti (Team Leader) - Demo Implementation
import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, TrendingUp, Building2, Download, Award } from 'lucide-react';
import './Analytics.css';

function AnalyticsDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get('http://localhost:5000/analytics/summary');
                setStats(response.data);
            } catch (error) {
                console.error('Error fetching analytics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return <div className="loading-state">Generating impact reports...</div>;

    return (
        <div className="container analytics-container">
            <div className="hero-section" style={{ padding: '3rem 2rem' }}>
                <h1 className="hero-title">National Research Impact</h1>
                <p className="hero-subtitle">
                    Visualizing the growth and reach of Ethiopia's intellectual output.
                </p>
            </div>

            {/* Top Level Stats */}
            <div className="stats-grid">
                <div className="glass-panel stat-card">
                    <div className="stat-icon"><Download size={32} /></div>
                    <div className="stat-value">{stats?.total_downloads || 0}</div>
                    <div className="stat-label">Total Downloads</div>
                </div>
                <div className="glass-panel stat-card">
                    <div className="stat-icon"><Building2 size={32} /></div>
                    <div className="stat-value">{stats?.institution_downloads?.length || 0}</div>
                    <div className="stat-label">Active Institutions</div>
                </div>
                <div className="glass-panel stat-card">
                    <div className="stat-icon"><TrendingUp size={32} /></div>
                    <div className="stat-value">+12%</div>
                    <div className="stat-label">Monthly Growth</div>
                </div>
            </div>

            <div className="analytics-grid">
                {/* Most Downloaded Papers */}
                <div className="glass-panel analytics-panel">
                    <h2><Award size={24} /> Top Downloaded Papers</h2>
                    <div className="analytics-list">
                        {stats?.top_documents?.map((doc, index) => (
                            <div key={index} className="list-item">
                                <div className="item-info">
                                    <span className="item-title">{doc.title}</span>
                                    <span className="item-sub">{doc.institution}</span>
                                </div>
                                <div className="item-value">{doc.count} dl</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Downloads by Institution */}
                <div className="glass-panel analytics-panel">
                    <h2><BarChart3 size={24} /> Impact by Institution</h2>
                    <div className="analytics-list">
                        {stats?.institution_downloads?.map((inst, index) => (
                            <div key={index} className="list-item">
                                <div className="item-info">
                                    <span className="item-title">{inst.name}</span>
                                </div>
                                <div className="item-value">{inst.count} total</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AnalyticsDashboard;
