import '../models/declaration.dart';
import 'api_service.dart';

class PaiementService {
  final ApiService _api = ApiService();

  Future<List<DeclarationPaiement>> list({String? search, String? statut, int page = 1}) async {
    final response = await _api.get('/declarations', queryParameters: {
      if (search != null && search.isNotEmpty) 'search': search,
      if (statut != null) 'statut': statut,
      'page': page,
    });

    if (response['success'] == true) {
      final data = response['data'];
      return (data is List ? data : data['data'] ?? [])
          .map<DeclarationPaiement>((d) => DeclarationPaiement.fromJson(d))
          .toList();
    }
    throw Exception(response['message'] ?? 'Erreur');
  }

  Future<DeclarationPaiement> get(int id) async {
    final response = await _api.get('/declarations/$id');
    if (response['success'] == true) {
      return DeclarationPaiement.fromJson(response['data']);
    }
    throw Exception(response['message'] ?? 'Erreur');
  }

  Future<DeclarationPaiement> create(Map<String, dynamic> data) async {
    final response = await _api.post('/declarations', data: data);
    if (response['success'] == true) {
      return DeclarationPaiement.fromJson(response['data']);
    }
    throw Exception(response['message'] ?? 'Erreur lors de la création');
  }

  Future<DeclarationPaiement> update(int id, Map<String, dynamic> data) async {
    final response = await _api.put('/declarations/$id', data: data);
    if (response['success'] == true) {
      return DeclarationPaiement.fromJson(response['data']);
    }
    throw Exception(response['message'] ?? 'Erreur lors de la modification');
  }

  Future<void> delete(int id) async {
    final response = await _api.delete('/declarations/$id');
    if (response['success'] != true) {
      throw Exception(response['message'] ?? 'Erreur lors de la suppression');
    }
  }

  Future<DeclarationPaiement> validerPaiement(int id, {String? referencePaiement, double? montantPaye}) async {
    final response = await _api.post('/declarations/$id/valider', data: {
      if (referencePaiement != null) 'reference_paiement': referencePaiement,
      if (montantPaye != null) 'montant_paye': montantPaye,
    });
    if (response['success'] == true) {
      return DeclarationPaiement.fromJson(response['data']);
    }
    throw Exception(response['message'] ?? 'Erreur lors de la validation');
  }

  Future<DeclarationPaiement> annuler(int id, String motifAnnulation) async {
    final response = await _api.post('/declarations/$id/annuler', data: {
      'motif_annulation': motifAnnulation,
    });
    if (response['success'] == true) {
      return DeclarationPaiement.fromJson(response['data']);
    }
    throw Exception(response['message'] ?? 'Erreur lors de l\'annulation');
  }

  Future<DeclarationPaiement> exonerer(int id) async {
    final response = await _api.post('/declarations/$id/exonerer');
    if (response['success'] == true) {
      return DeclarationPaiement.fromJson(response['data']);
    }
    throw Exception(response['message'] ?? 'Erreur lors de l\'exonération');
  }

  Future<PaiementStats> statistiques() async {
    final response = await _api.get('/declarations/statistiques');
    if (response['success'] == true) {
      return PaiementStats.fromJson(response['data']);
    }
    throw Exception(response['message'] ?? 'Erreur');
  }
}
