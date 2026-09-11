class Notification {
  final int id;
  final int? personneId;
  final String typeNotification;
  final String sujet;
  final String? message;
  final bool estLue;
  final DateTime? dateEnvoi;
  final DateTime? dateLecture;
  final String? lienAction;
  final DateTime? createdAt;

  Notification({
    required this.id,
    this.personneId,
    required this.typeNotification,
    required this.sujet,
    this.message,
    this.estLue = false,
    this.dateEnvoi,
    this.dateLecture,
    this.lienAction,
    this.createdAt,
  });

  factory Notification.fromJson(Map<String, dynamic> json) {
    return Notification(
      id: json['id'] ?? 0,
      personneId: json['personne_id'],
      typeNotification: json['type_notification'] ?? '',
      sujet: json['sujet'] ?? json['titre'] ?? '',
      message: json['message'],
      estLue: json['est_lue'] ?? json['lu'] ?? false,
      dateEnvoi: json['date_envoi'] != null ? DateTime.tryParse(json['date_envoi']) : null,
      dateLecture: json['date_lecture'] != null ? DateTime.tryParse(json['date_lecture']) : null,
      lienAction: json['lien_action'],
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at']) : null,
    );
  }

  String get typeLabel {
    const labels = {
      'paiement_echu': 'Paiement échu',
      'renouvellement_permis': 'Renouvellement permis',
      'controle_prochain': 'Contrôle à venir',
      'mise_en_demeure': 'Mise en demeure',
      'information': 'Information',
    };
    return labels[typeNotification] ?? typeNotification;
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
