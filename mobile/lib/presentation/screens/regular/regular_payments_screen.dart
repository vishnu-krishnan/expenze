import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../../providers/regular_payment_provider.dart';
import '../../providers/category_provider.dart';
import '../../../data/models/category.dart';

class RegularPaymentsScreen extends StatefulWidget {
  const RegularPaymentsScreen({super.key});

  @override
  State<RegularPaymentsScreen> createState() => _RegularPaymentsScreenState();
}

class _RegularPaymentsScreenState extends State<RegularPaymentsScreen> {
  final _nameController = TextEditingController();
  final _amountController = TextEditingController();
  final _notesController = TextEditingController();
  int? _selectedCategoryId;
  String _frequency = 'MONTHLY';
  DateTime _startDate = DateTime.now();
  bool _showAddForm = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      appBar: AppBar(
        title: const Text('Regular Payments'),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => setState(() => _showAddForm = !_showAddForm),
        backgroundColor: AppTheme.primary,
        child: Icon(_showAddForm ? LucideIcons.x : LucideIcons.plus,
            color: Colors.white),
      ),
      body: Consumer2<RegularPaymentProvider, CategoryProvider>(
        builder: (context, provider, categoryProvider, child) {
          return CustomScrollView(
            slivers: [
              if (_showAddForm)
                _buildAddForm(categoryProvider.categories, provider),
              if (provider.payments.isEmpty)
                const SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(LucideIcons.repeat,
                            size: 64, color: AppTheme.textLight),
                        SizedBox(height: 16),
                        Text('No active subscriptions',
                            style: TextStyle(
                                fontSize: 18, fontWeight: FontWeight.bold)),
                        Text('Manage your recurring bills here',
                            style: TextStyle(color: AppTheme.textSecondary)),
                      ],
                    ),
                  ),
                )
              else
                SliverPadding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final payment = provider.payments[index];
                        return _buildPaymentCard(payment, provider);
                      },
                      childCount: provider.payments.length,
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

  Widget _buildAddForm(
      List<Category> categories, RegularPaymentProvider provider) {
    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.all(24),
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: AppTheme.softShadow,
        ),
        child: Column(
          children: [
            TextField(
              controller: _nameController,
              decoration: AppTheme.inputDecoration(
                  'Subscription Name', LucideIcons.creditCard),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<int>(
              value: _selectedCategoryId,
              items: categories
                  .map(
                      (c) => DropdownMenuItem(value: c.id, child: Text(c.name)))
                  .toList(),
              onChanged: (val) => setState(() => _selectedCategoryId = val),
              decoration:
                  AppTheme.inputDecoration('Category', LucideIcons.layoutGrid),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _amountController,
                    keyboardType: TextInputType.number,
                    decoration: AppTheme.inputDecoration(
                        'Amount', LucideIcons.indianRupee),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: _frequency,
                    items: const [
                      DropdownMenuItem(
                          value: 'MONTHLY', child: Text('Monthly')),
                      DropdownMenuItem(value: 'WEEKLY', child: Text('Weekly')),
                      DropdownMenuItem(value: 'YEARLY', child: Text('Yearly')),
                    ],
                    onChanged: (val) => setState(() => _frequency = val!),
                    decoration:
                        AppTheme.inputDecoration('Cycle', LucideIcons.repeat),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            InkWell(
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: _startDate,
                  firstDate: DateTime(2020),
                  lastDate: DateTime(2100),
                );
                if (picked != null) setState(() => _startDate = picked);
              },
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Row(
                  children: [
                    const Icon(LucideIcons.calendarDays,
                        size: 20, color: AppTheme.textSecondary),
                    const SizedBox(width: 12),
                    Text(
                        'Next Payment: ${DateFormat('dd MMM').format(_startDate)}',
                        style: const TextStyle(fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  if (_nameController.text.isEmpty ||
                      _selectedCategoryId == null) return;
                  final payment = RegularPayment(
                    id: null,
                    name: _nameController.text,
                    categoryId: _selectedCategoryId!,
                    defaultPlannedAmount:
                        double.tryParse(_amountController.text) ?? 0,
                    frequency: _frequency,
                    startDate: DateFormat('yyyy-MM-dd').format(_startDate),
                    isActive: true,
                    notes: _notesController.text,
                  );
                  await provider.addPayment(payment);
                  setState(() => _showAddForm = false);
                },
                child: const Text('Enroll Payment'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentCard(
      RegularPayment payment, RegularPaymentProvider provider) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
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
                  color: AppTheme.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Icon(LucideIcons.repeat,
                    size: 20, color: AppTheme.primary),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(payment.name,
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 16)),
                    Text(payment.categoryName ?? 'Miscellaneous',
                        style:
                            TextStyle(color: AppTheme.textLight, fontSize: 13)),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('₹${payment.defaultPlannedAmount.toInt()}',
                      style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                          color: AppTheme.textPrimary)),
                  Text(payment.frequency.toLowerCase(),
                      style: const TextStyle(
                          fontSize: 11, color: AppTheme.textLight)),
                ],
              ),
            ],
          ),
          const Divider(height: 32),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(LucideIcons.timer,
                      size: 14, color: AppTheme.textLight),
                  const SizedBox(width: 6),
                  Text(
                      'Active since ${DateFormat('MMM yyyy').format(DateTime.parse(payment.startDate))}',
                      style: const TextStyle(
                          fontSize: 12, color: AppTheme.textSecondary)),
                ],
              ),
              IconButton(
                onPressed: () => provider.deletePayment(payment.id!),
                icon: const Icon(LucideIcons.trash2,
                    size: 18, color: AppTheme.danger),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
