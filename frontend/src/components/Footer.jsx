import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-grid">
                    {/* Brand */}
                    <div className="footer-brand-col">
                        <div className="footer-logo">IK<span>MS</span></div>
                        <p className="footer-tagline">
                            Ethiopia's Open Access National Knowledge Repository — Free to Read, Free to Share.
                        </p>
                        <div className="eth-stripe">
                            <span style={{ background: 'var(--eth-green)' }} />
                            <span style={{ background: 'var(--eth-yellow)' }} />
                            <span style={{ background: 'var(--eth-red)' }} />
                        </div>
                    </div>

                    {/* Explore */}
                    <div className="footer-col">
                        <h4 className="footer-col-title">Explore</h4>
                        <Link to="/" className="footer-link">Search Publications</Link>
                        <Link to="/institutions" className="footer-link">Institutions</Link>
                        <Link to="/analytics" className="footer-link">Impact Analytics</Link>
                        <Link to="/library" className="footer-link">My Library</Link>
                    </div>

                    {/* Information */}
                    <div className="footer-col">
                        <h4 className="footer-col-title">Information</h4>
                        <a href="#about" className="footer-link">About IKMS</a>
                        <a href="#open-access" className="footer-link">Open Access Policy</a>
                        <a href="#faq" className="footer-link">FAQ</a>
                        <a href="#contact" className="footer-link">Contact Us</a>
                    </div>

                    {/* Legal */}
                    <div className="footer-col">
                        <h4 className="footer-col-title">Legal</h4>
                        <a href="#privacy" className="footer-link">Privacy Policy</a>
                        <a href="#terms" className="footer-link">Terms of Use</a>
                        <a href="#cc" className="footer-link">Creative Commons (CC BY 4.0)</a>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p className="footer-copy">© {year} IKMS – Institutional Knowledge Management System. All rights reserved.</p>
                    <p className="footer-copy">
                        Content licensed under{' '}
                        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer" className="footer-cc-link">
                            CC BY 4.0
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
