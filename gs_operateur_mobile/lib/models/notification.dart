class Notification {
  final int id;
  final int? personneId;
  final String type;
  final String titre;
  final String? message;
  final bool lu;
  final DateTime? createdAt;

  Notification({
    required this.id,
    this.personneId,
    required this.type,
    required this.titre,
    this.message,
    this.lu = false,
    this.createdAt,
  });

  factory Notification.fromJson(Map<String, dynamic> json) {
    return Notification(
      id: json['id'] ?? 0,
      personneId: json['personne_id'],
      type: json['type'] ?? '',
      titre: json['titre'] ?? '',
      message: json['message'],
      lu: json['lu'] ?? false,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : null,
    );
  }
}

class NotificationStats {
  final int total;
  final int nonLues;

  NotificationStats({required this.total, required this.nonLues});

  factory NotificationStats.fromJson(Map<String, dynamic> json) {
    return NotificationStats(
      total: json['total'] ?? 0,
      nonLues: json['non_lues'] ?? 0,
    );
  }
}
