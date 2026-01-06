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
    const { token, logout } = useAuth();
    const [profile, setProfile] = useState({ username: '', email: '', phone: '', role: '', defaultBudget: 0 });
    const [originalEmail, setOriginalEmail] = useState('');
    const [originalPhone, setOriginalPhone] = useState('');
    const [originalBudget, setOriginalBudget] = useState(0);
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(true);
    const [otpModalOpen, setOtpModalOpen] = useState(false);

    useEffect(() => {
        if (token) fetchProfile();
    }, [token]);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/v1/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 401 || res.status === 403) {
                logout();
                return;
            }

            if (!res.ok) throw new Error(`Failed to load profile (Status: ${res.status})`);

            const data = await res.json();
            setProfile(data);
            setOriginalEmail(data.email);
            setOriginalPhone(data.phone || '');
            setOriginalBudget(data.defaultBudget || 0);
        } catch (err) {
            setMsg('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setMsg('');

        // Check if anything has actually changed
        const phoneChanged = profile.phone !== originalPhone;
        const emailChanged = profile.email !== originalEmail;
        const budgetChanged = Number(profile.defaultBudget) !== Number(originalBudget);

        if (!phoneChanged && !emailChanged && !budgetChanged) {
            setMsg('No changes detected');
            setTimeout(() => setMsg(''), 3000);
            return;
        }

        try {
            // 1. Update Basic Profile Info (Phone, Budget) - only if changed
            if (phoneChanged || budgetChanged) {
                const res = await fetch('/api/v1/profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        phone: profile.phone,
                        defaultBudget: profile.defaultBudget
                    })
                });

                if (res.status === 401 || res.status === 403) {
                    logout();
                    return;
                }

                // Safe JSON parsing
                let data;
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    data = await res.json();
                } else {
                    // If not JSON (likely HTML error page), throw status error
                    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
                    data = {}; // default
                }

                if (!res.ok) throw new Error(data.error || 'Failed to update profile');

                // Update original values after successful update
                setOriginalPhone(profile.phone);
                setOriginalBudget(profile.defaultBudget);
            }

            // 2. Handle Email Change Logic
            if (emailChanged) {
                // Request Email Change OTP
                const otpRes = await fetch('/api/v1/profile/request-email-change', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ newEmail: profile.email })
                });

                if (otpRes.status === 401 || otpRes.status === 403) {
                    logout();
                    return;
                }

                let otpData;
                const otpContentType = otpRes.headers.get("content-type");
                if (otpContentType && otpContentType.includes("application/json")) {
                    otpData = await otpRes.json();
                } else {
                    if (!otpRes.ok) throw new Error(`Request failed with status ${otpRes.status}`);
                    otpData = {};
                }

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
        const res = await fetch('/api/v1/profile/verify-email-change', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ otp })
        });

        if (res.status === 401 || res.status === 403) {
            logout();
            return;
        }

        const data = await res.json().catch(() => ({}));
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

            {msg && (
                <div className={`status-popup ${msg.includes('Error') ? 'status-error' :
                    msg.includes('No changes') ? 'status-warning' :
                        'status-success'
                    }`}>
                    {msg}
                </div>
            )}

            <div className="panel">
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

                    <div className="form-split">
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
                            value={profile.defaultBudget || ''}
                            onChange={e => setProfile({ ...profile, defaultBudget: e.target.value })}
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
