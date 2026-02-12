import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../data/services/api_service.dart';
import '../../data/services/database_helper.dart';

class AuthProvider with ChangeNotifier {
  final ApiService _apiService;
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: [
      'email',
      'profile',
    ],
  );
  final DatabaseHelper _dbHelper = DatabaseHelper.instance;

  String? _token;
  Map<String, dynamic>? _user;
  bool _isLoading = false;
  String? _error;

  AuthProvider(this._apiService);

  // Getters
  bool get isAuthenticated => _token != null;
  String? get token => _token;
  Map<String, dynamic>? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;

  // Initialize - Check if user is already logged in
  Future<void> initialize() async {
    _isLoading = true;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      _token = prefs.getString('auth_token');
      final username = prefs.getString('user_name');

      if (_token != null && username != null) {
        _user = {'username': username};
        _apiService.setToken(_token);
      }
    } catch (e) {
      _error = 'Failed to restore session';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Login
  Future<bool> login(String username, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.login(username, password);

      if (response.statusCode == 200) {
        final data = response.data;
        _token = data['token'];
        _user = data['user'];

        // Save to shared preferences
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', _token!);
        await prefs.setString('user_name', _user!['username'] ?? username);

        _apiService.setToken(_token);

        // Persist user locally in SQLite
        await _dbHelper.upsertUser(
          username: _user!['username'] ?? username,
          email: _user!['email'],
        );

        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = 'Login failed';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = e.toString().contains('401')
          ? 'Invalid username or password'
          : 'Network error. Please try again.';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Login with Google
  Future<bool> loginWithGoogle() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final account = await _googleSignIn.signIn();

      // User cancelled the sign in flow
      if (account == null) {
        _isLoading = false;
        notifyListeners();
        return false;
      }

      // For local-only auth, we don't need an ID token.
      // Use a stable local token based on the Google account.
      _token = 'local_google_${account.id ?? account.email}';
      _user = {
        'username': account.displayName ?? account.email,
        'email': account.email,
        'photoUrl': account.photoUrl,
        'provider': 'google',
      };

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', _token!);
      await prefs.setString('user_name', _user!['username'] ?? account.email);

      _apiService.setToken(_token);

      // Persist Google user in local SQLite DB
      await _dbHelper.upsertUser(
        username: _user!['username'] ?? account.email,
        email: account.email,
      );

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = 'Google sign-in failed. Please try again.';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Logout
  Future<void> logout() async {
    _token = null;
    _user = null;
    _apiService.setToken(null);

    // Also sign out from Google if previously used
    try {
      await _googleSignIn.signOut();
    } catch (_) {
      // ignore sign-out errors
    }

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('user_name');

    notifyListeners();
  }

  // Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
