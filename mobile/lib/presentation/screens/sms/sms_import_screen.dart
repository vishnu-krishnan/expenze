import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

/// Placeholder for SMS Import screen (matches web /import).
/// In the future this can parse SMS messages and create expenses locally.
class SmsImportScreen extends StatelessWidget {
  const SmsImportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      appBar: AppBar(
        title: Row(
          children: [
            Icon(Icons.sms, color: AppTheme.primary, size: 24),
            const SizedBox(width: 12),
            const Text('SMS Import'),
          ],
        ),
      ),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(16.0),
          child: Text(
            'SMS import screen\n\n'
            'Here we will read or paste SMS messages, detect transactions, '
            'and convert them into expenses in the local database.',
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }
}

