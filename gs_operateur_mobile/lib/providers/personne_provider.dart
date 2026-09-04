import 'package:flutter/material.dart';
import '../models/personne.dart';
import '../services/personne_service.dart';

class PersonneProvider extends ChangeNotifier {
  final PersonneService _service = PersonneService();
  List<Personne> _personnes = [];
  bool _loading = false;
  String? _error;
  int _currentPage = 1;
  bool _hasMore = true;

  List<Personne> get personnes => _personnes;
  bool get loading => _loading;
  String? get error => _error;
  bool get hasMore => _hasMore;

  Future<void> load({String? search, bool refresh = false}) async {
    if (refresh) {
      _currentPage = 1;
      _hasMore = true;
      _personnes = [];
    }
    if (!_hasMore) return;

    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final results = await _service.list(search: search, page: _currentPage);
      if (refresh) {
        _personnes = results;
      } else {
        _personnes.addAll(results);
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

  Future<Personne> create(Map<String, dynamic> data) async {
    final personne = await _service.create(data);
    _personnes.insert(0, personne);
    notifyListeners();
    return personne;
  }

  Future<Personne> update(int id, Map<String, dynamic> data) async {
    final personne = await _service.update(id, data);
    final index = _personnes.indexWhere((p) => p.id == id);
    if (index != -1) {
      _personnes[index] = personne;
      notifyListeners();
    }
    return personne;
  }

  Future<void> delete(int id) async {
    await _service.delete(id);
    _personnes.removeWhere((p) => p.id == id);
    notifyListeners();
  }
}
