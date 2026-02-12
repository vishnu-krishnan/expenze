import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/theme/app_theme.dart';
import '../../providers/category_provider.dart';

class CategoryAddScreen extends StatefulWidget {
  const CategoryAddScreen({super.key});

  @override
  State<CategoryAddScreen> createState() => _CategoryAddScreenState();
}

class _CategoryAddScreenState extends State<CategoryAddScreen> {
  final _nameController = TextEditingController();
  final _iconController = TextEditingController();

  final List<Map<String, dynamic>> _quickAddCategories = [
    {'name': 'Rent', 'emoji': '🏠'},
    {'name': 'Groceries', 'emoji': '🍎'},
    {'name': 'Dining Out', 'emoji': '🍽️'},
    {'name': 'Automotive', 'emoji': '🚗'},
    {'name': 'Utilities', 'emoji': '💡'},
    {'name': 'Health', 'emoji': '🏥'},
    {'name': 'Entertainment', 'emoji': '🎬'},
    {'name': 'Shopping', 'emoji': '🛍️'},
    {'name': 'Investments', 'emoji': '📈'},
    {'name': 'Others', 'emoji': '🎁'},
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _iconController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      appBar: AppBar(
        title: const Text('Add Category'),
      ),
      body: Consumer<CategoryProvider>(
        builder: (context, provider, child) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildSectionHeader(
                    'Quick Suggestions', 'Pick from common categories'),
                const SizedBox(height: 16),
                _buildQuickAddGrid(provider),
                const SizedBox(height: 40),
                _buildSectionHeader(
                    'Custom Category', 'Create your own identification'),
                const SizedBox(height: 16),
                _buildCustomForm(provider),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildSectionHeader(String title, String subtitle) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        Text(subtitle,
            style: TextStyle(color: AppTheme.textLight, fontSize: 13)),
      ],
    );
  }

  Widget _buildQuickAddGrid(CategoryProvider provider) {
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: _quickAddCategories.map((cat) {
        final exists = provider.categories
            .any((c) => c.name.toLowerCase() == cat['name'].toLowerCase());

        return GestureDetector(
          onTap: exists
              ? null
              : () async {
                  await provider.addCategory(cat['name'], cat['emoji']);
                  if (mounted) Navigator.pop(context);
                },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: exists ? AppTheme.bgSecondary : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: exists ? Colors.transparent : AppTheme.border,
              ),
              boxShadow: exists ? [] : AppTheme.softShadow,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(cat['emoji'], style: const TextStyle(fontSize: 18)),
                const SizedBox(width: 8),
                Text(
                  cat['name'],
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: exists ? AppTheme.textLight : AppTheme.textPrimary,
                  ),
                ),
                if (exists) ...[
                  const SizedBox(width: 4),
                  const Icon(LucideIcons.check,
                      size: 14, color: AppTheme.success),
                ]
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildCustomForm(CategoryProvider provider) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: AppTheme.softShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: _nameController,
            decoration:
                AppTheme.inputDecoration('Category Name', LucideIcons.tag),
          ),
          const SizedBox(height: 20),
          const Text('Select an Icon',
              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              '🏠',
              '🍎',
              '🍽️',
              '🚗',
              '💡',
              '🏥',
              '🎬',
              '🛍️',
              '📈',
              '🎁',
              '🎮',
              '✈️',
              '💊',
              '📚',
              '👗',
              '🛠️',
              '🐾',
              '☕',
              '💪',
              '🚕'
            ].map((emoji) {
              final isSelected = _iconController.text == emoji;
              return GestureDetector(
                onTap: () => setState(() => _iconController.text = emoji),
                child: Container(
                  width: 44,
                  height: 44,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: isSelected
                        ? AppTheme.primary.withOpacity(0.1)
                        : AppTheme.bgSecondary,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isSelected ? AppTheme.primary : Colors.transparent,
                      width: 2,
                    ),
                  ),
                  child: Text(emoji, style: const TextStyle(fontSize: 20)),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () async {
              if (_nameController.text.isEmpty) return;
              await provider.addCategory(
                  _nameController.text, _iconController.text);
              if (mounted) Navigator.pop(context);
            },
            style: AppTheme.primaryButtonStyle.copyWith(
              minimumSize:
                  WidgetStateProperty.all(const Size(double.infinity, 54)),
              shape: WidgetStateProperty.all(
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
            ),
            child: const Text('Add Category'),
          ),
        ],
      ),
    );
  }
}
