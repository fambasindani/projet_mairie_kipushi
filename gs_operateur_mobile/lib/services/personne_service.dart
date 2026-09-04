import 'dart:io';
import 'package:dio/dio.dart';
import '../models/personne.dart';
import 'api_service.dart';

class PersonneService {
  final ApiService _api = ApiService();

  Future<List<Personne>> list({String? search, int page = 1}) async {
    final response = await _api.get('/personnes', queryParameters: {
      if (search != null && search.isNotEmpty) 'search': search,
      'page': page,
    });

    if (response['success'] == true) {
      final data = response['data'];
      return (data is List ? data : data['data'] ?? [])
          .map<Personne>((p) => Personne.fromJson(p))
          .toList();
    }
    throw Exception(response['message'] ?? 'Erreur');
  }

  Future<Personne> get(int id) async {
    final response = await _api.get('/personnes/$id');
    if (response['success'] == true) {
      return Personne.fromJson(response['data']);
    }
    throw Exception(response['message'] ?? 'Erreur');
  }

  Future<Personne> create(Map<String, dynamic> data) async {
    final response = await _api.post('/personnes', data: data);
    if (response['success'] == true) {
      return Personne.fromJson(response['data']);
    }
    throw Exception(response['message'] ?? 'Erreur lors de la création');
  }

  Future<Personne> update(int id, Map<String, dynamic> data) async {
    final response = await _api.put('/personnes/$id', data: data);
    if (response['success'] == true) {
      return Personne.fromJson(response['data']);
    }
    throw Exception(response['message'] ?? 'Erreur lors de la modification');
  }

  Future<void> delete(int id) async {
    final response = await _api.delete('/personnes/$id');
    if (response['success'] != true) {
      throw Exception(response['message'] ?? 'Erreur lors de la suppression');
    }
  }

  Future<Personne> uploadAvatar(int id, File imageFile) async {
    final formData = FormData.fromMap({
      'avatar': await MultipartFile.fromFile(imageFile.path),
    });
    final response = await _api.postFormData('/personnes/$id/avatar', formData: formData);
    if (response['success'] == true) {
      return Personne.fromJson(response['data']);
    }
    throw Exception(response['message'] ?? 'Erreur upload avatar');
  }
}
