import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

export default function Dashboard() {
    const { user } = useAuth();
    const [monthKey, setMonthKey] = useState(new Date().toISOString().slice(0, 7));
    const [stats, setStats] = useState({ planned: 0, actual: 0, diff: 0, count: 0 });
    const [salary, setSalary] = useState(0);
    const [loading, setLoading] = useState(true);
    const [trendData, setTrendData] = useState(null);
    const [categoryData, setCategoryData] = useState(null);

    useEffect(() => {
        loadDashboardData(monthKey);
    }, [monthKey]);

    const loadDashboardData = async (key) => {
        setLoading(true);
        try {
            // 1. Fetch Month Items
            const res = await fetch(`/api/month/${key}`);
            const data = await res.json();

            let planned = 0, actual = 0, count = 0;
            if (data?.items) {
                data.items.forEach(i => {
                    planned += parseFloat(i.plannedAmount) || 0;
                    actual += parseFloat(i.actualAmount) || 0;
                    if (!i.isPaid) count++;
                });
            }

            // 2. Fetch Salary
            const salRes = await fetch(`/api/salary/${key}`);
            const salData = await salRes.json();
            setSalary(salData.amount || 0);

            setStats({
                planned,
                actual,
                diff: planned - actual, // Remaining from planned
                count
            });

            // 3. Fetch Trend (Last 6 months)
            const summaryRes = await fetch('/api/summary/last6');
            if (summaryRes.ok) {
                const summary = await summaryRes.json();
                setTrendData({
                    labels: summary.map(s => s.monthKey),
                    datasets: [
                        { label: 'Planned', data: summary.map(s => s.totalPlanned), borderColor: 'rgb(53, 162, 235)', backgroundColor: 'rgba(53, 162, 235, 0.5)' },
                        { label: 'Actual', data: summary.map(s => s.totalActual), borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132, 0.5)' },
                    ]
                });
            }

            // 4. Fetch Category Expenses (Pie Chart)
            const catRes = await fetch(`/api/category-expenses/${key}`);
            if (catRes.ok) {
                const catData = await catRes.json();
                setCategoryData({
                    labels: catData.map(c => c.categoryName),
                    datasets: [{
                        data: catData.map(c => c.totalActual),
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
                        ]
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
        const newKey = date.toISOString().slice(0, 7);
        setMonthKey(newKey);
    };

    const getExpenseClass = () => {
        if (!salary) return stats.actual > stats.planned ? 'high-expense' : '';
        const pct = (stats.actual / salary) * 100;
        if (pct >= 70) return 'high-expense';
        if (pct >= 50) return 'medium-expense';
        return 'low-expense';
    };

    if (loading) return <div className="p-4">Loading Dashboard...</div>;

    return (
        <section className="view active">
            <div className="view-header">
                <h2>Dashboard</h2>
                <div className="dashboard-nav">
                    <button onClick={() => handleMonthChange(-1)}>← Prev</button>
                    <input type="month" value={monthKey} onChange={(e) => setMonthKey(e.target.value)} />
                    <button onClick={() => handleMonthChange(1)}>Next →</button>
                </div>
            </div>

            <div className="cards-container">
                <div className="card">
                    <h3>Current Month</h3>
                    <p>{monthKey}</p>
                    <div className="stat-row"><span>Planned:</span> <span>₹{stats.planned.toFixed(2)}</span></div>
                    <div className="stat-row"><span>Actual:</span> <span>₹{stats.actual.toFixed(2)}</span></div>
                    <div className="stat-row"><strong>Remaining:</strong> <strong>₹{stats.diff.toFixed(2)}</strong></div>
                </div>

                <div className={`card ${getExpenseClass()}`}>
                    <h3>Total Expenses</h3>
                    <p>₹{stats.actual.toFixed(2)}</p>
                    <small>{salary ? `${((stats.actual / salary) * 100).toFixed(1)}% of Budget` : 'No Budget Set'}</small>
                </div>

                <div className="card card-warning">
                    <h3>Pending Expenses</h3>
                    <p>₹{((stats.planned - stats.actual) > 0 ? (stats.planned - stats.actual) : 0).toFixed(2)}</p>
                    <small>{stats.count} items unpaid</small>
                </div>

                <div className={`card ${salary - stats.actual >= 0 ? 'card-success' : 'negative'}`}>
                    <h3>Savings Goal</h3>
                    <p>{salary ? `₹${(salary - stats.actual).toFixed(2)}` : 'Set Budget'}</p>
                    <small>{salary ? `${(((salary - stats.actual) / salary) * 100).toFixed(1)}%` : '-'}</small>
                </div>
            </div>

            <div className="charts-grid">
                <div className="chart-container">
                    <h3 className="chart-title">Last 6 Months Trend</h3>
                    <div className="chart-wrapper">
                        {trendData && <Line data={trendData} options={{ maintainAspectRatio: false }} />}
                    </div>
                </div>
                <div className="chart-container">
                    <h3 className="chart-title">Category Breakdown</h3>
                    <div className="chart-wrapper">
                        {categoryData && <Pie data={categoryData} options={{ maintainAspectRatio: false }} />}
                    </div>
                </div>
            </div>
        </section>
    );
}
