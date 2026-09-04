import '../models/facture.dart';
import 'api_service.dart';

class FactureService {
  final ApiService _api = ApiService();

  Future<List<Facture>> list({String? search, int page = 1}) async {
    final response = await _api.get('/factures', queryParameters: {
      if (search != null && search.isNotEmpty) 'search': search,
      'page': page,
    });

    if (response['success'] == true) {
      final data = response['data'];
      return (data is List ? data : data['data'] ?? [])
          .map<Facture>((f) => Facture.fromJson(f))
          .toList();
    }
    throw Exception(response['message'] ?? 'Erreur');
  }

  Future<Facture> get(int id) async {
    final response = await _api.get('/factures/$id');
    if (response['success'] == true) {
      return Facture.fromJson(response['data']);
    }
    throw Exception(response['message'] ?? 'Erreur');
  }

  Future<String> downloadUrl(int id) async {
    return '${ApiService().getBaseUrl()}/factures/$id/download';
  }
}
