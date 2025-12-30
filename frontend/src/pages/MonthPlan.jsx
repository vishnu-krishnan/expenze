import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
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
    const [salary, setSalary] = useState(0);
    const [loading, setLoading] = useState(false);
    const [sort, setSort] = useState({ key: 'categoryName', order: 'asc' });

    useEffect(() => {
        if (token) loadData();
    }, [monthKey, token]);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/month/${monthKey}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setItems(data?.items || []);

            const catRes = await fetch('/api/categories', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (catRes.ok) setCategories(await catRes.json());

            const salRes = await fetch(`/api/salary/${monthKey}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const salData = await salRes.json();
            setSalary(salData.amount || 0);
        } catch (err) {
            console.error('Error loading month plan:', err);
        }
        setLoading(false);
    };

    const handleGenerate = async () => {
        setLoading(true);
        await fetch('/api/month/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ monthKey })
        });
        loadData();
    };

    const updateItem = async (id, field, value) => {
        const item = items.find(i => i.id === id);
        const updated = { ...item, [field]: value };
        setItems(items.map(i => i.id === id ? updated : i));

        await fetch(`/api/items/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updated)
        });
    };

    const updateSalary = async (val) => {
        setSalary(val);
        await fetch('/api/salary', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ monthKey, amount: val })
        });
    };

    const deleteItem = async (id) => {
        if (!confirm('Delete item?')) return;
        setItems(items.filter(i => i.id !== id));
        await fetch(`/api/items/${id}`, {
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

            <div className="toolbar" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="icon-wrapper primary" style={{ padding: '8px', color: 'var(--primary)' }}><CircleDollarSign size={20} /></div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Monthly Budget</label>
                        <input
                            type="number"
                            value={salary || ''}
                            onChange={e => updateSalary(parseFloat(e.target.value))}
                            placeholder="Set budget..."
                            style={{ border: 'none', background: 'transparent', padding: 0, fontSize: '1.25rem', fontWeight: '700', width: '150px', outline: 'none' }}
                        />
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                    <button className="primary" onClick={handleGenerate} disabled={loading} style={{ padding: '0.75rem 1.5rem' }}>
                        <Plus size={18} /> Populate from Regular
                    </button>
                    <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Auto-fills recurring items for this month</small>
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
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                    <AlertCircle size={40} opacity={0.3} />
                                    <p>No records found for {formatMonthName(monthKey)}.<br />Use 'Populate' or add items manually.</p>
                                </div>
                            </td></tr>
                        ) : (
                            sortedItems.map(item => (
                                <tr key={item.id} className={item.isPaid ? 'paid-row' : ''} style={{ opacity: item.isPaid ? 0.7 : 1 }}>
                                    <td style={{ fontWeight: '500' }}>{item.categoryName}</td>
                                    <td><input value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} style={{ border: 'transparent', background: 'transparent' }} /></td>
                                    <td><input type="number" value={item.plannedAmount} onChange={e => updateItem(item.id, 'plannedAmount', parseFloat(e.target.value))} style={{ border: 'transparent', background: 'transparent', width: '100px' }} /></td>
                                    <td><input type="number" value={item.actualAmount} onChange={e => updateItem(item.id, 'actualAmount', parseFloat(e.target.value))} style={{ border: 'transparent', background: 'transparent', width: '100px', fontWeight: 'bold' }} /></td>
                                    <td style={{ textAlign: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={!!item.isPaid}
                                            onChange={e => updateItem(item.id, 'isPaid', e.target.checked ? 1 : 0)}
                                            style={{ width: '20px', height: '20px' }}
                                        />
                                    </td>
                                    <td><input value={item.notes || ''} onChange={e => updateItem(item.id, 'notes', e.target.value)} placeholder="Add notes..." style={{ border: 'transparent', background: 'transparent', fontStyle: 'italic', fontSize: '0.85rem' }} /></td>
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
                                        <strong style={{ fontSize: '1.1rem', color: (salary - getTotalActual()) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                            ₹{(salary - getTotalActual()).toFixed(0)}
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

