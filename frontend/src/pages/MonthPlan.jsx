import { useState, useEffect } from 'react';

export default function MonthPlan() {
    const [monthKey, setMonthKey] = useState(new Date().toISOString().slice(0, 7));
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [salary, setSalary] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, [monthKey]);

    const loadData = async () => {
        setLoading(true);
        // Load Items
        const res = await fetch(`/api/month/${monthKey}`);
        const data = await res.json();
        if (data && data.items) {
            setItems(data.items);
        } else {
            setItems([]);
        }

        // Load Categories (for dropdowns)
        const catRes = await fetch('/api/categories');
        if (catRes.ok) setCategories(await catRes.json());

        // Load Salary
        const salRes = await fetch(`/api/salary/${monthKey}`);
        const salData = await salRes.json();
        setSalary(salData.amount || 0);

        setLoading(false);
    };

    const handleGenerate = async () => {
        setLoading(true);
        await fetch('/api/month/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ monthKey })
        });
        loadData();
    };

    const updateItem = async (id, field, value) => {
        const item = items.find(i => i.id === id);
        const updated = { ...item, [field]: value };

        // Optimistic update
        setItems(items.map(i => i.id === id ? updated : i));

        await fetch(`/api/items/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
        });
    };

    const updateSalary = async (val) => {
        setSalary(val); // Optimistic
        await fetch('/api/salary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ monthKey, amount: val })
        });
    };

    const deleteItem = async (id) => {
        if (!confirm('Delete item?')) return;
        setItems(items.filter(i => i.id !== id));
        await fetch(`/api/items/${id}`, { method: 'DELETE' });
    };

    const getTotalPlanned = () => items.reduce((sum, i) => sum + (parseFloat(i.plannedAmount) || 0), 0);
    const getTotalActual = () => items.reduce((sum, i) => sum + (parseFloat(i.actualAmount) || 0), 0);

    return (
        <section className="view active">
            <div className="view-header">
                <h2>Monthly Plan: {monthKey}</h2>
                <div className="dashboard-nav">
                    <button onClick={() => {
                        const [y, m] = monthKey.split('-').map(Number);
                        setMonthKey(new Date(y, m - 2, 1).toISOString().slice(0, 7));
                    }}>← Prev</button>
                    <input type="month" value={monthKey} onChange={e => setMonthKey(e.target.value)} />
                    <button onClick={() => {
                        const [y, m] = monthKey.split('-').map(Number);
                        setMonthKey(new Date(y, m, 1).toISOString().slice(0, 7));
                    }}>Next →</button>
                </div>
            </div>

            <div className="controls-bar">
                <button className="primary" onClick={handleGenerate}>🔄 Generate from Templates</button>
                <div className="salary-input">
                    <label>Monthly Budget: </label>
                    <input type="number" value={salary} onChange={e => updateSalary(parseFloat(e.target.value))} />
                </div>
            </div>

            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Item Name</th>
                            <th>Planned</th>
                            <th>Actual</th>
                            <th>Paid</th>
                            <th>Notes</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center' }}>No items found. Click 'Generate' or add manually.</td></tr>
                        ) : (
                            items.map(item => (
                                <tr key={item.id} className={item.isPaid ? 'paid-row' : ''}>
                                    <td>{item.categoryName}</td>
                                    <td><input value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} /></td>
                                    <td><input type="number" value={item.plannedAmount} onChange={e => updateItem(item.id, 'plannedAmount', parseFloat(e.target.value))} /></td>
                                    <td><input type="number" value={item.actualAmount} onChange={e => updateItem(item.id, 'actualAmount', parseFloat(e.target.value))} /></td>
                                    <td><input type="checkbox" checked={!!item.isPaid} onChange={e => updateItem(item.id, 'isPaid', e.target.checked ? 1 : 0)} /></td>
                                    <td><input value={item.notes || ''} onChange={e => updateItem(item.id, 'notes', e.target.value)} placeholder="..." /></td>
                                    <td><button className="danger small" onClick={() => deleteItem(item.id)}>X</button></td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan="2"><strong>Totals</strong></td>
                            <td><strong>{getTotalPlanned().toFixed(2)}</strong></td>
                            <td className={getTotalActual() > getTotalPlanned() ? 'negative' : 'positive'}>
                                <strong>{getTotalActual().toFixed(2)}</strong>
                            </td>
                            <td colSpan="3">
                                <em>Remaining: {(salary - getTotalActual()).toFixed(2)}</em>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </section>
    );
}
