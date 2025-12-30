import { useState, useEffect } from 'react';
import { X, ShieldCheck, Loader } from 'lucide-react';

export default function OtpModal({ isOpen, onClose, onVerify, email, timeoutMinutes = 2 }) {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [timeLeft, setTimeLeft] = useState(timeoutMinutes * 60);

    useEffect(() => {
        if (isOpen) {
            setOtp('');
            setError('');
            setLoading(false);
            setTimeLeft(timeoutMinutes * 60);
        }
    }, [isOpen, timeoutMinutes]);

    useEffect(() => {
        if (!isOpen || timeLeft <= 0) return;
        const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
        return () => clearInterval(timer);
    }, [isOpen, timeLeft]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await onVerify(otp);
            // onVerify handles success/closing logic
        } catch (err) {
            setError(err.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    <X size={20} color="var(--text-secondary)" />
                </button>

                <h3><ShieldCheck size={24} color="var(--primary)" /> Verify Email</h3>
                <p className="modal-description">
                    We sent a verification code to <strong>{email}</strong>.
                    Please enter it below to confirm your new email address.
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <input
                            type="text"
                            value={otp}
                            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="123456"
                            style={{
                                fontSize: '2rem',
                                letterSpacing: '0.5rem',
                                textAlign: 'center',
                                padding: '0.5rem',
                                width: '200px',
                                borderRadius: '8px',
                                border: '1px solid var(--border)'
                            }}
                            autoFocus
                            maxLength={6}
                        />
                    </div>

                    {error && <p style={{ color: 'var(--error)', fontSize: '0.9rem', margin: 0 }}>{error}</p>}

                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Expires in: <span style={{ fontWeight: 'bold', color: timeLeft < 30 ? 'var(--danger)' : 'var(--text)' }}>{formatTime(timeLeft)}</span>
                    </div>

                    <div className="modal-actions" style={{ marginTop: '0' }}>
                        <button type="button" className="secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="primary" disabled={loading || otp.length < 6}>
                            {loading ? <Loader size={18} className="spin" /> : 'Verify & Update'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
