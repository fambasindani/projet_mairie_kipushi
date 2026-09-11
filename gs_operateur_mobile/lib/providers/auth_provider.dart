import 'dart:async';
import 'package:flutter/material.dart';
import '../models/user.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import '../config/env.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();
  User? _user;
  bool _loading = true;
  Timer? _inactivityTimer;
  String? _lastError;

  User? get user => _user;
  bool get loading => _loading;
  bool get isAuthenticated => _user != null;
  bool get isOperateur => _user?.isOperateur ?? false;
  bool get isAdmin => _user?.isAdmin ?? false;
  String? get lastError => _lastError;

  Future<void> init() async {
    try {
      final api = ApiService();
      final hasToken = await api.hasToken();
      if (!hasToken) {
        _loading = false;
        notifyListeners();
        return;
      }

      try {
        _user = await _authService.me().timeout(const Duration(seconds: 10));
        _startInactivityTimer();
      } catch (e) {
        debugPrint('Auth init: token invalid or server unreachable - $e');
        await _authService.logout();
        _user = null;
      }
    } catch (e) {
      debugPrint('Auth init error: $e');
      _user = null;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<bool> login(String email, String password) async {
    try {
      _lastError = null;
      final result = await _authService.login(email, password);
      _user = result['user'] as User;
      _startInactivityTimer();
      notifyListeners();
      return true;
    } catch (e) {
      _lastError = e.toString().replaceFirst('Exception: ', '');
      debugPrint('Login error: $e');
      return false;
    }
  }

  Future<void> logout() async {
    _inactivityTimer?.cancel();
    try {
      await _authService.logout();
    } catch (_) {}
    _user = null;
    notifyListeners();
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
    required String newPasswordConfirmation,
  }) async {
    await _authService.changePassword(
      currentPassword: currentPassword,
      newPassword: newPassword,
      newPasswordConfirmation: newPasswordConfirmation,
    );
  }

  void resetInactivityTimer() {
    _inactivityTimer?.cancel();
    _startInactivityTimer();
  }

  void _startInactivityTimer() {
    _inactivityTimer = Timer(Env.sessionTimeout, () {
      logout();
    });
  }

  bool hasPermission(String permission) => _user?.hasPermission(permission) ?? false;
}
