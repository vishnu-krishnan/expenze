// app.js – Frontend logic with full CRUD & improved features
const App = {
    state: {
        categories: [],
        templates: [],
        currentMonth: new Date().toISOString().slice(0, 7), // YYYY-MM (for Monthly Plan)
        dashboardMonth: new Date().toISOString().slice(0, 7), // YYYY-MM (for Dashboard)
        monthPlan: null,
        monthItems: []
    },
    init: async () => {
        await App.fetchCategories();
        await App.fetchTemplates();

        // Set both month pickers to current month
        const currentMonth = App.state.currentMonth;
        const monthPicker = document.getElementById('month-picker');
        const dashPicker = document.getElementById('dash-month-picker');
        if (monthPicker) monthPicker.value = currentMonth;
        if (dashPicker) dashPicker.value = currentMonth;

        await View.showDashboard();
        View.populateCategorySelects();
    },
    // ---------- HELPERS ----------
    formatMonth: (monthKey) => {
        // Convert YYYY-MM to MMM-YY (e.g., 2025-10 → Oct-25)
        const [year, month] = monthKey.split('-');
        const date = new Date(year, month - 1, 1);
        const monthName = date.toLocaleString('en-US', { month: 'short' });
        const shortYear = year.slice(2);
        return `${monthName}-${shortYear}`;
    },
    // ---------- API ----------
    fetchCategories: async () => {
        const res = await fetch('/api/categories');
        App.state.categories = await res.json();
        View.renderCategories();
    },
    fetchTemplates: async () => {
        const res = await fetch('/api/templates');
        App.state.templates = await res.json();
        View.renderTemplates();
    },
    // ---------- CREATE ----------
    createCategory: async (e) => {
        e.preventDefault();
        const form = e.target;
        const name = form.name.value.trim();
        const sortOrder = parseInt(form.sortOrder.value) || 0;

        // Check for duplicates
        const exists = App.state.categories.find(c => c.name.toLowerCase() === name.toLowerCase());
        if (exists) {
            alert(`Category "${name}" already exists!`);
            return;
        }

        await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, sortOrder })
        });
        form.reset();
        await App.fetchCategories();
        View.populateCategorySelects();
    },
    createTemplate: async (e) => {
        e.preventDefault();
        const form = e.target;
        const body = {
            name: form.name.value.trim(),
            categoryId: form.categoryId.value,
            defaultPlannedAmount: parseFloat(form.defaultPlannedAmount.value) || 0,
            startMonth: form.startMonth.value,
            endMonth: form.endMonth.value || null,
            isActive: 1
        };
        await fetch('/api/templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        form.reset();
        form.startMonth.value = "2025-01";
        await App.fetchTemplates();
    },
    createManualItem: async (e) => {
        e.preventDefault();
        if (!App.state.monthPlan) {
            alert('Please generate the month plan first.');
            return;
        }
        const form = e.target;
        const body = {
            monthPlanId: App.state.monthPlan.id,
            categoryId: form.categoryId.value,
            name: form.name.value.trim(),
            plannedAmount: parseFloat(form.plannedAmount.value) || 0,
            actualAmount: 0,
            isPaid: 0,
            notes: ''
        };
        await fetch('/api/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        form.reset();
        await App.loadMonth(App.state.currentMonth);
    },
    // ---------- READ / UPDATE ----------
    loadMonth: async (monthKey) => {
        if (!monthKey) {
            console.error('loadMonth called with empty monthKey');
            return;
        }
        console.log('loadMonth called with:', monthKey);
        App.state.currentMonth = monthKey;

        // Sync both month pickers
        const monthPicker = document.getElementById('month-picker');
        const dashPicker = document.getElementById('dash-month-picker');
        if (monthPicker) {
            monthPicker.value = monthKey;
            console.log('Updated month-picker to:', monthKey);
        }
        if (dashPicker) {
            dashPicker.value = monthKey;
            console.log('Updated dash-month-picker to:', monthKey);
        }

        console.log('Fetching data for month:', monthKey);
        const res = await fetch(`/api/month/${monthKey}`);
        const data = await res.json();
        console.log('Received data:', data);

        if (data) {
            App.state.monthPlan = data.plan;
            App.state.monthItems = data.items;
        } else {
            App.state.monthPlan = null;
            App.state.monthItems = [];
        }

        // Fetch salary for this month
        const salaryRes = await fetch(`/api/salary/${monthKey}`);
        const salaryData = await salaryRes.json();
        App.state.currentSalary = salaryData.amount || 0;

        // Update salary input
        const salaryInput = document.getElementById('salary-input');
        if (salaryInput) {
            salaryInput.value = App.state.currentSalary;
        }

        View.renderMonthItems();
        View.calculateTotals();

        // Reload chart if on dashboard
        const dashboardView = document.getElementById('view-dashboard');
        if (dashboardView && dashboardView.classList.contains('active')) {
            console.log('Dashboard is active, reloading chart');
            await View.updateDashboard();
        }
    },
    saveSalary: async (amount) => {
        const salary = parseFloat(amount) || 0;
        App.state.currentSalary = salary;

        await fetch('/api/salary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ monthKey: App.state.currentMonth, amount: salary })
        });

        // Recalculate totals with new salary
        View.calculateTotals();
    },
    changeMonth: (offset) => {
        console.log('changeMonth called with offset:', offset);
        console.log('Current month before change:', App.state.currentMonth);

        const [y, m] = App.state.currentMonth.split('-').map(Number);
        console.log('Parsed year:', y, 'month:', m);

        // Calculate new month and year
        let newMonth = m + offset;
        let newYear = y;

        // Handle year boundaries
        if (newMonth > 12) {
            newMonth = 1;
            newYear++;
        } else if (newMonth < 1) {
            newMonth = 12;
            newYear--;
        }

        const newKey = `${newYear}-${String(newMonth).padStart(2, '0')}`;
        console.log('New month key:', newKey);

        App.loadMonth(newKey);
    },
    changeDashboardMonth: (offset) => {
        console.log('changeDashboardMonth called with offset:', offset);
        console.log('Dashboard month before change:', App.state.dashboardMonth);

        const [y, m] = App.state.dashboardMonth.split('-').map(Number);
        console.log('Parsed year:', y, 'month:', m);

        // Calculate new month and year
        let newMonth = m + offset;
        let newYear = y;

        // Handle year boundaries
        if (newMonth > 12) {
            newMonth = 1;
            newYear++;
        } else if (newMonth < 1) {
            newMonth = 12;
            newYear--;
        }

        const newKey = `${newYear}-${String(newMonth).padStart(2, '0')}`;
        console.log('New dashboard month key:', newKey);

        App.loadDashboardMonth(newKey);
    },
    loadDashboardMonth: async (monthKey) => {
        if (!monthKey) return;
        console.log('loadDashboardMonth called with:', monthKey);
        App.state.dashboardMonth = monthKey;

        // Update only dashboard month picker
        const dashPicker = document.getElementById('dash-month-picker');
        if (dashPicker) {
            dashPicker.value = monthKey;
            console.log('Updated dash-month-picker to:', monthKey);
        }

        // Fetch data for this month
        const res = await fetch(`/api/month/${monthKey}`);
        const data = await res.json();

        if (data) {
            // Temporarily store in state for calculations
            const tempItems = data.items || [];
            const totalPlanned = tempItems.reduce((s, i) => s + (parseFloat(i.plannedAmount) || 0), 0);
            const totalActual = tempItems.reduce((s, i) => s + (parseFloat(i.actualAmount) || 0), 0);
            const diff = totalPlanned - totalActual;
            const unpaidCount = tempItems.filter(i => !i.isPaid).length;

            // Update dashboard cards directly
            const dashMonth = document.getElementById('dash-current-month');
            if (dashMonth) dashMonth.innerText = App.formatMonth(monthKey);

            const dashPlanned = document.getElementById('dash-planned');
            if (dashPlanned) dashPlanned.innerText = `₹${totalPlanned.toFixed(2)}`;

            const dashActual = document.getElementById('dash-actual');
            if (dashActual) dashActual.innerText = `₹${totalActual.toFixed(2)}`;

            const dashDiff = document.getElementById('dash-diff');
            if (dashDiff) {
                dashDiff.innerText = `₹${diff.toFixed(2)}`;
                dashDiff.style.color = diff >= 0 ? 'var(--success)' : 'var(--danger)';
            }

            const dashTotalExpense = document.getElementById('dash-total-expense');
            if (dashTotalExpense) dashTotalExpense.innerText = `₹${totalActual.toFixed(2)}`;

            const dashUpcoming = document.getElementById('dash-upcoming-count');
            if (dashUpcoming) dashUpcoming.innerText = unpaidCount;

            const savingsPercent = totalPlanned > 0 ? ((diff / totalPlanned) * 100).toFixed(1) : 0;
            const dashSavings = document.getElementById('dash-savings-goal');
            if (dashSavings) {
                if (diff >= 0) {
                    dashSavings.innerText = `${savingsPercent}% saved`;
                    dashSavings.style.color = 'var(--success)';
                } else {
                    dashSavings.innerText = `${Math.abs(savingsPercent)}% over`;
                    dashSavings.style.color = 'var(--danger)';
                }
            }
        }

        // Reload charts
        await View.updateDashboard();
    },
    generateMonth: async () => {
        await fetch('/api/month/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ monthKey: App.state.currentMonth })
        });
        await App.loadMonth(App.state.currentMonth);
    },
    updateItem: async (id, field, value) => {
        const item = App.state.monthItems.find(i => i.id == id);
        if (!item) return;
        if (field === 'plannedAmount' || field === 'actualAmount') value = parseFloat(value) || 0;
        if (field === 'isPaid') value = value ? 1 : 0;
        item[field] = value;
        View.calculateTotals();
        await fetch(`/api/items/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: item.name,
                plannedAmount: item.plannedAmount,
                actualAmount: item.actualAmount,
                isPaid: item.isPaid,
                notes: item.notes
            })
        });
    },
    // ---------- DELETE ----------
    deleteCategory: async (id) => {
        const cat = App.state.categories.find(c => c.id == id);
        if (!cat) return;

        // Check usage
        const templatesUsing = App.state.templates.filter(t => t.categoryId == id);

        let confirmMsg = `Are you sure you want to delete category "${cat.name}"?`;
        if (templatesUsing.length > 0) {
            confirmMsg = `WARNING: Category "${cat.name}" is used by ${templatesUsing.length} template(s):\n\n`;
            confirmMsg += templatesUsing.map(t => `• ${t.name}`).join('\n');
            confirmMsg += '\n\nDeleting this category will NOT delete these templates, but they will have no category.\n\nType "DELETE" to confirm:';

            const userInput = prompt(confirmMsg);
            if (userInput !== 'DELETE') {
                alert('Deletion cancelled.');
                return;
            }
        } else {
            if (!confirm(confirmMsg)) return;
        }

        await fetch(`/api/categories/${id}`, { method: 'DELETE' });
        await App.fetchCategories();
        await App.fetchTemplates(); // Refresh to show updated category names
        View.populateCategorySelects();
    },
    editCategory: async (id) => {
        const cat = App.state.categories.find(c => c.id == id);
        const newName = prompt('Category name:', cat.name);
        if (newName === null || newName.trim() === '') return;

        // Check for duplicates (excluding current)
        const exists = App.state.categories.find(c => c.id !== id && c.name.toLowerCase() === newName.trim().toLowerCase());
        if (exists) {
            alert(`Category "${newName}" already exists!`);
            return;
        }

        const newOrder = prompt('Sort order:', cat.sortOrder);
        await fetch(`/api/categories/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName.trim(), sortOrder: parseInt(newOrder) || 0, isActive: cat.isActive })
        });
        await App.fetchCategories();
        await App.fetchTemplates(); // Refresh to show updated category names
        View.populateCategorySelects();
    },
    deleteTemplate: async (id) => {
        if (!confirm('Delete this template?')) return;
        await fetch(`/api/templates/${id}`, { method: 'DELETE' });
        await App.fetchTemplates();
    },
    editTemplate: async (id) => {
        const tmpl = App.state.templates.find(t => t.id == id);
        const newName = prompt('Template name:', tmpl.name);
        if (newName === null) return;
        const newAmount = prompt('Planned amount:', tmpl.defaultPlannedAmount);
        await fetch(`/api/templates/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: newName.trim(),
                categoryId: tmpl.categoryId,
                defaultPlannedAmount: parseFloat(newAmount) || 0,
                startMonth: tmpl.startMonth,
                endMonth: tmpl.endMonth,
                isActive: tmpl.isActive
            })
        });
        await App.fetchTemplates();
    },
    deleteItem: async (id) => {
        if (!confirm('Delete this item?')) return;
        await fetch(`/api/items/${id}`, { method: 'DELETE' });
        await App.loadMonth(App.state.currentMonth);
    }
};

const View = {
    showDashboard: async () => {
        View.switchTab('view-dashboard');
        await App.loadMonth(App.state.currentMonth);
        View.updateBreadcrumb('Dashboard');
        await View.updateDashboard();
    },
    showMonth: () => {
        View.switchTab('view-month');
        App.loadMonth(App.state.currentMonth);
        View.updateBreadcrumb('Monthly Plan');
    },
    showCategories: () => {
        View.switchTab('view-categories');
        View.updateBreadcrumb('Categories');
    },
    showTemplates: () => {
        View.switchTab('view-templates');
        View.updateBreadcrumb('Templates');
    },
    switchTab: (id) => {
        console.log('Switching to tab:', id);
        // Hide all views and remove active class
        document.querySelectorAll('.view').forEach(el => {
            el.classList.add('hidden');
            el.classList.remove('active');
        });
        // Show the selected view
        const targetView = document.getElementById(id);
        if (targetView) {
            targetView.classList.remove('hidden');
            targetView.classList.add('active');
            console.log('Tab switched successfully to:', id);
        } else {
            console.error('Could not find view with id:', id);
        }
        // Update active nav button
        document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));
        const btnMap = {
            'view-dashboard': 'nav-dashboard',
            'view-month': 'nav-month',
            'view-categories': 'nav-categories',
            'view-templates': 'nav-templates'
        };
        const activeBtn = document.getElementById(btnMap[id]);
        if (activeBtn) activeBtn.classList.add('active');
    },
    updateBreadcrumb: (current) => {
        const bc = document.getElementById('breadcrumb');
        bc.innerHTML = `
            <a href="#" onclick="View.showDashboard();return false;">Dashboard</a>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-current">${current}</span>
        `;
    },
    handleMobileNav: (value) => {
        const select = document.getElementById('mobile-nav-select');
        switch (value) {
            case 'dashboard':
                View.showDashboard();
                break;
            case 'month':
                View.showMonth();
                break;
            case 'categories':
                View.showCategories();
                break;
            case 'templates':
                View.showTemplates();
                break;
        }
    },
    populateCategorySelects: () => {
        const options = App.state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        ['template-cat-select', 'manual-cat-select'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = `<option value="">Select Category</option>` + options;
        });
    },
    renderCategories: () => {
        const list = document.getElementById('list-categories');
        if (App.state.categories.length === 0) {
            list.innerHTML = '<li style="text-align:center; color: var(--text-secondary);">No categories yet. Create one above!</li>';
            return;
        }
        list.innerHTML = App.state.categories.map(c => `
            <li>
                <div>
                    <span style="font-weight: 600;">${c.name}</span>
                    <small style="color: var(--text-secondary); margin-left: 0.5rem;">Order: ${c.sortOrder}</small>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="primary" onclick="App.editCategory(${c.id})">Edit</button>
                    <button class="danger" onclick="App.deleteCategory(${c.id})">Delete</button>
                </div>
            </li>`).join('');
    },
    renderTemplates: () => {
        const tbody = document.getElementById('list-templates');
        if (App.state.templates.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--text-secondary);">No templates yet. Create one above!</td></tr>';
            return;
        }
        tbody.innerHTML = App.state.templates.map(t => {
            const monthsRemaining = t.endMonth ? View.calculateMonthsRemaining(t.endMonth) : '∞';
            const statusBadge = t.isActive
                ? '<span class="badge badge-success">Active</span>'
                : '<span class="badge badge-inactive">Inactive</span>';
            const dateRange = `${App.formatMonth(t.startMonth)} → ${t.endMonth ? App.formatMonth(t.endMonth) : 'Ongoing'}`;
            const remainingText = monthsRemaining !== '∞' ? `${monthsRemaining} months left` : 'No end date';

            return `
            <tr>
                <td><strong>${t.name}</strong></td>
                <td>${t.categoryName || '<em style="color: var(--text-secondary);">No category</em>'}</td>
                <td class="text-right"><strong>₹${t.defaultPlannedAmount.toFixed(2)}</strong></td>
                <td class="active-duration">
                    <div class="status-info">
                        ${statusBadge}
                        <div class="date-info">
                            <small>${dateRange}</small>
                            <small class="text-muted">${remainingText}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="App.editTemplate(${t.id})" title="Edit">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                            Edit
                        </button>
                        <button class="btn-delete" onclick="App.deleteTemplate(${t.id})" title="Delete">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                            Delete
                        </button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    },
    calculateMonthsRemaining: (endMonth) => {
        if (!endMonth) return '∞';
        const now = new Date();
        const currentKey = now.toISOString().slice(0, 7);
        const [endY, endM] = endMonth.split('-').map(Number);
        const [currY, currM] = currentKey.split('-').map(Number);
        const monthsDiff = (endY - currY) * 12 + (endM - currM);
        return Math.max(0, monthsDiff);
    },
    renderMonthItems: () => {
        const tbody = document.getElementById('month-items-body');
        const items = App.state.monthItems;
        if (!items.length) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center">No items. Click "Generate from Templates" to start.</td></tr>`;
            View.calculateTotals();
            return;
        }
        let lastCatId = null;
        let html = '';
        items.forEach(item => {
            if (item.categoryId !== lastCatId) {
                html += `<tr class="category-header-row"><td colspan="6">${item.categoryName || 'Uncategorized'}</td></tr>`;
                lastCatId = item.categoryId;
            }
            html += `
                <tr>
                    <td></td>
                    <td><input value="${item.name}" onchange="App.updateItem(${item.id}, 'name', this.value)"/></td>
                    <td><input type="number" step="0.01" value="${item.plannedAmount}" onchange="App.updateItem(${item.id}, 'plannedAmount', this.value)" title="Edit planned amount for this month"/></td>
                    <td><input type="number" step="0.01" value="${item.actualAmount}" onchange="App.updateItem(${item.id}, 'actualAmount', this.value)"/></td>
                    <td style="text-align:center"><input type="checkbox" ${item.isPaid ? 'checked' : ''} onchange="App.updateItem(${item.id}, 'isPaid', this.checked)"/></td>
                    <td><input value="${item.notes || ''}" onchange="App.updateItem(${item.id}, 'notes', this.value)"/></td>
                </tr>`;
        });
        tbody.innerHTML = html;
        View.calculateTotals();
    },
    calculateTotals: () => {
        const items = App.state.monthItems;
        const totalPlanned = items.reduce((s, i) => s + (parseFloat(i.plannedAmount) || 0), 0);
        const totalActual = items.reduce((s, i) => s + (parseFloat(i.actualAmount) || 0), 0);
        const diff = totalPlanned - totalActual;
        const unpaidCount = items.filter(i => !i.isPaid).length;
        const pendingAmount = items.filter(i => !i.isPaid).reduce((s, i) => s + (parseFloat(i.plannedAmount) || 0), 0);
        const salary = App.state.currentSalary || 0;

        console.log('=== CALCULATE TOTALS DEBUG ===');
        console.log('Current Month:', App.state.currentMonth);
        console.log('Dashboard Month:', App.state.dashboardMonth);
        console.log('Budget (salary):', salary);
        console.log('Total Planned:', totalPlanned);
        console.log('Total Actual:', totalActual);
        console.log('Pending Amount:', pendingAmount);
        console.log('Unpaid Count:', unpaidCount);

        // Update month view totals
        const totalPlannedEl = document.getElementById('total-planned');
        const totalActualEl = document.getElementById('total-actual');
        const totalDiffEl = document.getElementById('total-diff');

        if (totalPlannedEl) totalPlannedEl.innerText = `₹${totalPlanned.toFixed(2)}`;
        if (totalActualEl) totalActualEl.innerText = `₹${totalActual.toFixed(2)}`;
        if (totalDiffEl) {
            totalDiffEl.innerText = `₹${diff.toFixed(2)}`;
            totalDiffEl.style.color = diff >= 0 ? 'var(--success)' : 'var(--danger)';
        }

        // Update dashboard cards
        const dashMonth = document.getElementById('dash-current-month');
        if (dashMonth) dashMonth.innerText = App.formatMonth(App.state.currentMonth);

        const dashPlanned = document.getElementById('dash-planned');
        if (dashPlanned) dashPlanned.innerText = `₹${totalPlanned.toFixed(2)}`;

        const dashActual = document.getElementById('dash-actual');
        if (dashActual) dashActual.innerText = `₹${totalActual.toFixed(2)}`;

        const dashDiff = document.getElementById('dash-diff');
        if (dashDiff) {
            dashDiff.innerText = `₹${diff.toFixed(2)}`;
            dashDiff.style.color = diff >= 0 ? 'var(--success)' : 'var(--danger)';
        }

        const dashTotalExpense = document.getElementById('dash-total-expense');
        const totalExpenseCard = document.getElementById('card-total-expense');

        if (dashTotalExpense) dashTotalExpense.innerText = `₹${totalActual.toFixed(2)}`;

        // Add dynamic class to total expenses card based on budget usage
        if (totalExpenseCard) {
            totalExpenseCard.classList.remove('high-expense', 'medium-expense', 'low-expense');

            if (salary > 0) {
                const expensePercent = (totalActual / salary) * 100;
                console.log(`💰 Total Expenses Card: ₹${totalActual.toFixed(2)} / ₹${salary.toFixed(2)} = ${expensePercent.toFixed(1)}%`);

                if (expensePercent >= 70) {
                    totalExpenseCard.classList.add('high-expense');
                    console.log('→ Color: 🔴 RED (>= 70%)');
                } else if (expensePercent >= 50) {
                    totalExpenseCard.classList.add('medium-expense');
                    console.log('→ Color: 🟠 ORANGE (50-70%)');
                } else {
                    totalExpenseCard.classList.add('low-expense');
                    console.log('→ Color: 🟢 GREEN (< 50%)');
                }
            } else {
                console.log('⚠️ NO BUDGET SET - Using planned amount as reference');
                if (totalPlanned > 0) {
                    const expensePercent = (totalActual / totalPlanned) * 100;
                    console.log(`💰 Total Expenses Card: ₹${totalActual.toFixed(2)} / ₹${totalPlanned.toFixed(2)} (planned) = ${expensePercent.toFixed(1)}%`);

                    if (expensePercent >= 90) {
                        totalExpenseCard.classList.add('high-expense');
                        console.log('→ Color: 🔴 RED (>= 90% of planned)');
                    } else if (expensePercent >= 70) {
                        totalExpenseCard.classList.add('medium-expense');
                        console.log('→ Color: 🟠 ORANGE (70-90% of planned)');
                    } else {
                        totalExpenseCard.classList.add('low-expense');
                        console.log('→ Color: 🟢 GREEN (< 70% of planned)');
                    }
                } else {
                    console.log('→ Color: No color (no planned amount)');
                }
            }
        }

        // Update pending expenses
        const dashPendingAmount = document.getElementById('dash-pending-amount');
        const dashPendingCount = document.getElementById('dash-pending-count');
        const pendingCard = document.getElementById('card-pending');

        if (dashPendingAmount) dashPendingAmount.innerText = `₹${pendingAmount.toFixed(2)}`;
        if (dashPendingCount) dashPendingCount.innerText = `${unpaidCount} item${unpaidCount !== 1 ? 's' : ''} unpaid`;

        // Add dynamic class based on pending amount relative to budget
        if (pendingCard && salary > 0) {
            const pendingPercent = (pendingAmount / salary) * 100;
            pendingCard.classList.remove('high-pending', 'medium-pending', 'low-pending');

            if (pendingPercent > 50) {
                // Red: More than 50% of budget is pending
                pendingCard.classList.add('high-pending');
            } else if (pendingPercent > 30) {
                // Orange/Warning: 30-50% of budget is pending
                pendingCard.classList.add('medium-pending');
            } else {
                // Green: Less than 30% of budget is pending
                pendingCard.classList.add('low-pending');
            }
        } else if (pendingCard) {
            // If no budget set, use planned amount as reference
            pendingCard.classList.remove('high-pending', 'medium-pending', 'low-pending');
            if (totalPlanned > 0) {
                const pendingPercent = (pendingAmount / totalPlanned) * 100;
                if (pendingPercent > 50) {
                    pendingCard.classList.add('high-pending');
                } else if (pendingPercent > 30) {
                    pendingCard.classList.add('medium-pending');
                } else {
                    pendingCard.classList.add('low-pending');
                }
            }
        }

        // Calculate savings based on budget
        const dashSavings = document.getElementById('dash-savings-goal');
        const savingsCard = document.getElementById('card-savings-goal');

        if (dashSavings) {
            if (salary > 0) {
                const actualSavings = salary - totalActual;
                const savingsPercent = ((actualSavings / salary) * 100).toFixed(1);

                // Add dynamic class based on savings
                if (savingsCard) {
                    savingsCard.classList.remove('positive', 'negative');
                    if (actualSavings >= 0) {
                        savingsCard.classList.add('positive'); // Green
                        dashSavings.innerText = `₹${actualSavings.toFixed(2)} (${savingsPercent}%)`;
                        dashSavings.style.color = 'var(--success)';
                    } else {
                        savingsCard.classList.add('negative'); // Red
                        dashSavings.innerText = `₹${actualSavings.toFixed(2)} (${savingsPercent}%)`;
                        dashSavings.style.color = 'var(--danger)';
                    }
                }
            } else {
                dashSavings.innerText = 'Set budget first';
                dashSavings.style.color = 'var(--text-secondary)';
                if (savingsCard) {
                    savingsCard.classList.remove('positive', 'negative');
                }
            }
        }
    },
    updateDashboard: async () => {
        try {
            // Fetch last 6 months summary
            const res = await fetch('/api/summary/last6');
            if (!res.ok) {
                console.error('Failed to fetch summary data');
                return;
            }
            const data = await res.json();
            console.log('Chart data received:', data);

            // Validate and format month labels
            const labels = data.map(d => {
                const monthKey = d.monthKey;
                console.log('Processing monthKey:', monthKey);
                return App.formatMonth(monthKey);
            });
            console.log('Formatted labels:', labels);

            const planned = data.map(d => d.totalPlanned || 0);
            const actual = data.map(d => d.totalActual || 0);

            // Line Chart - Last 6 Months
            const canvas = document.getElementById('summary-chart');
            if (canvas) {
                if (window.summaryChartInstance) {
                    window.summaryChartInstance.destroy();
                }

                const ctx = canvas.getContext('2d');
                window.summaryChartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels,
                        datasets: [
                            {
                                label: 'Planned',
                                data: planned,
                                borderColor: '#0d9488',
                                backgroundColor: 'rgba(13, 148, 136, 0.1)',
                                borderWidth: 3,
                                tension: 0.4,
                                fill: true,
                                pointRadius: 5,
                                pointHoverRadius: 7,
                                pointBackgroundColor: '#0d9488',
                                pointBorderColor: '#fff',
                                pointBorderWidth: 2
                            },
                            {
                                label: 'Actual',
                                data: actual,
                                borderColor: '#ef4444',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                borderWidth: 3,
                                tension: 0.4,
                                fill: true,
                                pointRadius: 5,
                                pointHoverRadius: 7,
                                pointBackgroundColor: '#ef4444',
                                pointBorderColor: '#fff',
                                pointBorderWidth: 2
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                            mode: 'index',
                            intersect: false
                        },
                        plugins: {
                            legend: {
                                position: 'top',
                                labels: {
                                    font: { size: 14, weight: 'bold' },
                                    padding: 15,
                                    usePointStyle: true
                                }
                            },
                            title: { display: false },
                            tooltip: {
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                padding: 12,
                                titleFont: { size: 14, weight: 'bold' },
                                bodyFont: { size: 13 },
                                callbacks: {
                                    label: function (context) {
                                        return context.dataset.label + ': ₹' + context.parsed.y.toFixed(2);
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    font: { size: 12 },
                                    callback: function (value) {
                                        return '₹' + value.toLocaleString();
                                    }
                                },
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.05)'
                                }
                            },
                            x: {
                                ticks: {
                                    font: { size: 12, weight: 'bold' }
                                },
                                grid: {
                                    display: false
                                }
                            }
                        }
                    }
                });
            }

            // Pie Chart - Category Expenses for Current Month
            const catRes = await fetch(`/api/category-expenses/${App.state.dashboardMonth}`);
            if (catRes.ok) {
                const catData = await catRes.json();
                const catCanvas = document.getElementById('category-chart');

                if (catCanvas && catData.length > 0) {
                    if (window.categoryChartInstance) {
                        window.categoryChartInstance.destroy();
                    }

                    const catCtx = catCanvas.getContext('2d');
                    const colors = [
                        '#0d9488', '#10b981', '#f59e0b', '#ef4444', '#3b82f6',
                        '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4'
                    ];

                    window.categoryChartInstance = new Chart(catCtx, {
                        type: 'pie',
                        data: {
                            labels: catData.map(c => c.categoryName || 'Uncategorized'),
                            datasets: [{
                                data: catData.map(c => c.totalActual),
                                backgroundColor: colors.slice(0, catData.length),
                                borderWidth: 2,
                                borderColor: '#fff'
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { position: 'bottom' },
                                title: {
                                    display: true,
                                    text: `Expenses by Category (${App.formatMonth(App.state.dashboardMonth)})`
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function (context) {
                                            const label = context.label || '';
                                            const value = context.parsed || 0;
                                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                            const percentage = ((value / total) * 100).toFixed(1);
                                            return `${label}: ₹${value.toFixed(2)} (${percentage}%)`;
                                        }
                                    }
                                }
                            }
                        }
                    });
                } else if (catCanvas) {
                    // Show "No data" message
                    if (window.categoryChartInstance) {
                        window.categoryChartInstance.destroy();
                    }
                    const catCtx = catCanvas.getContext('2d');
                    catCtx.clearRect(0, 0, catCanvas.width, catCanvas.height);
                    catCtx.font = '14px Inter';
                    catCtx.fillStyle = '#94a3b8';
                    catCtx.textAlign = 'center';
                    catCtx.fillText('No expense data for this month', catCanvas.width / 2, catCanvas.height / 2);
                }
            }
        } catch (error) {
            console.error('Error loading dashboard charts:', error);
        }
    }
};

// Start the app
App.init();
