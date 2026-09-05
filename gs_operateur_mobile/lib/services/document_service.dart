import 'dart:io';
import 'package:dio/dio.dart';
import '../models/document.dart';
import 'api_service.dart';

class DocumentService {
  final ApiService _api = ApiService();

  Future<List<Document>> list({String? search, int? personneId, int page = 1}) async {
    final response = await _api.get('/documents', queryParameters: {
      if (search != null && search.isNotEmpty) 'search': search,
      if (personneId != null) 'personne_id': personneId,
      'page': page,
    });

    if (response['success'] == true) {
      final data = response['data'];
      return (data is List ? data : data['data'] ?? [])
          .map<Document>((d) => Document.fromJson(d))
          .toList();
    }
    throw Exception(response['message'] ?? 'Erreur');
  }

  Future<Document> get(int id) async {
    final response = await _api.get('/documents/$id');
    if (response['success'] == true) {
      return Document.fromJson(response['data']);
    }
    throw Exception(response['message'] ?? 'Erreur');
  }

  Future<Document?> upload({
    required int personneId,
    required String typeDocument,
    String? numero,
    required File fichier,
  }) async {
    final formData = FormData.fromMap({
      if (personneId > 0) 'personne_id': personneId,
      'type_document': typeDocument,
      if (numero != null && numero.isNotEmpty) 'numero': numero,
      'fichier': await MultipartFile.fromFile(fichier.path),
    });
    final response = await _api.postFormData('/documents', formData: formData);
    if (response['success'] == true) {
      try {
        return Document.fromJson(response['data']);
      } catch (_) {
        return null;
      }
    }
    throw Exception(response['message'] ?? 'Erreur lors de l\'upload');
  }

  Future<void> delete(int id) async {
    final response = await _api.delete('/documents/$id');
    if (response['success'] != true) {
      throw Exception(response['message'] ?? 'Erreur lors de la suppression');
    }
  }

  String downloadUrl(int id) {
    return '${ApiService().getBaseUrl()}/documents/$id/download';
  }
}
