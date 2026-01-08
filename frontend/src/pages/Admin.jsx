import { useState, useEffect } from 'react';
import { getApiUrl } from '../utils/apiConfig';
import {
    Users,
    Shield,
    Trash2,
    UserCheck,
    ArrowUpCircle,
    ArrowDownCircle,
    AlertCircle
} from 'lucide-react';

export default function Admin() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl('/api/v1/admin/users'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                throw new Error(res.status === 403 ? 'Access denied. Admin only.' : 'Failed to fetch users');
            }

            const data = await res.json();
            setUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const toggleRole = async (u) => {
        const newRole = u.role === 'admin' ? 'user' : 'admin';
        if (!confirm(`Change role to ${newRole}?`)) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl(`/api/v1/admin/users/${u.id}`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role: newRole, is_verified: 1 })
            });

            if (!res.ok) throw new Error('Failed to update role');
            fetchUsers();
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    const deleteUser = async (id) => {
        if (!confirm('Delete this user?')) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl(`/api/v1/admin/users/${id}`), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Failed to delete user');
            fetchUsers();
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    if (loading) {
        return (
            <section className="view active">
                <div className="panel" style={{ textAlign: 'center', padding: '5rem' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>Loading user list...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="view active">
            <div className="view-header">
                <div>
                    <h2><Users size={24} style={{ marginRight: '0.75rem', color: 'var(--primary)' }} /> User Management</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>View and manage roles for all registered accounts.</p>
                </div>
            </div>

            {error && (
                <div className="status-msg status-error" style={{ marginBottom: '2rem' }}>
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            <div className="panel">
                {users.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No users found</p>
                        <small>New users will appear here after registration</small>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Role</th>
                                    <th>Verified</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td>{u.username}</td>
                                        <td>{u.email || '-'}</td>
                                        <td>{u.phone || '-'}</td>
                                        <td>
                                            <span className={`badge ${u.role === 'admin' ? 'badge-success' : 'badge-inactive'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td>{u.is_verified ? '✅' : '❌'}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="primary" onClick={() => toggleRole(u)}>
                                                    {u.role === 'admin' ? 'Demote' : 'Promote'}
                                                </button>
                                                <button className="danger" onClick={() => deleteUser(u.id)}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    );
}
