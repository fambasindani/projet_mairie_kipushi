import 'package:flutter/material.dart';
import '../models/notification.dart' as models;
import '../services/notification_service.dart';

class NotificationProvider extends ChangeNotifier {
  final NotificationService _service = NotificationService();
  List<models.Notification> _notifications = [];
  models.NotificationStats? _stats;
  bool _loading = false;

  List<models.Notification> get notifications => _notifications;
  models.NotificationStats? get stats => _stats;
  bool get loading => _loading;
  int get nonLues => _stats?.nonLues ?? 0;

  Future<void> load() async {
    _loading = true;
    notifyListeners();
    try {
      _notifications = await _service.list();
      _stats = await _service.statistiques();
    } catch (e) {
      debugPrint('Error loading notifications: $e');
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> markAsRead(int id) async {
    await _service.marquerCommeLue(id);
    final index = _notifications.indexWhere((n) => n.id == id);
    if (index != -1) {
      _notifications[index] = models.Notification(
        id: _notifications[index].id,
        type: _notifications[index].type,
        titre: _notifications[index].titre,
        message: _notifications[index].message,
        lu: true,
        createdAt: _notifications[index].createdAt,
      );
      _stats = models.NotificationStats(
        total: _stats?.total ?? 0,
        nonLues: (_stats?.nonLues ?? 1) - 1,
      );
      notifyListeners();
    }
  }

  Future<void> markAllAsRead() async {
    await _service.marquerToutesCommeLues();
    _notifications = _notifications.map((n) => models.Notification(
      id: n.id,
      type: n.type,
      titre: n.titre,
      message: n.message,
      lu: true,
      createdAt: n.createdAt,
    )).toList();
    _stats = models.NotificationStats(total: _stats?.total ?? 0, nonLues: 0);
    notifyListeners();
  }
}
