import { useState, useEffect } from 'react';

export default function Templates() {
    const [templates, setTemplates] = useState([]);
    const [categories, setCategories] = useState([]);
    const [newTmpl, setNewTmpl] = useState({ name: '', categoryId: '', defaultPlannedAmount: 0, notes: '', startMonth: '', endMonth: '', isActive: 1 });

    useEffect(() => {
        fetchTemplates();
        fetchCategories();
    }, []);

    const fetchTemplates = async () => {
        const res = await fetch('/api/templates');
        if (res.ok) setTemplates(await res.json());
    };

    const fetchCategories = async () => {
        const res = await fetch('/api/categories');
        if (res.ok) setCategories(await res.json());
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        await fetch('/api/templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTmpl)
        });
        setNewTmpl({ name: '', categoryId: '', defaultPlannedAmount: 0, notes: '', startMonth: '', endMonth: '', isActive: 1 });
        fetchTemplates();
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this template?')) return;
        await fetch(`/api/templates/${id}`, { method: 'DELETE' });
        fetchTemplates();
    };

    return (
        <section className="view active">
            <h2>Payment Templates</h2>
            <div className="panel">
                <form className="add-form grid-form" onSubmit={handleAdd}>
                    <input type="text" placeholder="Template Name" value={newTmpl.name} onChange={e => setNewTmpl({ ...newTmpl, name: e.target.value })} required />

                    <select value={newTmpl.categoryId} onChange={e => setNewTmpl({ ...newTmpl, categoryId: e.target.value })} required>
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>

                    <input type="number" placeholder="Default Amount" value={newTmpl.defaultPlannedAmount} onChange={e => setNewTmpl({ ...newTmpl, defaultPlannedAmount: parseFloat(e.target.value) })} />

                    <input type="month" placeholder="Start Month" value={newTmpl.startMonth} onChange={e => setNewTmpl({ ...newTmpl, startMonth: e.target.value })} required />

                    <input type="month" placeholder="End Month (Optional)" value={newTmpl.endMonth} onChange={e => setNewTmpl({ ...newTmpl, endMonth: e.target.value })} />

                    <button type="submit" className="primary">Add Template</button>
                </form>

                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Amount</th>
                                <th>Start</th>
                                <th>End</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {templates.map(t => (
                                <tr key={t.id}>
                                    <td>{t.name}</td>
                                    <td>{t.categoryName}</td>
                                    <td>{t.defaultPlannedAmount}</td>
                                    <td>{t.startMonth}</td>
                                    <td>{t.endMonth || 'Forever'}</td>
                                    <td>
                                        <button className="danger" onClick={() => handleDelete(t.id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
