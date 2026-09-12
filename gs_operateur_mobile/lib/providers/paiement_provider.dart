import 'package:flutter/material.dart';
import '../models/declaration.dart';
import '../services/paiement_service.dart';

class PaiementProvider extends ChangeNotifier {
  final PaiementService service = PaiementService();
  List<DeclarationPaiement> _declarations = [];
  PaiementStats? _stats;
  bool _loading = false;
  String? _error;
  int _currentPage = 1;
  bool _hasMore = true;

  List<DeclarationPaiement> get declarations => _declarations;
  PaiementStats? get stats => _stats;
  bool get loading => _loading;
  String? get error => _error;
  bool get hasMore => _hasMore;

  int get enAttente => _declarations.where((d) => d.isEnAttente).length;
  int get paye => _declarations.where((d) => d.isPaye).length;

  Future<void> load({String? search, String? statut, bool refresh = false}) async {
    if (refresh) {
      _currentPage = 1;
      _hasMore = true;
      _declarations = [];
    }
    if (!_hasMore) return;

    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final results = await service.list(search: search, statut: statut, page: _currentPage);
      if (refresh) {
        _declarations = results;
      } else {
        _declarations.addAll(results);
      }
      _hasMore = results.length >= 15;
      _currentPage++;
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> loadStats() async {
    try {
      _stats = await service.statistiques();
      notifyListeners();
    } catch (e) {
      _error = e.toString();
    }
  }

  Future<DeclarationPaiement> valider(int id, {String? reference}) async {
    final declaration = await service.validerPaiement(id, referencePaiement: reference);
    final index = _declarations.indexWhere((d) => d.id == id);
    if (index != -1) {
      _declarations[index] = declaration;
      notifyListeners();
    }
    return declaration;
  }

  Future<void> annuler(int id, String motifAnnulation) async {
    final declaration = await service.annuler(id, motifAnnulation);
    final index = _declarations.indexWhere((d) => d.id == id);
    if (index != -1) {
      _declarations[index] = declaration;
      notifyListeners();
    }
  }
}
