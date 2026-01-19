import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/apiConfig';
import OtpModal from '../components/OtpModal';
import {
    User,
    Mail,
    Phone,
    Shield,
    Save,
    AlertCircle,
    CheckCircle2,
    Wallet,
    Plus,
    Trash2,
    Tag,
    Edit2,
    Check,
    X
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

    // Category Templates
    const [categories, setCategories] = useState([]);
    const [templates, setTemplates] = useState({});
    const [newTemplate, setNewTemplate] = useState({});
    const [templateMsg, setTemplateMsg] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editingValue, setEditingValue] = useState('');
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    useEffect(() => {
        if (token) {
            fetchProfile();
            loadCategories();
            loadTemplates();
        }
    }, [token]);

    const fetchProfile = async () => {
        try {
            const res = await fetch(getApiUrl('/api/v1/profile'), {
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
                const res = await fetch(getApiUrl('/api/v1/profile'), {
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
                const otpRes = await fetch(getApiUrl('/api/v1/profile/request-email-change'), {
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
        const res = await fetch(getApiUrl('/api/v1/profile/verify-email-change'), {
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

    // Template Management Functions
    const loadCategories = async () => {
        try {
            const res = await fetch(getApiUrl('/api/v1/category'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (err) {
            console.error('Error loading categories:', err);
        }
    };

    const loadTemplates = async () => {
        try {
            const res = await fetch(getApiUrl('/api/v1/category-templates'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTemplates(data);
            }
        } catch (err) {
            console.error('Error loading templates:', err);
        }
    };

    const initializeDefaults = async () => {
        try {
            const res = await fetch(getApiUrl('/api/v1/category-templates/initialize'), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok) {
                setTemplateMsg(data.message || 'Default categories and templates loaded successfully!');
                setTimeout(() => setTemplateMsg(''), 4000);
                // Refresh both categories and templates since categories might have been created
                await Promise.all([loadCategories(), loadTemplates()]);
            } else {
                throw new Error(data.error || 'Failed to load defaults');
            }
        } catch (err) {
            setTemplateMsg('Error: ' + err.message);
            setTimeout(() => setTemplateMsg(''), 4000);
        }
    };

    const addTemplate = async (categoryId) => {
        if (!newTemplate[categoryId]?.trim()) return;

        try {
            const res = await fetch(getApiUrl('/api/v1/category-templates'), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    categoryId,
                    subOption: newTemplate[categoryId].trim(),
                    sortOrder: templates[categoryId]?.length || 0
                })
            });

            if (res.ok) {
                setNewTemplate({ ...newTemplate, [categoryId]: '' });
                loadTemplates();
            }
        } catch (err) {
            console.error('Error adding template:', err);
        }
    };

    const updateTemplate = async (id, categoryId) => {
        if (!editingValue.trim()) return;

        try {
            const res = await fetch(getApiUrl(`/api/v1/category-templates/${id}`), {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    categoryId,
                    subOption: editingValue.trim()
                })
            });

            if (res.ok) {
                setEditingId(null);
                setEditingValue('');
                loadTemplates();
            }
        } catch (err) {
            console.error('Error updating template:', err);
        }
    };

    const deleteTemplate = async (id) => {
        try {
            const res = await fetch(getApiUrl(`/api/v1/category-templates/${id}`), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                loadTemplates();
            }
        } catch (err) {
            console.error('Error deleting template:', err);
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        const cleanName = newCategoryName.trim();
        if (!cleanName) return;

        if (categories.some(c => c.name.toLowerCase() === cleanName.toLowerCase())) {
            setTemplateMsg('Error: Category already exists');
            setTimeout(() => setTemplateMsg(''), 3000);
            return;
        }

        try {
            const res = await fetch(getApiUrl('/api/v1/categories'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: cleanName, icon: '📁' })
            });

            if (res.ok) {
                setNewCategoryName('');
                setShowAddCategory(false);
                await loadCategories();
                setTemplateMsg('Category added successfully');
                setTimeout(() => setTemplateMsg(''), 3000);
            }
        } catch (err) {
            setTemplateMsg('Error: ' + err.message);
        }
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

            {/* Category Templates Section */}
            <div className="panel" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Tag size={20} color="var(--primary)" /> Category Templates
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                            Define quick options for faster expense entry
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="small" onClick={() => setShowAddCategory(!showAddCategory)}>
                            {showAddCategory ? <X size={14} /> : <Plus size={14} />} Category
                        </button>
                        <button className="primary small" onClick={initializeDefaults}>
                            <Plus size={14} /> Load Defaults
                        </button>
                    </div>
                </div>

                {showAddCategory && (
                    <div className="panel" style={{ background: 'var(--bg-secondary)', marginBottom: '1.5rem', animation: 'slideDown 0.2s ease-out' }}>
                        <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
                                <input
                                    type="text"
                                    placeholder="Enter new category name..."
                                    value={newCategoryName}
                                    onChange={e => setNewCategoryName(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <button type="submit" className="primary small" style={{ height: '2.5rem' }}>
                                Create
                            </button>
                        </form>
                    </div>
                )}

                {templateMsg && (
                    <div className={`status-popup ${templateMsg.includes('Error') ? 'status-error' : 'status-success'}`} style={{ position: 'relative', marginBottom: '1rem' }}>
                        {templateMsg}
                    </div>
                )}

                {categories.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                        No categories found. Create categories first to add templates.
                    </p>
                ) : (
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        {categories.map(category => (
                            <div key={category.id} style={{
                                padding: '1.25rem',
                                background: 'rgba(255, 255, 255, 0.5)',
                                borderRadius: '8px',
                                border: '1px solid var(--border)'
                            }}>
                                <h4 style={{
                                    marginBottom: '1rem',
                                    color: 'var(--primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    {category.icon && <span>{category.icon}</span>}
                                    {category.name}
                                    {templates[category.id] && (
                                        <span style={{
                                            fontSize: '0.75rem',
                                            background: 'var(--primary)',
                                            color: 'white',
                                            padding: '0.15rem 0.5rem',
                                            borderRadius: '12px'
                                        }}>
                                            {templates[category.id].length}
                                        </span>
                                    )}
                                </h4>

                                {/* Existing templates */}
                                {templates[category.id]?.length > 0 && (
                                    <div style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '0.75rem',
                                        marginBottom: '1.25rem'
                                    }}>
                                        {templates[category.id].map(t => (
                                            <div key={t.id} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '0.4rem 0.6rem',
                                                background: 'white',
                                                borderRadius: '8px',
                                                border: editingId === t.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                                                boxShadow: 'var(--shadow-sm)',
                                                transition: 'all 0.2s ease'
                                            }}>
                                                {editingId === t.id ? (
                                                    <>
                                                        <input
                                                            value={editingValue}
                                                            onChange={e => setEditingValue(e.target.value)}
                                                            autoFocus
                                                            onKeyPress={e => e.key === 'Enter' && updateTemplate(t.id, t.categoryId)}
                                                            style={{
                                                                border: 'none',
                                                                padding: '0.25rem',
                                                                width: '100px',
                                                                fontSize: '0.9rem',
                                                                outline: 'none'
                                                            }}
                                                        />
                                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                            <button
                                                                className="primary small"
                                                                onClick={() => updateTemplate(t.id, t.categoryId)}
                                                                style={{ padding: '0.2rem', minWidth: 'auto', background: 'var(--success)' }}
                                                            >
                                                                <Check size={12} />
                                                            </button>
                                                            <button
                                                                className="danger small"
                                                                onClick={() => setEditingId(null)}
                                                                style={{ padding: '0.2rem', minWidth: 'auto' }}
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{t.subOption}</span>
                                                        <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' }}>
                                                            <button
                                                                className="small"
                                                                onClick={() => {
                                                                    setEditingId(t.id);
                                                                    setEditingValue(t.subOption);
                                                                }}
                                                                style={{ padding: '0.2rem', minWidth: 'auto', background: 'transparent', color: 'var(--text-secondary)' }}
                                                                title="Edit"
                                                            >
                                                                <Edit2 size={12} />
                                                            </button>
                                                            <button
                                                                className="danger small"
                                                                onClick={() => deleteTemplate(t.id)}
                                                                style={{ padding: '0.2rem', minWidth: 'auto' }}
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Add new template */}
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        placeholder="Add new option..."
                                        value={newTemplate[category.id] || ''}
                                        onChange={e => setNewTemplate({
                                            ...newTemplate,
                                            [category.id]: e.target.value
                                        })}
                                        onKeyPress={e => e.key === 'Enter' && addTemplate(category.id)}
                                        style={{ flex: 1 }}
                                    />
                                    <button
                                        className="primary small"
                                        onClick={() => addTemplate(category.id)}
                                        disabled={!newTemplate[category.id]?.trim()}
                                    >
                                        <Plus size={14} /> Add
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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
