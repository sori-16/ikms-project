import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Shield, CheckCircle, XCircle, FileText, User, Calendar,
    Building2, Download, BarChart2, UploadCloud, FolderUp,
    Users, Edit3, BookOpen, Clock, CheckSquare, AlertCircle
} from 'lucide-react';
import { getUser, getAuthHeaders } from '../../utils/auth';
import '../Dashboard.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const STATUS_COLORS = {
    approved: { bg: 'rgba(16,185,129,0.1)', color: 'var(--success)', label: 'Approved' },
    pending:  { bg: 'rgba(245,158,11,0.1)',  color: 'var(--gold-dark)', label: 'Pending' },
    rejected: { bg: 'rgba(239,68,68,0.1)',   color: 'var(--danger)',  label: 'Rejected' },
};

function StatusBadge({ status }) {
    const s = STATUS_COLORS[status] || STATUS_COLORS.pending;
    return (
        <span style={{
            background: s.bg, color: s.color, padding: '0.2rem 0.7rem',
            borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600
        }}>{s.label}</span>
    );
}

function InstitutionDashboard() {
    const [pendingDocs, setPendingDocs]   = useState([]);
    const [allDocs,     setAllDocs]       = useState([]);
    const [members,     setMembers]       = useState([]);
    const [affReqs,     setAffReqs]       = useState([]);
    const [profile,     setProfile]       = useState(null);
    const [stats,       setStats]         = useState(null);
    const [user,        setUser]          = useState(null);
    const [loading,     setLoading]       = useState(true);
    const [message,     setMessage]       = useState('');
    const [activeTab,   setActiveTab]     = useState('overview');

    // Edit profile state
    const [editDesc,    setEditDesc]      = useState('');
    const [editLoc,     setEditLoc]       = useState('');
    const [editWeb,     setEditWeb]       = useState('');
    const [logoUploading, setLogoUploading] = useState(false);
    const [saving,      setSaving]        = useState(false);

    // Bulk upload state
    const [bulkFiles,      setBulkFiles]     = useState([]);
    const [bulkUploading,  setBulkUploading] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const u = getUser();
        if (!u || (u.role !== 'inst_admin' && u.role !== 'sys_admin')) {
            navigate('/login'); return;
        }
        setUser(u);
        loadAll();
    }, [navigate]);

    const loadAll = async () => {
        setLoading(true);
        await Promise.allSettled([
            fetchStats(), fetchPending(), fetchAllDocs(),
            fetchMembers(), fetchAffRequests(), fetchProfile()
        ]);
        setLoading(false);
    };

    const fetchStats   = async () => { try { const r = await axios.get(`${API}/institutions/my/analytics`, { headers: getAuthHeaders() }); setStats(r.data); } catch {} };
    const fetchPending = async () => { try { const r = await axios.get(`${API}/institutions/my/pending`, { headers: getAuthHeaders() }); setPendingDocs(r.data); } catch {} };
    const fetchAllDocs = async () => { try { const r = await axios.get(`${API}/institutions/my/documents`, { headers: getAuthHeaders() }); setAllDocs(r.data); } catch {} };
    const fetchMembers = async () => { try { const r = await axios.get(`${API}/institutions/my/members`, { headers: getAuthHeaders() }); setMembers(r.data); } catch {} };
    const fetchAffRequests = async () => { try { const r = await axios.get(`${API}/institutions/my/affiliation-requests`, { headers: getAuthHeaders() }); setAffReqs(r.data); } catch {} };
    const fetchProfile = async () => {
        try {
            const r = await axios.get(`${API}/institutions/my/profile`, { headers: getAuthHeaders() });
            setProfile(r.data);
            setEditDesc(r.data.description || '');
            setEditLoc(r.data.location || '');
            setEditWeb(r.data.website || '');
        } catch {}
    };

    const handleDocAction = async (docId, status) => {
        try {
            await axios.post(`${API}/documents/${docId}/institutional-verify`, { status }, { headers: getAuthHeaders() });
            showMsg(`success:Document ${status === 'verified' ? 'approved' : 'rejected'}.`);
            fetchPending(); fetchAllDocs(); fetchStats();
        } catch { showMsg('error:Failed to update status.'); }
    };

    const handleAffAction = async (reqId, action) => {
        try {
            await axios.post(`${API}/institutions/my/affiliation-requests/${reqId}/${action}`, {}, { headers: getAuthHeaders() });
            showMsg(`success:Request ${action}d successfully.`);
            fetchAffRequests(); fetchMembers();
        } catch { showMsg(`error:Failed to ${action} request.`); }
    };

    const handleProfileSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await axios.put(`${API}/institutions/my/profile`, {
                description: editDesc, location: editLoc, website: editWeb
            }, { headers: getAuthHeaders() });
            showMsg('success:Profile updated successfully!');
            fetchProfile();
        } catch { showMsg('error:Failed to update profile.'); }
        setSaving(false);
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLogoUploading(true);
        const fd = new FormData();
        fd.append('logo', file);
        try {
            const r = await axios.post(`${API}/institutions/my/logo`, fd, {
                headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' }
            });
            showMsg('success:Logo uploaded!');
            setProfile(prev => prev ? { ...prev, logo_path: r.data.logo_path } : prev);
        } catch (err) {
            showMsg('error:Logo upload failed: ' + (err.response?.data?.error || err.message));
        }
        setLogoUploading(false);
    };

    const handleBulkSubmit = async (e) => {
        e.preventDefault();
        if (!bulkFiles.length) { showMsg('error:Please select at least one PDF.'); return; }
        setBulkUploading(true);
        const fd = new FormData();
        bulkFiles.forEach(f => fd.append('files', f));
        try {
            const r = await axios.post(`${API}/admin/institution/bulk-upload`, fd, {
                headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' }
            });
            showMsg(`success:${r.data.message}`);
            setBulkFiles([]);
            fetchStats(); fetchAllDocs();
        } catch (err) {
            showMsg(`error:Bulk upload failed: ${err.response?.data?.error || err.message}`);
        }
        setBulkUploading(false);
    };

    const showMsg = (m) => { setMessage(m); setTimeout(() => setMessage(''), 5000); };
    const msgType = message.startsWith('success:') ? 'success' : 'error';
    const msgText = message.replace(/^(success|error):/, '');

    if (!user) return null;

    const instName = stats?.institution_name || profile?.name || 'Institution';

    const tabs = [
        { id: 'overview',      label: 'Overview',          icon: <BarChart2 size={16} /> },
        { id: 'publications',  label: `Publications (${allDocs.length})`, icon: <BookOpen size={16} /> },
        { id: 'pending',       label: `Pending (${pendingDocs.length})`,  icon: <Clock size={16} /> },
        { id: 'members',       label: `Members (${members.length})`,      icon: <Users size={16} /> },
        { id: 'affiliations',  label: `Join Requests (${affReqs.length})`,icon: <CheckSquare size={16} /> },
        { id: 'bulk-upload',   label: 'Bulk Upload',       icon: <FolderUp size={16} /> },
        { id: 'edit-profile',  label: 'Edit Profile',      icon: <Edit3 size={16} /> },
    ];

    const SidebarCards = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Quick Stats Sidebar */}
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BarChart2 size={17} color="var(--primary)" /> Platform Analytics
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[
                        { label: 'Storage Quota', val: `${Math.max(1, (stats?.total_documents||0)*2)} / 500 GB`, pct: '2%', color: 'var(--success)' },
                        { label: 'Verification Rate', val: '98%', pct: '98%', color: 'var(--primary)' },
                    ].map(bar => (
                        <div key={bar.label}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                                <span style={{ color: 'var(--text-secondary)' }}>{bar.label}</span>
                                <span style={{ fontWeight: 600 }}>{bar.val}</span>
                            </div>
                            <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ width: bar.pct, height: '100%', background: bar.color }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {/* Quick Diagnostics */}
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={17} color="var(--success)" /> Quick Diagnostics
                </h3>
                {[
                    { dot: 'var(--success)', text: 'Elasticsearch synced.' },
                    { dot: 'var(--success)', text: 'Supabase CDN connected.' },
                    { dot: 'var(--gold-dark)', text: 'Queue processing normally.' },
                ].map(d => (
                    <p key={d.text} style={{ display: 'flex', gap: '0.5rem', margin: '0 0 0.6rem', fontSize: '0.87rem', color: 'var(--text-secondary)' }}>
                        <span style={{ color: d.dot, marginTop: 3 }}>●</span> {d.text}
                    </p>
                ))}
            </div>
            {/* Institution Profile preview */}
            {profile && (
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                    <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Building2 size={17} color="var(--primary)" /> {instName}
                    </h3>
                    {profile.description && <p style={{ fontSize: '0.87rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem' }}>{profile.description}</p>}
                    {profile.location && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>📍 {profile.location}</p>}
                    {profile.website && <a href={profile.website} target="_blank" rel="noreferrer" style={{ fontSize: '0.82rem', color: 'var(--primary)', display: 'block', marginTop: 4 }}>🔗 Website</a>}
                </div>
            )}
        </div>
    );

    return (
        <div className="page-wrapper" style={{ background: 'var(--bg-body)' }}>
            <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
                {/* Header — no Sign Out button since sidebar already has Logout */}
                <div className="glass-panel" style={{
                    padding: '1.75rem 2rem', marginBottom: '2rem', borderRadius: 'var(--radius-lg)',
                    borderLeft: '4px solid var(--primary)', boxShadow: 'var(--shadow-md)'
                }}>
                    <h1 className="dash-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.9rem', margin: 0 }}>
                        <Building2 size={30} color="var(--primary)" />
                        {instName} Hub
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem', fontSize: '1.05rem' }}>
                        Welcome back, <strong>{user.name}</strong>. Centralized archive management &amp; moderation.
                    </p>
                </div>

                {message && <div className={`message-banner ${msgType}`} style={{ marginBottom: '1.5rem', borderRadius: 'var(--radius-md)' }}>{msgText}</div>}

                {/* Two-column grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '2rem', alignItems: 'start' }}>

                    {/* ── LEFT MAIN ────────────────────────────────────── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        {/* Pill Tabs — scrollable on small screens */}
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {tabs.map(t => (
                                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                    padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer',
                                    background: activeTab === t.id ? 'var(--primary)' : 'var(--bg-secondary)',
                                    color: activeTab === t.id ? 'white' : 'var(--text-secondary)',
                                    fontWeight: activeTab === t.id ? 700 : 500, fontSize: '0.88rem', transition: 'all 0.2s'
                                }}>
                                    {t.icon} {t.label}
                                </button>
                            ))}
                        </div>

                        {/* ── OVERVIEW TAB ── */}
                        {activeTab === 'overview' && (
                            <div className="animate-slideUp" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1.25rem' }}>
                                {[
                                    { icon: <FileText size={20} />, color: 'rgba(37,99,235,0.1)', accent: 'var(--primary)', val: stats?.total_documents || 0, label: 'Archived Papers' },
                                    { icon: <Download size={20} />, color: 'rgba(16,185,129,0.1)', accent: 'var(--success)', val: stats?.total_downloads || 0, label: 'Total Downloads' },
                                    { icon: <User size={20} />, color: 'rgba(245,158,11,0.1)', accent: 'var(--gold-dark)', val: stats?.active_researchers || 0, label: 'Active Researchers' },
                                    { icon: <Clock size={20} />, color: 'rgba(239,68,68,0.1)', accent: 'var(--danger)',  val: pendingDocs.length, label: 'Pending Verification' },
                                    { icon: <Users size={20} />, color: 'rgba(139,92,246,0.1)', accent: '#7c3aed', val: members.length, label: 'Total Members' },
                                    { icon: <AlertCircle size={20}/>, color: 'rgba(245,158,11,0.1)', accent: 'var(--gold-dark)', val: affReqs.length, label: 'Join Requests' },
                                ].map(c => (
                                    <div key={c.label} className="glass-panel" style={{ padding: '1.4rem', borderRadius: 'var(--radius-lg)' }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 8, background: c.color, color: c.accent, display:'flex', alignItems:'center', justifyContent:'center', marginBottom: '0.9rem' }}>{c.icon}</div>
                                        <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>{c.val}</div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 2 }}>{c.label}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── PUBLICATIONS TAB ── */}
                        {activeTab === 'publications' && (
                            <div className="glass-panel animate-slideUp" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
                                <h2 style={{ margin: '0 0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <BookOpen size={22} color="var(--primary)" /> All Publications
                                </h2>
                                {loading ? <div className="loading-state">Loading publications…</div>
                                : allDocs.length === 0 ? (
                                    <div className="empty-state" style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                                        <FileText size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                        <p>No publications found yet. Use Bulk Upload to add documents.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                        {allDocs.map(doc => (
                                            <div key={doc.id} className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 600, marginBottom: '0.3rem' }}>{doc.title}</div>
                                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                                                        <span><Calendar size={12} style={{ marginRight: 4 }} />{doc.upload_date ? new Date(doc.upload_date).toLocaleDateString() : 'N/A'}</span>
                                                        <span><Download size={12} style={{ marginRight: 4 }} />{doc.download_count || 0} downloads</span>
                                                    </div>
                                                </div>
                                                <StatusBadge status={doc.status} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── PENDING TAB ── */}
                        {activeTab === 'pending' && (
                            <div className="glass-panel animate-slideUp" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
                                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}><Shield size={22} color="var(--primary)" /> Moderation Queue</h2>
                                    <button className="btn btn-ghost btn-sm" onClick={fetchPending}>Refresh</button>
                                </div>
                                {loading ? <div className="loading-state">Scanning queue…</div>
                                : pendingDocs.length === 0 ? (
                                    <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                                        <CheckCircle size={48} color="var(--success)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
                                        <h3 style={{ margin: '0 0 0.5rem' }}>All Clear!</h3>
                                        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No documents pending verification.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {pendingDocs.map(doc => (
                                            <div key={doc.id} className="glass-panel" style={{ padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid var(--warning)' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 600 }}>{doc.title}</div>
                                                    <div style={{ display: 'flex', gap: '1.2rem', fontSize: '0.83rem', color: 'var(--text-secondary)', marginTop: 6 }}>
                                                        <span><User size={12} style={{ marginRight: 4 }} />{doc.uploader_name || 'Researcher'}</span>
                                                        <span><Calendar size={12} style={{ marginRight: 4 }} />{doc.upload_date ? new Date(doc.upload_date).toLocaleDateString() : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.6rem' }}>
                                                    <button className="btn btn-success" onClick={() => handleDocAction(doc.id, 'verified')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1rem' }}>
                                                        <CheckCircle size={15} /> Approve
                                                    </button>
                                                    <button className="btn btn-danger btn-sm" onClick={() => handleDocAction(doc.id, 'rejected')} style={{ padding: '0.45rem 0.9rem' }}>
                                                        <XCircle size={15} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── MEMBERS TAB ── */}
                        {activeTab === 'members' && (
                            <div className="glass-panel animate-slideUp" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
                                <h2 style={{ margin: '0 0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <Users size={22} color="var(--primary)" /> Registered Members
                                </h2>
                                {members.length === 0 ? (
                                    <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                                        <Users size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                        <p style={{ color: 'var(--text-secondary)' }}>No members linked to this institution yet.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {members.map(m => (
                                            <div key={m.id} className="glass-panel" style={{ padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem' }}>
                                                        {m.name?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600 }}>{m.name}</div>
                                                        <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>{m.email}</div>
                                                    </div>
                                                </div>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.role}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── AFFILIATION REQUESTS TAB ── */}
                        {activeTab === 'affiliations' && (
                            <div className="glass-panel animate-slideUp" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
                                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}><CheckSquare size={22} color="var(--primary)" /> Join Requests</h2>
                                    <button className="btn btn-ghost btn-sm" onClick={fetchAffRequests}>Refresh</button>
                                </div>
                                {affReqs.length === 0 ? (
                                    <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                                        <CheckSquare size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                        <p style={{ color: 'var(--text-secondary)' }}>No pending affiliation requests at this time.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {affReqs.map(r => (
                                            <div key={r.id} className="glass-panel" style={{ padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid var(--primary)' }}>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{r.user_name}</div>
                                                    <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>{r.user_email}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                                        Requested: {r.created_at ? new Date(r.created_at).toLocaleDateString() : 'N/A'}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.6rem' }}>
                                                    <button className="btn btn-success" onClick={() => handleAffAction(r.id, 'approve')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1rem' }}>
                                                        <CheckCircle size={15} /> Approve
                                                    </button>
                                                    <button className="btn btn-danger btn-sm" onClick={() => handleAffAction(r.id, 'reject')} style={{ padding: '0.45rem 0.9rem' }}>
                                                        <XCircle size={15} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── BULK UPLOAD TAB ── */}
                        {activeTab === 'bulk-upload' && (
                            <div className="glass-panel animate-slideUp" style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
                                <h2 style={{ margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <FolderUp size={26} color="var(--primary)" /> Enterprise Archive Upload
                                </h2>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
                                    Upload multiple PDFs at once. Files bypass the moderation queue and are immediately indexed.
                                    <strong> The filename will be used as the document title.</strong>
                                </p>
                                <form onSubmit={handleBulkSubmit}>
                                    <div style={{ position: 'relative', border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '4rem 2rem', textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.5)', marginBottom: '1.5rem' }}>
                                        <input type="file" multiple accept=".pdf" onChange={e => setBulkFiles(Array.from(e.target.files))} disabled={bulkUploading}
                                            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                                        <UploadCloud size={60} color="var(--primary)" style={{ opacity: 0.7, marginBottom: '1rem' }} />
                                        <h3 style={{ margin: '0 0 0.5rem' }}>Drop PDFs Here or Click to Browse</h3>
                                        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                                            {bulkFiles.length > 0
                                                ? <span style={{ color: 'var(--success)', fontWeight: 700 }}>{bulkFiles.length} file(s) ready to upload</span>
                                                : 'Multiple .pdf files supported'}
                                        </p>
                                    </div>
                                    {bulkFiles.length > 0 && (
                                        <div className="glass-panel" style={{ maxHeight: 220, overflowY: 'auto', padding: '1.25rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
                                            <strong style={{ display: 'block', marginBottom: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Staged Files:</strong>
                                            {bulkFiles.map((f, i) => (
                                                <div key={i} style={{ fontSize: '0.87rem', color: 'var(--text-secondary)', padding: '0.3rem 0' }}>
                                                    {f.name} <span style={{ opacity: 0.5 }}>— {(f.size/1024/1024).toFixed(2)} MB</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <button type="submit" className="btn btn-primary" disabled={bulkUploading || !bulkFiles.length}
                                        style={{ width: '100%', padding: '1.1rem', fontSize: '1.05rem', borderRadius: 'var(--radius-md)', fontWeight: 700 }}>
                                        {bulkUploading
                                            ? <><span className="spinner" style={{ width: 20, height: 20, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite', display:'inline-block', marginRight: 10 }} />Processing…<style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></>
                                            : `Upload ${bulkFiles.length} Document(s)`
                                        }
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* ── EDIT PROFILE TAB ── */}
                        {activeTab === 'edit-profile' && (
                            <div className="glass-panel animate-slideUp" style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
                                <h2 style={{ margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Edit3 size={24} color="var(--primary)" /> Edit Institution Profile
                                </h2>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                                    Update your institution's public profile on the IKMS discovery portal. Changes are live instantly.
                                </p>
                                <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {/* Logo Upload */}
                                    <div className="form-group">
                                        <label className="input-label">Institution Logo</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                            <div style={{ position: 'relative', width: 80, height: 80, borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--bg-secondary)', border: '2px solid var(--border)', flexShrink: 0 }}>
                                                {profile?.logo_path
                                                    ? <img src={profile.logo_path} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}><Building2 size={32} color="var(--primary)" /></div>
                                                }
                                                <label htmlFor="logo-upload" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: 0, transition: 'opacity 0.2s' }}
                                                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                                    onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                                                    <UploadCloud size={22} color="white" />
                                                </label>
                                                <input id="logo-upload" type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={handleLogoUpload} />
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 600, margin: '0 0 0.3rem' }}>Upload a logo</p>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>{logoUploading ? 'Uploading…' : 'PNG, JPG or WebP. Hover the logo and click to change.'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="input-label">Institution Name</label>
                                        <input className="input" value={instName} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                                        <small style={{ color: 'var(--text-muted)' }}>Name can only be changed by a System Admin.</small>
                                    </div>
                                    <div className="form-group">
                                        <label className="input-label">Description</label>
                                        <textarea className="input" rows={4} value={editDesc} onChange={e => setEditDesc(e.target.value)}
                                            placeholder="Brief description of your institution's research focus…" style={{ resize: 'vertical' }} />
                                    </div>
                                    <div className="form-group">
                                        <label className="input-label">Location / City</label>
                                        <input className="input" value={editLoc} onChange={e => setEditLoc(e.target.value)} placeholder="e.g. Addis Ababa, Ethiopia" />
                                    </div>
                                    <div className="form-group">
                                        <label className="input-label">Website URL</label>
                                        <input className="input" type="url" value={editWeb} onChange={e => setEditWeb(e.target.value)} placeholder="https://www.youruni.edu.et" />
                                    </div>
                                    <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding: '1rem', fontSize: '1rem', borderRadius: 'var(--radius-md)', fontWeight: 700 }}>
                                        {saving ? 'Saving…' : 'Save Changes'}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* ── RIGHT SIDEBAR ── */}
                    <SidebarCards />
                </div>
            </div>
        </div>
    );
}

export default InstitutionDashboard;
