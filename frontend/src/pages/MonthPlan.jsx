import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/apiConfig';
import { Link } from 'react-router-dom';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Plus,
    Trash2,
    AlertCircle,
    CircleDollarSign,
    Calculator,
    CheckCircle,
    ArrowUpDown,
    ArrowUp,
    ArrowDown
} from 'lucide-react';

export default function MonthPlan() {
    const { token } = useAuth();
    const [monthKey, setMonthKey] = useState(new Date().toISOString().slice(0, 7));
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);

    const [loading, setLoading] = useState(false);
    const [sort, setSort] = useState({ key: 'categoryName', order: 'asc' });
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        if (token) loadData();
    }, [monthKey, token]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [monthRes, catRes, profRes] = await Promise.all([
                fetch(getApiUrl(`/api/v1/month/${monthKey}`), { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(getApiUrl('/api/v1/categories'), { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(getApiUrl('/api/v1/profile'), { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const data = await monthRes.json();
            setItems(data?.items || []);

            if (catRes.ok) setCategories(await catRes.json());
            if (profRes.ok) setProfile(await profRes.json());

        } catch (err) {
            console.error('Error loading month plan:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        setLoading(true);
        await fetch(getApiUrl('/api/v1/month/generate'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ monthKey })
        });
        loadData();
    };

    // 1. Update local state immediately for smooth typing
    const handleItemChange = (id, field, value) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    // 2. Persist to DB only when user is done typing (onBlur)
    const saveItem = async (item) => {
        try {
            await fetch(getApiUrl(`/api/v1/items/${item.id}`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(item)
            });
        } catch (error) {
            console.error("Failed to save item:", error);
            // Optionally revert state here if needed
        }
    };

    // Special handler for immediate save (e.g., Checkbox)
    const handlePaidToggle = (item, isPaid) => {
        const updated = { ...item, isPaid };
        // Update local
        setItems(prev => prev.map(i => i.id === item.id ? updated : i));
        // Save immediately
        saveItem(updated);
    };



    const deleteItem = async (id) => {
        if (!confirm('Delete item?')) return;
        setItems(items.filter(i => i.id !== id));
        await fetch(getApiUrl(`/api/v1/items/${id}`), {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    };

    const handleMonthChange = (offset) => {
        const [y, m] = monthKey.split('-').map(Number);
        const date = new Date(y, m - 1 + offset, 1);
        const nextY = date.getFullYear();
        const nextM = String(date.getMonth() + 1).padStart(2, '0');
        setMonthKey(`${nextY}-${nextM}`);
    };

    const formatMonthName = (key) => {
        const [y, m] = key.split('-').map(Number);
        return new Date(y, m - 1).toLocaleDateString('default', { month: 'long', year: 'numeric' });
    };

    const getTotalPlanned = () => items.reduce((sum, i) => sum + (parseFloat(i.plannedAmount) || 0), 0);
    const getTotalActual = () => items.reduce((sum, i) => sum + (parseFloat(i.actualAmount) || 0), 0);

    const sortedItems = useMemo(() => {
        return [...items].sort((a, b) => {
            let valA = a[sort.key];
            let valB = b[sort.key];

            if (['plannedAmount', 'actualAmount'].includes(sort.key)) {
                valA = parseFloat(valA || 0);
                valB = parseFloat(valB || 0);
            }

            if (valA < valB) return sort.order === 'asc' ? -1 : 1;
            if (valA > valB) return sort.order === 'asc' ? 1 : -1;
            return 0;
        });
    }, [items, sort]);

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
                    <h2><Calendar size={24} style={{ marginRight: '0.75rem', color: 'var(--primary)' }} /> Monthly Plan</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Track and manage your expenses for this month.</p>
                </div>
                <div className="dashboard-nav" style={{ background: 'white', padding: '0.5rem', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button className="small" onClick={() => handleMonthChange(-1)} style={{ padding: '0.5rem' }}><ChevronLeft size={18} /></button>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 0.5rem' }}>
                        <span style={{ fontWeight: '600', minWidth: '120px', textAlign: 'center' }}>{formatMonthName(monthKey)}</span>
                        <input
                            type="month"
                            value={monthKey}
                            onChange={(e) => setMonthKey(e.target.value)}
                            style={{ position: 'absolute', opacity: 0, width: '100%', cursor: 'pointer' }}
                        />
                    </div>
                    <button className="small" onClick={() => handleMonthChange(1)} style={{ padding: '0.5rem' }}><ChevronRight size={18} /></button>
                </div>
            </div>

            <div className="toolbar" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 1.25rem',
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="icon-wrapper primary" style={{ padding: '6px', color: 'var(--primary)' }}><CircleDollarSign size={18} /></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monthly Budget</label>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '400' }}>From Profile</span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '500' }}>₹</span>
                    <span style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: 'var(--primary)',
                        lineHeight: '1'
                    }}>
                        {profile?.defaultBudget || 0}
                    </span>
                </div>
            </div>

            <div className="table-wrapper" style={{ marginTop: '2rem' }}>
                <table className="data-table monthly-plan-table">
                    <thead>
                        <tr>
                            <th onClick={() => toggleSort('categoryName')} style={{ cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    Category {sort.key === 'categoryName' ? (sort.order === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} opacity={0.3} />}
                                </div>
                            </th>
                            <th onClick={() => toggleSort('name')} style={{ cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    Item Name {sort.key === 'name' ? (sort.order === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} opacity={0.3} />}
                                </div>
                            </th>
                            <th onClick={() => toggleSort('plannedAmount')} style={{ cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    Planned {sort.key === 'plannedAmount' ? (sort.order === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} opacity={0.3} />}
                                </div>
                            </th>
                            <th onClick={() => toggleSort('actualAmount')} style={{ cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    Actual {sort.key === 'actualAmount' ? (sort.order === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} opacity={0.3} />}
                                </div>
                            </th>
                            <th style={{ textAlign: 'center' }}>Paid</th>
                            <th>Notes</th>
                            <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedItems.length === 0 ? (
                            <tr className="no-data-row"><td colSpan="7" style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                    <AlertCircle size={40} opacity={0.3} />
                                    <p>No records found for {formatMonthName(monthKey)}.<br />Use 'Populate' or add items manually.</p>
                                    <button className="primary" onClick={handleGenerate} style={{ marginTop: '1rem' }} disabled={loading}>
                                        {loading ? 'Generating...' : <><Plus size={18} /> Populate from Templates</>}
                                    </button>
                                </div>
                            </td></tr>
                        ) : (
                            sortedItems.map(item => (
                                <tr key={item.id} className={item.isPaid ? 'paid-row' : ''} style={{ opacity: item.isPaid ? 0.7 : 1 }}>
                                    <td style={{ fontWeight: '500' }}>{item.categoryName}</td>
                                    <td>
                                        <input
                                            value={item.name}
                                            onChange={e => handleItemChange(item.id, 'name', e.target.value)}
                                            onBlur={() => saveItem(item)}
                                            style={{ border: 'transparent', background: 'transparent' }}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            value={item.plannedAmount}
                                            onChange={e => handleItemChange(item.id, 'plannedAmount', parseFloat(e.target.value))}
                                            onBlur={() => saveItem(item)}
                                            style={{ border: 'transparent', background: 'transparent', width: '100px' }}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            value={item.actualAmount}
                                            onChange={e => handleItemChange(item.id, 'actualAmount', parseFloat(e.target.value))}
                                            onBlur={() => saveItem(item)}
                                            style={{ border: 'transparent', background: 'transparent', width: '100px', fontWeight: 'bold' }}
                                        />
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={!!item.isPaid}
                                            onChange={e => handlePaidToggle(item, e.target.checked ? 1 : 0)}
                                            style={{ width: '20px', height: '20px' }}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            value={item.notes || ''}
                                            onChange={e => handleItemChange(item.id, 'notes', e.target.value)}
                                            onBlur={() => saveItem(item)}
                                            placeholder="Add notes..."
                                            style={{ border: 'transparent', background: 'transparent', fontStyle: 'italic', fontSize: '0.85rem' }}
                                        />
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button className="danger small" onClick={() => deleteItem(item.id)} style={{ padding: '0.5rem' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    {items.length > 0 && (
                        <tfoot style={{ background: 'var(--bg-secondary)' }}>
                            <tr>
                                <td colSpan="2" style={{ padding: '1.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700' }}>
                                        <Calculator size={18} /> SUMMARY
                                    </div>
                                </td>
                                <td><strong>₹{getTotalPlanned().toFixed(0)}</strong></td>
                                <td className={getTotalActual() > getTotalPlanned() ? 'negative' : 'positive'}>
                                    <strong>₹{getTotalActual().toFixed(0)}</strong>
                                </td>
                                <td colSpan="3" style={{ textAlign: 'right', paddingRight: '2rem' }}>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '1rem', background: 'white', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>REMAINING:</span>
                                        <strong style={{ fontSize: '1.1rem', color: ((profile?.defaultBudget || 0) - getTotalActual()) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                            ₹{((profile?.defaultBudget || 0) - getTotalActual()).toFixed(0)}
                                        </strong>
                                    </div>
                                </td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </section>
    );
}

