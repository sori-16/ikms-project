import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
    Activity, Users, Shield, Database, CheckSquare, Search, FileText,
    LogOut, CheckCircle, XCircle, Eye, EyeOff, RotateCcw, AlertTriangle, Building2, Bell, MessageSquare
} from 'lucide-react';
import { getUser, getAuthHeaders, logout } from '../../utils/auth';

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

function MasterAdminDashboard() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const navigate = useNavigate();

    // Data States
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [institutions, setInstitutions] = useState([]);

    // Per-section loading
    const [dataLoading, setDataLoading] = useState({});
    const setSection = (key, val) => setDataLoading(p => ({...p, [key]: val}));

    // UI States
    const [activeTab, setActiveTab] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modals
    const [instModal, setInstModal] = useState(null); // { mode: 'create'|'edit', data }
    const [assignModal, setAssignModal] = useState(null); // { instId, userId }
    const [deleteInstId, setDeleteInstId] = useState(null);

    useEffect(() => {
        const u = getUser();
        if (!u || u.role !== 'sys_admin') {
            navigate('/login'); return;
        }
        setUser(u);
        if (!activeTab || activeTab === 'queue') {
            setActiveTab('overview');
        }
        loadAllData(u.role);
    }, [navigate]);

    const loadAllData = () => {
        // Fire all fetches immediately, UI shows without waiting
        fetchStats();
        fetchUsers();
        fetchInstitutions();
        setLoading(false); // Show UI right away
    };

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // --- Fetchers ---
    const fetchStats = async () => { setSection('stats', true); try { const r = await axios.get(`${API}/admin/stats`, { headers: getAuthHeaders() }); setStats(r.data); } catch {} finally { setSection('stats', false); } };
    const fetchUsers = async () => { setSection('users', true); try { const r = await axios.get(`${API}/admin/users`, { headers: getAuthHeaders() }); setUsers(r.data); } catch {} finally { setSection('users', false); } };
    const fetchInstitutions = async () => { setSection('insts', true); try { const r = await axios.get(`${API}/admin/institutions`, { headers: getAuthHeaders() }); setInstitutions(r.data); } catch(e) { console.error('Institutions error:', e.response?.data || e.message); } finally { setSection('insts', false); } };

    // --- Actions ---
    const handleRoleUpdate = async (userId, newRole) => {
        try {
            await axios.put(`${API}/admin/users/${userId}/role`, { role: newRole }, { headers: getAuthHeaders() });
            showToast('Role updated successfully.');
            fetchUsers();
        } catch { showToast('Failed to update role.', 'error'); }
    };

    const handleSaveInstitution = async () => {
        if (!instModal?.data?.name?.trim()) { showToast('Institution name is required.', 'error'); return; }
        try {
            if (instModal.mode === 'create') {
                await axios.post(`${API}/institutions`, instModal.data, { headers: getAuthHeaders() });
                showToast('Institution created!');
            } else {
                await axios.put(`${API}/institutions/${instModal.data.id}`, instModal.data, { headers: getAuthHeaders() });
                showToast('Institution updated!');
            }
            setInstModal(null); fetchInstitutions(); fetchStats();
        } catch (err) { showToast(err.response?.data?.error || 'Failed to save institution.', 'error'); }
    };

    const handleDeleteInstitution = async () => {
        if (!deleteInstId) return;
        try {
            await axios.delete(`${API}/institutions/${deleteInstId}`, { headers: getAuthHeaders() });
            showToast('Institution deleted.');
            setDeleteInstId(null); fetchInstitutions(); fetchStats();
        } catch (err) { showToast(err.response?.data?.error || 'Failed to delete.', 'error'); }
    };

    const handleAssignAdmin = async () => {
        if (!assignModal?.userId || !assignModal?.instId) { showToast('Please select a user.', 'error'); return; }
        try {
            await axios.post(`${API}/admin/institutions/${assignModal.instId}/assign-admin`, { user_id: assignModal.userId }, { headers: getAuthHeaders() });
            showToast('Admin assigned successfully!');
            setAssignModal(null); fetchInstitutions(); fetchUsers();
        } catch (err) { showToast(err.response?.data?.error || 'Failed to assign admin.', 'error'); }
    };

    // --- SIDEBAR ---
    const SideNav = () => {
        const sysAdminTabs = [
            { id: 'overview', label: 'System Overview', icon: Activity },
            { id: 'users', label: 'User Directory', icon: Shield },
            { id: 'institutions', label: 'Institutions', icon: Building2 },
            { id: 'system', label: 'System Status', icon: Database },
        ];

        return (
            <aside style={{ width: '260px', background: '#0f2b3d', color: '#fff', display: 'flex', flexDirection: 'column', height: '100vh', flexShrink: 0 }}>
                {/* Logo Area */}
                <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                        <Shield size={20} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>IKMS <span style={{color:'var(--gold-dark)'}}>Admin</span></div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 2, textTransform: 'capitalize' }}>{user?.role.replace('_', ' ')}</div>
                    </div>
                </div>

                <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', overflowY: 'auto' }}>
                    {sysAdminTabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '0.75rem 1rem', borderRadius: 6, border: 'none', cursor: 'pointer',
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
                        </button>
                    ))}
                </nav>

                <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <button onClick={logout} style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1rem', background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', fontSize: '0.9rem', cursor: 'pointer', borderRadius: 6, fontWeight: 600 }}>
                        <LogOut size={18} /> Exit Admin Profile
                    </button>
                </div>
            </aside>
        );
    };

    // --- RENDER TOP BAR ---
    const TopBar = () => (
        <header style={{ background: '#fff', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', textTransform: 'capitalize' }}>
                {activeTab.replace('_', ' ')} Dashboard
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ position: 'relative', cursor: 'pointer' }}>
                    <Bell size={20} color="#64748b" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>{user?.name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Mission Control</div>
                    </div>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                        {user?.name?.[0]?.toUpperCase()}
                    </div>
                </div>
            </div>
        </header>
    );

    // --- TAB VIEWS ---
    
    // SysAdmin: Overview
    const renderOverview = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                <div style={{ background: '#fff', borderRadius: 8, padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderLeft: '4px solid #0284c7' }}>
                    <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Total Users</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0' }}>{stats?.users || 0}</div>
                    </div>
                </div>
                <div style={{ background: '#fff', borderRadius: 8, padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderLeft: '4px solid #10b981' }}>
                    <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Approved Knowledge</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0' }}>{stats?.documents?.approved || 0}</div>
                    </div>
                </div>
                <div style={{ background: '#fff', borderRadius: 8, padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderLeft: '4px solid #8b5cf6' }}>
                    <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Institutions</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0' }}>{stats?.institutions || 0}</div>
                    </div>
                </div>
            </div>
        </div>
    );


    // SysAdmin: Users Directory
    const renderUsers = () => {
        const ROLES = ['public', 'researcher', 'inst_admin', 'sys_admin'];
        const filtered = users.filter(u => (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()));
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>System User Directory</h2>
                    <div style={{ position: 'relative', width: 300 }}>
                        <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 10 }} />
                        <input type="text" placeholder="Search accounts..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 6, border: '1px solid #cbd5e1', outline: 'none' }} />
                    </div>
                </div>
                <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Account Name</th>
                                <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Email Label</th>
                                <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Current Role</th>
                                <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textAlign: 'right' }}>Assign New Role</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(u => (
                                <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>{u.name || '—'}</td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: '#64748b' }}>{u.email}</td>
                                    <td style={{ padding: '1rem 1.5rem' }}><span style={{ padding: '2px 8px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600, background: u.role === 'sys_admin' ? '#fce7f3' : '#e0f2fe', color: u.role === 'sys_admin' ? '#be185d' : '#0369a1' }}>{u.role}</span></td>
                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                        <select value={u.role} onChange={(e) => handleRoleUpdate(u.id, e.target.value)} style={{ padding: '0.3rem 0.5rem', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}>
                                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };


    const renderInstitutions = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Institution Registry</h2>
                <button onClick={() => setInstModal({ mode: 'create', data: { name: '', description: '', location: '', website: '', established_year: '' } })} style={{ background: '#0f2b3d', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: 6, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Building2 size={16}/> + Add Institution
                </button>
            </div>
            <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Institution</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Location</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textAlign: 'center' }}>📄 Docs</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textAlign: 'center' }}>👥 Members</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {institutions.map(inst => (
                            <tr key={inst.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '1rem 1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: 36, height: 36, borderRadius: 6, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                                            {inst.logo_path ? <img src={inst.logo_path} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="logo" /> : <Building2 size={18} color="#94a3b8" />}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>{inst.name}</div>
                                            {inst.website && <div style={{ fontSize: '0.75rem', color: '#0ea5e9' }}>{inst.website}</div>}
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: '#64748b' }}>{inst.location || '—'}</td>
                                <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', textAlign: 'center' }}>{inst.doc_count ?? '—'}</td>
                                <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', textAlign: 'center' }}>{inst.member_count ?? '—'}</td>
                                <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <button onClick={() => setAssignModal({ instId: inst.id, instName: inst.name, userId: '' })} style={{ background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '0.35rem 0.7rem', borderRadius: 4, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>Assign Admin</button>
                                        <button onClick={() => setInstModal({ mode: 'edit', data: { id: inst.id, name: inst.name, description: inst.description || '', location: inst.location || '', website: inst.website || '', established_year: inst.established_year || '' } })} style={{ background: '#f1f5f9', color: '#0f172a', border: 'none', padding: '0.35rem 0.7rem', borderRadius: 4, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                                        <button onClick={() => setDeleteInstId(inst.id)} style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', padding: '0.35rem 0.7rem', borderRadius: 4, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {institutions.length === 0 && <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No institutions registered yet.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderSystem = () => (
        <div style={{ background: '#fff', borderRadius: 8, padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: '#0f172a' }}>Infrastructure Health Check</h3>
            <div style={{ display: 'flex', gap: '2rem' }}>
                <div style={{ padding: '1rem 2rem', background: '#f8fafc', borderRadius: 8, borderLeft: stats?.system?.elasticsearch === 'connected' ? '4px solid #10b981' : '4px solid #ef4444' }}>
                    <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Elasticsearch Engine</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: stats?.system?.elasticsearch === 'connected' ? '#10b981' : '#ef4444', marginTop: 4 }}>{stats?.system?.elasticsearch || 'Offline'}</div>
                </div>
                <div style={{ padding: '1rem 2rem', background: '#f8fafc', borderRadius: 8, borderLeft: '4px solid #10b981' }}>
                    <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Database Connection</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981', marginTop: 4 }}>{stats?.system?.database || 'Connected'}</div>
                </div>
            </div>
        </div>
    );

    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f4f7f6' }}>Loading Enterprise Portal...</div>;

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#f4f7f6', overflow: 'hidden', fontFamily: 'var(--font-body)' }}>
            <SideNav />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <TopBar />
                
                {toast && (
                    <div style={{ position: 'absolute', top: 80, right: 24, zIndex: 100, background: toast.type === 'error' ? '#fee2e2' : '#e0f2fe', color: toast.type === 'error' ? '#b91c1c' : '#0369a1', padding: '1rem 1.5rem', borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', display: 'flex', gap: '0.5rem', alignItems: 'center', fontWeight: 600, fontSize: '0.9rem', animation: 'dropIn 0.3s' }}>
                        {toast.type === 'error' ? <AlertTriangle size={18}/> : <CheckCircle size={18}/>} {toast.msg}
                    </div>
                )}

                <main style={{ flex: 1, overflowY: 'auto', padding: '2rem 3rem' }}>
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'users' && renderUsers()}
                    {activeTab === 'institutions' && renderInstitutions()}
                    {activeTab === 'system' && renderSystem()}
                </main>
            </div>

            {/* Institution Create/Edit Modal */}
            {instModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', padding: '2rem', borderRadius: 8, width: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a', margin: '0 0 1.5rem' }}><Building2 size={20}/> {instModal.mode === 'create' ? 'Add New Institution' : 'Edit Institution'}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {[['name','Institution Name *'], ['location','Location / Headquarters'], ['website','Website URL'], ['established_year','Established Year']].map(([field, label]) => (
                                <div key={field}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>{label}</label>
                                    <input type={field === 'established_year' ? 'number' : 'text'} value={instModal.data[field] || ''} onChange={e => setInstModal({...instModal, data: {...instModal.data, [field]: e.target.value}})} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', outline: 'none' }} />
                                </div>
                            ))}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Description</label>
                                <textarea rows={3} value={instModal.data.description || ''} onChange={e => setInstModal({...instModal, data: {...instModal.data, description: e.target.value}})} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setInstModal(null)} style={{ padding: '0.5rem 1rem', background: '#f1f5f9', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleSaveInstitution} style={{ padding: '0.5rem 1.2rem', background: '#0f2b3d', color: 'white', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>{instModal.mode === 'create' ? 'Create Institution' : 'Save Changes'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Institution Confirm */}
            {deleteInstId && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', padding: '2rem', borderRadius: 8, width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                        <h3 style={{ color: '#ef4444', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={20}/> Confirm Deletion</h3>
                        <p style={{ fontSize: '0.9rem', color: '#64748b' }}>This will permanently delete the institution and all associated metadata. This cannot be undone.</p>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setDeleteInstId(null)} style={{ padding: '0.5rem 1rem', background: '#f1f5f9', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleDeleteInstitution} style={{ padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>Delete Forever</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Admin Modal */}
            {assignModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', padding: '2rem', borderRadius: 8, width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                        <h3 style={{ color: '#0f172a', margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: 8 }}><Shield size={20}/> Assign Institution Admin</h3>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>Assigning to: <strong>{assignModal.instName}</strong></p>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Select User</label>
                        <select value={assignModal.userId} onChange={e => setAssignModal({...assignModal, userId: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid #cbd5e1', outline: 'none' }}>
                            <option value="">— Choose a user —</option>
                            {users.filter(u => u.role === 'researcher' || u.role === 'inst_admin').map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                        </select>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setAssignModal(null)} style={{ padding: '0.5rem 1rem', background: '#f1f5f9', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleAssignAdmin} style={{ padding: '0.5rem 1.2rem', background: '#0f2b3d', color: 'white', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>Confirm Assignment</button>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{__html: `
                @keyframes dropIn { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}} />
        </div>
    );
}

export default MasterAdminDashboard;
