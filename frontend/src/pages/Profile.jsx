import { useState, useEffect } from 'react';

export default function Profile() {
    const [profile, setProfile] = useState({ username: '', email: '', phone: '', role: '' });
    const [msg, setMsg] = useState('');

    useEffect(() => {
        fetch('/api/profile')
            .then(res => res.json())
            .then(data => setProfile(data))
            .catch(err => console.error(err));
    }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: profile.email, phone: profile.phone })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setMsg('Profile Updated Successfully');
        } catch (err) {
            setMsg('Error: ' + err.message);
        }
    };

    return (
        <section className="view active">
            <h2>User Profile</h2>
            <div className="panel" style={{ maxWidth: '600px' }}>
                {msg && <div style={{ marginBottom: '1rem', color: msg.includes('Error') ? 'red' : 'green' }}>{msg}</div>}
                <form onSubmit={handleUpdate}>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label>Username</label>
                        <input type="text" value={profile.username} disabled style={{ background: 'var(--bg-primary)' }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label>Email</label>
                        <input type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label>Phone</label>
                        <input type="tel" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label>Role</label>
                        <div className="badge badge-inactive" style={{ display: 'inline-block', marginTop: '0.5rem' }}>{profile.role.toUpperCase()}</div>
                    </div>
                    <button type="submit" className="primary">Save Changes</button>
                </form>
            </div>
        </section>
    );
}
