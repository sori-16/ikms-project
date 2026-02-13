// Created by: Soreti (Team Leader) - Demo Implementation
import { Link, useNavigate } from 'react-router-dom';
import { isAuthenticated, getUser, logout } from '../utils/auth';
import './Navbar.css';

function Navbar() {
    const authenticated = isAuthenticated();
    const user = getUser();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="navbar glass-panel">
            <div className="navbar-container">
                <Link to="/" className="navbar-brand">
                    IKMS
                </Link>

                <div className="navbar-links">
                    {!authenticated ? (
                        <>
                            <Link to="/" className="nav-link">Search</Link>
                            <Link to="/login" className="nav-link">Login</Link>
                            <Link to="/register" className="nav-link btn-primary-small">Register</Link>
                        </>
                    ) : (
                        <>
                            <Link to="/" className="nav-link">Search</Link>
                            {user?.role === 'moderator' || user?.role === 'sys_admin' ? (
                                <Link to="/moderator-dashboard" className="nav-link">Dashboard</Link>
                            ) : (
                                <Link to="/researcher-dashboard" className="nav-link">Dashboard</Link>
                            )}
                            <span className="nav-user">Hi, {user?.name}</span>
                            <button onClick={handleLogout} className="nav-link btn-logout">
                                Logout
                            </button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
