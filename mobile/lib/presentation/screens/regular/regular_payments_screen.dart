import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

/// Placeholder for Regular Payments / Templates screen (matches web /regular).
/// Will later use the `regular_payments` table for recurring items.
class RegularPaymentsScreen extends StatelessWidget {
  const RegularPaymentsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      appBar: AppBar(
        title: Row(
          children: [
            Icon(Icons.repeat, color: AppTheme.primary, size: 24),
            const SizedBox(width: 12),
            const Text('Regular Payments'),
          ],
        ),
      ),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(16.0),
          child: Text(
            'Regular payments screen\n\n'
            'Here we will list and manage recurring expenses (templates) '
            'such as subscriptions and monthly bills, using the local database.',
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }
}

