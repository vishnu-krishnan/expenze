import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { getApiUrl } from '../utils/apiConfig';
import forgotImg from '../assets/forgot_password.jpg';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [showPass, setShowPass] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMsg({ type: '', text: '' });

        if (password !== confirmPassword) {
            setMsg({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        if (password.length < 6) {
            setMsg({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(getApiUrl('/api/v1/reset-password'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password })
            });
            const data = await res.json();

            if (res.ok) {
                setMsg({ type: 'success', text: 'Password reset successfully! Redirecting...' });
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setMsg({ type: 'error', text: data.error || 'Failed to reset password' });
            }
        } catch (err) {
            setMsg({ type: 'error', text: 'Something went wrong.' });
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="auth-container">
                <div className="auth-card" style={{ textAlign: 'center' }}>
                    <h3>Invalid Link</h3>
                    <p>No token provided. Please use the link from your email.</p>
                    <button className="primary auth-btn" onClick={() => navigate('/login')}>Back to Login</button>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page-wrapper" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            background: 'transparent'
        }}>
            <div className="auth-card-split" style={{
                display: 'flex',
                maxWidth: '1000px',
                width: '100%',
                background: 'var(--bg-card)',
                borderRadius: '16px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                minHeight: '600px'
            }}>
                {/* Image Section */}
                <div className="auth-image-side" style={{
                    flex: '1',
                    background: 'var(--bg-secondary)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <img
                        src={forgotImg}
                        alt="Finance Management"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            position: 'absolute',
                            top: 0,
                            left: 0
                        }}
                    />
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '3rem 2rem',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
                        color: 'white',
                        textAlign: 'center'
                    }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>Secure Your Account</h3>
                        <p style={{ margin: 0, fontSize: '0.95rem', color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                            Choose a strong password to protect your financial data.
                        </p>
                    </div>
                </div>

                {/* Form Section */}
                <div className="auth-form-side" style={{
                    flex: '1',
                    padding: '3rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                }}>
                    <div className="auth-header">
                        <div className="logo" style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>
                            <span className="rupee-icon" style={{ background: 'var(--primary)', color: 'white', width: '32px', height: '32px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px' }}>₹</span>
                            Expenze
                        </div>
                        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Reset Password</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>Enter your new password below.</p>
                    </div>

                    {msg.text && (
                        <div className={`status-msg status-${msg.type}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            {msg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                            {msg.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label>New Password</label>
                            <div className="input-wrapper">
                                <Lock className="input-icon" size={20} />
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="New Password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    style={{
                                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: '4px', display: 'flex', alignItems: 'center'
                                    }}
                                    tabIndex={-1}
                                >
                                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Confirm Password</label>
                            <div className="input-wrapper">
                                <Lock className="input-icon" size={20} />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm Password"
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="primary auth-btn" disabled={loading} style={{ marginTop: '1rem' }}>
                            {loading ? <><Loader2 className="animate-spin" size={20} /> Resetting...</> : 'Reset Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
