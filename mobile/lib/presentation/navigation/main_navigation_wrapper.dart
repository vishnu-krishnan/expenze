import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/theme/app_theme.dart';
import '../screens/dashboard/dashboard_screen.dart';
import '../screens/month/month_plan_screen.dart';
import '../screens/regular/regular_payments_screen.dart';
import '../screens/profile/profile_screen.dart';

class MainNavigationWrapper extends StatefulWidget {
  const MainNavigationWrapper({super.key});

  @override
  State<MainNavigationWrapper> createState() => _MainNavigationWrapperState();
}

class _MainNavigationWrapperState extends State<MainNavigationWrapper> {
  int _selectedIndex = 0;

  final List<Widget> _screens = [
    const DashboardScreen(),
    const MonthPlanScreen(),
    const RegularPaymentsScreen(),
    const ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _selectedIndex,
        children: _screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        backgroundColor: Colors.white,
        elevation: 8,
        type: BottomNavigationBarType.fixed,
        selectedItemColor: AppTheme.primary,
        unselectedItemColor: AppTheme.textSecondary,
        selectedLabelStyle: const TextStyle(
          fontWeight: FontWeight.bold,
          fontSize: 12,
        ),
        unselectedLabelStyle: const TextStyle(
          fontSize: 12,
        ),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(LucideIcons.home, size: 20),
            activeIcon: Icon(LucideIcons.home, size: 22),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(LucideIcons.pieChart, size: 20),
            activeIcon: Icon(LucideIcons.pieChart, size: 22),
            label: 'Analytics',
          ),
          BottomNavigationBarItem(
            icon: Icon(LucideIcons.creditCard, size: 20),
            activeIcon: Icon(LucideIcons.creditCard, size: 22),
            label: 'Bills',
          ),
          BottomNavigationBarItem(
            icon: Icon(LucideIcons.user, size: 20),
            activeIcon: Icon(LucideIcons.user, size: 22),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
