import 'package:dio/dio.dart';
import '../models/recu_perception.dart';
import 'api_service.dart';

class RecuPerceptionService {
  final ApiService _api = ApiService();

  Future<List<RecuPerception>> list({String? search, String? typePerception, int page = 1}) async {
    final response = await _api.get('/recus-perception', queryParameters: {
      if (search != null && search.isNotEmpty) 'search': search,
      if (typePerception != null) 'type_perception': typePerception,
      'page': page,
    });

    if (response['success'] == true) {
      final data = response['data'];
      final items = data is Map ? (data['data'] ?? []) : data;
      return (items as List).map<RecuPerception>((r) => RecuPerception.fromJson(r)).toList();
    }
    throw Exception(response['message'] ?? 'Erreur');
  }

  Future<RecuPerception> get(int id) async {
    final response = await _api.get('/recus-perception/$id');
    if (response['success'] == true) {
      return RecuPerception.fromJson(response['data']);
    }
    throw Exception(response['message'] ?? 'Erreur');
  }

  Future<RecuPerception> create(Map<String, dynamic> data) async {
    final response = await _api.post('/recus-perception', data: data);
    if (response['success'] == true) {
      return RecuPerception.fromJson(response['data']);
    }
    throw Exception(response['message'] ?? 'Erreur lors de la création');
  }

  Future<RecuPerception> update(int id, Map<String, dynamic> data) async {
    final response = await _api.put('/recus-perception/$id', data: data);
    if (response['success'] == true) {
      return RecuPerception.fromJson(response['data']);
    }
    throw Exception(response['message'] ?? 'Erreur lors de la modification');
  }

  Future<void> delete(int id) async {
    final response = await _api.delete('/recus-perception/$id');
    if (response['success'] != true) {
      throw Exception(response['message'] ?? 'Erreur lors de la suppression');
    }
  }

  Future<Map<String, dynamic>> stats() async {
    final response = await _api.get('/recus-perception/stats');
    if (response['success'] == true) {
      return response['data'];
    }
    throw Exception(response['message'] ?? 'Erreur');
  }

  Future<List<Map<String, dynamic>>> types() async {
    final response = await _api.get('/recus-perception/types');
    if (response['success'] == true) {
      return List<Map<String, dynamic>>.from(response['data']);
    }
    throw Exception(response['message'] ?? 'Erreur');
  }

  Future<String> prochainNumero(String typePerception) async {
    final response = await _api.get('/recus-perception/prochain-numero', queryParameters: {
      'type_perception': typePerception,
    });
    if (response['success'] == true) {
      return response['data']['numero'];
    }
    throw Exception(response['message'] ?? 'Erreur');
  }

  Future<Map<String, dynamic>> qrcode(int id) async {
    final response = await _api.get('/recus-perception/$id/qrcode');
    if (response['success'] == true) {
      return response['data'];
    }
    throw Exception(response['message'] ?? 'Erreur');
  }
}
