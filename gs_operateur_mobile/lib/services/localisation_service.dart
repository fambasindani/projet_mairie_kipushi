import '../models/localisation.dart';
import 'api_service.dart';

class LocalisationService {
  final ApiService _api = ApiService();

  Future<List<Province>> provinces() async {
    final response = await _api.get('/provinces');
    if (response['success'] == true) {
      final data = response['data'];
      return (data is List ? data : data['data'] ?? [])
          .map<Province>((p) => Province.fromJson(p))
          .toList();
    }
    throw Exception(response['message'] ?? 'Erreur');
  }

  Future<List<Ville>> villes({int? provinceId}) async {
    final response = await _api.get('/villes', queryParameters: {
      if (provinceId != null) 'id_province': provinceId,
    });
    if (response['success'] == true) {
      final data = response['data'];
      return (data is List ? data : data['data'] ?? [])
          .map<Ville>((v) => Ville.fromJson(v))
          .toList();
    }
    throw Exception(response['message'] ?? 'Erreur');
  }

  Future<List<Commune>> communes({int? villeId}) async {
    final response = await _api.get('/communes', queryParameters: {
      if (villeId != null) 'id_ville': villeId,
    });
    if (response['success'] == true) {
      final data = response['data'];
      return (data is List ? data : data['data'] ?? [])
          .map<Commune>((c) => Commune.fromJson(c))
          .toList();
    }
    throw Exception(response['message'] ?? 'Erreur');
  }

  Future<List<Quartier>> quartiers({int? communeId}) async {
    final response = await _api.get('/quartiers', queryParameters: {
      if (communeId != null) 'commune_id': communeId,
    });
    if (response['success'] == true) {
      final data = response['data'];
      return (data is List ? data : data['data'] ?? [])
          .map<Quartier>((q) => Quartier.fromJson(q))
          .toList();
    }
    throw Exception(response['message'] ?? 'Erreur');
  }
}
