import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/theme/app_theme.dart';
import 'presentation/providers/auth_provider.dart';
import 'presentation/providers/expense_provider.dart';
import 'presentation/providers/category_provider.dart';
import 'presentation/providers/regular_payment_provider.dart';
import 'presentation/screens/auth/login_screen.dart';
import 'presentation/screens/auth/register_screen.dart';
import 'presentation/screens/auth/reset_password_screen.dart';
import 'presentation/screens/month/month_plan_screen.dart';
import 'presentation/screens/categories/categories_screen.dart';
import 'presentation/screens/regular/regular_payments_screen.dart';
import 'presentation/screens/sms/sms_import_screen.dart';
import 'presentation/screens/profile/profile_screen.dart';
import 'presentation/navigation/main_navigation_wrapper.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        // Auth Provider
        ChangeNotifierProvider<AuthProvider>(
          create: (context) => AuthProvider()..initialize(),
        ),
        // Expense Provider
        ChangeNotifierProvider<ExpenseProvider>(
          create: (context) => ExpenseProvider()
            ..loadMonthData(DateTime.now().toIso8601String().substring(0, 7)),
        ),
        // Category Provider
        ChangeNotifierProvider<CategoryProvider>(
          create: (context) => CategoryProvider()..loadCategories(),
        ),
        // Regular Payment Provider
        ChangeNotifierProvider<RegularPaymentProvider>(
          create: (context) => RegularPaymentProvider()..loadPayments(),
        ),
      ],
      child: MaterialApp(
        title: 'Expenze',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        home: const AuthWrapper(),
        routes: {
          '/login': (context) => const LoginScreen(),
          '/register': (context) => const RegisterScreen(),
          '/reset-password': (context) {
            final args = ModalRoute.of(context)?.settings.arguments
                as Map<String, dynamic>?;
            return ResetPasswordScreen(token: args?['token']);
          },
          '/main': (context) => const MainNavigationWrapper(),
          '/month': (context) => const MonthPlanScreen(),
          '/categories': (context) => const CategoriesScreen(),
          '/regular': (context) => const RegularPaymentsScreen(),
          '/import': (context) => const SmsImportScreen(),
          '/profile': (context) => const ProfileScreen(),
        },
      ),
    );
  }
}

class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        // Show loading while checking authentication
        if (auth.isLoading) {
          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator(),
            ),
          );
        }

        // Navigate based on authentication status
        if (auth.isAuthenticated) {
          return const MainNavigationWrapper();
        } else {
          return const LoginScreen();
        }
      },
    );
  }
}
