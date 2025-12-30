import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Users,
    ShieldCheck,
    UserCheck,
    User,
    Settings,
    Activity,
    BarChart3,
    Shield,
    Clock,
    Info,
    ChevronRight,
    LayoutDashboard
} from 'lucide-react';

export default function AdminDashboard() {
    const { token } = useAuth();
    const [stats, setStats] = useState({
        totalUsers: 0,
        adminUsers: 0,
        regularUsers: 0,
        verifiedUsers: 0,
        recentUsers: []
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (token) fetchStats();
    }, [token]);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const users = await res.json();
                setStats({
                    totalUsers: users.length,
                    adminUsers: users.filter(u => u.role === 'admin').length,
                    regularUsers: users.filter(u => u.role === 'user').length,
                    verifiedUsers: users.filter(u => u.is_verified).length,
                    recentUsers: users.slice(0, 5) // Last 5 users
                });
            }
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <section className="view active">
                <div className="panel" style={{ margin: '2rem 0', textAlign: 'center', padding: '5rem' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>Loading overview...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="view active">
            <div className="view-header">
                <div>
                    <h2><Activity size={24} style={{ marginRight: '0.75rem', color: 'var(--primary)' }} /> Admin Dashboard</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>System overview and high-level management.</p>
                </div>
            </div>

            <div className="cards-container">
                <div className="card">
                    <div className="card-header-icon">
                        <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Total Users</span>
                        <div className="icon-wrapper primary"><Users size={20} /></div>
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.totalUsers}</div>
                    <small style={{ color: 'var(--text-light)' }}>Registered accounts</small>
                </div>

                <div className="card">
                    <div className="card-header-icon">
                        <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Verified</span>
                        <div className="icon-wrapper success"><ShieldCheck size={20} /></div>
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.verifiedUsers}</div>
                    <small style={{ color: 'var(--text-light)' }}>
                        {stats.totalUsers > 0 ? `${Math.round((stats.verifiedUsers / stats.totalUsers) * 100)}%` : '0%'} rate
                    </small>
                </div>

                <div className="card">
                    <div className="card-header-icon">
                        <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Admins</span>
                        <div className="icon-wrapper warning"><Shield size={20} /></div>
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.adminUsers}</div>
                    <small style={{ color: 'var(--text-light)' }}>Privileged accounts</small>
                </div>

                <div className="card">
                    <div className="card-header-icon">
                        <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Regular</span>
                        <div className="icon-wrapper info"><User size={20} /></div>
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.regularUsers}</div>
                    <small style={{ color: 'var(--text-light)' }}>Standard users</small>
                </div>
            </div>

            <div className="panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={18} color="var(--primary)" /> Recent Users
                    </h3>
                    <button className="small" onClick={() => navigate('/admin/users')}>View All</button>
                </div>

                {stats.recentUsers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>No recent activity</div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th style={{ textAlign: 'center' }}>Status</th>
                                    <th style={{ textAlign: 'center' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentUsers.map(user => (
                                    <tr key={user.id}>
                                        <td style={{ fontWeight: '600' }}>{user.username}</td>
                                        <td>{user.email || '-'}</td>
                                        <td>
                                            <span className={`badge ${user.role === 'admin' ? 'badge-info' : 'badge-inactive'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {user.is_verified ?
                                                <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', fontSize: '0.85rem' }}><UserCheck size={14} /> Verified</span> :
                                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Pending</span>
                                            }
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button className="small" onClick={() => navigate('/admin/users')}><ChevronRight size={14} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="panel" style={{ borderLeft: '4px solid var(--primary)', background: 'var(--bg-secondary)' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Info size={18} color="var(--primary)" /> System Information
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Version</div>
                        <div style={{ fontWeight: '600' }}>Expenze v1.2</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Stack</div>
                        <div style={{ fontWeight: '600' }}>Node.js / React / SQLite</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Environment</div>
                        <div style={{ fontWeight: '600', color: 'var(--success)' }}>{window.location.hostname === 'localhost' ? 'DEV' : 'PROD'}</div>
                    </div>
                </div>
            </div>
        </section>
    );
}
