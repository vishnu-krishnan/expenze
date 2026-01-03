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

            <div className="panel" style={{ marginBottom: '2.5rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', borderRadius: '1rem', padding: '2rem' }}>
                <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                    <Plus size={22} color="var(--primary)" /> Add New Regular Payment
                </h3>
                <form className="grid-form" onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>

                    {/* Name */}
                    <div className="input-group">
                        <label>Payment Name</label>
                        <div className="input-wrapper">
                            <Tag className="input-icon" size={18} />
                            <input
                                type="text"
                                placeholder="e.g. Netflix, Rent, Gym"
                                value={newTmpl.name}
                                onChange={e => setNewTmpl({ ...newTmpl, name: e.target.value })}
                                required
                                style={{ height: '48px', fontSize: '1rem' }}
                            />
                        </div>
                    </div>

                    {/* Category */}
                    <div className="input-group">
                        <label>Category</label>
                        <div className="input-wrapper">
                            <Layers className="input-icon" size={18} />
                            <select
                                value={newTmpl.categoryId}
                                onChange={e => setNewTmpl({ ...newTmpl, categoryId: e.target.value })}
                                required
                                style={{ height: '48px', fontSize: '1rem' }}
                            >
                                <option value="">Select Category</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Amount */}
                    <div className="input-group">
                        <label>Default Amount (₹)</label>
                        <div className="input-wrapper">
                            <IndianRupee className="input-icon" size={18} />
                            <input
                                type="number"
                                placeholder="0.00"
                                value={newTmpl.defaultPlannedAmount || ''}
                                onChange={e => setNewTmpl({ ...newTmpl, defaultPlannedAmount: parseFloat(e.target.value) })}
                                style={{ height: '48px', fontSize: '1rem' }}
                            />
                        </div>
                    </div>

                    {/* Start Month - Custom Styled */}
                    <div className="input-group">
                        <label>Start Month</label>
                        <div style={{ position: 'relative', height: '48px' }}>
                            {/* Visual Overlay */}
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                border: '1px solid var(--border)',
                                borderRadius: '0.5rem',
                                padding: '0 0.875rem 0 2.75rem', // Left padding for icon
                                background: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                color: newTmpl.startMonth ? 'var(--text)' : 'var(--text-light)',
                                pointerEvents: 'none', // Lets clicks pass through to input
                                fontSize: '1rem'
                            }}>
                                <Calendar size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-light)' }} />
                                {newTmpl.startMonth ? formatMonth(newTmpl.startMonth) : 'Select Start Month...'}
                            </div>

                            {/* Actual Input (Invisible but clickable) */}
                            <input
                                type="month"
                                value={newTmpl.startMonth}
                                onChange={e => setNewTmpl({ ...newTmpl, startMonth: e.target.value })}
                                required
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    width: '100%',
                                    height: '100%',
                                    opacity: 0,
                                    cursor: 'pointer'
                                }}
                            />
                        </div>
                        <small style={{ color: 'var(--text-secondary)', marginTop: '0.4rem', display: 'block', fontSize: '0.8rem' }}>When does this payment cycle begin?</small>
                    </div>

                    {/* End Month - Custom Styled */}
                    <div className="input-group">
                        <label>End Month <span style={{ fontWeight: 'normal', color: 'var(--text-light)', fontSize: '0.8rem' }}>(Optional)</span></label>
                        <div style={{ position: 'relative', height: '48px' }}>
                            {/* Visual Overlay */}
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                border: '1px solid var(--border)',
                                borderRadius: '0.5rem',
                                padding: '0 0.875rem 0 2.75rem',
                                background: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                color: newTmpl.endMonth ? 'var(--text)' : 'var(--text-light)',
                                pointerEvents: 'none',
                                fontSize: '1rem'
                            }}>
                                <Calendar size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-light)' }} />
                                {newTmpl.endMonth ? formatMonth(newTmpl.endMonth) : 'Ongoing (Always)'}
                            </div>

                            {/* Actual Input */}
                            <input
                                type="month"
                                value={newTmpl.endMonth || ''}
                                onChange={e => setNewTmpl({ ...newTmpl, endMonth: e.target.value })}
                                min={newTmpl.startMonth}
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    width: '100%',
                                    height: '100%',
                                    opacity: 0,
                                    cursor: 'pointer'
                                }}
                            />
                        </div>
                    </div>

                    {/* Frequency (Fixed for now, can be editable later) */}
                    <div className="input-group">
                        <label>Frequency</label>
                        <div style={{
                            height: '48px',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 1rem',
                            background: 'var(--bg-secondary)',
                            borderRadius: '0.5rem',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border)'
                        }}>
                            <Repeat size={16} style={{ marginRight: '0.5rem' }} /> Monthly
                        </div>
                    </div>

                    {/* Notes Field (Full Width) */}
                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                        <label>Notes / Description</label>
                        <textarea
                            placeholder="Add any details, account numbers, or reminders here..."
                            value={newTmpl.notes || ''}
                            onChange={e => setNewTmpl({ ...newTmpl, notes: e.target.value })}
                            style={{
                                width: '100%',
                                minHeight: '80px',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border)',
                                fontFamily: 'inherit',
                                resize: 'vertical'
                            }}
                        />
                    </div>

                    <button type="submit" className="primary" style={{ gridColumn: '1 / -1', height: '54px', fontSize: '1.1rem', marginTop: '1rem' }}>
                        <Plus size={20} /> Create Regular Payment
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

