import React, { useState, useEffect, useMemo, Fragment } from 'react';
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
    ArrowDown,
    Tag,
    ChevronDown,
    X
} from 'lucide-react';

export default function MonthPlan() {
    const { token } = useAuth();
    const [monthKey, setMonthKey] = useState(new Date().toISOString().slice(0, 7));
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);

    const [loading, setLoading] = useState(false);
    const [sort, setSort] = useState({ key: 'categoryName', order: 'asc' });
    const [profile, setProfile] = useState(null);
    const [templates, setTemplates] = useState({});
    const [showAddForm, setShowAddForm] = useState(false);
    const [newItem, setNewItem] = useState({ categoryId: '', name: '', plannedAmount: '', actualAmount: '', priority: 'MEDIUM', notes: '' });
    const [selectedSubOption, setSelectedSubOption] = useState('');

    useEffect(() => {
        if (token) loadData();
    }, [monthKey, token]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [monthRes, catRes, profRes, templateRes] = await Promise.all([
                fetch(getApiUrl(`/api/v1/month/${monthKey}`), { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(getApiUrl('/api/v1/categories'), { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(getApiUrl('/api/v1/profile'), { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(getApiUrl('/api/v1/category-templates'), { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const data = await monthRes.json();
            setItems(data?.items || []);

            if (catRes.ok) setCategories(await catRes.json());
            if (profRes.ok) setProfile(await profRes.json());
            if (templateRes.ok) setTemplates(await templateRes.json());

        } catch (err) {
            console.error('Error loading month plan:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async (e) => {
        e.preventDefault();

        // Sanitize data: convert numeric fields to actual numbers
        const payload = {
            ...newItem,
            plannedAmount: newItem.plannedAmount !== '' ? parseFloat(newItem.plannedAmount) : 0,
            actualAmount: newItem.actualAmount !== '' ? parseFloat(newItem.actualAmount) : 0,
            monthKey: monthKey
        };

        console.log('Adding item with payload:', payload);

        try {
            const res = await fetch(getApiUrl('/api/v1/items'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                console.log('Item added successfully');
                setNewItem({ categoryId: '', name: '', plannedAmount: '', actualAmount: '', priority: 'MEDIUM', notes: '' });
                setSelectedSubOption('');
                setShowAddForm(false);
                await loadData();
            } else {
                const errData = await res.json().catch(() => ({ error: 'Unknown server error' }));
                console.error('Failed to add item:', errData);
                alert(`Error: ${errData.error || 'Check all fields and try again'}`);
            }
        } catch (error) {
            console.error("Error adding item:", error);
            alert("Connection error while adding item. Please check your internet.");
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

    const toggleSort = (key) => {
        setSort(prev => ({
            key,
            order: prev.key === key && prev.order === 'asc' ? 'desc' : 'asc'
        }));
    };

    console.log('MonthPlan items check:', Array.isArray(items), items?.length);

    const itemsToRender = useMemo(() => {
        if (!Array.isArray(items)) return [];
        const currentSort = sort || { key: 'categoryName', order: 'asc' };

        return [...items].sort((a, b) => {
            let valA = a?.[currentSort.key] ?? '';
            let valB = b?.[currentSort.key] ?? '';

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return currentSort.order === 'asc' ? -1 : 1;
            if (valA > valB) return currentSort.order === 'asc' ? 1 : -1;
            return 0;
        });
    }, [items, sort]);

    const itemsGrouped = useMemo(() => {
        const groups = {};
        if (!Array.isArray(itemsToRender)) return groups;

        itemsToRender.forEach(item => {
            const cat = item?.categoryName || 'Uncategorized';
            if (!groups[cat]) {
                groups[cat] = [];
            }
            groups[cat].push(item);
        });
        return groups;
    }, [itemsToRender]);

    if (loading && items.length === 0) {
        return (
            <section className="view active">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
                    <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    <p style={{ color: 'var(--text-secondary)' }}>Loading Month Plan...</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </section>
        );
    }

    return (
        <section className="view active">
            <div className="view-header">
                <div>
                    <h2><Calendar size={24} style={{ marginRight: '0.75rem', color: 'var(--primary)' }} /> Monthly Plan</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Track and manage your expenses for this month.</p>
                </div>
                <div className="dashboard-nav" style={{ background: 'white', padding: '0.5rem', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button className="primary small" onClick={() => setShowAddForm(!showAddForm)}>
                        {showAddForm ? <X size={18} /> : <Plus size={18} />} Add Item
                    </button>
                    <div style={{ width: '1px', height: '24px', background: 'var(--border)' }}></div>
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

            {/* Manual Add Form */}
            {showAddForm && (
                <div className="panel" style={{ marginBottom: '1.5rem', animation: 'slideDown 0.3s ease-out' }}>
                    <form onSubmit={handleAddItem} className="grid-form" style={{ alignItems: 'end' }}>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label>Category</label>
                            <select
                                value={newItem.categoryId}
                                onChange={e => {
                                    const catId = e.target.value;
                                    setNewItem({ ...newItem, categoryId: catId, name: '' });
                                    setSelectedSubOption('');
                                }}
                                required
                            >
                                <option value="">Select Category</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Smart Sub-option Dropdown */}
                        {newItem.categoryId && templates[newItem.categoryId]?.length > 0 && (
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>Selection</label>
                                <select
                                    value={selectedSubOption}
                                    onChange={e => {
                                        const subOpt = e.target.value;
                                        setSelectedSubOption(subOpt);
                                        if (subOpt && subOpt !== '__custom__') {
                                            const catName = categories.find(c => c.id == newItem.categoryId)?.name;
                                            setNewItem({ ...newItem, name: `${catName} - ${subOpt}` });
                                        } else {
                                            setNewItem({ ...newItem, name: '' });
                                        }
                                    }}
                                >
                                    <option value="">Select Type</option>
                                    {templates[newItem.categoryId].map(t => (
                                        <option key={t.id} value={t.subOption}>{t.subOption}</option>
                                    ))}
                                    <option value="__custom__">✏️ Custom Name</option>
                                </select>
                            </div>
                        )}

                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label>Item Name</label>
                            <input
                                type="text"
                                value={newItem.name}
                                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                placeholder="e.g. Rent, Grocery"
                                required
                                disabled={selectedSubOption && selectedSubOption !== '__custom__'}
                            />
                        </div>

                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label>Planned Amount</label>
                            <input
                                type="number"
                                value={newItem.plannedAmount}
                                onChange={e => setNewItem({ ...newItem, plannedAmount: e.target.value })}
                                placeholder="0.00"
                                required
                            />
                        </div>

                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label>Actual Amount</label>
                            <input
                                type="number"
                                value={newItem.actualAmount}
                                onChange={e => setNewItem({ ...newItem, actualAmount: e.target.value })}
                                placeholder="0.00"
                            />
                        </div>

                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label>Priority</label>
                            <select
                                value={newItem.priority}
                                onChange={e => setNewItem({ ...newItem, priority: e.target.value })}
                            >
                                <option value="HIGH">🔴 High</option>
                                <option value="MEDIUM">🟡 Medium</option>
                                <option value="LOW">🟢 Low</option>
                            </select>
                        </div>

                        <div className="input-group" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
                            <label>Notes (Optional)</label>
                            <input
                                type="text"
                                value={newItem.notes}
                                onChange={e => setNewItem({ ...newItem, notes: e.target.value })}
                                placeholder="Add context..."
                            />
                        </div>

                        <button type="submit" className="primary" style={{ padding: '0.75rem' }}>
                            <Plus size={18} /> Add
                        </button>
                    </form>
                </div>
            )}

            <div className="table-wrapper" style={{ marginTop: '2rem' }}>
                <table className="data-table monthly-plan-table">
                    <thead>
                        <tr>
                            <th onClick={() => toggleSort('categoryName')} style={{ cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    Category {sort.key === 'categoryName' ? (sort.order === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} opacity={0.3} />}
                                </div>
                            </th>
                            <th onClick={() => toggleSort('priority')} style={{ cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    Priority {sort.key === 'priority' ? (sort.order === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} opacity={0.3} />}
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
                            <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 ? (
                            <tr className="no-data-row">
                                <td colSpan="7" style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                        <AlertCircle size={40} opacity={0.3} />
                                        <p>No records found for {formatMonthName(monthKey)}.<br />Use 'Populate' or add items manually.</p>
                                        <button className="primary" onClick={handleGenerate} style={{ marginTop: '1rem' }} disabled={loading}>
                                            {loading ? 'Generating...' : <><Plus size={18} /> Populate from Templates</>}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            Object.entries(itemsGrouped).map(([categoryName, categoryItems]) => (
                                <Fragment key={categoryName}>
                                    <tr className="category-group-header" style={{ background: 'var(--bg-secondary)', borderLeft: '4px solid var(--primary)' }}>
                                        <td colSpan="7" style={{ padding: '0.75rem 1rem', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.5px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {categories.find(c => c.name === categoryName)?.icon && (
                                                        <span>{categories.find(c => c.name === categoryName).icon}</span>
                                                    )}
                                                    {categoryName.toUpperCase()}
                                                    <span style={{ fontSize: '0.7rem', background: 'var(--primary)', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '10px', marginLeft: '0.5rem' }}>
                                                        {categoryItems.length}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                    Total: ₹{categoryItems.reduce((sum, i) => sum + (parseFloat(i.actualAmount) || 0), 0).toFixed(0)}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                    {categoryItems.map(item => (
                                        <tr key={item.id} className={item.isPaid ? 'paid-row data-row' : 'data-row'} style={{
                                            opacity: item.isPaid ? 0.7 : 1,
                                            borderLeft: item.priority === 'HIGH' ? '5px solid #ef4444' :
                                                item.priority === 'LOW' ? '5px solid #94a3b8' : '5px solid var(--primary)',
                                            background: item.priority === 'HIGH' ? 'rgba(239, 68, 68, 0.02)' :
                                                item.priority === 'LOW' ? 'rgba(148, 163, 184, 0.02)' : 'transparent'
                                        }}>
                                            <td style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{item.categoryName}</td>
                                            <td>
                                                <select
                                                    value={item.priority || 'MEDIUM'}
                                                    onChange={e => {
                                                        handleItemChange(item.id, 'priority', e.target.value);
                                                        saveItem({ ...item, priority: e.target.value });
                                                    }}
                                                    style={{
                                                        padding: '0.2rem 0.5rem',
                                                        fontSize: '0.75rem',
                                                        borderRadius: '4px',
                                                        border: '1px solid var(--border)',
                                                        background: item.priority === 'HIGH' ? '#fee2e2' :
                                                            item.priority === 'LOW' ? '#f3f4f6' : '#fef9c3',
                                                        color: item.priority === 'HIGH' ? '#991b1b' :
                                                            item.priority === 'LOW' ? '#374151' : '#854d0e',
                                                        fontWeight: '600'
                                                    }}
                                                >
                                                    <option value="HIGH">🔴 High</option>
                                                    <option value="MEDIUM">🟡 Medium</option>
                                                    <option value="LOW">🟢 Low</option>
                                                </select>
                                            </td>
                                            <td>
                                                <input
                                                    value={item.name}
                                                    onChange={e => handleItemChange(item.id, 'name', e.target.value)}
                                                    onBlur={() => saveItem(item)}
                                                    style={{ border: 'transparent', background: 'transparent', width: '100%' }}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    value={item.plannedAmount}
                                                    onChange={e => handleItemChange(item.id, 'plannedAmount', parseFloat(e.target.value))}
                                                    onBlur={() => saveItem(item)}
                                                    style={{ border: 'transparent', background: 'transparent', width: '80px' }}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    value={item.actualAmount}
                                                    onChange={e => handleItemChange(item.id, 'actualAmount', parseFloat(e.target.value))}
                                                    onBlur={() => saveItem(item)}
                                                    style={{ border: 'transparent', background: 'transparent', width: '80px', fontWeight: 'bold' }}
                                                />
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={!!item.isPaid}
                                                    onChange={e => handlePaidToggle(item, e.target.checked ? 1 : 0)}
                                                    style={{ width: '18px', height: '18px' }}
                                                />
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button className="danger small" onClick={() => deleteItem(item.id)} style={{ padding: '0.4rem' }}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </Fragment>
                            ))
                        )}
                    </tbody>
                    {items.length > 0 && (
                        <tfoot style={{ background: 'var(--bg-secondary)' }}>
                            <tr>
                                <td colSpan="3" style={{ padding: '1.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700' }}>
                                        <Calculator size={18} /> SUMMARY
                                    </div>
                                </td>
                                <td><strong title="Total Planned">₹{getTotalPlanned().toFixed(0)}</strong></td>
                                <td className={getTotalActual() > getTotalPlanned() ? 'negative' : 'positive'}>
                                    <strong title="Total Actual">₹{getTotalActual().toFixed(0)}</strong>
                                </td>
                                <td colSpan="2" style={{ textAlign: 'right', paddingRight: '2rem' }}>
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

            {/* Monthly Budget moved to bottom */}
            <div className="toolbar" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 1.25rem',
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                marginTop: '1rem'
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
        </section>
    );
}

