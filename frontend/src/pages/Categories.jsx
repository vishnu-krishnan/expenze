import { useState, useEffect } from 'react';

export default function Categories() {
    const [categories, setCategories] = useState([]);
    const [newCat, setNewCat] = useState({ name: '', sortOrder: 0 });
    const [editId, setEditId] = useState(null);
    const [editData, setEditData] = useState({});

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        const res = await fetch('/api/categories');
        if (res.ok) setCategories(await res.json());
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCat)
        });
        setNewCat({ name: '', sortOrder: 0 });
        fetchCategories();
    };

    const handleSave = async (id) => {
        await fetch(`/api/categories/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editData)
        });
        setEditId(null);
        fetchCategories();
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this category?')) return;
        await fetch(`/api/categories/${id}`, { method: 'DELETE' });
        fetchCategories();
    };

    const startEdit = (c) => {
        setEditId(c.id);
        setEditData(c);
    };

    return (
        <section className="view active">
            <h2>Categories</h2>
            <div className="panel">
                <form className="add-form" onSubmit={handleAdd}>
                    <input type="text" placeholder="New Category Name" value={newCat.name} onChange={e => setNewCat({ ...newCat, name: e.target.value })} required />
                    <input type="number" placeholder="Sort Order" value={newCat.sortOrder} onChange={e => setNewCat({ ...newCat, sortOrder: parseInt(e.target.value) })} style={{ width: '100px' }} />
                    <button type="submit" className="primary">Add Category</button>
                </form>

                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Sort Order</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map(c => (
                                <tr key={c.id}>
                                    {editId === c.id ? (
                                        <>
                                            <td><input value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} /></td>
                                            <td><input type="number" value={editData.sortOrder} onChange={e => setEditData({ ...editData, sortOrder: parseInt(e.target.value) })} /></td>
                                            <td>
                                                <button className="primary" onClick={() => handleSave(c.id)}>Save</button>
                                                <button onClick={() => setEditId(null)}>Cancel</button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td>{c.name}</td>
                                            <td>{c.sortOrder}</td>
                                            <td>
                                                <button onClick={() => startEdit(c)}>Edit</button>
                                                <button className="danger" onClick={() => handleDelete(c.id)}>Delete</button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
