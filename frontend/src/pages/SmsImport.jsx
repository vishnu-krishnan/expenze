import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/apiConfig';
import {
    Smartphone,
    MessageSquare,
    Zap,
    Plus,
    CheckCircle,
    AlertCircle,
    Copy,
    ChevronRight,
    Search,
    IndianRupee,
    Loader2,
    Sparkles
} from 'lucide-react';

export default function SmsImport() {
    const { token } = useAuth();
    const [rawText, setRawText] = useState('');
    const [detectedExpenses, setDetectedExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState(null);

    useEffect(() => {
        if (token) fetchCategories();
    }, [token]);

    const fetchCategories = async () => {
        const res = await fetch(getApiUrl('/api/v1/categories'), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setCategories(await res.json());
    };

    const parseSms = () => {
        if (!rawText.trim()) return;

        setLoading(true);
        // Simulate a bit of processing delay for "Smart" feel
        setTimeout(() => {
            const lines = rawText.split('\n').filter(line => line.trim().length > 10);
            const results = lines.map((line, index) => {
                // Regex for Amount: Matches Rs, Rs., INR, or "debited for Rs"
                const amountRegex = /(?:Rs\.?|INR|debited for Rs)\s*?([\d,]+(?:\.\d{2})?)/i;
                const amountMatch = line.match(amountRegex);
                const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;

                // Regex for Merchant: Capture what comes after keywords, or name before "credited"
                const merchantRegex = /(?:at|to|for|from|merchant:?)\s+([A-Z0-9\s&]{3,24})(?:\s|done|on|using|ref|$)|([A-Z0-9\s&]{3,24})(?=\s+credited)/i;
                const merchantMatch = line.match(merchantRegex);
                let merchant = merchantMatch ? (merchantMatch[1] || merchantMatch[2]).trim() : 'Unknown Merchant';

                // Clean up merchant name
                merchant = merchant.replace(/\s+/g, ' ').split(/ (on|using|done|ref|UPI)/i)[0];
                merchant = merchant.replace(/[.;:]+$/, '').trim();

                // Suggest Category based on keywords
                let suggestedCatId = '';
                const m = merchant.toLowerCase();

                if (m.includes('swiggy') || m.includes('zomato') || m.includes('food') || m.includes('starbucks') || m.includes('restaur') || m.includes('chai')) {
                    suggestedCatId = categories.find(c => c.name.toLowerCase().includes('dining'))?.id;
                } else if (m.includes('amazon') || m.includes('flipkart') || m.includes('myntra') || m.includes('shop')) {
                    suggestedCatId = categories.find(c => c.name.toLowerCase().includes('shopping'))?.id;
                } else if (m.includes('uber') || m.includes('ola') || m.includes('irctc') || m.includes('petrol') || m.includes('fuel')) {
                    suggestedCatId = categories.find(c => c.name.toLowerCase().includes('travel') || c.name.toLowerCase().includes('automotive'))?.id;
                } else if (m.includes('jio') || m.includes('airtel') || m.includes('recharge') || m.includes('phone')) {
                    suggestedCatId = categories.find(c => c.name.toLowerCase().includes('phone'))?.id;
                }

                return {
                    id: index,
                    raw: line,
                    name: merchant,
                    amount: amount,
                    categoryId: suggestedCatId || '',
                    priority: 'MEDIUM',
                    isValid: amount > 0,
                    status: 'pending' // pending, saving, success, error
                };
            });

            setDetectedExpenses(results);
            setLoading(false);
        }, 800);
    };

    const parseSmsWithAi = async () => {
        if (!rawText.trim()) return;
        setLoading(true);
        try {
            const res = await fetch(getApiUrl('/api/v1/ai/parse-sms'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ text: rawText })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.expenses && data.expenses.length > 0) {
                    const aiResults = data.expenses.map((exp, index) => {
                        const matchedCat = categories.find(c =>
                            c.name.toLowerCase().includes(exp.categorySuggestion?.toLowerCase()) ||
                            exp.categorySuggestion?.toLowerCase().includes(c.name.toLowerCase())
                        );

                        return {
                            id: `ai-${index}-${Date.now()}`,
                            raw: exp.rawText,
                            name: exp.name,
                            amount: exp.amount,
                            categoryId: matchedCat?.id || '',
                            priority: exp.priority || 'MEDIUM',
                            isValid: exp.amount > 0,
                            status: 'pending'
                        };
                    });
                    setDetectedExpenses(aiResults);
                } else {
                    alert("AI could not detect any transactions. Make sure your Groq API Key is configured.");
                    parseSms();
                }
            } else {
                alert("AI parsing failed. Using Lite Parser.");
                parseSms();
            }
        } catch (error) {
            console.error("AI Error:", error);
            parseSms();
        } finally {
            setLoading(false);
        }
    };

    const handleImportAll = async () => {
        const toSave = detectedExpenses.filter(e => e.status === 'pending' && e.isValid && e.categoryId);
        if (toSave.length === 0) {
            alert('Please select categories for valid items first.');
            return;
        }

        setSaving(true);
        const currentMonth = new Date().toISOString().slice(0, 7);

        for (const item of toSave) {
            try {
                // Update local status to saving
                setDetectedExpenses(prev => prev.map(e => e.id === item.id ? { ...e, status: 'saving' } : e));

                const res = await fetch(getApiUrl('/api/v1/items'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: item.name,
                        categoryId: item.categoryId,
                        plannedAmount: item.amount,
                        actualAmount: item.amount,
                        priority: item.priority,
                        monthKey: currentMonth,
                        isPaid: 1 // Imported SMS usually means it's already spent/paid
                    })
                });

                if (res.ok) {
                    setDetectedExpenses(prev => prev.map(e => e.id === item.id ? { ...e, status: 'success' } : e));
                } else {
                    setDetectedExpenses(prev => prev.map(e => e.id === item.id ? { ...e, status: 'error' } : e));
                }
            } catch (err) {
                setDetectedExpenses(prev => prev.map(e => e.id === item.id ? { ...e, status: 'error' } : e));
            }
        }
        setSaving(false);
        setStatus('Import complete!');
        setTimeout(() => setStatus(null), 3000);
    };

    const updateExpense = (id, field, value) => {
        setDetectedExpenses(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
    };

    return (
        <section className="view active">
            <div className="view-header">
                <div>
                    <h2><Smartphone size={24} style={{ marginRight: '0.75rem', color: 'var(--primary)' }} /> Smart SMS Import</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Paste transaction messages to automatically detect and add expenses.</p>
                </div>
            </div>

            <div className="grid-container sms-import-grid">
                <style>{`
                    @media (max-width: 992px) {
                        .sms-import-grid {
                            grid-template-columns: 1fr !important;
                        }
                        .panel {
                            position: static !important;
                        }
                    }
                `}</style>
                <div className="panel" style={{ position: 'sticky', top: '2rem' }}>
                    <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MessageSquare size={18} color="var(--primary)" /> Paste SMS Content
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        Copy and paste one or more transaction messages from your banking app or SMS inbox.
                    </p>
                    <textarea
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        placeholder="e.g. Spent Rs 500 at Swiggy using HDFC Bank Card..."
                        style={{
                            width: '100%',
                            height: '300px',
                            padding: '1rem',
                            borderRadius: '12px',
                            border: '1px solid var(--border)',
                            background: '#f8fafc',
                            fontFamily: 'monospace',
                            fontSize: '0.9rem',
                            resize: 'none',
                            marginBottom: '1.5rem'
                        }}
                    />
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <button
                            className="primary"
                            onClick={parseSms}
                            disabled={loading || !rawText.trim()}
                            style={{ flex: 1, height: '3.5rem', background: 'var(--text-secondary)' }}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <><Zap size={18} /> Lite Parse</>}
                        </button>
                        <button
                            className="primary"
                            onClick={parseSmsWithAi}
                            disabled={loading || !rawText.trim()}
                            style={{ flex: 1.5, height: '3.5rem', background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', border: 'none' }}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <><Sparkles size={18} /> AI Parse (Groq)</>}
                        </button>
                    </div>

                    <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(13, 148, 136, 0.05)', borderRadius: '12px', border: '1px dashed var(--primary)' }}>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>Security Note</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Due to browser privacy rules, we cannot read your SMS app automatically. Please copy-paste your messages here.
                        </p>
                    </div>
                </div>

                <div className="panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ margin: 0 }}>Detected Expenses</h3>
                        {detectedExpenses.length > 0 && (
                            <button
                                className="primary"
                                onClick={handleImportAll}
                                disabled={saving}
                                style={{ height: '2.5rem', padding: '0 1.5rem' }}
                            >
                                {saving ? <Loader2 className="animate-spin" /> : <><Plus size={16} /> Import to Monthly Plan</>}
                            </button>
                        )}
                    </div>

                    {status && (
                        <div className="status-popup status-success" style={{ marginBottom: '1rem', position: 'static', width: '100%' }}>
                            {status}
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {detectedExpenses.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '5rem 2rem', border: '2px dashed var(--border)', borderRadius: '16px', color: 'var(--text-secondary)' }}>
                                <Search size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                                <p>No expenses detected yet. Paste some text on the left to begin.</p>
                            </div>
                        ) : (
                            detectedExpenses.map((expense) => (
                                <div
                                    key={expense.id}
                                    style={{
                                        padding: '1.25rem',
                                        borderRadius: '16px',
                                        background: expense.status === 'success' ? '#f0fdf4' : 'white',
                                        border: `1px solid ${expense.status === 'success' ? '#bbf7d0' : 'var(--border)'}`,
                                        borderLeft: `5px solid ${expense.isValid ? 'var(--primary)' : '#ef4444'}`,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '1rem',
                                        transition: 'all 0.3s ease',
                                        opacity: expense.status === 'success' ? 0.7 : 1
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                <input
                                                    value={expense.name}
                                                    onChange={(e) => updateExpense(expense.id, 'name', e.target.value)}
                                                    style={{ border: 'none', background: 'transparent', fontWeight: '700', fontSize: '1.1rem', padding: 0, width: '100%' }}
                                                />
                                            </div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                "{expense.raw}"
                                            </p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', justifyContent: 'flex-end', color: 'var(--primary)', fontWeight: '800', fontSize: '1.25rem' }}>
                                                <span>₹</span>
                                                <input
                                                    type="number"
                                                    value={expense.amount}
                                                    onChange={(e) => updateExpense(expense.id, 'amount', parseFloat(e.target.value))}
                                                    style={{ border: 'none', background: 'transparent', width: '100px', textAlign: 'right', fontWeight: '800', color: 'inherit', padding: 0 }}
                                                />
                                            </div>
                                            {expense.status === 'success' && (
                                                <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'flex-end' }}>
                                                    <CheckCircle size={10} /> ADDED
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                                        <div className="input-group" style={{ marginBottom: 0 }}>
                                            <label style={{ fontSize: '0.7rem' }}>Category</label>
                                            <select
                                                value={expense.categoryId}
                                                onChange={(e) => updateExpense(expense.id, 'categoryId', e.target.value)}
                                                style={{ fontSize: '0.85rem', padding: '0.4rem' }}
                                            >
                                                <option value="">Select Category</option>
                                                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="input-group" style={{ marginBottom: 0 }}>
                                            <label style={{ fontSize: '0.7rem' }}>Priority</label>
                                            <select
                                                value={expense.priority}
                                                onChange={(e) => updateExpense(expense.id, 'priority', e.target.value)}
                                                style={{ fontSize: '0.85rem', padding: '0.4rem' }}
                                            >
                                                <option value="HIGH">High</option>
                                                <option value="MEDIUM">Medium</option>
                                                <option value="LOW">Low</option>
                                            </select>
                                        </div>
                                        {expense.status !== 'success' && (
                                            <button
                                                className="danger small"
                                                onClick={() => setDetectedExpenses(prev => prev.filter(e => e.id !== expense.id))}
                                                style={{ padding: '0.5rem', borderRadius: '8px' }}
                                            >
                                                Skip
                                            </button>
                                        )}
                                    </div>

                                    {!expense.isValid && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontSize: '0.75rem', fontWeight: '600' }}>
                                            <AlertCircle size={14} /> Could not detect amount automatically.
                                        </div>
                                    )}
                                    {!expense.categoryId && expense.isValid && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                            <Zap size={14} style={{ color: '#f59e0b' }} /> Select a category to import.
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
