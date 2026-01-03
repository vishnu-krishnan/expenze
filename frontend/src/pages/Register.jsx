import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle2, Lock, Mail, Phone, Loader2, KeyRound } from 'lucide-react';

export default function Register() {
    const navigate = useNavigate();
    const [mode, setMode] = useState('REGISTER'); // REGISTER or VERIFY
    const [formData, setFormData] = useState({ username: '', password: '', email: '', phone: '' });
    const [otp, setOtp] = useState('');
    const [pendingEmail, setPendingEmail] = useState('');
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [loading, setLoading] = useState(false);
    const [testOtp, setTestOtp] = useState(null);
    const [otpExpiry, setOtpExpiry] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);
    const [deliveryStatus, setDeliveryStatus] = useState('pending'); // pending, sent, failed
    const [deliveryError, setDeliveryError] = useState(null);
    const [otpTimeout, setOtpTimeout] = useState(2); // In minutes

    // Fetch OTP Timeout on mount
    useEffect(() => {
        const fetchTimeout = async () => {
            try {
                const res = await fetch('/api/v1/settings/otp_timeout');
                if (res.ok) {
                    const data = await res.json();
                    if (data.setting_value) setOtpTimeout(parseInt(data.setting_value));
                }
            } catch (err) {
                console.error('Failed to fetch OTP timeout:', err);
            }
        };
        fetchTimeout();
    }, []);

    // Countdown timer for OTP expiry
    useEffect(() => {
        if (!otpExpiry) return;

        const timer = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, Math.floor((otpExpiry - now) / 1000));
            setTimeLeft(remaining);

            if (remaining === 0) {
                setError(`OTP Expired. Please register again.`);
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [otpExpiry]);

    // Polling for email delivery status
    useEffect(() => {
        if (mode !== 'VERIFY' || deliveryStatus !== 'pending') return;

        let attempts = 0;
        const maxAttempts = 15; // 45 seconds total

        const poll = setInterval(async () => {
            attempts++;
            try {
                const res = await fetch(`/api/v1/registration-status/${pendingEmail}`);
                const data = await res.json();

                if (data.delivery_status !== 'pending') {
                    setDeliveryStatus(data.delivery_status);
                    setDeliveryError(data.delivery_error);
                    clearInterval(poll);

                    if (data.delivery_status === 'failed') {
                        setError(`Email Delivery Problem: ${data.delivery_error || 'Check SMTP settings'}`);
                    }
                }
            } catch (err) {
                console.error('Status polling error:', err);
            }

            if (attempts >= maxAttempts) {
                clearInterval(poll);
                // If still pending, don't show "Failed", just stop polling
                if (deliveryStatus === 'pending') {
                    console.log('Polling timed out, assuming transition to manual check');
                }
            }
        }, 3000);

        return () => clearInterval(poll);
    }, [mode, deliveryStatus, pendingEmail]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setInfo('');
        setLoading(true);
        setDeliveryStatus('pending');
        setDeliveryError(null);
        try {
            const res = await fetch('/api/v1/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setPendingEmail(data.email);
            setInfo(data.message);
            if (data.testOtp) setTestOtp(data.testOtp);

            // Set OTP expiry based on backend response or setting
            const timeout = data.otp_timeout || otpTimeout;
            setOtpTimeout(timeout);
            setOtpExpiry(Date.now() + timeout * 60 * 1000);
            setTimeLeft(timeout * 60);

            setMode('VERIFY');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');
        setInfo(''); // Clear old success status
        setLoading(true);
        try {
            const res = await fetch('/api/v1/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: pendingEmail, otp })
            });

            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Server returned invalid response. Please try again or check logs.');
            }

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setInfo('Account verified! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setError('');
        setInfo('');
        setLoading(true);
        setDeliveryStatus('pending');
        setDeliveryError(null);
        try {
            const res = await fetch('/api/v1/resend-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: pendingEmail })
            });

            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Server returned invalid response. Please try again.');
            }

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setInfo(data.message);
            const timeout = data.otp_timeout || otpTimeout;
            setOtpTimeout(timeout);
            setOtpExpiry(Date.now() + timeout * 60 * 1000);
            setTimeLeft(timeout * 60);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="logo" style={{ marginBottom: '1rem' }}>
                        <span className="rupee-icon">₹</span>
                        Expenze
                    </div>
                    <h2>{mode === 'REGISTER' ? 'Create Account' : 'Verify Your Account'}</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {mode === 'REGISTER'
                            ? 'Join Expenze to manage your finances'
                            : `A verification code has been sent to ${pendingEmail}`}
                    </p>
                </div>

                {error && <div className="status-msg status-error">{error}</div>}
                {info && <div className="status-msg status-success">{info}</div>}

                {mode === 'VERIFY' && (
                    <div style={{
                        marginTop: '1.25rem',
                        padding: '1rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: '0.75rem',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Email Status:</span>
                            <span style={{
                                fontWeight: '600',
                                color: deliveryStatus === 'sent' ? 'var(--success)' :
                                    deliveryStatus === 'failed' ? 'var(--danger)' : 'var(--warning)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                            }}>
                                {deliveryStatus === 'sent' ? '✅ Delivered' :
                                    deliveryStatus === 'failed' ? '❌ Failed' : '⌛ Sending...'}
                            </span>
                        </div>

                        {timeLeft !== null && timeLeft > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>OTP Expires in:</span>
                                <span style={{
                                    fontWeight: '700',
                                    color: timeLeft < 30 ? 'var(--danger)' : 'var(--primary)',
                                    fontVariantNumeric: 'tabular-nums'
                                }}>
                                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {mode === 'REGISTER' && (
                    <form onSubmit={handleRegister}>
                        <div className="input-group">
                            <label>Username</label>
                            <div className="input-wrapper">
                                <UserCircle2 className="input-icon" size={20} />
                                <input type="text" name="username" placeholder="Choose a username" value={formData.username} onChange={handleChange} required autoFocus />
                            </div>
                        </div>
                        <div className="input-group">
                            <label>Email Address</label>
                            <div className="input-wrapper">
                                <Mail className="input-icon" size={20} />
                                <input type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required />
                            </div>
                        </div>
                        <div className="input-group">
                            <label>Phone (Optional)</label>
                            <div className="input-wrapper">
                                <Phone className="input-icon" size={20} />
                                <input type="tel" name="phone" placeholder="+91 98765 43210" value={formData.phone} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="input-group">
                            <label>Password</label>
                            <div className="input-wrapper">
                                <Lock className="input-icon" size={20} />
                                <input type="password" name="password" placeholder="Create a strong password" value={formData.password} onChange={handleChange} required />
                            </div>
                        </div>
                        <button type="submit" className="primary auth-btn" disabled={loading}>
                            {loading ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Loader2 className="animate-spin" size={18} />
                                    Creating Account...
                                </span>
                            ) : 'Create Account'}
                        </button>
                    </form>
                )}

                {mode === 'VERIFY' && (
                    <form onSubmit={handleVerify} style={{ marginTop: '1.5rem' }}>
                        <div className="input-group">
                            <label>One-Time Password</label>
                            <div className="input-wrapper">
                                <KeyRound className="input-icon" size={20} />
                                <input
                                    className="otp-box"
                                    type="text"
                                    placeholder="------"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                    autoFocus
                                    disabled={timeLeft === 0}
                                />
                            </div>
                            {testOtp && (
                                <div style={{
                                    marginTop: '0.75rem',
                                    fontSize: '0.75rem',
                                    color: '#4b5563',
                                    background: '#f3f4f6',
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: '0.5rem',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    border: '1px dashed #d1d5db'
                                }}>
                                    <span>Dev Mode OTP:</span>
                                    <strong style={{ color: 'var(--primary)', letterSpacing: '1px' }}>{testOtp}</strong>
                                </div>
                            )}
                        </div>
                        <button type="submit" className="primary auth-btn" disabled={loading || timeLeft === 0}>
                            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Verify & Access'}
                        </button>

                        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                            <button
                                type="button"
                                className="text-btn"
                                onClick={handleResendOtp}
                                disabled={loading}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--primary)',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    width: '100%'
                                }}
                            >
                                {loading && deliveryStatus === 'pending' ? <Loader2 className="animate-spin" size={14} /> : 'Didn\'t receive code? Resend OTP'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Action Links */}
                <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column', alignItems: 'center', marginTop: '1rem' }}>
                    {mode === 'VERIFY' ? (
                        <>
                            {timeLeft === 0 && (
                                <div
                                    className="toggle-link"
                                    onClick={() => {
                                        setError('');
                                        setInfo('');
                                        setTestOtp(null);
                                        setOtpExpiry(null);
                                        setTimeLeft(null);
                                        setMode('REGISTER');
                                    }}
                                >
                                    <span style={{ fontSize: '0.85rem' }}>Entered the wrong email?</span>
                                    <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: '600', marginLeft: '0.25rem' }}>Change it here</span>
                                </div>
                            )}
                            <div className="toggle-link" onClick={() => navigate('/login')}>
                                ← Back to Login
                            </div>
                        </>
                    ) : (
                        <div className="toggle-link" onClick={() => navigate('/login')}>
                            Already have an account? Sign In
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
