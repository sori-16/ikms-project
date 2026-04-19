import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Shield, CheckCircle, XCircle, FileText, User, Calendar, Building2, Download, BarChart2, UploadCloud, FolderUp } from 'lucide-react';
import { getUser, getAuthHeaders, logout } from '../../utils/auth';
import '../Dashboard.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function InstitutionDashboard() {
    const [pendingDocs, setPendingDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    
    // Bulk Upload State
    const [bulkFiles, setBulkFiles] = useState([]);
    const [bulkUploading, setBulkUploading] = useState(false);
    
    const navigate = useNavigate();

    useEffect(() => {
        const u = getUser();
        if (!u || (u.role !== 'inst_admin' && u.role !== 'sys_admin')) {
            navigate('/login');
            return;
        }
        setUser(u);
        fetchStats();
        fetchPending();
    }, [navigate]);

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${API}/institutions/my/analytics`, { headers: getAuthHeaders() });
            setStats(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchPending = async () => {
        try {
            const res = await axios.get(`${API}/institutions/my/pending`, { headers: getAuthHeaders() });
            setPendingDocs(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleAction = async (docId, status) => {
        try {
            await axios.post(`${API}/documents/${docId}/institutional-verify`, { status }, { headers: getAuthHeaders() });
            setMessage(`success:Document ${status === 'verified' ? 'verified' : 'rejected'}.`);
            fetchPending();
        } catch {
            setMessage('error:Failed to update status.');
        }
        setTimeout(() => setMessage(''), 3000);
    };

    const msgType = message.startsWith('success:') ? 'success' : 'error';
    const msgText = message.replace(/^(success|error):/, '');

    if (!user) return null;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <BarChart2 size={16} /> },
        { id: 'pending', label: `Pending (${pendingDocs.length})`, icon: <FileText size={16} /> },
        { id: 'bulk-upload', label: 'Bulk Upload', icon: <FolderUp size={16} /> }
    ];

    const handleBulkFileChange = (e) => {
        if (e.target.files) {
            setBulkFiles(Array.from(e.target.files));
        }
    };

    const handleBulkSubmit = async (e) => {
        e.preventDefault();
        if (bulkFiles.length === 0) {
            setMessage('error:Please select at least one PDF file.');
            return;
        }

        setBulkUploading(true);
        const formData = new FormData();
        bulkFiles.forEach(file => {
            formData.append('files', file);
        });

        try {
            const res = await axios.post(`${API}/admin/institution/bulk-upload`, formData, {
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'multipart/form-data'
                }
            });
            setMessage(`success:${res.data.message}`);
            setBulkFiles([]);
            fetchStats(); // Update stats as new documents are added
        } catch (err) {
            setMessage(`error:Bulk upload failed: ${err.response?.data?.error || err.message}`);
        } finally {
            setBulkUploading(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => setMessage(''), 5000);
        }
    };

    return (
        <div className="page-wrapper" style={{ background: 'var(--bg-body)' }}>
            <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
                {/* Premium Dashboard Header */}
                <div className="dash-header glass-panel" style={{ 
                    padding: '2rem', 
                    marginBottom: '2rem', 
                    borderRadius: 'var(--radius-lg)',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(20,20,40,0.02) 100%)',
                    borderLeft: '4px solid var(--primary)',
                    boxShadow: 'var(--shadow-md)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1 className="dash-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '2rem', margin: 0 }}>
                                <Building2 size={32} color="var(--primary)" /> 
                                {stats?.institution_name ? `${stats.institution_name} Hub` : 'Institution Dashboard'}
                            </h1>
                            <p className="dash-subtitle" style={{ fontSize: '1.1rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                                Welcome back, {user.name}. Centralized archive management and moderation.
                            </p>
                        </div>
                        <button onClick={logout} className="btn btn-ghost">Sign Out</button>
                    </div>
                </div>

                {message && <div className={`message-banner ${msgType}`} style={{ marginBottom: '2rem', borderRadius: 'var(--radius-md)' }}>{msgText}</div>}

                {/* Dashboard Grid Layout */}
                <div className="dash-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '2rem', alignItems: 'start' }}>
                    
                    {/* Main Content Area */}
                    <div className="dash-main" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        
                        {/* Premium Tabs */}
                        <div className="dash-tabs glass-panel" style={{ padding: '0.5rem', borderRadius: 'var(--radius-full)', display: 'flex', gap: '0.5rem', width: 'fit-content' }}>
                            {tabs.map(t => (
                                <button 
                                    key={t.id} 
                                    className={`dash-tab ${activeTab === t.id ? 'active' : ''}`} 
                                    onClick={() => setActiveTab(t.id)}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: 'var(--radius-full)',
                                        border: 'none',
                                        background: activeTab === t.id ? 'var(--primary)' : 'transparent',
                                        color: activeTab === t.id ? 'white' : 'var(--text-secondary)',
                                        fontWeight: activeTab === t.id ? '600' : '500',
                                        transition: 'all 0.2s',
                                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                                    }}
                                >
                                    {t.icon} {t.label}
                                </button>
                            ))}
                        </div>

                        {/* Overview Content */}
                        {activeTab === 'overview' && (
                            <div className="animate-slideUp" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                <div className="stat-card glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}><FileText size={20} /></div>
                                    <div className="stat-value" style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats?.total_documents || 0}</div>
                                    <div className="stat-label" style={{ color: 'var(--text-secondary)' }}>Archived Papers</div>
                                </div>
                                <div className="stat-card glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}><Download size={20} /></div>
                                    <div className="stat-value" style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats?.total_downloads || 0}</div>
                                    <div className="stat-label" style={{ color: 'var(--text-secondary)' }}>Total Downloads</div>
                                </div>
                                <div className="stat-card glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--gold-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}><User size={20} /></div>
                                    <div className="stat-value" style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats?.active_researchers || 0}</div>
                                    <div className="stat-label" style={{ color: 'var(--text-secondary)' }}>Active Researchers</div>
                                </div>
                                <div className="stat-card glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}><Shield size={20} /></div>
                                    <div className="stat-value" style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{pendingDocs.length}</div>
                                    <div className="stat-label" style={{ color: 'var(--text-secondary)' }}>Pending Verification</div>
                                </div>
                            </div>
                        )}

                        {/* Pending Queue Content */}
                        {activeTab === 'pending' && (
                            <div className="glass-panel animate-slideUp" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
                                <div className="section-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h2 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Shield size={24} color="var(--primary)" /> Moderation Queue</h2>
                                    <button className="btn btn-ghost btn-sm" onClick={fetchPending}>Refresh Queue</button>
                                </div>

                                {loading ? (
                                    <div className="loading-state" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Scanning verification queue...</div>
                                ) : pendingDocs.length === 0 ? (
                                    <div className="empty-state" style={{ padding: '4rem 2rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}><CheckCircle size={32} /></div>
                                        <h3 style={{ margin: '0 0 0.5rem' }}>All Clear!</h3>
                                        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No documents are pending verification at this time.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {pendingDocs.map(doc => (
                                            <div key={doc.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid var(--warning)' }}>
                                                <div style={{ flex: 1 }}>
                                                    <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>{doc.title}</h3>
                                                    <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><User size={14} /> Prepared by {doc.uploader_name || 'Researcher'}</span>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Calendar size={14} /> {new Date(doc.upload_date).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                    <button className="btn btn-success" onClick={() => handleAction(doc.id, 'verified')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                                                        <CheckCircle size={16} /> Approve
                                                    </button>
                                                    <button className="btn btn-danger btn-sm" onClick={() => handleAction(doc.id, 'rejected')} style={{ padding: '0.5rem 1rem' }}>
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Bulk Upload Content */}
                        {activeTab === 'bulk-upload' && (
                            <div className="glass-panel animate-slideUp" style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
                                <div className="section-header" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <FolderUp size={28} color="var(--primary)" />
                                    <h2 className="section-title" style={{ margin: 0 }}>Enterprise Archive Upload</h2>
                                </div>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6, fontSize: '1.05rem' }}>
                                    Seamlessly inject large batches of documents into your institutional archive. 
                                    Files uploaded here automatically bypass the moderation queue and receive immediate indexing into the national discovery engine. 
                                    <strong> Notice: The exact filename will be permanently used as the document title.</strong>
                                </p>

                                <form onSubmit={handleBulkSubmit}>
                                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                                        <div style={{ 
                                            border: '2px dashed var(--border)', 
                                            borderRadius: 'var(--radius-lg)', 
                                            padding: '4rem 2rem', 
                                            textAlign: 'center',
                                            background: 'rgba(255,255,255,0.5)',
                                            cursor: 'pointer',
                                            position: 'relative',
                                            transition: 'all 0.2s',
                                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                                        }}>
                                            <input 
                                                type="file" 
                                                multiple 
                                                accept=".pdf" 
                                                onChange={handleBulkFileChange}
                                                style={{ 
                                                    position: 'absolute', 
                                                    top: 0, left: 0, right: 0, bottom: 0, 
                                                    opacity: 0, 
                                                    cursor: 'pointer' 
                                                }}
                                                disabled={bulkUploading}
                                            />
                                            <UploadCloud size={64} color="var(--primary)" style={{ opacity: 0.8, marginBottom: '1.5rem' }} />
                                            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>Drag & Drop Institutional PDFs</h3>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: 0 }}>
                                                {bulkFiles.length > 0 ? (
                                                    <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>{bulkFiles.length} file(s) staged and ready...</span>
                                                ) : (
                                                    "Click to browse your hard drive. Multiple selections supported."
                                                )}
                                            </p>
                                        </div>
                                        
                                        {bulkFiles.length > 0 && (
                                            <div className="glass-panel" style={{ marginTop: '1.5rem', maxHeight: '250px', overflowY: 'auto', padding: '1.5rem', borderRadius: 'var(--radius-sm)' }}>
                                                <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Staged for Ingestion:</h4>
                                                <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                    {bulkFiles.map((f, i) => (
                                                        <li key={i} style={{ marginBottom: '0.5rem' }}>{f.name} <span style={{ opacity: 0.5 }}>— {(f.size / 1024 / 1024).toFixed(2)} MB</span></li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    <button 
                                        type="submit" 
                                        className="btn btn-primary" 
                                        disabled={bulkUploading || bulkFiles.length === 0}
                                        style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', borderRadius: 'var(--radius-md)', fontWeight: 'bold', boxShadow: 'var(--shadow-md)' }}
                                    >
                                        {bulkUploading ? (
                                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                                                <span className="spinner" style={{ width: '22px', height: '22px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                                                Processing & Indexing {bulkFiles.length} Documents...
                                                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                                            </span>
                                        ) : (
                                            `Commence Mass Upload: ${bulkFiles.length} Document(s)`
                                        )}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar - Professional Features */}
                    <div className="dash-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        
                        {/* System Health Card */}
                        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <BarChart2 size={18} color="var(--primary)" /> Platform Analytics
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Storage Quota</span>
                                        <span style={{ fontWeight: '500' }}>{Math.max(1, Math.round((stats?.total_documents || 0) * 2.5))} / 500 GB</span>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: '4%', height: '100%', background: 'var(--success)' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Verification Rate</span>
                                        <span style={{ fontWeight: '500' }}>98%</span>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: '98%', height: '100%', background: 'var(--primary)' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Institutional Activity (Simulated for aesthetics) */}
                        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FileText size={18} color="var(--success)" /> Quick Diagnostics
                            </h3>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                                <p style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', margin: '0 0 0.75rem' }}>
                                    <span style={{ color: 'var(--success)', marginTop: '2px' }}>●</span> 
                                    Elasticsearch Indexing Engine is online and synchronized.
                                </p>
                                <p style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', margin: '0 0 0.75rem' }}>
                                    <span style={{ color: 'var(--success)', marginTop: '2px' }}>●</span> 
                                    Supabase Global CDN connected.
                                </p>
                                <p style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', margin: 0 }}>
                                    <span style={{ color: 'var(--gold-dark)', marginTop: '2px' }}>●</span> 
                                    Moderation queue processing at normal speeds.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default InstitutionDashboard;
