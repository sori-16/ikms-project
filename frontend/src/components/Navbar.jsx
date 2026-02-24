import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, LayoutDashboard, LogOut, BookOpen, Building2, BarChart2, Library } from 'lucide-react';
import { isAuthenticated, getUser, logout } from '../utils/auth';
import './Navbar.css';

function Navbar() {
    const authenticated = isAuthenticated();
    const user = getUser();
    const navigate = useNavigate();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleLogout = () => {
        logout();
        setDrawerOpen(false);
        navigate('/');
    };

    const handleNavSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
            setDrawerOpen(false);
        }
    };

    const getDashboardLink = () => {
        if (!user) return '/researcher-dashboard';
        if (user.role === 'moderator' || user.role === 'sys_admin') return '/moderator-dashboard';
        if (user.role === 'inst_admin') return '/institution-dashboard';
        return '/researcher-dashboard';
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    return (
        <>
            <nav className="navbar">
                <div className="navbar-container">
                    {/* Left: Brand */}
                    <Link to="/" className="navbar-brand">
                        IK<span>MS</span>
                    </Link>

                    {/* Center: Search */}
                    <form className="navbar-search" onSubmit={handleNavSearch}>
                        <Search className="navbar-search-icon" size={16} />
                        <input
                            type="text"
                            className="navbar-search-input"
                            placeholder='Search by title, author, institution...'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button type="submit" className="navbar-search-btn">Search</button>
                    </form>

                    {/* Right: Actions */}
                    <div className="navbar-actions">
                        <Link to="/institutions" className="nav-link">
                            <Building2 size={15} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                            Institutions
                        </Link>
                        <Link to="/analytics" className="nav-link">
                            <BarChart2 size={15} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                            Impact
                        </Link>

                        {authenticated && (
                            <Link to="/library" className="nav-link">
                                <Library size={15} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                                My Library
                            </Link>
                        )}

                        <div className="nav-divider" />

                        {!authenticated ? (
                            <>
                                <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
                                <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
                            </>
                        ) : (
                            <>
                                <Link to={getDashboardLink()} className="btn btn-ghost btn-sm" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                    <LayoutDashboard size={15} />
                                    Dashboard
                                </Link>
                                <div className="nav-user-pill">
                                    <div className="nav-user-avatar">{getInitials(user?.name)}</div>
                                    <span>{user?.name?.split(' ')[0]}</span>
                                </div>
                                <button onClick={handleLogout} className="btn btn-ghost btn-sm btn-icon" title="Logout">
                                    <LogOut size={16} />
                                </button>
                            </>
                        )}

                        {/* Hamburger */}
                        <button
                            className={`hamburger ${drawerOpen ? 'open' : ''}`}
                            onClick={() => setDrawerOpen(!drawerOpen)}
                            aria-label="Toggle menu"
                        >
                            <span /><span /><span />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Drawer */}
            <div className={`mobile-drawer ${drawerOpen ? 'open' : ''}`}>
                <div className="mobile-drawer-search">
                    <form onSubmit={handleNavSearch} style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </form>
                </div>

                <Link to="/" className="nav-link" onClick={() => setDrawerOpen(false)}>🔍 Search</Link>
                <Link to="/institutions" className="nav-link" onClick={() => setDrawerOpen(false)}>🏛 Institutions</Link>
                <Link to="/analytics" className="nav-link" onClick={() => setDrawerOpen(false)}>📊 Impact Analytics</Link>

                {authenticated && (
                    <>
                        <Link to="/library" className="nav-link" onClick={() => setDrawerOpen(false)}>📚 My Library</Link>
                        <Link to={getDashboardLink()} className="nav-link" onClick={() => setDrawerOpen(false)}>⚙️ Dashboard</Link>
                        <button
                            onClick={handleLogout}
                            className="nav-link"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'var(--danger)', fontFamily: 'inherit', fontSize: 'inherit', width: '100%', fontWeight: '500', padding: '0.7rem 1rem', borderRadius: 'var(--radius-sm)' }}
                        >
                            🚪 Logout
                        </button>
                    </>
                )}
                {!authenticated && (
                    <>
                        <Link to="/login" className="nav-link" onClick={() => setDrawerOpen(false)}>Login</Link>
                        <Link to="/register" className="btn btn-primary" style={{ marginTop: '0.5rem' }} onClick={() => setDrawerOpen(false)}>Register</Link>
                    </>
                )}
            </div>
        </>
    );
}

export default Navbar;
