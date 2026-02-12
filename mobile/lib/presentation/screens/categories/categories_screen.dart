import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

/// Placeholder for Categories management screen (matches web /categories page).
/// Later this will read/write from the local `categories` table.
class CategoriesScreen extends StatelessWidget {
  const CategoriesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      appBar: AppBar(
        title: Row(
          children: [
            Icon(Icons.category, color: AppTheme.primary, size: 24),
            const SizedBox(width: 12),
            const Text('Categories'),
          ],
        ),
      ),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(16.0),
          child: Text(
            'Categories screen\n\n'
            'Here we will manage expense categories (name, icon, color) '
            'stored in the local SQLite database.',
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }
}

