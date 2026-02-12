import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../../core/theme/app_theme.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  String _monthKey = DateTime.now().toIso8601String().substring(0, 7);
  bool _isLoading = true;

  // Stats
  double _planned = 0;
  double _actual = 0;
  double _salary = 0;
  int _pendingCount = 0;

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    setState(() => _isLoading = true);

    // TODO: Load actual data from API
    await Future.delayed(const Duration(seconds: 1)); // Simulate API call

    // Mock data for now
    setState(() {
      _planned = 25000;
      _actual = 18500;
      _salary = 50000;
      _pendingCount = 3;
      _isLoading = false;
    });
  }

  void _handleMonthChange(int offset) {
    final parts = _monthKey.split('-');
    final year = int.parse(parts[0]);
    final month = int.parse(parts[1]);

    final date = DateTime(year, month + offset, 1);
    setState(() {
      _monthKey = '${date.year}-${date.month.toString().padLeft(2, '0')}';
    });
    _loadDashboardData();
  }

  String _formatMonthName(String key) {
    final parts = key.split('-');
    final date = DateTime(int.parse(parts[0]), int.parse(parts[1]));
    return '${_getMonthName(date.month)} ${date.year}';
  }

  String _getMonthName(int month) {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ];
    return months[month - 1];
  }

  Color _getExpenseClass() {
    if (_salary == 0)
      return _actual > _planned ? AppTheme.danger : AppTheme.success;
    final pct = (_actual / _salary) * 100;
    if (pct >= 90) return AppTheme.danger;
    if (pct >= 70) return AppTheme.warning;
    return AppTheme.success;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      appBar: AppBar(
        title: Row(
          children: [
            Icon(Icons.dashboard, color: AppTheme.primary, size: 24),
            const SizedBox(width: 12),
            const Text('Dashboard'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await Provider.of<AuthProvider>(context, listen: false).logout();
              if (mounted) {
                Navigator.of(context).pushReplacementNamed('/login');
              }
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadDashboardData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Welcome message
                    const Text(
                      'Welcome back! Here\'s your financial overview.',
                      style: TextStyle(
                        color: AppTheme.textSecondary,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Month selector
                    _buildMonthSelector(),
                    const SizedBox(height: 24),

                    // Stats cards
                    _buildStatsCards(),
                    const SizedBox(height: 24),

                    // Quick actions
                    _buildQuickActions(),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildMonthSelector() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            icon: const Icon(Icons.chevron_left),
            onPressed: () => _handleMonthChange(-1),
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
          ),
          Row(
            children: [
              const Icon(Icons.calendar_today,
                  size: 18, color: AppTheme.primary),
              const SizedBox(width: 8),
              Text(
                _formatMonthName(_monthKey),
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.chevron_right),
            onPressed: () => _handleMonthChange(1),
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsCards() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                title: 'Overview',
                amount: _actual,
                subtitle: 'Planned: ₹${_planned.toStringAsFixed(0)}',
                icon: Icons.trending_up,
                color: AppTheme.primary,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                title: 'Spending',
                amount: _actual,
                subtitle: _salary > 0
                    ? '${((_actual / _salary) * 100).toStringAsFixed(1)}% used'
                    : 'N/A',
                icon: _getExpenseClass() == AppTheme.danger
                    ? Icons.arrow_upward
                    : Icons.arrow_downward,
                color: _getExpenseClass(),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                title: 'Pending',
                amount: (_planned - _actual) > 0 ? (_planned - _actual) : 0,
                subtitle: '$_pendingCount unpaid bills',
                icon: Icons.schedule,
                color: AppTheme.warning,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                title: 'Remaining',
                amount: _salary - _actual,
                subtitle: _salary > 0
                    ? '${(((_salary - _actual) / _salary) * 100).toStringAsFixed(1)}% left'
                    : 'Set budget',
                icon: Icons.account_balance_wallet,
                color: AppTheme.secondary,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatCard({
    required String title,
    required double amount,
    required String subtitle,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: TextStyle(
                  color: color,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 16, color: color),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            '₹${amount.toStringAsFixed(0)}',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: const TextStyle(
              fontSize: 12,
              color: AppTheme.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Quick Actions',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: AppTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 12),
        _buildActionCard(
          title: 'Smart SMS Import',
          subtitle: 'Automatically add expenses from bank SMS',
          icon: Icons.smartphone,
          color: AppTheme.primary,
          onTap: () {
            // TODO: Navigate to SMS import
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('SMS Import - Coming soon!')),
            );
          },
        ),
        const SizedBox(height: 12),
        _buildActionCard(
          title: 'Monthly Plan',
          subtitle: 'View and manage your detailed spending plan',
          icon: Icons.calendar_month,
          color: AppTheme.secondary,
          onTap: () {
            // TODO: Navigate to monthly plan
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Monthly Plan - Coming soon!')),
            );
          },
        ),
      ],
    );
  }

  Widget _buildActionCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.border),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: AppTheme.textLight),
          ],
        ),
      ),
    );
  }
}
