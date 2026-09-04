import '../models/activite.dart';
import 'api_service.dart';

class ActiviteService {
  final ApiService _api = ApiService();

  Future<List<ActiviteEconomique>> list({String? search, int? personneId, int page = 1}) async {
    final response = await _api.get('/activites-economiques', queryParameters: {
      if (search != null && search.isNotEmpty) 'search': search,
      if (personneId != null) 'personne_id': personneId,
      'page': page,
    });

    if (response['success'] == true) {
      final data = response['data'];
      return (data is List ? data : data['data'] ?? [])
          .map<ActiviteEconomique>((a) => ActiviteEconomique.fromJson(a))
          .toList();
    }
    throw Exception(response['message'] ?? 'Erreur');
  }

  Future<ActiviteEconomique> get(int id) async {
    final response = await _api.get('/activites-economiques/$id');
    if (response['success'] == true) {
      return ActiviteEconomique.fromJson(response['data']);
    }
    throw Exception(response['message'] ?? 'Erreur');
  }

  Future<ActiviteEconomique> create(Map<String, dynamic> data) async {
    final response = await _api.post('/activites-economiques', data: data);
    if (response['success'] == true) {
      return ActiviteEconomique.fromJson(response['data']);
    }
    throw Exception(response['message'] ?? 'Erreur lors de la création');
  }

  Future<ActiviteEconomique> update(int id, Map<String, dynamic> data) async {
    final response = await _api.put('/activites-economiques/$id', data: data);
    if (response['success'] == true) {
      return ActiviteEconomique.fromJson(response['data']);
    }
    throw Exception(response['message'] ?? 'Erreur lors de la modification');
  }

  Future<void> delete(int id) async {
    final response = await _api.delete('/activites-economiques/$id');
    if (response['success'] != true) {
      throw Exception(response['message'] ?? 'Erreur lors de la suppression');
    }
  }
}
