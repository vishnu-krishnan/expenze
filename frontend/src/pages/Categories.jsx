import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import {
    Tag,
    Plus,
    Trash2,
    Edit2,
    Check,
    X,
    FolderPlus,
    LayoutGrid,
    CheckCircle2,
    Layers,
    Home,
    ShoppingCart,
    Car,
    Zap,
    Utensils,
    HeartPulse,
    Film,
    ShoppingBag,
    Landmark,
    Briefcase,
    Smartphone,
    Gift
} from 'lucide-react';

export default function Categories() {
    const { token } = useAuth();
    const [categories, setCategories] = useState([]);
    const [newCat, setNewCat] = useState({ name: '', icon: '' });
    const [editId, setEditId] = useState(null);
    const [editData, setEditData] = useState({});
    const [loading, setLoading] = useState(false);
    const [justAdded, setJustAdded] = useState(null);
    const [msg, setMsg] = useState('');

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);

    useEffect(() => {
        if (token) fetchCategories();
    }, [token]);

    const fetchCategories = async () => {
        const res = await fetch('/api/categories', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setCategories(await res.json());
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        const cleanName = newCat.name.trim();
        if (!cleanName) return;

        if (categories.some(c => c.name.toLowerCase() === cleanName.toLowerCase())) {
            setMsg('Error: Category already exists');
            setTimeout(() => setMsg(''), 3000);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: cleanName, icon: newCat.icon || '' })
            });

            if (res.ok) {
                setNewCat({ name: '', icon: '' });
                await fetchCategories();
                setMsg('Category added successfully');
                setTimeout(() => setMsg(''), 3000);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (id) => {
        await fetch(`/api/categories/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(editData)
        });
        setEditId(null);
        fetchCategories();
    };

    // Replaced window.confirm with Modal Logic
    const handleDeleteClick = (c) => {
        setCategoryToDelete(c);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!categoryToDelete) return;
        await fetch(`/api/categories/${categoryToDelete.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchCategories();
        // Modal closes via onConfirm/onClose mapping in JSX or state reset
        setCategoryToDelete(null);
    };

    const startEdit = (c) => {
        setEditId(c.id);
        setEditData(c);
    };

    const commonCategories = [
        { label: 'Rent/EMI', icon: Home, color: '#3b82f6', emoji: '🏠' },
        { label: 'Groceries', icon: ShoppingCart, color: '#10b981', emoji: '🍎' },
        { label: 'Transport', icon: Car, color: '#6366f1', emoji: '🚗' },
        { label: 'Utilities', icon: Zap, color: '#f59e0b', emoji: '💡' },
        { label: 'Dining Out', icon: Utensils, color: '#ef4444', emoji: '🍽️' },
        { label: 'Health', icon: HeartPulse, color: '#ec4899', emoji: '🏥' },
        { label: 'Entertainment', icon: Film, color: '#8b5cf6', emoji: '🎬' },
        { label: 'Shopping', icon: ShoppingBag, color: '#f97316', emoji: '🛍️' },
        { label: 'Investments', icon: Landmark, color: '#059669', emoji: '📈' },
        { label: 'Workspace', icon: Briefcase, color: '#475569', emoji: '💼' },
        { label: 'Mobile/Net', icon: Smartphone, color: '#0ea5e9', emoji: '📱' },
        { label: 'Others', icon: Gift, color: '#d946ef', emoji: '🎁' }
    ];

    const quickAdd = async (cat) => {
        const exists = categories.some(c => c.name.toLowerCase() === cat.label.toLowerCase());
        if (exists) {
            setJustAdded(cat.label);
            setMsg('Category already exists!');
            setTimeout(() => { setJustAdded(null); setMsg(''); }, 2000);
            return;
        }

        setLoading(true);
        await fetch('/api/categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name: cat.label, icon: '' })
        });
        await fetchCategories();
        setLoading(false);
        setJustAdded(cat.label);
        setMsg(`${cat.label} added!`);
        setTimeout(() => { setJustAdded(null); setMsg(''); }, 2000);
    };

    const emojiOptions = ['💰', '💳', '🎓', '✈️', '🐶', '🐱', '👶', '💄', '🔨', '📚', '🎵', '🍺'];

    return (
        <section className="view active">
            <div className="view-header">
                <div>
                    <h2><Layers size={24} style={{ marginRight: '0.75rem', color: 'var(--primary)' }} /> Categories</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Organize your spending into meaningful buckets.</p>
                </div>
            </div>

            {msg && (
                <div className={`status-popup ${msg.includes('Error') ? 'status-error' : 'status-success'}`}>
                    {msg}
                </div>
            )}

            <div className="grid-container">
                <div className="panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <LayoutGrid size={18} color="var(--primary)" /> Your Categories
                        </h3>
                        <span className="badge badge-info">{categories.length} Total</span>
                    </div>

                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Category Name</th>
                                    <th style={{ textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.length === 0 ? (
                                    <tr><td colSpan="2" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                                        No categories yet. Use Quick Add or the form!
                                    </td></tr>
                                ) : (
                                    categories.map(c => (
                                        <tr key={c.id}>
                                            {editId === c.id ? (
                                                <>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <input
                                                                value={editData.icon || ''}
                                                                onChange={e => setEditData({ ...editData, icon: e.target.value })}
                                                                style={{ width: '50px', border: '1px solid var(--border)', borderRadius: '4px', textAlign: 'center' }}
                                                            />
                                                            <input
                                                                value={editData.name}
                                                                onChange={e => setEditData({ ...editData, name: e.target.value })}
                                                                style={{ width: '100%', border: '1px solid var(--primary)', borderRadius: '4px' }}
                                                                autoFocus
                                                            />
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                            <button className="primary small" onClick={() => handleSave(c.id)}><Check size={14} /></button>
                                                            <button className="small" onClick={() => setEditId(null)}><X size={14} /></button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td style={{ fontWeight: '600', fontSize: '1rem' }}>
                                                        <span style={{ marginRight: '0.75rem', fontSize: '1.25rem' }}>{c.icon}</span>
                                                        {c.name}
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                            <button className="small" onClick={() => startEdit(c)}><Edit2 size={14} /></button>
                                                            {/* Fixed: Use handleDeleteClick instead of handleDelete */}
                                                            <button className="danger small" onClick={() => handleDeleteClick(c)}><Trash2 size={14} /></button>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="panel">
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <FolderPlus size={18} color="var(--success)" /> ✨ Quick Add
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
                            {commonCategories.map(cat => {
                                const exists = categories.some(c => c.name.toLowerCase() === cat.label.toLowerCase());
                                return (
                                    <button
                                        key={cat.label}
                                        onClick={() => quickAdd(cat)}
                                        disabled={loading || exists}
                                        style={{
                                            padding: '0.6rem 0.75rem',
                                            fontSize: '0.9rem',
                                            background: exists ? 'var(--bg-secondary)' : 'white',
                                            color: exists ? 'var(--text-secondary)' : 'var(--text)',
                                            border: `1px solid ${exists ? 'var(--border)' : 'var(--primary)'}`,
                                            borderRadius: '10px',
                                            cursor: exists ? 'default' : 'pointer',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.6rem',
                                            textAlign: 'left',
                                        }}
                                    >
                                        <span style={{ fontSize: '1.2rem' }}>{cat.emoji}</span>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexGrow: 1 }}>{cat.label}</span>
                                        {exists && <CheckCircle2 size={14} color="var(--success)" style={{ flexShrink: 0 }} />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="panel">
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Tag size={18} color="var(--primary)" /> ➕ Custom Category
                        </h3>
                        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="input-group">
                                <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Category Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Pet Care"
                                    value={newCat.name}
                                    onChange={e => setNewCat({ ...newCat, name: e.target.value })}
                                    required
                                />
                            </div>

                            <button type="submit" className="primary" style={{ height: '3rem', fontWeight: '600' }}>
                                <Plus size={20} /> Create Category
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Reusable Confirm Modal */}
            <ConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Category?"
                message={`Are you sure you want to delete "${categoryToDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete Category"
                confirmColor="danger"
            />
        </section>
    );
}
