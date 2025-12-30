import { useState, useEffect } from 'react';

export default function Admin() {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        const res = await fetch('/api/admin/users');
        if (res.ok) {
            setUsers(await res.json());
        }
    };

    const toggleRole = async (u) => {
        const newRole = u.role === 'admin' ? 'user' : 'admin';
        if (!confirm(`Change role to ${newRole}?`)) return;

        await fetch(`/api/admin/users/${u.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: newRole, is_verified: 1 })
        });
        fetchUsers();
    };

    const deleteUser = async (id) => {
        if (!confirm('Delete this user?')) return;
        await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
        fetchUsers();
    };

    return (
        <section className="view active">
            <h2>Admin Panel - User Management</h2>
            <div className="panel">
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
            </div>
        </section>
    );
}
