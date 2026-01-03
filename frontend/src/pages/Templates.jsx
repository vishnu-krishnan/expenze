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
    ArrowDown,
    CreditCard,
    LayoutGrid,
    CalendarRange,
    FileText,
    CheckCircle2
} from 'lucide-react';

export default function RegularPayments() {
    const { token } = useAuth();
    const [templates, setTemplates] = useState([]);
    const [categories, setCategories] = useState([]);
    const [newTmpl, setNewTmpl] = useState({
        name: '',
        categoryId: '',
        defaultPlannedAmount: 0,
        notes: '',
        startDate: '',
        endDate: '',
        frequency: 'MONTHLY',
        isActive: 1
    });
    const [focusState, setFocusState] = useState({ start: false, end: false });
    const [sort, setSort] = useState({ key: 'name', order: 'asc' });

    useEffect(() => {
        if (token) {
            fetchTemplates();
            fetchCategories();
        }
    }, [token]);

    const fetchTemplates = async () => {
        const res = await fetch('/api/v1/regular', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setTemplates(await res.json());
    };

    const fetchCategories = async () => {
        const res = await fetch('/api/v1/categories', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setCategories(await res.json());
    };

    const MIN_START_DATE = '1950-01-01';

    const getNextDay = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        date.setDate(date.getDate() + 1);
        return date.toISOString().split('T')[0];
    };

    const handleAdd = async (e) => {
        e.preventDefault();

        // Date Validations
        if (newTmpl.startDate < MIN_START_DATE) {
            alert('Start Date cannot be before 01 Jan 1950');
            return;
        }

        if (newTmpl.endDate && newTmpl.endDate <= newTmpl.startDate) {
            alert('End Date must be strictly after Start Date');
            return;
        }

        await fetch('/api/v1/regular', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newTmpl)
        });
        setNewTmpl({ name: '', categoryId: '', defaultPlannedAmount: 0, notes: '', startDate: '', endDate: '', frequency: 'MONTHLY', isActive: 1 });
        fetchTemplates();
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this regular payment?')) return;
        await fetch(`/api/v1/regular/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchTemplates();
    };

    const formatDate = (val) => {
        if (!val) return 'Forever';
        // Convert YYYY-MM-DD to DD-MM-YYYY
        const [y, m, d] = val.split('-');
        return `${d}-${m}-${y}`;
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
                    <p style={{ color: 'var(--text-secondary)' }}>Manage recurring expenses (Monthly, Weekly, Yearly).</p>
                </div>
            </div>

            <div className="panel" style={{ marginBottom: '2.5rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', borderRadius: '1rem', padding: '2rem' }}>
                <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                    <Plus size={22} color="var(--primary)" /> Add New Payment
                </h3>
                <form className="grid-form" onSubmit={handleAdd}>

                    {/* Name */}
                    <div className="input-group">
                        <label>Payment Name</label>
                        <div className="input-wrapper">
                            <CreditCard className="input-icon" size={18} />
                            <input
                                type="text"
                                placeholder="e.g. Netflix, Rent"
                                value={newTmpl.name}
                                onChange={e => setNewTmpl({ ...newTmpl, name: e.target.value })}
                                required
                                style={{ height: '50px', fontSize: '0.95rem' }}
                            />
                        </div>
                    </div>

                    {/* Category */}
                    <div className="input-group">
                        <label>Category</label>
                        <div className="input-wrapper">
                            <LayoutGrid className="input-icon" size={18} />
                            <select
                                value={newTmpl.categoryId}
                                onChange={e => setNewTmpl({ ...newTmpl, categoryId: e.target.value })}
                                required
                                style={{ height: '50px', fontSize: '0.95rem' }}
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
                                style={{ height: '50px', fontSize: '0.95rem' }}
                            />
                        </div>
                    </div>

                    {/* Frequency */}
                    <div className="input-group">
                        <label>Frequency</label>
                        <div className="input-wrapper">
                            <Repeat className="input-icon" size={18} />
                            <select
                                value={newTmpl.frequency}
                                onChange={e => setNewTmpl({ ...newTmpl, frequency: e.target.value })}
                                style={{
                                    height: '50px',
                                    fontSize: '0.95rem',
                                    paddingLeft: '2.75rem',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="MONTHLY">Monthly</option>
                                <option value="WEEKLY">Weekly</option>
                                <option value="YEARLY">Yearly</option>
                            </select>
                        </div>
                    </div>

                    {/* Date Row */}
                    <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label>Start Date</label>
                            <div className="input-wrapper" style={{ position: 'relative', height: '50px' }}>
                                {/* VISUAL LAYER: Shows the formatted text or placeholder */}
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    border: '1px solid var(--border)',
                                    borderRadius: '0.5rem',
                                    background: 'var(--card-bg)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    paddingLeft: '2.75rem',
                                    fontSize: '0.95rem',
                                    color: newTmpl.startDate ? 'var(--text)' : 'var(--text-light)',
                                    zIndex: 1, // Visual layer
                                    pointerEvents: 'none', // Clicks pass through to the input
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden'
                                }}>
                                    {newTmpl.startDate ? formatDate(newTmpl.startDate) : 'Select Start Date...'}
                                </div>

                                {/* ICON */}
                                <CalendarRange className="input-icon" size={18} style={{ zIndex: 2 }} />

                                {/* FUNCTIONAL LAYER: Invisible native picker on top */}
                                <input
                                    type="date"
                                    required
                                    value={newTmpl.startDate}
                                    onChange={e => setNewTmpl({ ...newTmpl, startDate: e.target.value })}
                                    max="9999-12-31"
                                    min={MIN_START_DATE}
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        width: '100%',
                                        height: '100%',
                                        opacity: 0, // Make it invisible
                                        zIndex: 10, // Ensure it captures clicks
                                        cursor: 'pointer'
                                    }}
                                />
                            </div>
                            <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block', fontSize: '0.75rem' }}>First payment date</small>
                        </div>

                        <div className="input-group" style={{ margin: 0 }}>
                            <label>End Date <span style={{ fontWeight: 'normal', color: 'var(--text-light)', fontSize: '0.75rem' }}>(Optional)</span></label>
                            <div className="input-wrapper" style={{ position: 'relative', height: '50px' }}>
                                {/* VISUAL LAYER */}
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    border: '1px solid var(--border)',
                                    borderRadius: '0.5rem',
                                    background: 'var(--card-bg)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    paddingLeft: '2.75rem',
                                    fontSize: '0.95rem',
                                    color: newTmpl.endDate ? 'var(--text)' : 'var(--text-light)',
                                    zIndex: 1,
                                    pointerEvents: 'none',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden'
                                }}>
                                    {newTmpl.endDate ? formatDate(newTmpl.endDate) : 'Ongoing (Always)'}
                                </div>

                                {/* ICON */}
                                <CalendarRange className="input-icon" size={18} style={{ zIndex: 2 }} />

                                {/* FUNCTIONAL LAYER */}
                                <input
                                    type="date"
                                    value={newTmpl.endDate || ''}
                                    onChange={e => setNewTmpl({ ...newTmpl, endDate: e.target.value })}
                                    min={getNextDay(newTmpl.startDate)}
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        width: '100%',
                                        height: '100%',
                                        opacity: 0,
                                        zIndex: 10,
                                        cursor: 'pointer'
                                    }}
                                />
                            </div>
                            <small style={{ color: 'var(--text-light)', marginTop: '0.25rem', display: 'block', fontSize: '0.75rem' }}>Leave empty if ongoing</small>
                        </div>
                    </div>

                    {/* Notes Field (Full Width) */}
                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                        <label>Notes / Description</label>
                        <div className="input-wrapper">
                            <FileText className="input-icon" size={18} />
                            <input
                                type="text"
                                placeholder="Add any details (e.g. Transaction ID, Account #)"
                                value={newTmpl.notes || ''}
                                onChange={e => setNewTmpl({ ...newTmpl, notes: e.target.value })}
                                style={{
                                    height: '50px',
                                    fontSize: '0.95rem'
                                }}
                            />
                        </div>
                    </div>

                    <button type="submit" className="primary" style={{
                        gridColumn: '1 / -1',
                        height: '56px',
                        fontSize: '1.1rem',
                        marginTop: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        boxShadow: '0 4px 6px -1px rgba(13, 148, 136, 0.2)'
                    }}>
                        <Plus size={22} /> Create Regular Payment
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
                            <th onClick={() => toggleSort('frequency')} style={{ cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    Frequency {sort.key === 'frequency' ? (sort.order === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} opacity={0.3} />}
                                </div>
                            </th>
                            <th onClick={() => toggleSort('defaultPlannedAmount')} style={{ cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    Default Amount {sort.key === 'defaultPlannedAmount' ? (sort.order === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} opacity={0.3} />}
                                </div>
                            </th>
                            <th onClick={() => toggleSort('startDate')} style={{ cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    Timeline {sort.key === 'startDate' ? (sort.order === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} opacity={0.3} />}
                                </div>
                            </th>
                            <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedTemplates.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                    <Repeat size={40} opacity={0.2} />
                                    No regular payments set up yet.
                                </div>
                            </td></tr>
                        ) : (
                            sortedTemplates.map(t => (
                                <tr key={t.id}>
                                    <td style={{ fontWeight: '600', color: 'var(--text)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{
                                                width: '32px', height: '32px', borderRadius: '50%',
                                                background: 'var(--bg-secondary)', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <Tag size={16} color="var(--primary)" />
                                            </div>
                                            {t.name}
                                        </div>
                                    </td>
                                    <td><span className="badge badge-info">{t.categoryName}</span></td>
                                    <td><span style={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>{t.frequency?.toLowerCase() || 'monthly'}</span></td>
                                    <td><strong>₹{parseFloat(t.defaultPlannedAmount).toFixed(0)}</strong></td>
                                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <Calendar size={14} /> {formatDate(t.startDate)} → {t.endDate ? formatDate(t.endDate) : 'Ongoing'}
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

