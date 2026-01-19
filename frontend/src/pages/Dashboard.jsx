import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/apiConfig';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import {
    Calendar,
    ArrowUpCircle,
    ArrowDownCircle,
    Wallet,
    TrendingUp,
    Clock,
    ChevronLeft,
    ChevronRight,
    Target,
    Activity
} from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

export default function Dashboard() {
    const { token } = useAuth();
    const [monthKey, setMonthKey] = useState(new Date().toISOString().slice(0, 7));
    const [stats, setStats] = useState({ planned: 0, actual: 0, diff: 0, count: 0 });
    const [salary, setSalary] = useState(0);
    const [loading, setLoading] = useState(true);
    const [trendData, setTrendData] = useState(null);
    const [categoryData, setCategoryData] = useState(null);

    useEffect(() => {
        if (token) loadDashboardData(monthKey);
    }, [monthKey, token]);

    const loadDashboardData = async (key) => {
        setLoading(true);
        try {
            // Parallelize fetches for better performance
            const [monthRes, profRes, summaryRes, catRes] = await Promise.all([
                fetch(getApiUrl(`/api/v1/month/${key}`), { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(getApiUrl('/api/v1/profile'), { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(getApiUrl('/api/v1/summary/last6'), { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(getApiUrl(`/api/v1/category-expenses/${key}`), { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            // 1. Month Data
            const data = await monthRes.json();
            let planned = 0, actual = 0, count = 0;
            if (data?.items) {
                data.items.forEach(i => {
                    planned += parseFloat(i.plannedAmount) || 0;
                    actual += parseFloat(i.actualAmount) || 0;
                    if (!i.isPaid) count++;
                });
            }

            // 2. Profile (Budget) - replacing Salary entity
            let budgetAmount = 0;
            if (profRes.ok) {
                const prof = await profRes.json();
                budgetAmount = parseFloat(prof.defaultBudget) || 0;
                setSalary(budgetAmount); // We treat 'salary' state as 'Current Budget'
            }

            setStats({
                planned,
                actual,
                diff: planned - actual,
                count
            });

            // 3. Trend Data
            if (summaryRes.ok) {
                const summary = await summaryRes.json();
                setTrendData({
                    labels: summary.map(s => {
                        const [y, m] = s.monthKey.split('-');
                        return new Date(y, m - 1).toLocaleDateString('default', { month: 'short' });
                    }),
                    datasets: [
                        { label: 'Planned', data: summary.map(s => s.totalPlanned), borderColor: '#0d9488', backgroundColor: 'rgba(13, 148, 136, 0.5)', tension: 0.3 },
                        { label: 'Actual', data: summary.map(s => s.totalActual), borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.5)', tension: 0.3 },
                    ]
                });
            }

            // 4. Category Data
            if (catRes.ok) {
                const catData = await catRes.json();
                setCategoryData({
                    labels: catData.map(c => c.categoryName),
                    datasets: [{
                        data: catData.map(c => c.totalActual),
                        backgroundColor: [
                            '#0d9488', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981'
                        ],
                        borderWidth: 0
                    }]
                });
            }
        } catch (error) {
            console.error("Dashboard loading error:", error);
        } finally {
            setLoading(false);
        }
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

    const getExpenseClass = () => {
        if (!salary) return stats.actual > stats.planned ? 'high-expense' : '';
        const pct = (stats.actual / salary) * 100;
        if (pct >= 90) return 'danger';
        if (pct >= 70) return 'warning';
        return 'success';
    };

    if (loading) return <div className="panel" style={{ textAlign: 'center', padding: '5rem' }}>Loading Dashboard...</div>;

    return (
        <section className="view active">
            <div className="view-header">
                <div>
                    <h2 style={{ marginBottom: '0.25rem' }}>
                        <Activity size={24} style={{ marginRight: '0.75rem', color: 'var(--primary)' }} />
                        Dashboard
                    </h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Welcome back! Here's your financial overview.</p>
                </div>
                <div className="dashboard-nav" style={{ background: 'white', padding: '0.5rem', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button className="small" onClick={() => handleMonthChange(-1)} style={{ padding: '0.5rem' }}><ChevronLeft size={18} /></button>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 0.5rem' }}>
                        <Calendar size={18} color="var(--primary)" />
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

            <div className="cards-container">
                <div className="card" style={{
                    background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.05) 0%, rgba(13, 148, 136, 0.02) 100%)',
                    border: '1px solid rgba(13, 148, 136, 0.15)'
                }}>
                    <div className="card-header-icon">
                        <h3 style={{ color: '#0d9488' }}>Overview</h3>
                        <div className="icon-wrapper primary"><TrendingUp size={20} /></div>
                    </div>
                    <p style={{ fontSize: '2.25rem', fontWeight: '700', color: '#0d9488', marginBottom: '0.5rem' }}>
                        ₹{stats.actual.toFixed(0)}
                    </p>
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.6)',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        marginTop: '1rem'
                    }}>
                        <div className="stat-row" style={{ marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📊 Planned Budget</span>
                            <span style={{ fontWeight: '600' }}>₹{stats.planned.toFixed(0)}</span>
                        </div>
                        <div className="stat-row">
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>💰 Monthly Budget</span>
                            <span style={{ fontWeight: '600', color: '#0d9488' }}>₹{salary.toFixed(0)}</span>
                        </div>
                    </div>
                </div>

                <div className={`card card-${getExpenseClass()}`} style={{
                    background: getExpenseClass() === 'danger'
                        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.02) 100%)'
                        : 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.02) 100%)',
                    border: `1px solid ${getExpenseClass() === 'danger' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
                }}>
                    <div className="card-header-icon">
                        <h3 style={{ color: getExpenseClass() === 'danger' ? '#dc2626' : '#059669' }}>Spending</h3>
                        <div className={`icon-wrapper ${getExpenseClass()}`}>
                            {getExpenseClass() === 'danger' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                        </div>
                    </div>
                    <p style={{
                        fontSize: '2.25rem',
                        fontWeight: '700',
                        color: getExpenseClass() === 'danger' ? '#dc2626' : '#059669',
                        marginBottom: '0.5rem'
                    }}>
                        ₹{stats.actual.toFixed(0)}
                    </p>
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.6)',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        marginTop: '1rem'
                    }}>
                        <div style={{ marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Budget Usage</span>
                                <strong style={{ fontSize: '0.95rem', color: getExpenseClass() === 'danger' ? '#dc2626' : '#059669' }}>
                                    {salary ? `${((stats.actual / salary) * 100).toFixed(1)}%` : 'N/A'}
                                </strong>
                            </div>
                            {salary > 0 && (
                                <div style={{
                                    width: '100%',
                                    height: '6px',
                                    background: '#e5e7eb',
                                    borderRadius: '3px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${Math.min((stats.actual / salary) * 100, 100)}%`,
                                        height: '100%',
                                        background: getExpenseClass() === 'danger' ? '#ef4444' : '#10b981',
                                        transition: 'width 0.3s ease'
                                    }} />
                                </div>
                            )}
                        </div>
                        <small style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                            {getExpenseClass() === 'danger' ? '⚠️ Over budget limit' : '✅ Within safe limits'}
                        </small>
                    </div>
                </div>

                <div className="card" style={{
                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(251, 191, 36, 0.02) 100%)',
                    border: '1px solid rgba(251, 191, 36, 0.2)'
                }}>
                    <div className="card-header-icon">
                        <h3 style={{ color: '#d97706' }}>Pending</h3>
                        <div className="icon-wrapper warning"><Clock size={20} /></div>
                    </div>
                    <p style={{ fontSize: '2.25rem', fontWeight: '700', color: '#d97706', marginBottom: '0.5rem' }}>
                        ₹{((stats.planned - stats.actual) > 0 ? (stats.planned - stats.actual) : 0).toFixed(0)}
                    </p>
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.6)',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        marginTop: '1rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>📝</span>
                            <div>
                                <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{stats.count}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Unpaid Bills</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card" style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.02) 100%)',
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                }}>
                    <div className="card-header-icon">
                        <h3 style={{ color: '#2563eb' }}>Remaining</h3>
                        <div className="icon-wrapper success"><Wallet size={20} /></div>
                    </div>
                    <p style={{
                        fontSize: '2.25rem',
                        fontWeight: '700',
                        color: (salary - stats.actual) >= 0 ? '#2563eb' : '#dc2626',
                        marginBottom: '0.5rem'
                    }}>
                        ₹{(salary - stats.actual).toFixed(0)}
                    </p>
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.6)',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        marginTop: '1rem'
                    }}>
                        <div style={{ marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                💎 Available to Save
                            </span>
                        </div>
                        <strong style={{ fontSize: '1rem', color: '#2563eb' }}>
                            {salary ? `${(((salary - stats.actual) / salary) * 100).toFixed(1)}%` : 'Set a budget'}
                        </strong>
                        {salary > 0 && (salary - stats.actual) >= 0 && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#059669' }}>
                                🎯 Great job managing expenses!
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="charts-grid">
                {trendData && trendData.labels && trendData.labels.length > 0 && (
                    <div className="chart-container">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                            <div className="icon-wrapper info" style={{ padding: '8px' }}><TrendingUp size={18} /></div>
                            <h3 style={{ margin: 0 }}>Spending Trend</h3>
                        </div>
                        <div className="chart-wrapper">
                            <Line data={trendData} options={{
                                maintainAspectRatio: false,
                                plugins: { legend: { position: 'top', align: 'end' } },
                                scales: { y: { beginAtZero: true, grid: { borderDash: [5, 5] } } }
                            }} />
                        </div>
                    </div>
                )}

                {categoryData && categoryData.labels && categoryData.labels.length > 0 && categoryData.datasets[0].data.some(d => d > 0) && (
                    <div className="chart-container">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                            <div className="icon-wrapper success" style={{ padding: '8px' }}><Target size={18} /></div>
                            <h3 style={{ margin: 0 }}>Category Breakdown</h3>
                        </div>
                        <div className="chart-wrapper">
                            <Pie data={categoryData} options={{
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { position: 'bottom' },
                                    tooltip: {
                                        callbacks: {
                                            label: function (context) {
                                                const label = context.label || '';
                                                const value = context.parsed || 0;
                                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                                const percentage = ((value / total) * 100).toFixed(1);
                                                return `${label}: ₹${value.toFixed(0)} (${percentage}%)`;
                                            }
                                        }
                                    }
                                }
                            }} />
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
