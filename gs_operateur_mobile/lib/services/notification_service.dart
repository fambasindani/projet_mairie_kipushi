import '../models/notification.dart';
import 'api_service.dart';

class NotificationService {
  final ApiService _api = ApiService();

  Future<List<Notification>> list({String? search, int page = 1, int perPage = 20}) async {
    final response = await _api.get('/notifications', queryParameters: {
      'page': page,
      'per_page': perPage,
      if (search != null && search.isNotEmpty) 'search': search,
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
    await _api.patch('/notifications/lire-toutes');
  }

  Future<void> delete(int id) async {
    await _api.delete('/notifications/$id');
  }

  Future<int> countNonLues() async {
    try {
      final items = await nonLues();
      return items.length;
    } catch (_) {
      return 0;
    }
  }
}
