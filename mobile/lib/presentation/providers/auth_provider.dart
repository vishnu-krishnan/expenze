import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../data/services/database_helper.dart';

class AuthProvider with ChangeNotifier {
  final GoogleSignIn _googleSignIn = GoogleSignIn.instance;
  final DatabaseHelper _dbHelper = DatabaseHelper.instance;

  String? _token;
  Map<String, dynamic>? _user;
  bool _isLoading = false;
  String? _error;
  bool _isGoogleAvailable = false;

  AuthProvider();

  // Getters
  bool get isAuthenticated => _token != null;
  String? get token => _token;
  Map<String, dynamic>? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isGoogleAvailable => _isGoogleAvailable;

  // Initialize - Check if user is already logged in
  Future<void> initialize() async {
    _isLoading = true;
    notifyListeners();

    try {
      // In 7.0.0+, initialization is mandatory before use
      await _googleSignIn.initialize();
      _isGoogleAvailable = true;
    } catch (e) {
      _isGoogleAvailable = false;
      debugPrint('Google Sign-In initialization failed: $e');
    }

    try {
      final prefs = await SharedPreferences.getInstance();
      _token = prefs.getString('auth_token');
      final username = prefs.getString('user_name');

      if (_token != null && username != null) {
        // Fetch full profile from DB
        final dbUser = await _dbHelper.getUser(username);
        _user = {
          'id': dbUser?['id'],
          'username': username,
          'fullName': dbUser?['full_name'] ??
              prefs.getString('user_full_name') ??
              username,
          'email': prefs.getString('user_email'),
          'phone': prefs.getString('user_phone'),
          'photoUrl': prefs.getString('user_photo'),
          'defaultBudget': prefs.getDouble('user_budget') ?? 0.0,
          'provider': prefs.getString('auth_provider') ?? 'local',
        };
      }
    } catch (e) {
      _error = 'Failed to restore session';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Login (Local DB Match)
  Future<bool> login(String username, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final dbUser = await _dbHelper.getUser(username);

      if (dbUser == null) {
        _error = 'User not found. Please register first.';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      if (dbUser['password'] != password) {
        _error = 'Invalid credentials';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      _token = 'local_session_${DateTime.now().millisecondsSinceEpoch}';

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', _token!);
      await prefs.setString('user_name', username);
      await prefs.setString('user_full_name', dbUser['full_name'] ?? username);
      await prefs.setString('auth_provider', 'local');

      _user = {
        'id': dbUser['id'],
        'username': username,
        'fullName': dbUser['full_name'] ?? username,
        'email': dbUser['email'],
        'provider': 'local',
      };

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = 'Login failed: ${e.toString()}';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Register (Local DB)
  Future<bool> register({
    required String username,
    required String password,
    String? fullName,
    String? email,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final existing = await _dbHelper.getUser(username);
      if (existing != null) {
        _error = 'Username already exists';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      final userId = await _dbHelper.registerUser(
        username: username,
        password: password,
        fullName: fullName,
        email: email,
      );

      _token = 'local_session_${DateTime.now().millisecondsSinceEpoch}';

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', _token!);
      await prefs.setString('user_name', username);
      await prefs.setString('user_full_name', fullName ?? username);
      await prefs.setString('auth_provider', 'local');

      _user = {
        'id': userId,
        'username': username,
        'fullName': fullName ?? username,
        'email': email,
        'provider': 'local',
      };

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = 'Registration failed: ${e.toString()}';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Login with Google (Identity only, Data remains local)
  Future<bool> loginWithGoogle() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      if (!_isGoogleAvailable) {
        _error =
            'Google Sign-In is not configured correctly. On Android, a "Web Client ID" (serverClientId) must be provided in the code or via google-services.json.';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      if (!_googleSignIn.supportsAuthenticate()) {
        _error = 'Google Sign-In not supported on this platform';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      // New 7.0.0+ flow: authenticate() moves to stream events
      final completer = Completer<GoogleSignInAccount?>();
      StreamSubscription? subscription;

      subscription = _googleSignIn.authenticationEvents.listen((event) {
        if (event is GoogleSignInAuthenticationEventSignIn) {
          completer.complete(event.user);
          subscription?.cancel();
        }
      }, onError: (err) {
        if (!completer.isCompleted) completer.completeError(err);
        subscription?.cancel();
      });

      // Start the flow. You can add scopeHint here if needed.
      await _googleSignIn.authenticate();

      // Wait for the result or timeout
      final account = await completer.future.timeout(
        const Duration(minutes: 5),
        onTimeout: () {
          subscription?.cancel();
          throw TimeoutException('Google Sign-In timed out');
        },
      );

      if (account == null) {
        _isLoading = false;
        notifyListeners();
        return false;
      }

      _token = 'local_google_${account.id}';
      final username = account.displayName ?? account.email;

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', _token!);
      await prefs.setString('user_name', username);
      await prefs.setString('user_email', account.email);
      if (account.photoUrl != null)
        await prefs.setString('user_photo', account.photoUrl!);
      await prefs.setString('auth_provider', 'google');

      // Sync with local DB
      final userId = await _dbHelper.upsertUser(
        username: username,
        email: account.email,
      );

      _user = {
        'id': userId,
        'username': username,
        'email': account.email,
        'photoUrl': account.photoUrl,
        'provider': 'google',
      };

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = 'Google sign-in failed: ${e.toString()}';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Logout
  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();

    try {
      // Clear Google session
      await _googleSignIn.signOut();
    } catch (_) {}

    try {
      // Clear Preferences
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('auth_token');
      await prefs.remove('user_name');
      await prefs.remove('user_email');
      await prefs.remove('user_photo');
      await prefs.remove('auth_provider');

      _token = null;
      _user = null;
    } catch (e) {
      _error = 'Logout error: ${e.toString()}';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> updateProfile(
      {String? fullName,
      String? username,
      String? phone,
      double? defaultBudget}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      if (fullName != null) await prefs.setString('user_full_name', fullName);
      if (username != null) await prefs.setString('user_name', username);
      if (phone != null) await prefs.setString('user_phone', phone);
      if (defaultBudget != null)
        await prefs.setDouble('user_budget', defaultBudget);

      _user = {
        ...(_user ?? {}),
        if (fullName != null) 'fullName': fullName,
        if (username != null) 'username': username,
        if (phone != null) 'phone': phone,
        if (defaultBudget != null) 'defaultBudget': defaultBudget,
      };

      // Also update in DB
      if (_user?['id'] != null) {
        await _dbHelper.updateUserProfile(_user!['id'], {
          if (fullName != null) 'full_name': fullName,
          if (username != null) 'username': username,
          if (phone != null) 'phone': phone,
          if (defaultBudget != null) 'default_budget': defaultBudget,
        });
      }
    } catch (e) {
      _error = 'Update failed';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
