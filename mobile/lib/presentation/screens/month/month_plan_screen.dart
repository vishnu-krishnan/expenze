import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

/// Simple placeholder for the Month Plan view from the web app.
/// Later we can wire this to the local SQLite `expenses` and `month_plans` tables.
class MonthPlanScreen extends StatelessWidget {
  const MonthPlanScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      appBar: AppBar(
        title: Row(
          children: [
            Icon(Icons.calendar_month, color: AppTheme.primary, size: 24),
            const SizedBox(width: 12),
            const Text('Monthly Plan'),
          ],
        ),
      ),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(16.0),
          child: Text(
            'Monthly plan screen\n\n'
            'Here we will show the list of planned items for the selected month, '
            'with planned vs actual amounts and edit/add/delete actions, using the local database.',
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }
}

