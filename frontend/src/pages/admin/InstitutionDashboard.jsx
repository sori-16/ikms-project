import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
    Home, FileText, CheckSquare, Users, Building2, BarChart2, Settings,
    LogOut, Search, Bell, UploadCloud, ChevronRight, TrendingUp, TrendingDown,
    MoreVertical, CheckCircle, XCircle, ArrowLeft, Download, Shield, Eye, AlertCircle
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getUser, logout, getAuthHeaders } from '../../utils/auth';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const STATUS_COLORS = {
    approved: { bg: '#e0f2fe', color: '#0369a1', label: 'Approved' },
    verified: { bg: '#e0f2fe', color: '#0369a1', label: 'Verified' },
    pending:  { bg: '#fef3c7', color: '#b45309', label: 'Pending' },
    rejected: { bg: '#fee2e2', color: '#b91c1c', label: 'Rejected' },
};

function StatusBadge({ status }) {
    const s = STATUS_COLORS[status] || STATUS_COLORS.pending;
    return (
        <span style={{
            background: s.bg, color: s.color, padding: '0.2rem 0.6rem',
            borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600
        }}>{s.label || status}</span>
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
    const [activeTab,   setActiveTab]     = useState('overview');

    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [toast, setToast] = useState(null);
    const [dataLoading, setDataLoading] = useState({});
    const setSection = (key, val) => setDataLoading(p => ({...p, [key]: val}));

    // Profile Edit
    const [editDesc, setEditDesc] = useState('');
    const [editLoc, setEditLoc]   = useState('');
    const [editWeb, setEditWeb]   = useState('');
    const [logoUploading, setLogoUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Bulk Upload
    const [bulkUploading, setBulkUploading] = useState(false);
    const [bulkResult, setBulkResult] = useState(null);
    const [showBulkUploader, setShowBulkUploader] = useState(false);
    const [selectedUserRequest, setSelectedUserRequest] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const u = getUser();
        if (!u || u.role !== 'inst_admin') {
            navigate('/login'); return;
        }
        setUser(u);
        loadAll();
    }, [navigate]);

    const loadAll = () => {
        // Fire all fetches immediately, UI shows without waiting
        fetchStats();
        fetchPending();
        fetchAllDocs();
        fetchMembers();
        fetchAffRequests();
        fetchProfile();
        setLoading(false); // Show UI shell right away
    };

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchStats   = async () => { setSection('stats', true); try { const r = await axios.get(`${API}/institutions/my/analytics`, { headers: getAuthHeaders() }); setStats(r.data); } catch {} finally { setSection('stats', false); } };
    const fetchPending = async () => { setSection('pending', true); try { const r = await axios.get(`${API}/institutions/my/pending`, { headers: getAuthHeaders() }); setPendingDocs(r.data); } catch {} finally { setSection('pending', false); } };
    const fetchAllDocs = async () => { setSection('docs', true); try { const r = await axios.get(`${API}/institutions/my/documents`, { headers: getAuthHeaders() }); setAllDocs(r.data); } catch {} finally { setSection('docs', false); } };
    const fetchMembers = async () => { setSection('members', true); try { const r = await axios.get(`${API}/institutions/my/members`, { headers: getAuthHeaders() }); setMembers(r.data); } catch {} finally { setSection('members', false); } };
    const fetchAffRequests = async () => { setSection('aff', true); try { const r = await axios.get(`${API}/institutions/my/affiliation-requests`, { headers: getAuthHeaders() }); setAffReqs(r.data); } catch {} finally { setSection('aff', false); } };
    const fetchProfile = async () => {
        setSection('profile', true);
        try {
            const r = await axios.get(`${API}/institutions/my/profile`, { headers: getAuthHeaders() });
            setProfile(r.data);
            setEditDesc(r.data.description || '');
            setEditLoc(r.data.location || '');
            setEditWeb(r.data.website || '');
        } catch {} finally { setSection('profile', false); }
    };

    const handleDocAction = async (docId, status) => {
        try {
            await axios.post(`${API}/documents/${docId}/institutional-verify`, { status }, { headers: getAuthHeaders() });
            showToast(`Document ${status === 'approved' ? 'verified & approved' : 'rejected'}.`);
            fetchPending(); fetchAllDocs(); fetchStats();
        } catch (err) { showToast(err.response?.data?.error || 'Failed to update document.', 'error'); }
    };

    const handleAffAction = async (reqId, action) => {
        try {
            await axios.post(`${API}/institutions/my/affiliation-requests/${reqId}/${action}`, {}, { headers: getAuthHeaders() });
            showToast(`Request ${action}d successfully.`);
            fetchAffRequests(); fetchMembers();
        } catch { showToast('Action failed.', 'error'); }
    };

    const handleBulkUpload = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setBulkUploading(true);
        setBulkResult(null);
        const fd = new FormData();
        Array.from(files).forEach(f => fd.append('files', f));
        try {
            const r = await axios.post(`${API}/admin/institution/bulk-upload`, fd, {
                headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' }
            });
            setBulkResult({ success: true, message: r.data.message, errors: r.data.errors || [] });
            showToast(r.data.message);
            fetchAllDocs(); fetchStats();
        } catch (err) {
            const msg = err.response?.data?.error || 'Bulk upload failed.';
            setBulkResult({ success: false, message: msg, errors: [] });
            showToast(msg, 'error');
        }
        setBulkUploading(false);
        // Reset the input so the same files can be re-uploaded if needed
        e.target.value = '';
    };

    // --- RENDER SIDEBAR ---
    const SideNav = () => {
        const tabs = [
            { id: 'overview', label: 'Overview', icon: Home },
            { id: 'documents', label: 'Documents', icon: FileText },
            { id: 'verifications', label: 'Verifications', icon: CheckSquare, badge: pendingDocs.length + affReqs.length },
            { id: 'researchers', label: 'Researchers', icon: Users },
            { id: 'profile', label: 'Institution Profile', icon: Building2 },
            { id: 'analytics', label: 'Analytics', icon: BarChart2 },
            { id: 'settings', label: 'Settings', icon: Settings },
        ];

        return (
            <aside style={{ width: '250px', background: '#0f2b3d', color: '#fff', display: 'flex', flexDirection: 'column', height: '100vh', flexShrink: 0 }}>
                {/* Logo Area */}
                <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {profile?.logo_path ? <img src={profile.logo_path} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : <Building2 size={20} color="#0f2b3d"/>}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {profile?.name || 'Institution Admin'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 2 }}>Research Admin</div>
                    </div>
                </div>

                {/* Nav Links */}
                <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', overflowY: 'auto' }}>
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '0.7rem 1rem', borderRadius: 6, border: 'none', cursor: 'pointer',
                                background: activeTab === t.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                                color: activeTab === t.id ? '#fff' : '#94a3b8',
                                transition: 'all 0.2s', width: '100%', textAlign: 'left',
                                fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: activeTab === t.id ? 600 : 500
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <t.icon size={18} color={activeTab === t.id ? '#38bdf8' : '#94a3b8'} />
                                {t.label}
                            </div>
                            {t.badge > 0 && (
                                <span style={{ background: '#22c55e', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: 99 }}>
                                    {t.badge || 0}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                        <ArrowLeft size={18} /> Public Portal
                    </Link>
                    <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 1rem', background: 'none', border: 'none', color: '#ef4444', fontSize: '0.9rem', cursor: 'pointer', textAlign: 'left' }}>
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </aside>
        );
    };

    // --- RENDER TOP BAR ---
    const TopBar = () => (
        <header style={{ background: '#fff', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, maxWidth: 400 }}>
                <div style={{ position: 'relative', width: '100%' }}>
                    <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 10 }} />
                    <input 
                        type="text" 
                        placeholder="Search standard global data..." 
                        style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 99, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.85rem', outline: 'none' }}
                        value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ position: 'relative', cursor: 'pointer' }}>
                    <Bell size={20} color="#64748b" />
                    {((pendingDocs && pendingDocs.length > 0) || (affReqs && affReqs.length > 0)) && <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: '#ef4444', borderRadius: '50%' }} />}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>{user?.name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Admin</div>
                    </div>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                        {user?.name?.[0]?.toUpperCase()}
                    </div>
                </div>
            </div>
        </header>
    );

    // --- CONTENT VIEWS ---
    const KpiCard = ({ title, value, subtitle, icon: Icon, color = '#38bdf8', loading = false }) => (
        <div style={{ background: '#fff', borderRadius: 8, padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
            {loading && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 3, background: color, opacity: 0.5, animation: 'loading-bar 1.5s infinite linear' }} />}
            <div style={{ width: 56, height: 56, borderRadius: 12, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={28} color={color} />
            </div>
            <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0', opacity: loading ? 0.4 : 1, transition: 'opacity 0.2s' }}>{value}</div>
                {subtitle && <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>{subtitle}</div>}
            </div>
        </div>
    );

    const renderOverview = () => {
        const approvedCount = allDocs.filter(d => d.status === 'approved').length;
        
        // Dummy data for charts
        const chartData = [
            { name: 'Jan', pubs: 400, dls: 240 }, { name: 'Feb', pubs: 300, dls: 139 },
            { name: 'Mar', pubs: 200, dls: 980 }, { name: 'Apr', pubs: 278, dls: 390 },
            { name: 'May', pubs: 189, dls: 480 }, { name: 'Jun', pubs: 239, dls: 380 }
        ];

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Overview</h2>
                
                {/* KPIs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                    <KpiCard title="Total Publications" value={approvedCount} subtitle="Approved papers" icon={FileText} color="#0284c7" loading={dataLoading.docs} />
                    <KpiCard title="Pending Verifications" value={pendingDocs.length + affReqs.length} subtitle="Needs attention" icon={CheckSquare} color="#f59e0b" loading={dataLoading.pending || dataLoading.aff} />
                    <KpiCard title="Total Downloads" value={stats?.total_downloads || 0} subtitle="Across all papers" icon={Download} color="#8b5cf6" loading={dataLoading.stats} />
                    <KpiCard title="Active Researchers" value={members.length} subtitle="Verified members" icon={Users} color="#10b981" loading={dataLoading.members} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', alignItems: 'start' }}>
                    {/* Activity Feed */}
                    <div style={{ background: '#fff', borderRadius: 8, padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 1rem' }}>Recent Activity</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {pendingDocs.slice(0,4).map((doc, i) => (
                                <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.8rem', fontWeight: 700, color:'var(--text-muted)' }}>
                                        {doc.title?.charAt(0) || 'D'}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>New document submitted</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{doc.title.substring(0, 40)}...</div>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 2 }}>{new Date(doc.created_at || Date.now()).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            ))}
                            {pendingDocs.length === 0 && <div style={{ fontSize: '0.85rem', color: '#64748b' }}>No recent activity.</div>}
                        </div>
                    </div>

                    {/* Quick Actions & Charts */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* 
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => setActiveTab('verifications')} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', fontWeight: 600, border: '1px solid #cbd5e1' }}><CheckCircle size={16}/> Review Pending</button>
                            <button onClick={() => setActiveTab('documents')} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', fontWeight: 600, background: '#0f2b3d' }}><UploadCloud size={16}/> Manage Docs</button>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div style={{ background: '#fff', borderRadius: 8, padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '1rem' }}>Publications Overview</h4>
                                <div style={{ height: 180 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                            <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                                            <YAxis fontSize={11} tickLine={false} axisLine={false} />
                                            <RechartsTooltip />
                                            <Line type="monotone" dataKey="pubs" stroke="#0ea5e9" strokeWidth={3} dot={{r:4}} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div style={{ background: '#fff', borderRadius: 8, padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '1rem' }}>Downloads Over Time</h4>
                                <div style={{ height: 180 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                            <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                                            <YAxis fontSize={11} tickLine={false} axisLine={false} />
                                            <RechartsTooltip />
                                            <Bar dataKey="dls" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                        */}
                    </div>
                </div>
            </div>
        );
    };

    const renderVerifications = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Pending Verifications</h2>
            <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Item / Title</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Type</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Date</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Status</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {affReqs.map(req => (
                            <tr key={'aff-'+req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>{req.user_name} <br/><span style={{ fontSize:'0.8rem', fontWeight: 400, color: '#64748b' }}>{req.user_email}</span></td>
                                <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem' }}><Users size={14} style={{ marginRight: 4, verticalAlign: -2 }}/> Joining Request</td>
                                <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: '#64748b' }}>{new Date(req.created_at).toLocaleDateString()}</td>
                                <td style={{ padding: '1rem 1.5rem' }}><StatusBadge status="pending" /></td>
                                <td style={{ padding: '1rem 1.5rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    <button onClick={() => setSelectedUserRequest(req)} style={{ background: '#f1f5f9', color: '#0f172a', border: 'none', padding: '0.4rem 0.8rem', borderRadius: 4, fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}><Eye size={14}/> View Profile</button>
                                    <button onClick={() => handleAffAction(req.id, 'approve')} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: 4, fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>Verify</button>
                                    <button onClick={() => handleAffAction(req.id, 'reject')} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: 4, fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>Reject</button>
                                </td>
                            </tr>
                        ))}
                        {pendingDocs.map(doc => (
                            <tr key={'doc-'+doc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#0f172a', maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.title}</td>
                                <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem' }}><FileText size={14} style={{ marginRight: 4, verticalAlign: -2 }}/> Document</td>
                                <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: '#64748b' }}>{doc.upload_date ? new Date(doc.upload_date).toLocaleDateString() : 'N/A'}</td>
                                <td style={{ padding: '1rem 1.5rem' }}><StatusBadge status="pending" /></td>
                                <td style={{ padding: '1rem 1.5rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    <Link to={`/document/${doc.id}`} target="_blank" style={{ background: '#f1f5f9', color: '#0f172a', textDecoration: 'none', padding: '0.4rem 0.8rem', borderRadius: 4, fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={14}/> View</Link>
                                    <button onClick={() => handleDocAction(doc.id, 'approved')} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: 4, fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>Verify</button>
                                    <button onClick={() => handleDocAction(doc.id, 'rejected')} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: 4, fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>Reject</button>
                                </td>
                            </tr>
                        ))}
                        {(!affReqs || !pendingDocs || (affReqs.length === 0 && pendingDocs.length === 0)) && (
                            <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>No pending verifications. You are all caught up!</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const handleProfileSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await axios.put(`${API}/institutions/my/profile`, { description: editDesc, location: editLoc, website: editWeb }, { headers: getAuthHeaders() });
            showToast('Profile updated successfully!');
            fetchProfile();
        } catch { showToast('Failed to update profile.', 'error'); }
        setSaving(false);
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLogoUploading(true);
        const fd = new FormData(); fd.append('logo', file);
        try {
            const r = await axios.post(`${API}/institutions/my/logo`, fd, { headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' }});
            showToast('Logo uploaded!');
            setProfile(prev => prev ? { ...prev, logo_path: r.data.logo_path } : prev);
        } catch (err) { showToast(err.response?.data?.error || 'Logo upload failed', 'error'); }
        setLogoUploading(false);
    };

    const renderProfile = () => (
        <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Institution Profile</h2>
            <div style={{ background: '#fff', borderRadius: 8, padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ position: 'relative', width: 90, height: 90, borderRadius: 12, overflow: 'hidden', background: '#f8fafc', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                            {profile?.logo_path ? <img src={profile.logo_path} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}><Building2 size={32} color="#94a3b8" /></div>}
                            <label style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: 0, transition: 'opacity 0.2s', color: 'white' }} 
                                onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                                <UploadCloud size={24} />
                            </label>
                            <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={handleLogoUpload} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Institution Logo</div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 4 }}>{logoUploading ? 'Uploading...' : 'Square recommended. Hover and click to upload.'}</div>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>Institution Name</label>
                        <input type="text" value={profile?.name || ''} disabled style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed', outline: 'none' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>Overview Description</label>
                        <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={4} style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>Location / Headquarters</label>
                            <input type="text" value={editLoc} onChange={e => setEditLoc(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1', outline: 'none' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>Website URL</label>
                            <input type="url" value={editWeb} onChange={e => setEditWeb(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1', outline: 'none' }} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button type="submit" disabled={saving} style={{ background: '#0ea5e9', color: 'white', padding: '0.6rem 1.5rem', borderRadius: 6, fontWeight: 600, border: 'none', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save Changes'}</button>
                    </div>
                </form>
            </div>
        </div>
    );

    const renderDocuments = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Institution Documents</h2>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0f2b3d', color: '#fff', padding: '0.5rem 1.2rem', borderRadius: 6, fontWeight: 600, fontSize: '0.9rem', cursor: bulkUploading ? 'not-allowed' : 'pointer', opacity: bulkUploading ? 0.7 : 1 }}>
                    <UploadCloud size={16}/> {bulkUploading ? 'Uploading...' : 'Bulk Upload'}
                    <input type="file" accept=".pdf" multiple style={{ display: 'none' }} onChange={handleBulkUpload} disabled={bulkUploading} />
                </label>
            </div>

            {/* Bulk Upload Result Banner */}
            {bulkResult && (
                <div style={{ padding: '1rem 1.5rem', borderRadius: 8, background: bulkResult.success ? '#e0f2fe' : '#fee2e2', color: bulkResult.success ? '#0369a1' : '#b91c1c', fontSize: '0.9rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{bulkResult.message}</span>
                    {bulkResult.errors?.length > 0 && (
                        <span style={{ fontSize: '0.8rem', fontWeight: 400, marginLeft: '1rem' }}>
                            {bulkResult.errors.length} file(s) failed: {bulkResult.errors.map(e => e.file).join(', ')}
                        </span>
                    )}
                    <button onClick={() => setBulkResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', lineHeight: 1, color: 'inherit' }}>×</button>
                </div>
            )}
            
            {bulkUploading && (
                <div style={{ padding: '1rem 1.5rem', borderRadius: 8, background: '#fef3c7', color: '#b45309', fontSize: '0.9rem', fontWeight: 600 }}>
                    ⏳ Processing PDFs — extracting text, running AI pipeline, uploading to cloud. This may take a minute...
                </div>
            )}

            <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Document Title</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Date</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Status</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textAlign: 'right' }}>Visibility</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allDocs.map(doc => (
                            <tr key={doc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', fontWeight: 500, color: '#0f172a', maxWidth: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.title}</td>
                                <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: '#64748b' }}>{doc.upload_date ? new Date(doc.upload_date).toLocaleDateString() : 'N/A'}</td>
                                <td style={{ padding: '1rem 1.5rem' }}><StatusBadge status={doc.status} /></td>
                                <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                    <Link to={`/document/${doc.id}`} target="_blank" style={{ color: '#0ea5e9', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>View Page</Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderResearchers = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Institution Researchers</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 10 }} />
                        <input 
                            type="text" 
                            placeholder="Search researchers..." 
                            style={{ padding: '8px 12px 8px 36px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
                            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Name</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Email</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Role</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Joined Date</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members.filter(m => m.name?.toLowerCase().includes(searchQuery.toLowerCase()) || m.email?.toLowerCase().includes(searchQuery.toLowerCase())).map(m => (
                            <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>{m.name}</td>
                                <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: '#64748b' }}>{m.email}</td>
                                <td style={{ padding: '1rem 1.5rem' }}>
                                    <span style={{ background: '#f1f5f9', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 600 }}>{m.role?.toUpperCase()}</span>
                                </td>
                                <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: '#64748b' }}>{m.created_at ? new Date(m.created_at).toLocaleDateString() : 'N/A'}</td>
                                <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                    <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }}>Manage</button>
                                </td>
                            </tr>
                        ))}
                        {members.length === 0 && (
                            <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>No researchers found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderAnalytics = () => {
        const pieData = [
            { name: 'Approved', value: allDocs.filter(d => d.status === 'approved').length },
            { name: 'Pending', value: allDocs.filter(d => d.status === 'pending').length },
            { name: 'Rejected', value: allDocs.filter(d => d.status === 'rejected').length },
        ].filter(d => d.value > 0);

        const PIE_COLORS = ['#0ea5e9', '#f59e0b', '#ef4444'];

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Deep Analytics</h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {/* Publication Distribution */}
                    <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.5rem' }}>Publication Status</h3>
                        <div style={{ height: 250 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                    </Pie>
                                    <RechartsTooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1rem' }}>
                            {pieData.map((d, i) => (
                                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: PIE_COLORS[i] }} />
                                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>{d.name}: {d.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Engagement Overview */}
                    <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.5rem' }}>Engagement Metrics</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {[
                                { label: 'Total Downloads', value: stats?.total_downloads || 0, icon: Download, color: '#8b5cf6' },
                                { label: 'Total Views', value: stats?.total_views || 0, icon: Eye, color: '#0ea5e9' },
                                { label: 'Avg. Per Paper', value: ((stats?.total_downloads || 0) / (allDocs.length || 1)).toFixed(1), icon: BarChart2, color: '#10b981' },
                            ].map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 8, background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <item.icon size={20} color={item.color} />
                                        </div>
                                        <span style={{ fontWeight: 600, color: '#475569' }}>{item.label}</span>
                                    </div>
                                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.5rem' }}>Top Researchers by Publication</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                        {members.slice(0, 4).map((m, i) => (
                            <div key={m.id} style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: 8, textAlign: 'center' }}>
                                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', fontWeight: 800 }}>{m.name?.[0]}</div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 2 }}>{m.name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Researcher</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderSettings = () => (
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Dashboard Settings</h2>
            <div style={{ background: '#fff', borderRadius: 8, padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Notification Preferences</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                            <input type="checkbox" defaultChecked style={{ width: 18, height: 18 }} />
                            <span style={{ fontSize: '0.9rem', color: '#334155' }}>Email me for new document verifications</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                            <input type="checkbox" defaultChecked style={{ width: 18, height: 18 }} />
                            <span style={{ fontSize: '0.9rem', color: '#334155' }}>Email me for new affiliation requests</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                            <input type="checkbox" style={{ width: 18, height: 18 }} />
                            <span style={{ fontSize: '0.9rem', color: '#334155' }}>Monthly institutional analytics report</span>
                        </label>
                    </div>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '2rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: '#ef4444' }}>Danger Zone</h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>Once you delete an institutional account, there is no going back. Please be certain.</p>
                    <button style={{ background: '#fff', color: '#ef4444', border: '1px solid #ef4444', padding: '0.6rem 1.2rem', borderRadius: 6, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>Delete Institution Account</button>
                </div>
            </div>
        </div>
    );

    const renderDefault = () => (
        <div style={{ padding: '3rem', textAlign: 'center', background: '#fff', borderRadius: 8, color: '#64748b' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem' }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Dashboard</h3>
            <p>This module is currently under development to integrate deeper system analytics.</p>
        </div>
    );

    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f4f7f6' }}>Loading Institution Admin...</div>;

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#f4f7f6', overflow: 'hidden', fontFamily: 'var(--font-body)' }}>
            <SideNav />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <TopBar />
                
                {toast && (
                    <div style={{ position: 'absolute', top: 80, right: 24, zIndex: 100, background: toast.type === 'error' ? '#fee2e2' : '#e0f2fe', color: toast.type === 'error' ? '#b91c1c' : '#0369a1', padding: '1rem 1.5rem', borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', display: 'flex', gap: '0.5rem', alignItems: 'center', fontWeight: 600, fontSize: '0.9rem', animation: 'dropIn 0.3s' }}>
                        {toast.type === 'error' ? <AlertCircle size={18}/> : <CheckCircle size={18}/>} {toast.msg}
                    </div>
                )}

                <main style={{ flex: 1, overflowY: 'auto', padding: '2rem 3rem' }}>
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'verifications' && renderVerifications()}
                    {activeTab === 'profile' && renderProfile()}
                    {activeTab === 'documents' && renderDocuments()}
                    {activeTab === 'researchers' && renderResearchers()}
                    {activeTab === 'analytics' && renderAnalytics()}
                    {activeTab === 'settings' && renderSettings()}
                </main>
                
                {selectedUserRequest && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div style={{ background: '#fff', borderRadius: 12, padding: '2rem', width: '90%', maxWidth: 500, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Researcher Profile</h3>
                                <button onClick={() => setSelectedUserRequest(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#64748b' }}>×</button>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {selectedUserRequest.photo_url ? <img src={selectedUserRequest.photo_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={32} color="#94a3b8" />}
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{selectedUserRequest.user_name}</div>
                                    <div style={{ fontSize: '0.9rem', color: '#64748b' }}>{selectedUserRequest.user_email}</div>
                                </div>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.2rem' }}>Occupation / Role</label>
                                <div style={{ fontSize: '0.95rem', color: '#0f172a', background: '#f8fafc', padding: '0.75rem', borderRadius: 6 }}>{selectedUserRequest.occupation || 'Not specified'}</div>
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.2rem' }}>Research Interests</label>
                                <div style={{ fontSize: '0.95rem', color: '#0f172a', background: '#f8fafc', padding: '0.75rem', borderRadius: 6, minHeight: 60 }}>{selectedUserRequest.research_interests || 'Not specified'}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button onClick={() => { handleAffAction(selectedUserRequest.id, 'reject'); setSelectedUserRequest(null); }} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>Reject</button>
                                <button onClick={() => { handleAffAction(selectedUserRequest.id, 'approve'); setSelectedUserRequest(null); }} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>Verify & Approve</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes dropIn { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes loading-bar {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}} />
        </div>
    );
}

export default InstitutionDashboard;
