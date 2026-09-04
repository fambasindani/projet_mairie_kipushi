import '../models/user.dart';
import 'api_service.dart';

class AuthService {
  final ApiService _api = ApiService();

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await _api.post('/login', data: {
      'email': email,
      'password': password,
    });

    if (response['success'] == true) {
      final token = response['data']['token'];
      final user = User.fromJson(response['data']['utilisateur']);
      await _api.setToken(token);
      return {'token': token, 'user': user};
    }
    throw Exception(response['message'] ?? 'Erreur de connexion');
  }

  Future<User> me() async {
    final response = await _api.get('/me');
    if (response['success'] == true) {
      final data = response['data'];
      final userData = data['utilisateur'] ?? data;
      final rolesData = data['roles'] ?? userData['roles'];
      userData['roles'] = rolesData;
      return User.fromJson(userData);
    }
    throw Exception(response['message'] ?? 'Erreur lors du chargement du profil');
  }

  Future<void> logout() async {
    try {
      await _api.post('/logout');
    } finally {
      await _api.clearToken();
    }
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
    required String newPasswordConfirmation,
  }) async {
    final response = await _api.post('/change-password', data: {
      'current_password': currentPassword,
      'new_password': newPassword,
      'new_password_confirmation': newPasswordConfirmation,
    });
    if (response['success'] != true) {
      throw Exception(response['message'] ?? 'Erreur lors du changement de mot de passe');
    }
  }
}
