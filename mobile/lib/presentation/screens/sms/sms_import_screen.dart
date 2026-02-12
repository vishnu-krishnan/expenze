import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/theme/app_theme.dart';
import '../../providers/expense_provider.dart';
import '../../providers/category_provider.dart';
import '../../../data/models/category.dart';
import '../../../data/models/expense.dart';

class DetectedExpense {
  final String id;
  final String raw;
  String name;
  double amount;
  int? categoryId;
  String priority;
  bool isSaving;
  bool isSuccess;

  DetectedExpense({
    required this.id,
    required this.raw,
    required this.name,
    required this.amount,
    this.categoryId,
    this.priority = 'MEDIUM',
    this.isSaving = false,
    this.isSuccess = false,
  });
}

class SmsImportScreen extends StatefulWidget {
  const SmsImportScreen({super.key});

  @override
  State<SmsImportScreen> createState() => _SmsImportScreenState();
}

class _SmsImportScreenState extends State<SmsImportScreen> {
  final _rawTextController = TextEditingController();
  List<DetectedExpense> _detectedExpenses = [];
  bool _isLoading = false;

  void _parseSms() {
    final text = _rawTextController.text;
    if (text.isEmpty) return;

    setState(() => _isLoading = true);

    // Lite Regex Parser (simplified version of the React logic)
    final lines = text.split('\n').where((l) => l.trim().length > 10).toList();
    final results = lines.asMap().entries.map((entry) {
      final line = entry.value;
      final index = entry.key;

      // Regex for Amount
      final amountRegex = RegExp(
          r'(?:Rs\.?|INR|debited for Rs)\s*?([\d,]+(?:\.\d{2})?)',
          caseSensitive: false);
      final amountMatch = amountRegex.firstMatch(line);
      final amount = amountMatch != null
          ? double.parse(amountMatch.group(1)!.replaceAll(',', ''))
          : 0.0;

      // Regex for Merchant
      final merchantRegex = RegExp(
          r'(?:at|to|for|from|merchant:?)\s+([A-Z0-9\s&]{3,24})',
          caseSensitive: false);
      final merchantMatch = merchantRegex.firstMatch(line);
      final merchant = merchantMatch != null
          ? merchantMatch.group(1)!.trim()
          : 'Unknown Merchant';

      return DetectedExpense(
        id: 'lite-$index',
        raw: line,
        name: merchant,
        amount: amount,
      );
    }).toList();

    setState(() {
      _detectedExpenses = results;
      _isLoading = false;
    });
  }

  Future<void> _importAll() async {
    final provider = context.read<ExpenseProvider>();
    final currentMonth = provider.currentMonthKey;

    for (var i = 0; i < _detectedExpenses.length; i++) {
      final item = _detectedExpenses[i];
      if (item.categoryId == null || item.amount == 0 || item.isSuccess)
        continue;

      setState(() => _detectedExpenses[i].isSaving = true);

      try {
        final expense = Expense(
          monthKey: currentMonth,
          categoryId: item.categoryId,
          name: item.name,
          plannedAmount: item.amount,
          actualAmount: item.amount,
          priority: item.priority,
          isPaid: true,
        );
        await provider.addExpense(expense);
        setState(() => _detectedExpenses[i].isSuccess = true);
      } catch (e) {
        print('Error importing: $e');
      } finally {
        setState(() => _detectedExpenses[i].isSaving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      appBar: AppBar(title: const Text('Smart SMS Import')),
      body: Consumer<CategoryProvider>(
        builder: (context, catProvider, child) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildInputSection(),
                if (_detectedExpenses.isNotEmpty) ...[
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Detected Expenses',
                          style: TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 18)),
                      ElevatedButton.icon(
                        onPressed: _importAll,
                        icon: const Icon(LucideIcons.plus, size: 16),
                        label: const Text('Import All'),
                        style: AppTheme.primaryButtonStyle.copyWith(
                          padding: WidgetStateProperty.all(
                              const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 8)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ..._detectedExpenses.asMap().entries.map((entry) =>
                      _buildDetectedCard(
                          entry.value, entry.key, catProvider.categories)),
                ],
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildInputSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(LucideIcons.messageSquare,
                  size: 18, color: AppTheme.primary),
              const SizedBox(width: 8),
              const Text('Paste SMS Content',
                  style: TextStyle(fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _rawTextController,
            maxLines: 6,
            decoration: AppTheme.inputDecoration(
                    'Paste transaction messages...', LucideIcons.smartphone)
                .copyWith(
              prefixIcon: null, // Remove icon for larger text area
            ),
            style: const TextStyle(fontFamily: 'monospace', fontSize: 13),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _isLoading ? null : _parseSms,
                  icon: const Icon(LucideIcons.zap, size: 18),
                  label: const Text('Lite Parse'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.textSecondary,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {
                    // TODO: Implement AI Parse (needs ApiService update)
                  },
                  icon: const Icon(LucideIcons.sparkles, size: 18),
                  label: const Text('AI Parse'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.deepPurple,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDetectedCard(
      DetectedExpense expense, int index, List<Category> categories) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: expense.isSuccess
            ? AppTheme.success.withOpacity(0.05)
            : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
            color: expense.isSuccess
                ? AppTheme.success.withOpacity(0.3)
                : AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(expense.name,
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 16)),
              ),
              Text(
                '₹${expense.amount.toStringAsFixed(0)}',
                style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                    color: AppTheme.primary),
              ),
            ],
          ),
          Text(
            expense.raw,
            style: TextStyle(
                color: AppTheme.textSecondary,
                fontSize: 11,
                fontStyle: FontStyle.italic),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Divider(height: 1),
          ),
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<int>(
                  value: expense.categoryId,
                  items: categories
                      .map((c) => DropdownMenuItem(
                          value: c.id,
                          child: Text(c.name,
                              style: const TextStyle(fontSize: 13))))
                      .toList(),
                  onChanged: expense.isSuccess
                      ? null
                      : (val) => setState(
                          () => _detectedExpenses[index].categoryId = val),
                  decoration: const InputDecoration(
                    labelText: 'Category',
                    contentPadding:
                        EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    border: OutlineInputBorder(),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              if (expense.isSaving)
                const CircularProgressIndicator(strokeWidth: 2)
              else if (expense.isSuccess)
                Icon(LucideIcons.checkCircle, color: AppTheme.success, size: 24)
              else
                IconButton(
                  icon: const Icon(LucideIcons.trash2,
                      color: AppTheme.danger, size: 20),
                  onPressed: () =>
                      setState(() => _detectedExpenses.removeAt(index)),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
