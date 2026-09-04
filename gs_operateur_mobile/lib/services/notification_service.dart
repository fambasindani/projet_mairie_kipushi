import '../models/notification.dart';
import 'api_service.dart';

class NotificationService {
  final ApiService _api = ApiService();

  Future<List<Notification>> list({int page = 1}) async {
    final response = await _api.get('/notifications', queryParameters: {
      'page': page,
    });

    if (response['success'] == true) {
      final data = response['data'];
      return (data is List ? data : data['data'] ?? [])
          .map<Notification>((n) => Notification.fromJson(n))
          .toList();
    }
    throw Exception(response['message'] ?? 'Erreur');
  }

  Future<List<Notification>> nonLues() async {
    final response = await _api.get('/notifications/non-lues');
    if (response['success'] == true) {
      final data = response['data'];
      return (data is List ? data : [])
          .map<Notification>((n) => Notification.fromJson(n))
          .toList();
    }
    throw Exception(response['message'] ?? 'Erreur');
  }

  Future<void> marquerCommeLue(int id) async {
    await _api.patch('/notifications/$id/lire');
  }

  Future<void> marquerToutesCommeLues() async {
    await _api.post('/notifications/marquer-toutes-lues');
  }

  Future<NotificationStats> statistiques() async {
    final response = await _api.get('/notifications/statistiques');
    if (response['success'] == true) {
      return NotificationStats.fromJson(response['data']);
    }
    throw Exception(response['message'] ?? 'Erreur');
  }
}
