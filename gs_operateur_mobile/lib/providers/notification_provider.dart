import 'package:flutter/material.dart';
import '../models/notification.dart' as models;
import '../services/notification_service.dart';

class NotificationProvider extends ChangeNotifier {
  final NotificationService _service = NotificationService();
  List<models.Notification> _notifications = [];
  bool _loading = false;
  int _nonLues = 0;

  List<models.Notification> get notifications => _notifications;
  bool get loading => _loading;
  int get nonLues => _nonLues;

  Future<void> load() async {
    _loading = true;
    notifyListeners();
    try {
      _notifications = await _service.list();
      _nonLues = await _service.countNonLues();
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
        typeNotification: _notifications[index].typeNotification,
        sujet: _notifications[index].sujet,
        message: _notifications[index].message,
        estLue: true,
        dateEnvoi: _notifications[index].dateEnvoi,
        dateLecture: DateTime.now(),
        lienAction: _notifications[index].lienAction,
        createdAt: _notifications[index].createdAt,
      );
      _nonLues = (_nonLues - 1).clamp(0, 9999);
      notifyListeners();
    }
  }

  Future<void> markAllAsRead() async {
    await _service.marquerToutesCommeLues();
    _notifications = _notifications.map((n) => models.Notification(
      id: n.id,
      typeNotification: n.typeNotification,
      sujet: n.sujet,
      message: n.message,
      estLue: true,
      dateEnvoi: n.dateEnvoi,
      dateLecture: DateTime.now(),
      lienAction: n.lienAction,
      createdAt: n.createdAt,
    )).toList();
    _nonLues = 0;
    notifyListeners();
  }

  Future<void> delete(int id) async {
    await _service.delete(id);
    _notifications.removeWhere((n) => n.id == id);
    _nonLues = _notifications.where((n) => !n.estLue).length;
    notifyListeners();
  }
}
