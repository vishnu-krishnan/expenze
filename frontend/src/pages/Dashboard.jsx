import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
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
            const res = await fetch(`/api/v1/month/${key}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            let planned = 0, actual = 0, count = 0;
            if (data?.items) {
                data.items.forEach(i => {
                    planned += parseFloat(i.plannedAmount) || 0;
                    actual += parseFloat(i.actualAmount) || 0;
                    if (!i.isPaid) count++;
                });
            }

            const salRes = await fetch(`/api/v1/salary/${key}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const salData = await salRes.json();
            setSalary(salData.amount || 0);

            setStats({
                planned,
                actual,
                diff: planned - actual,
                count
            });

            const summaryRes = await fetch('/api/v1/summary/last6', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
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

            const catRes = await fetch(`/api/v1/category-expenses/${key}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
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
            console.error(error);
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
                <div className="card">
                    <div className="card-header-icon">
                        <h3>Overview</h3>
                        <div className="icon-wrapper primary"><TrendingUp size={20} /></div>
                    </div>
                    <p>₹{stats.actual.toFixed(0)}</p>
                    <div className="stat-row" style={{ marginTop: '1rem' }}><span>Planned</span> <span>₹{stats.planned.toFixed(0)}</span></div>
                    <div className="stat-row"><span>Budget</span> <span>₹{salary.toFixed(0)}</span></div>
                </div>

                <div className={`card card-${getExpenseClass()}`}>
                    <div className="card-header-icon">
                        <h3>Spending</h3>
                        <div className={`icon-wrapper ${getExpenseClass()}`}>
                            {getExpenseClass() === 'danger' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                        </div>
                    </div>
                    <p>₹{stats.actual.toFixed(0)}</p>
                    <small style={{ color: 'var(--text-secondary)' }}>
                        {salary ? `📌 ${((stats.actual / salary) * 100).toFixed(1)}% of budget` : 'No budget set'}
                    </small>
                </div>

                <div className="card">
                    <div className="card-header-icon">
                        <h3>Pending</h3>
                        <div className="icon-wrapper warning"><Clock size={20} /></div>
                    </div>
                    <p>₹{((stats.planned - stats.actual) > 0 ? (stats.planned - stats.actual) : 0).toFixed(0)}</p>
                    <small style={{ color: 'var(--text-secondary)' }}>📝 {stats.count} unpaid bills</small>
                </div>

                <div className="card">
                    <div className="card-header-icon">
                        <h3>Remaining</h3>
                        <div className="icon-wrapper success"><Wallet size={20} /></div>
                    </div>
                    <p>₹{(salary - stats.actual).toFixed(0)}</p>
                    <small style={{ color: 'var(--text-secondary)' }}>
                        {salary ? `🎯 ${(((salary - stats.actual) / salary) * 100).toFixed(1)}% safe to save` : 'Set a budget'}
                    </small>
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
                                plugins: { legend: { position: 'bottom' } }
                            }} />
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
