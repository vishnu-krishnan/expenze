import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserCircle2, Lock, Loader2, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { validateUsername, sanitizeInput } from '../utils/validation';
import { getApiUrl } from '../utils/apiConfig';
import loginImg from '../assets/login.jpg';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [errors, setErrors] = useState({ username: '', password: '', general: '' });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [view, setView] = useState('login'); // login | forgot
    const [resetEmail, setResetEmail] = useState('');
    const [resetStatus, setResetStatus] = useState({ type: '', msg: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        const sanitized = sanitizeInput(value);
        setFormData({ ...formData, [name]: sanitized });
        setErrors({ ...errors, [name]: '', general: '' });
    };

    const validateForm = () => {
        const newErrors = { username: '', password: '', general: '' };
        let isValid = true;

        const usernameValidation = validateUsername(formData.username);
        if (!usernameValidation.isValid) {
            newErrors.username = usernameValidation.error;
            isValid = false;
        }

        if (!formData.password || formData.password.trim() === '') {
            newErrors.password = 'Password is required';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrors({ username: '', password: '', general: '' });

        if (!validateForm()) return;

        setLoading(true);

        try {
            const loginUrl = getApiUrl('/api/v1/login');
            console.log('Attempting login to:', loginUrl);
            const res = await fetch(loginUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: formData.username.trim(),
                    password: formData.password
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 401) {
                    throw new Error('Invalid username or password');
                } else {
                    throw new Error(data.error || 'Login failed. Please try again.');
                }
            }

            login(data.user, data.token);
            setFormData({ username: '', password: '' });
            navigate('/');
        } catch (err) {
            console.error('Login error:', err);
            setErrors({
                ...errors,
                general: err.message || 'An unexpected error occurred.'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResetStatus({ type: '', msg: '' });

        try {
            const res = await fetch(getApiUrl('/api/v1/forgot-password'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail })
            });
            const data = await res.json();

            if (res.ok) {
                setResetStatus({ type: 'success', msg: data.message });
            } else {
                setResetStatus({ type: 'error', msg: data.error || 'Failed to send reset link' });
            }
        } catch (err) {
            setResetStatus({ type: 'error', msg: 'Something went wrong.' });
        } finally {
            setLoading(false);
        }
    };

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
                        src={loginImg}
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
                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>Master Your Finances</h3>
                        <p style={{ margin: 0, fontSize: '0.95rem', color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                            Track spending, plan budgets, and achieve your financial goals with Expenze.
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
                        {view === 'login' ? (
                            <>
                                <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Welcome Back</h2>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Sign in to manage your finances</p>
                            </>
                        ) : (
                            <>
                                <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Forgot Password</h2>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Enter your email to receive a reset link</p>
                            </>
                        )}
                    </div>

                    {view === 'login' ? (
                        <>
                            {errors.general && (
                                <div className="status-msg status-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                    <AlertCircle size={18} />
                                    {errors.general}
                                </div>
                            )}

                            <form onSubmit={handleLogin} noValidate>
                                <div className="input-group">
                                    <label htmlFor="username">Username</label>
                                    <div className="input-wrapper">
                                        <UserCircle2 className="input-icon" size={20} />
                                        <input
                                            id="username"
                                            type="text"
                                            name="username"
                                            placeholder="Enter your username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            required
                                            autoFocus
                                            autoComplete="username"
                                            maxLength={30}
                                            disabled={loading}
                                            aria-invalid={errors.username ? 'true' : 'false'}
                                        />
                                    </div>
                                    {errors.username && (
                                        <small style={{ color: 'var(--danger)', display: 'block', marginTop: '0.25rem' }}>
                                            {errors.username}
                                        </small>
                                    )}
                                </div>

                                <div className="input-group">
                                    <label htmlFor="password">Password</label>
                                    <div className="input-wrapper" style={{ position: 'relative' }}>
                                        <Lock className="input-icon" size={20} />
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            placeholder="Enter your password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                            autoComplete="current-password"
                                            maxLength={128}
                                            disabled={loading}
                                            aria-invalid={errors.password ? 'true' : 'false'}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{
                                                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: '4px',
                                                display: 'flex', alignItems: 'center'
                                            }}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <small style={{ color: 'var(--danger)', display: 'block', marginTop: '0.25rem' }}>
                                            {errors.password}
                                        </small>
                                    )}
                                    <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                                        <span
                                            onClick={() => setView('forgot')}
                                            style={{ color: 'var(--primary)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '500' }}
                                        >
                                            Forgot Password?
                                        </span>
                                    </div>
                                </div>

                                <button type="submit" className="primary auth-btn" disabled={loading} style={{ marginTop: '1rem' }}>
                                    {loading ? <><Loader2 className="animate-spin" size={20} /> Signing in...</> : 'Sign In'}
                                </button>
                            </form>

                            <div className="toggle-link" onClick={() => !loading && navigate('/register')} style={{ marginTop: '1.5rem', textAlign: 'center', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
                                Don't have an account? <strong>Sign Up</strong>
                            </div>
                        </>
                    ) : (
                        // Forgot Password View
                        <>
                            {resetStatus.msg && (
                                <div className={`status-msg ${resetStatus.type === 'error' ? 'status-error' : 'status-success'}`}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                    {resetStatus.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                                    {resetStatus.msg}
                                </div>
                            )}

                            <form onSubmit={handleForgotSubmit}>
                                <div className="input-group">
                                    <label htmlFor="resetEmail">Email Address</label>
                                    <div className="input-wrapper">
                                        <UserCircle2 className="input-icon" size={20} />
                                        <input
                                            id="resetEmail"
                                            type="email"
                                            placeholder="e.g. user@example.com"
                                            value={resetEmail}
                                            onChange={e => setResetEmail(e.target.value)}
                                            required
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="primary auth-btn" disabled={loading} style={{ marginTop: '1rem' }}>
                                    {loading ? <><Loader2 className="animate-spin" size={20} /> Sending...</> : 'Send Reset Link'}
                                </button>
                            </form>

                            <div className="toggle-link" onClick={() => { setView('login'); setResetStatus({ type: '', msg: '' }); }} style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                                Back to <strong>Sign In</strong>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
