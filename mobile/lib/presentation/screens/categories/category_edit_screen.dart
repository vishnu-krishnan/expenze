import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/theme/app_theme.dart';
import '../../providers/category_provider.dart';
import '../../../data/models/category.dart';

class CategoryEditScreen extends StatefulWidget {
  final Category category;
  const CategoryEditScreen({super.key, required this.category});

  @override
  State<CategoryEditScreen> createState() => _CategoryEditScreenState();
}

class _CategoryEditScreenState extends State<CategoryEditScreen> {
  late TextEditingController _nameController;
  late TextEditingController _iconController;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.category.name);
    _iconController = TextEditingController(text: widget.category.icon);
  }

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
        title: const Text('Edit Category'),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.trash2, color: AppTheme.danger),
            onPressed: () => _showDeleteDialog(context),
          ),
        ],
      ),
      body: Consumer<CategoryProvider>(
        builder: (context, provider, child) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildSectionHeader(
                    'Modify Identity', 'Update how this category appears'),
                const SizedBox(height: 24),
                _buildEditForm(provider),
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

  Widget _buildEditForm(CategoryProvider provider) {
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
          const Text('Category Icon',
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
                        ? AppTheme.primary.withValues(alpha: 0.1)
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
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: () async {
              if (_nameController.text.isEmpty) return;
              // Assuming provider will have an updateCategory method or similar
              // For now, we'll re-add/handle it or if not available, we'll suggest it
              // Since the provider might not have update yet, let's check
              await provider.updateCategory(widget.category.id,
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
            child: const Text('Save Changes'),
          ),
        ],
      ),
    );
  }

  void _showDeleteDialog(BuildContext context) {
    final provider = context.read<CategoryProvider>();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Category?'),
        content: Text(
            'Are you sure you want to delete "${widget.category.name}"? This action cannot be undone.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('CANCEL')),
          TextButton(
            onPressed: () async {
              await provider.deleteCategory(widget.category.id);
              if (mounted) {
                Navigator.pop(context); // Close dialog
                Navigator.pop(context); // Go back to list
              }
            },
            child:
                const Text('DELETE', style: TextStyle(color: AppTheme.danger)),
          ),
        ],
      ),
    );
  }
}
