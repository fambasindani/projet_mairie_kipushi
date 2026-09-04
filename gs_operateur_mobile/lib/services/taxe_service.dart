import '../models/taxe.dart';
import 'api_service.dart';

class TaxeService {
  final ApiService _api = ApiService();

  Future<List<Taxe>> list({String? search, int page = 1}) async {
    final response = await _api.get('/taxes', queryParameters: {
      if (search != null && search.isNotEmpty) 'search': search,
      'page': page,
    });

    if (response['success'] == true) {
      final data = response['data'];
      return (data is List ? data : data['data'] ?? [])
          .map<Taxe>((t) => Taxe.fromJson(t))
          .toList();
    }
    throw Exception(response['message'] ?? 'Erreur');
  }

  Future<Taxe> get(int id) async {
    final response = await _api.get('/taxes/$id');
    if (response['success'] == true) {
      return Taxe.fromJson(response['data']);
    }
    throw Exception(response['message'] ?? 'Erreur');
  }

  Future<Taxe> create(Map<String, dynamic> data) async {
    final response = await _api.post('/taxes', data: data);
    if (response['success'] == true) {
      return Taxe.fromJson(response['data']);
    }
    throw Exception(response['message'] ?? 'Erreur lors de la création');
  }
}
