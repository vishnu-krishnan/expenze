import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="app-container">
            <header>
                <div className="logo">
                    <span className="rupee-icon">₹</span>
                    Expenze
                    <span className="tagline">Smart Money Management</span>
                </div>
                <nav className="desktop-nav">
                    <button onClick={() => navigate('/')}>Dashboard</button>
                    <button onClick={() => navigate('/month')}>Monthly Plan</button>
                    <button onClick={() => navigate('/categories')}>Categories</button>
                    <button onClick={() => navigate('/templates')}>Templates</button>
                    <button onClick={() => navigate('/profile')}>Profile</button>
                    {user && user.role === 'admin' && <button className="danger" onClick={() => navigate('/admin')}>Admin</button>}
                    <button onClick={logout}>Logout</button>
                </nav>
            </header>
            <main>
                {children}
            </main>
        </div>
    );
}

