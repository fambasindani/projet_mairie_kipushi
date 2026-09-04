class Province {
  final int id;
  final String nom;

  Province({required this.id, required this.nom});

  factory Province.fromJson(Map<String, dynamic> json) {
    return Province(id: json['id'] ?? 0, nom: json['nom'] ?? '');
  }
}

class Ville {
  final int id;
  final String nom;
  final int? idProvince;

  Ville({required this.id, required this.nom, this.idProvince});

  factory Ville.fromJson(Map<String, dynamic> json) {
    return Ville(
      id: json['id'] ?? 0,
      nom: json['nom'] ?? '',
      idProvince: json['id_province'],
    );
  }
}

class Commune {
  final int id;
  final String nom;
  final int? villeId;
  final Ville? ville;

  Commune({required this.id, required this.nom, this.villeId, this.ville});

  factory Commune.fromJson(Map<String, dynamic> json) {
    return Commune(
      id: json['id'] ?? 0,
      nom: json['nom'] ?? '',
      villeId: json['ville_id'],
      ville: json['ville'] != null ? Ville.fromJson(json['ville']) : null,
    );
  }
}

class Quartier {
  final int id;
  final String nom;
  final int? communeId;
  final Commune? commune;

  Quartier({required this.id, required this.nom, this.communeId, this.commune});

  factory Quartier.fromJson(Map<String, dynamic> json) {
    return Quartier(
      id: json['id'] ?? 0,
      nom: json['nom'] ?? '',
      communeId: json['commune_id'],
      commune:
          json['commune'] != null ? Commune.fromJson(json['commune']) : null,
    );
  }
}
