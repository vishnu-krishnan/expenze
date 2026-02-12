import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../../providers/expense_provider.dart';
import '../../providers/category_provider.dart';
import '../../../data/models/expense.dart';
import '../../../data/models/category.dart';

class MonthPlanScreen extends StatefulWidget {
  const MonthPlanScreen({super.key});

  @override
  State<MonthPlanScreen> createState() => _MonthPlanScreenState();
}

class _MonthPlanScreenState extends State<MonthPlanScreen> {
  bool _showAddForm = false;
  final _nameController = TextEditingController();
  final _amountController = TextEditingController();
  int? _selectedCategoryId;

  @override
  void dispose() {
    _nameController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  void _handleMonthChange(int offset) {
    final provider = context.read<ExpenseProvider>();
    final current = DateTime.parse('${provider.currentMonthKey}-01');
    final next = DateTime(current.year, current.month + offset, 1);
    provider.setMonth(DateFormat('yyyy-MM').format(next));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      appBar: AppBar(
        title: const Text('Budget Planner'),
        actions: [
          IconButton(
            onPressed: () => setState(() => _showAddForm = !_showAddForm),
            icon: Icon(_showAddForm ? LucideIcons.x : LucideIcons.plusCircle,
                color: AppTheme.primary),
          ),
        ],
      ),
      body: Consumer2<ExpenseProvider, CategoryProvider>(
        builder: (context, expenseProvider, categoryProvider, child) {
          if (expenseProvider.isLoading && expenseProvider.expenses.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          return CustomScrollView(
            slivers: [
              // 1. Month Navigation
              SliverToBoxAdapter(
                child: _buildMonthNavigator(expenseProvider.currentMonthKey),
              ),

              // 2. Add Form (Integrated)
              if (_showAddForm)
                SliverToBoxAdapter(
                  child: _buildAddForm(
                      categoryProvider.categories, expenseProvider),
                ),

              // 3. Summary Header
              SliverToBoxAdapter(
                child: _buildSummaryOverview(expenseProvider),
              ),

              // 4. Expense List
              if (expenseProvider.expenses.isEmpty)
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: _buildEmptyState(),
                )
              else
                SliverPadding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final expense = expenseProvider.expenses[index];
                        return _buildExpenseCard(expense, expenseProvider);
                      },
                      childCount: expenseProvider.expenses.length,
                    ),
                  ),
                ),
              const SliverToBoxAdapter(child: SizedBox(height: 100)),
            ],
          );
        },
      ),
    );
  }

  Widget _buildMonthNavigator(String monthKey) {
    final date = DateTime.parse('$monthKey-01');
    final monthName = DateFormat('MMMM yyyy').format(date);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: AppTheme.softShadow,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _buildNavButton(
              LucideIcons.chevronLeft, () => _handleMonthChange(-1)),
          Text(
            monthName,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          _buildNavButton(
              LucideIcons.chevronRight, () => _handleMonthChange(1)),
        ],
      ),
    );
  }

  Widget _buildNavButton(IconData icon, VoidCallback onTap) {
    return IconButton(
      icon: Icon(icon, size: 20, color: AppTheme.primary),
      onPressed: onTap,
    );
  }

  Widget _buildSummaryOverview(ExpenseProvider provider) {
    final summary = provider.summary;
    final planned = summary['planned'] ?? 0.0;
    final actual = summary['actual'] ?? 0.0;
    final remaining = summary['remaining'] ?? 0.0;

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Row(
        children: [
          _buildSummaryCard('Planned', planned, AppTheme.secondary),
          const SizedBox(width: 12),
          _buildSummaryCard('Spent', actual, AppTheme.accent),
          const SizedBox(width: 12),
          _buildSummaryCard('Balance', remaining,
              remaining >= 0 ? AppTheme.success : AppTheme.danger),
        ],
      ),
    );
  }

  Widget _buildSummaryCard(String label, double amount, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: AppTheme.softShadow,
        ),
        child: Column(
          children: [
            Text(label,
                style: TextStyle(
                    fontSize: 12,
                    color: AppTheme.textSecondary,
                    fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            Text(
              '₹${amount.toInt()}',
              style: TextStyle(
                  fontSize: 18, fontWeight: FontWeight.bold, color: color),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAddForm(List<Category> categories, ExpenseProvider provider) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.primary.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Plan New Expense',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          const SizedBox(height: 20),
          DropdownButtonFormField<int>(
            value: _selectedCategoryId,
            items: categories
                .map((c) => DropdownMenuItem(value: c.id, child: Text(c.name)))
                .toList(),
            onChanged: (val) => setState(() => _selectedCategoryId = val),
            decoration: AppTheme.inputDecoration('Category', LucideIcons.tag),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _nameController,
            decoration:
                AppTheme.inputDecoration('What is it for?', LucideIcons.edit3),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _amountController,
            keyboardType: TextInputType.number,
            decoration: AppTheme.inputDecoration(
                'How much? (Planned)', LucideIcons.target),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => _submitForm(provider),
              child: const Text('Add to Plan'),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _submitForm(ExpenseProvider provider) async {
    if (_selectedCategoryId == null ||
        _nameController.text.isEmpty ||
        _amountController.text.isEmpty) return;
    final expense = Expense(
      monthKey: provider.currentMonthKey,
      categoryId: _selectedCategoryId,
      name: _nameController.text,
      plannedAmount: double.parse(_amountController.text),
    );
    await provider.addExpense(expense);
    setState(() {
      _showAddForm = false;
      _nameController.clear();
      _amountController.clear();
      _selectedCategoryId = null;
    });
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(LucideIcons.calendarX,
              size: 64, color: AppTheme.textLight.withOpacity(0.5)),
          const SizedBox(height: 16),
          const Text('No plans yet',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const Text('Plan your month to stay on track',
              style: TextStyle(color: AppTheme.textSecondary)),
        ],
      ),
    );
  }

  Widget _buildExpenseCard(Expense expense, ExpenseProvider provider) {
    final bool isOver =
        expense.isPaid && (expense.actualAmount > expense.plannedAmount);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: AppTheme.softShadow,
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: (expense.isPaid ? AppTheme.success : AppTheme.primary)
                      .withOpacity(0.1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(
                  expense.isPaid
                      ? LucideIcons.checkCheck
                      : LucideIcons.shoppingBag,
                  size: 20,
                  color: expense.isPaid ? AppTheme.success : AppTheme.primary,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(expense.name,
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 16)),
                    Text('Target: ₹${expense.plannedAmount.toInt()}',
                        style:
                            TextStyle(color: AppTheme.textLight, fontSize: 12)),
                  ],
                ),
              ),
              Checkbox(
                value: expense.isPaid,
                onChanged: (val) => _showPaidDialog(expense, provider),
                activeColor: AppTheme.success,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(6)),
              ),
            ],
          ),
          if (expense.isPaid) ...[
            const Divider(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Actual Spent:',
                    style:
                        TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                Text(
                  '₹${expense.actualAmount.toInt()}',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: isOver ? AppTheme.danger : AppTheme.textPrimary,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  void _showPaidDialog(Expense expense, ExpenseProvider provider) {
    if (expense.isPaid) {
      provider.togglePaid(expense, 0);
      return;
    }
    final controller =
        TextEditingController(text: expense.plannedAmount.toStringAsFixed(0));
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirm Expense'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Enter the final amount spent'),
            const SizedBox(height: 16),
            TextField(
              controller: controller,
              keyboardType: TextInputType.number,
              autofocus: true,
              decoration:
                  AppTheme.inputDecoration('Amount', LucideIcons.indianRupee),
            ),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              final amount =
                  double.tryParse(controller.text) ?? expense.plannedAmount;
              provider.togglePaid(expense, amount);
              Navigator.pop(context);
            },
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
  }
}
