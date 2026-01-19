import { useState, useEffect } from 'react';
import { getApiUrl } from '../utils/apiConfig';
import { Settings, Mail, Shield, Zap, Globe, Info, Save, RefreshCw } from 'lucide-react';

export default function AdminSettings() {
    const [settings, setSettings] = useState({
        email_provider: 'gmail',
        email_user: '',
        email_pass: '',
        sendgrid_api_key: '',
        resend_api_key: '',
        smtp_host: '',
        smtp_port: '587',
        smtp_secure: 'false',
        app_name: 'Expenze',
        support_email: '',
        otp_timeout: '2'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [testingEmail, setTestingEmail] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl('/api/v1/admin/settings'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                const settingsObj = {};
                data.forEach(s => {
                    settingsObj[s.setting_key] = s.setting_value || '';
                });
                setSettings(prev => ({ ...prev, ...settingsObj }));
            }
        } catch (err) {
            console.error('Failed to load settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        try {
            const token = localStorage.getItem('token');

            // Save each setting
            for (const [key, value] of Object.entries(settings)) {
                await fetch(getApiUrl(`/api/v1/admin/settings/${key}`), {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        value,
                        type: 'text',
                        category: key.startsWith('email_') || key.includes('sendgrid') || key.includes('resend') || key.includes('smtp') ? 'email' : 'general',
                        description: getSettingDescription(key)
                    })
                });
            }

            setMessage('Settings saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Error saving settings: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const getSettingDescription = (key) => {
        const descriptions = {
            'email_provider': 'Email service provider',
            'email_user': 'Email address for sending OTP',
            'email_pass': 'Email password or app password',
            'sendgrid_api_key': 'SendGrid API key',
            'resend_api_key': 'Resend API key',
            'smtp_host': 'SMTP server hostname',
            'smtp_port': 'SMTP server port',
            'smtp_secure': 'Use SSL/TLS',
            'app_name': 'Application display name',
            'support_email': 'Support/contact email address',
            'otp_timeout': 'OTP validity period in minutes'
        };
        return descriptions[key] || '';
    };

    if (loading) {
        return (
            <section className="view active">
                <div className="panel" style={{ textAlign: 'center', padding: '5rem' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>Loading settings...</p>
                </div>
            </section>
        );
    }

    const provider = settings.email_provider || 'gmail';

    return (
        <section className="view active">
            <div className="view-header">
                <div>
                    <h2><Settings size={24} style={{ marginRight: '0.75rem', color: 'var(--primary)' }} /> System Settings</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Configure system-wide settings. Changes take effect immediately.</p>
                </div>
            </div>

            {message && (
                <div className={`status-msg ${message.includes('Error') ? 'status-error' : 'status-success'}`}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSave}>
                {/* Email Configuration */}
                <div className="panel">
                    <h3 style={{ marginBottom: '1rem', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem' }}>
                        📧 Email Configuration
                    </h3>

                    {/* Provider Selection */}
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label>Email Provider</label>
                        <select
                            value={provider}
                            onChange={e => setSettings({ ...settings, email_provider: e.target.value })}
                            style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--card-bg)', width: '100%' }}
                        >
                            <option value="gmail">Gmail SMTP</option>
                            <option value="sendgrid">SendGrid API</option>
                            <option value="resend">Resend API</option>
                            <option value="smtp">Custom SMTP</option>
                        </select>
                        <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>
                            {provider === 'sendgrid' && '✅ Secure API-based delivery'}
                            {provider === 'resend' && '✅ Modern API-based email service'}
                            {provider === 'gmail' && 'Standard Gmail SMTP'}
                            {provider === 'smtp' && 'Generic SMTP configuration'}
                        </small>
                    </div>

                    {/* Gmail Configuration */}
                    {provider === 'gmail' && (
                        <>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label>Gmail Address</label>
                                <input
                                    type="email"
                                    value={settings.email_user}
                                    onChange={e => setSettings({ ...settings, email_user: e.target.value })}
                                    placeholder="your-app@gmail.com"
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label>Gmail App Password</label>
                                <input
                                    type="password"
                                    value={settings.email_pass}
                                    onChange={e => setSettings({ ...settings, email_pass: e.target.value })}
                                    placeholder="xxxx xxxx xxxx xxxx"
                                />
                                <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>
                                    <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                                        Generate Gmail App Password →
                                    </a>
                                </small>
                            </div>
                        </>
                    )}

                    {/* SendGrid Configuration */}
                    {provider === 'sendgrid' && (
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label>SendGrid API Key</label>
                            <input
                                type="password"
                                value={settings.sendgrid_api_key}
                                onChange={e => setSettings({ ...settings, sendgrid_api_key: e.target.value })}
                                placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxx"
                            />
                            <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>
                                Free tier: 100 emails/day.
                                <a href="https://sendgrid.com/signup" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', marginLeft: '0.25rem' }}>
                                    Get API Key →
                                </a>
                            </small>
                        </div>
                    )}

                    {/* Resend Configuration */}
                    {provider === 'resend' && (
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label>Resend API Key</label>
                            <input
                                type="password"
                                value={settings.resend_api_key}
                                onChange={e => setSettings({ ...settings, resend_api_key: e.target.value })}
                                placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxx"
                            />
                            <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>
                                Free tier: 3,000 emails/month.
                                <a href="https://resend.com/signup" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', marginLeft: '0.25rem' }}>
                                    Get API Key →
                                </a>
                            </small>
                        </div>
                    )}

                    {/* Custom SMTP Configuration */}
                    {provider === 'smtp' && (
                        <>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label>SMTP Host</label>
                                <input
                                    type="text"
                                    value={settings.smtp_host}
                                    onChange={e => setSettings({ ...settings, smtp_host: e.target.value })}
                                    placeholder="smtp.example.com"
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div className="form-group">
                                    <label>SMTP Port</label>
                                    <input
                                        type="number"
                                        value={settings.smtp_port}
                                        onChange={e => setSettings({ ...settings, smtp_port: e.target.value })}
                                        placeholder="587"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Use SSL/TLS</label>
                                    <select
                                        value={settings.smtp_secure}
                                        onChange={e => setSettings({ ...settings, smtp_secure: e.target.value })}
                                        style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                                    >
                                        <option value="false">No (Port 587)</option>
                                        <option value="true">Yes (Port 465)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label>SMTP Username</label>
                                <input
                                    type="text"
                                    value={settings.email_user}
                                    onChange={e => setSettings({ ...settings, email_user: e.target.value })}
                                    placeholder="username"
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label>SMTP Password</label>
                                <input
                                    type="password"
                                    value={settings.email_pass}
                                    onChange={e => setSettings({ ...settings, email_pass: e.target.value })}
                                    placeholder="password"
                                />
                            </div>
                        </>
                    )}


                </div>

                {/* Security Settings */}
                <div className="panel">
                    <h3 style={{ marginBottom: '1rem', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem' }}>
                        🔒 Security Settings
                    </h3>

                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label>OTP Timeout (Minutes)</label>
                        <input
                            type="number"
                            min="1"
                            max="60"
                            value={settings.otp_timeout}
                            onChange={e => setSettings({ ...settings, otp_timeout: e.target.value })}
                            placeholder="2"
                        />
                        <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>
                            How long the verification code remains valid for users.
                        </small>
                    </div>
                </div>

                {/* General Settings */}
                <div className="panel">
                    <h3 style={{ marginBottom: '1rem', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem' }}>
                        ⚙️ General Settings
                    </h3>

                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label>Application Name</label>
                        <input
                            type="text"
                            value={settings.app_name}
                            onChange={e => setSettings({ ...settings, app_name: e.target.value })}
                            placeholder="Expenze"
                        />
                        <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>
                            Display name for the application
                        </small>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label>Support Email</label>
                        <input
                            type="email"
                            value={settings.support_email}
                            onChange={e => setSettings({ ...settings, support_email: e.target.value })}
                            placeholder="support@expenze.com"
                        />
                        <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>
                            Contact email shown to users for support
                        </small>
                    </div>
                </div>

                {/* Save Button */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={fetchSettings} disabled={saving}>
                        Reset Changes
                    </button>
                    <button type="submit" className="primary" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>

            {/* Instructions */}
            <div className="panel" style={{ background: 'var(--bg-secondary)' }}>
                <h4>📝 How to Configure Gmail SMTP:</h4>
                <ol style={{ marginLeft: '1.5rem', lineHeight: '1.8' }}>
                    <li>Go to your <a href="https://myaccount.google.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>Google Account</a></li>
                    <li>Navigate to Security → 2-Step Verification (enable if not already)</li>
                    <li>Go to Security → App Passwords</li>
                    <li>Generate a new app password for "Mail"</li>
                    <li>Copy the 16-character password and paste it above</li>
                    <li>Save settings and test by registering a new user</li>
                </ol>
            </div>
        </section>
    );
}
