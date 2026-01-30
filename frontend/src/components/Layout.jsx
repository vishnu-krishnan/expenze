import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Activity,
    Calendar,
    Layers,
    User,
    LogOut,
    Settings,
    Users,
    Repeat,
    Menu,
    X,
    Smartphone
} from 'lucide-react';

export default function Layout({ children }) {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            document.body.style.position = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
            document.body.style.position = 'unset';
        };
    }, [mobileMenuOpen]);

    const isAdmin = user && user.role === 'admin';

    const navItems = isAdmin ? [
        { path: '/admin', label: 'Dashboard', icon: Activity },
        { path: '/admin/users', label: 'Users', icon: Users },
        { path: '/admin/regular', label: 'Regular Setup', icon: Repeat },
        { path: '/admin/settings', label: 'Settings', icon: Settings },
        { path: '/profile', label: 'Profile', icon: User },
    ] : [
        { path: '/', label: 'Dashboard', icon: Activity },
        { path: '/month', label: 'Monthly Plan', icon: Calendar },
        { path: '/import', label: 'Smart Import', icon: Smartphone },
        { path: '/regular', label: 'Regular Payments', icon: Repeat },
        { path: '/categories', label: 'Categories', icon: Layers },
        { path: '/profile', label: 'Profile', icon: User },
    ];

    const handleNavigate = (path) => {
        navigate(path);
        setMobileMenuOpen(false);
    };

    return (
        <div className="app-container">
            <header>
                <div className="logo" onClick={() => navigate(isAdmin ? '/admin' : '/')} style={{ cursor: 'pointer' }}>
                    <span className="rupee-icon">₹</span>
                    Expenze
                    <span className="tagline">
                        {isAdmin ? 'Admin Panel' : 'Smart Money Management'}
                    </span>
                </div>

                {/* Desktop Navigation (Visible > 1024px) */}
                <nav className="desktop-menu">
                    {navItems.map(item => (
                        <button
                            key={item.path}
                            className={(location.pathname === item.path || (item.path === '/' && location.pathname === '/dashboard')) ? 'active' : ''}
                            onClick={() => handleNavigate(item.path)}
                        >
                            <item.icon size={18} /> {item.label}
                        </button>
                    ))}
                    <button className="logout-btn" onClick={logout}>
                        <LogOut size={18} /> Logout
                    </button>
                </nav>

                {/* Mobile Toggle Button (Visible <= 1024px) */}
                <button className="mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            <main>
                {children}
            </main>

            {ReactDOM.createPortal(
                <>
                    {/* Mobile Navigation Drawer (Visible <= 1024px when open) */}
                    <nav
                        className={`mobile-menu ${mobileMenuOpen ? 'active' : ''}`}
                    >
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                style={{ background: 'transparent', border: 'none', color: 'white', padding: '0.5rem' }}
                            >
                                <X size={28} />
                            </button>
                        </div>

                        {navItems.map(item => (
                            <button
                                key={item.path}
                                className={(location.pathname === item.path || (item.path === '/' && location.pathname === '/dashboard')) ? 'active' : ''}
                                onClick={() => handleNavigate(item.path)}
                            >
                                <item.icon size={18} /> {item.label}
                            </button>
                        ))}
                        <button className="logout-btn" onClick={logout}>
                            <LogOut size={18} /> Logout
                        </button>
                    </nav>

                    {/* Mobile Menu Backdrop */}
                    {mobileMenuOpen && (
                        <div
                            className="mobile-backdrop"
                            onClick={() => setMobileMenuOpen(false)}
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                zIndex: 2147483639,
                                backdropFilter: 'blur(2px)'
                            }}
                        />
                    )}
                </>,
                document.body
            )}
        </div>
    );
}
