import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import OtpModal from '../components/OtpModal';
import {
    User,
    Mail,
    Phone,
    Shield,
    Save,
    AlertCircle,
    CheckCircle2,
    Wallet
} from 'lucide-react';

export default function Profile() {
    const { token } = useAuth();
    const [profile, setProfile] = useState({ username: '', email: '', phone: '', role: '', default_budget: 0 });
    const [originalEmail, setOriginalEmail] = useState('');
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(true);
    const [otpModalOpen, setOtpModalOpen] = useState(false);

    useEffect(() => {
        if (token) fetchProfile();
    }, [token]);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Failed to load profile');

            const data = await res.json();
            setProfile(data);
            setOriginalEmail(data.email);
        } catch (err) {
            setMsg('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setMsg('');

        try {
            // 1. Update Basic Profile Info (Phone, Budget)
            // Note: Backend now ignores 'email' in PUT /api/profile
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    phone: profile.phone,
                    default_budget: profile.default_budget
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update profile');

            // 2. Handle Email Change Logic
            if (profile.email !== originalEmail) {
                // Request Email Change OTP
                const otpRes = await fetch('/api/profile/request-email-change', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ newEmail: profile.email })
                });

                const otpData = await otpRes.json();
                if (!otpRes.ok) throw new Error(otpData.error || 'Failed to initiate email change');

                setOtpModalOpen(true);
                // Return here - we wait for OTP verification to complete the email update
                return;
            }

            setMsg('Profile Updated Successfully');
            setTimeout(() => setMsg(''), 3000);
        } catch (err) {
            setMsg('Error: ' + err.message);
        }
    };

    const handleVerifyOtp = async (otp) => {
        // Call verification endpoint
        const res = await fetch('/api/profile/verify-email-change', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ otp })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Verification failed');

        // Success
        setOtpModalOpen(false);
        setOriginalEmail(profile.email); // Sync original email
        setMsg('Profile & Email Updated Successfully');
        setTimeout(() => setMsg(''), 3000);
    };

    if (loading) {
        return (
            <section className="view active">
                <div className="panel" style={{ textAlign: 'center', padding: '5rem' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>Loading profile...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="view active">
            <div className="view-header">
                <div>
                    <h2><User size={24} style={{ marginRight: '0.75rem', color: 'var(--primary)' }} /> Profile Settings</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage your account information and preferences.</p>
                </div>
            </div>

            <div className="panel">
                {msg && (
                    <div className={`status-msg ${msg.includes('Error') ? 'status-error' : 'status-success'}`}>
                        {msg.includes('Error') ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                        {msg}
                    </div>
                )}

                <form onSubmit={handleUpdate}>
                    <div className="input-group">
                        <label><Shield size={16} color="var(--primary)" style={{ verticalAlign: 'text-bottom', marginRight: '0.5rem' }} /> Username</label>
                        <input
                            type="text"
                            value={profile.username || ''}
                            disabled
                            style={{ background: 'var(--bg-secondary)', opacity: 0.7, cursor: 'not-allowed' }}
                        />
                        <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                            Your unique identifier (cannot be changed)
                        </small>
                    </div>

                    <div className="split-layout" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label><Mail size={16} color="var(--primary)" style={{ verticalAlign: 'text-bottom', marginRight: '0.5rem' }} /> Email Address</label>
                            <input
                                type="email"
                                value={profile.email || ''}
                                onChange={e => setProfile({ ...profile, email: e.target.value })}
                                placeholder="your@email.com"
                                style={{
                                    border: profile.email !== originalEmail ? '1px solid var(--warning)' : '1px solid var(--border)',
                                    background: profile.email !== originalEmail ? 'var(--warning-light)' : 'white'
                                }}
                            />
                            {profile.email !== originalEmail && (
                                <small style={{ color: 'var(--warning-dark)', display: 'block', marginTop: '0.25rem' }}>
                                    Verification required to change email
                                </small>
                            )}
                        </div>

                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label><Phone size={16} color="var(--primary)" style={{ verticalAlign: 'text-bottom', marginRight: '0.5rem' }} /> Phone Number</label>
                            <input
                                type="tel"
                                value={profile.phone || ''}
                                onChange={e => setProfile({ ...profile, phone: e.target.value })}
                                placeholder="+91 98765 43210"
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label><Wallet size={16} color="var(--primary)" style={{ verticalAlign: 'text-bottom', marginRight: '0.5rem' }} /> Default Monthly Budget (₹)</label>
                        <input
                            type="number"
                            value={profile.default_budget || ''}
                            onChange={e => setProfile({ ...profile, default_budget: e.target.value })}
                            placeholder="e.g. 50000"
                        />
                        <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                            This amount will be used as the default budget for new months.
                        </small>
                    </div>

                    <button type="submit" className="primary" style={{ marginTop: '1rem', width: '100%' }}>
                        <Save size={18} /> Save Changes
                    </button>
                </form>
            </div>

            {/* OTP Verification Modal */}
            <OtpModal
                isOpen={otpModalOpen}
                onClose={() => setOtpModalOpen(false)}
                onVerify={handleVerifyOtp}
                email={profile.email}
            />
        </section>
    );
}
