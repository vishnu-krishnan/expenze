import { useState } from 'react';
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
    X
} from 'lucide-react';

export default function Layout({ children }) {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

                {/* Mobile Toggle Button */}
                <button className="mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                <nav className={`desktop-nav ${mobileMenuOpen ? 'mobile-active' : ''}`}>
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
            </header>

            <main>
                {children}
            </main>
        </div>
    );
}
