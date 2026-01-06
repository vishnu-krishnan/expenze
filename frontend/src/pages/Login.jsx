import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserCircle2, Lock, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { validateUsername, sanitizeInput } from '../utils/validation';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [errors, setErrors] = useState({ username: '', password: '', general: '' });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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
            const res = await fetch('/api/v1/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    username: formData.username.trim(),
                    password: formData.password
                }),
                credentials: 'same-origin'
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

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="logo" style={{ marginBottom: '1rem' }}>
                        <span className="rupee-icon">₹</span>
                        Expenze
                    </div>
                    <h2>Welcome Back</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Sign in to manage your finances
                    </p>
                </div>

                {errors.general && (
                    <div className="status-msg status-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                    </div>

                    <button type="submit" className="primary auth-btn" disabled={loading}>
                        {loading ? <><Loader2 className="animate-spin" size={20} /> Signing in...</> : 'Sign In'}
                    </button>
                </form>

                <div className="toggle-link" onClick={() => !loading && navigate('/register')} style={{ cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
                    Don't have an account? <strong>Sign Up</strong>
                </div>
            </div>
        </div>
    );
}
