class User {
  final int id;
  final String nomUtilisateur;
  final String email;
  final String? telephone;
  final String? adresse;
  final String? cni;
  final String? avatar;
  final String? avatarUrl;
  final int? personneId;
  final DateTime? derniereConnexion;
  final DateTime? createdAt;
  final List<String> roles;
  final List<String> permissions;

  User({
    required this.id,
    required this.nomUtilisateur,
    required this.email,
    this.telephone,
    this.adresse,
    this.cni,
    this.avatar,
    this.avatarUrl,
    this.personneId,
    this.derniereConnexion,
    this.createdAt,
    this.roles = const [],
    this.permissions = const [],
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? 0,
      nomUtilisateur: json['nom_utilisateur'] ?? '',
      email: json['email'] ?? '',
      telephone: json['telephone'],
      adresse: json['adresse'],
      cni: json['cni'],
      avatar: json['avatar'],
      avatarUrl: json['avatar_url'],
      personneId: json['personne_id'],
      derniereConnexion: json['derniere_connexion'] != null
          ? DateTime.tryParse(json['derniere_connexion'])
          : null,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'])
          : null,
      roles: (json['roles'] as List<dynamic>?)
              ?.map((r) => r is String ? r : r['nom'] as String)
              .toList() ??
          [],
      permissions: _extractPermissions(json['roles']),
    );
  }

  static List<String> _extractPermissions(dynamic roles) {
    if (roles == null || roles is! List) return [];
    final perms = <String>[];
    for (final role in roles) {
      if (role is Map && role['permissions'] is List) {
        for (final p in role['permissions']) {
          perms.add(p is String ? p : p['nom'] ?? '');
        }
      }
    }
    return perms.toSet().toList();
  }

  bool get isOperateur => roles.contains('Operateur');
  bool get isAdmin => roles.contains('Administrateur');

  bool hasPermission(String permission) => permissions.contains(permission);
}
