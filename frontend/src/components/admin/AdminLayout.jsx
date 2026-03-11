import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Shield, Building2, Terminal, LogOut, Menu, X, ArrowLeft } from 'lucide-react';
import { getUser, logout } from '../../utils/auth';
import './AdminLayout.css';

function AdminLayout() {
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const currentUser = getUser();
        // Redirect if not a privileged role
        if (!currentUser || !['sys_admin', 'moderator', 'inst_admin'].includes(currentUser.role)) {
            navigate('/login');
            return;
        }
        setUser(currentUser);
    }, [navigate]);

    if (!user) return null;

    const navLinks = [
        {
            path: '/admin/sysadmin',
            label: 'System Admin',
            icon: <Terminal size={18} />,
            roles: ['sys_admin']
        },
        {
            path: '/admin/moderator',
            label: 'Moderation Queue',
            icon: <Shield size={18} />,
            roles: ['sys_admin', 'moderator']
        },
        {
            path: '/admin/institution',
            label: 'Institution Panel',
            icon: <Building2 size={18} />,
            roles: ['sys_admin', 'inst_admin']
        }
    ];

    // Filter links based on user role
    const visibleLinks = navLinks.filter(link => link.roles.includes(user.role));

    return (
        <div className="admin-layout">
            {/* Mobile Header */}
            <div className="admin-mobile-header">
                <div className="admin-logo">IK<span>MS</span> Admin</div>
                <button className="admin-menu-toggle" onClick={() => setSidebarOpen(true)}>
                    <Menu size={24} />
                </button>
            </div>

            {/* Sidebar Overlay (Mobile) */}
            {sidebarOpen && (
                <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="admin-sidebar-header">
                    <div className="admin-logo">IK<span>MS</span> Admin</div>
                    <button className="admin-close-toggle" onClick={() => setSidebarOpen(false)}>
                        <X size={24} />
                    </button>
                </div>

                <div className="admin-user-profile">
                    <div className="admin-avatar">{user.name?.[0]?.toUpperCase()}</div>
                    <div className="admin-user-info">
                        <div className="admin-user-name">{user.name}</div>
                        <div className="admin-user-role">{user.role.replace('_', ' ')}</div>
                    </div>
                </div>

                <nav className="admin-nav">
                    {visibleLinks.map(link => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            {link.icon} {link.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="admin-sidebar-footer">
                    <NavLink to="/" className="admin-nav-item">
                        <ArrowLeft size={18} /> Back to Public Site
                    </NavLink>
                    <button onClick={logout} className="admin-nav-item logout-btn">
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="admin-main">
                <div className="admin-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

export default AdminLayout;
