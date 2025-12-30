import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Plus,
    Trash2,
    Repeat,
    Calendar,
    IndianRupee,
    Tag,
    AlertCircle,
    Layers,
    ArrowUpDown,
    ArrowUp,
    ArrowDown
} from 'lucide-react';

export default function RegularPayments() {
    const { token } = useAuth();
    const [templates, setTemplates] = useState([]);
    const [categories, setCategories] = useState([]);
    const [newTmpl, setNewTmpl] = useState({ name: '', categoryId: '', defaultPlannedAmount: 0, notes: '', startMonth: '', endMonth: '', isActive: 1 });
    const [sort, setSort] = useState({ key: 'name', order: 'asc' });

    useEffect(() => {
        if (token) {
            fetchTemplates();
            fetchCategories();
        }
    }, [token]);

    const fetchTemplates = async () => {
        const res = await fetch('/api/regular', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setTemplates(await res.json());
    };

    const fetchCategories = async () => {
        const res = await fetch('/api/categories', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setCategories(await res.json());
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        await fetch('/api/regular', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newTmpl)
        });
        setNewTmpl({ name: '', categoryId: '', defaultPlannedAmount: 0, notes: '', startMonth: '', endMonth: '', isActive: 1 });
        fetchTemplates();
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this regular payment?')) return;
        await fetch(`/api/regular/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchTemplates();
    };

    const formatMonth = (val) => {
        if (!val) return 'Forever';
        const [y, m] = val.split('-').map(Number);
        return new Date(y, m - 1).toLocaleDateString('default', { month: 'short', year: 'numeric' });
    };

    const sortedTemplates = useMemo(() => {
        return [...templates].sort((a, b) => {
            let valA = a[sort.key];
            let valB = b[sort.key];

            if (sort.key === 'defaultPlannedAmount') {
                valA = parseFloat(valA);
                valB = parseFloat(valB);
            }

            if (valA < valB) return sort.order === 'asc' ? -1 : 1;
            if (valA > valB) return sort.order === 'asc' ? 1 : -1;
            return 0;
        });
    }, [templates, sort]);

    const toggleSort = (key) => {
        setSort(prev => ({
            key,
            order: prev.key === key && prev.order === 'asc' ? 'desc' : 'asc'
        }));
    };

    return (
        <section className="view active">
            <div className="view-header">
                <div>
                    <h2><Repeat size={24} style={{ marginRight: '0.75rem', verticalAlign: 'bottom', color: 'var(--primary)' }} /> Regular Payments</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage expenses that repeat every month automatically.</p>
                </div>
            </div>

            <div className="panel" style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={20} color="var(--primary)" /> Add New Payment
                </h3>
                <form className="grid-form" onSubmit={handleAdd}>
                    <div className="input-group">
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Payment Name</label>
                        <div style={{ position: 'relative' }}>
                            <Tag size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                            <input type="text" placeholder="e.g. Netflix, Rent" value={newTmpl.name} onChange={e => setNewTmpl({ ...newTmpl, name: e.target.value })} required style={{ paddingLeft: '2.5rem' }} />
                        </div>
                    </div>

                    <div className="input-group">
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Category</label>
                        <div style={{ position: 'relative' }}>
                            <Layers size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                            <select value={newTmpl.categoryId} onChange={e => setNewTmpl({ ...newTmpl, categoryId: e.target.value })} required style={{ paddingLeft: '2.5rem' }}>
                                <option value="">Select Category</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="input-group">
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Amount (₹)</label>
                        <div style={{ position: 'relative' }}>
                            <IndianRupee size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                            <input type="number" placeholder="0.00" value={newTmpl.defaultPlannedAmount || ''} onChange={e => setNewTmpl({ ...newTmpl, defaultPlannedAmount: parseFloat(e.target.value) })} style={{ paddingLeft: '2.5rem' }} />
                        </div>
                    </div>

                    <div className="input-group">
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Start Month</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <Calendar size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-light)' }} />
                            <div style={{ width: '100%', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.625rem 0.875rem 0.625rem 2.5rem', position: 'relative', cursor: 'pointer', background: 'white' }}>
                                <span style={{ color: newTmpl.startMonth ? 'var(--text)' : 'var(--text-light)' }}>
                                    {newTmpl.startMonth ? formatMonth(newTmpl.startMonth) : 'Pick start month...'}
                                </span>
                                <input
                                    type="month"
                                    value={newTmpl.startMonth}
                                    onChange={e => setNewTmpl({ ...newTmpl, startMonth: e.target.value })}
                                    required
                                    style={{ position: 'absolute', opacity: 0, top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                />
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="primary">
                        <Plus size={18} /> Add Payment
                    </button>
                </form>
            </div>

            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th onClick={() => toggleSort('name')} style={{ cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    Payment Item {sort.key === 'name' ? (sort.order === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} opacity={0.3} />}
                                </div>
                            </th>
                            <th onClick={() => toggleSort('categoryName')} style={{ cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    Category {sort.key === 'categoryName' ? (sort.order === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} opacity={0.3} />}
                                </div>
                            </th>
                            <th onClick={() => toggleSort('defaultPlannedAmount')} style={{ cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    Default Amount {sort.key === 'defaultPlannedAmount' ? (sort.order === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} opacity={0.3} />}
                                </div>
                            </th>
                            <th onClick={() => toggleSort('startMonth')} style={{ cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    Timeline {sort.key === 'startMonth' ? (sort.order === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} opacity={0.3} />}
                                </div>
                            </th>
                            <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedTemplates.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                    <Repeat size={40} opacity={0.2} />
                                    No regular payments set up yet.
                                </div>
                            </td></tr>
                        ) : (
                            sortedTemplates.map(t => (
                                <tr key={t.id}>
                                    <td style={{ fontWeight: '600' }}>{t.name}</td>
                                    <td><span className="badge badge-info">{t.categoryName}</span></td>
                                    <td><strong>₹{parseFloat(t.defaultPlannedAmount).toFixed(0)}</strong></td>
                                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <Calendar size={14} /> {formatMonth(t.startMonth)} → {t.endMonth ? formatMonth(t.endMonth) : 'Ongoing'}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button className="danger small" onClick={() => handleDelete(t.id)} style={{ padding: '0.5rem' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

