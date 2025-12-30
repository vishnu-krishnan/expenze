import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserCircle2, Lock, Mail, Phone, ArrowRight, Loader2, KeyRound } from 'lucide-react';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [mode, setMode] = useState('LOGIN'); // LOGIN, REGISTER, VERIFY
    const [formData, setFormData] = useState({ username: '', password: '', email: '', phone: '' });
    const [otp, setOtp] = useState('');
    const [pendingEmail, setPendingEmail] = useState('');
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [loading, setLoading] = useState(false);
    const [testOtp, setTestOtp] = useState(null);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: formData.username, password: formData.password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            login(data.user, data.token);
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setInfo('');
        setLoading(true);
        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setPendingEmail(data.email);
            setInfo(data.message);
            if (data.testOtp) setTestOtp(data.testOtp);
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
        setLoading(true);
        try {
            const res = await fetch('/api/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: pendingEmail, otp })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            login(data.user, data.token);
            navigate('/');
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
                    <div className="logo" style={{ justifyContent: 'center', marginBottom: '1rem' }}>
                        <span className="rupee-icon" style={{ fontSize: '2.5rem' }}>₹</span>
                        <span style={{ fontSize: '2rem', color: 'var(--primary)', fontWeight: '800' }}>Expenze</span>
                    </div>
                    <h1>{mode === 'LOGIN' ? 'Welcome Back' : mode === 'REGISTER' ? 'Create Account' : 'Verify OTP'}</h1>
                    <p>
                        {mode === 'LOGIN' ? 'Enter your credentials to access your account' :
                            mode === 'REGISTER' ? 'Start managing your finances today' :
                                'check your email for the verification code'}
                    </p>
                </div>

                {error && <div className="status-msg status-error">{error}</div>}
                {info && <div className="status-msg status-success">{info}</div>}

                {mode === 'LOGIN' && (
                    <form onSubmit={handleLogin}>
                        <div className="input-group">
                            <label>Username</label>
                            <div className="input-wrapper">
                                <UserCircle2 className="input-icon" size={20} />
                                <input type="text" name="username" placeholder="Enter username" value={formData.username} onChange={handleChange} required autoFocus />
                            </div>
                        </div>
                        <div className="input-group">
                            <label>Password</label>
                            <div className="input-wrapper">
                                <Lock className="input-icon" size={20} />
                                <input type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
                            </div>
                        </div>
                        <button type="submit" className="primary auth-btn" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" /> : <>Sign In <ArrowRight size={20} /></>}
                        </button>
                    </form>
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
                            {loading ? <Loader2 className="animate-spin" /> : 'Create Account'}
                        </button>
                    </form>
                )}

                {mode === 'VERIFY' && (
                    <form onSubmit={handleVerify}>
                        <div className="input-group">
                            <label>One-Time Password</label>
                            <div className="input-wrapper">
                                <KeyRound className="input-icon" size={20} />
                                <input className="otp-box" type="text" placeholder="------" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} required autoFocus />
                            </div>
                            {testOtp && <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#666', background: '#f5f5f5', padding: '0.5rem', borderRadius: '4px' }}>Dev Mode OTP: <strong>{testOtp}</strong></div>}
                        </div>
                        <button type="submit" className="primary auth-btn" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" /> : 'Verify & Access'}
                        </button>
                    </form>
                )}

                <div className="toggle-link" onClick={() => {
                    setError(''); setInfo('');
                    setMode(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN');
                }}>
                    {mode === 'LOGIN' ? "Don't have an account? Sign Up" : mode === 'REGISTER' ? 'Already have an account? Sign In' : 'Back to Login'}
                </div>
            </div>
        </div>
    );
}
