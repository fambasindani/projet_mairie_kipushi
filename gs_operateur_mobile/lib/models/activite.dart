class ActiviteEconomique {
  final int id;
  final int? personneId;
  final String? typeActivite;
  final String? description;
  final String? nomEtablissement;
  final String? adresse;
  final double? latitude;
  final double? longitude;
  final String? statut;
  final DateTime? createdAt;
  final PersonneSimple? personne;

  ActiviteEconomique({
    required this.id,
    this.personneId,
    this.typeActivite,
    this.description,
    this.nomEtablissement,
    this.adresse,
    this.latitude,
    this.longitude,
    this.statut,
    this.createdAt,
    this.personne,
  });

  factory ActiviteEconomique.fromJson(Map<String, dynamic> json) {
    return ActiviteEconomique(
      id: json['id'] ?? 0,
      personneId: json['personne_id'],
      typeActivite: json['type_activite'],
      description: json['description'],
      nomEtablissement: json['nom_etablissement'],
      adresse: json['adresse'],
      latitude: json['latitude']?.toDouble(),
      longitude: json['longitude']?.toDouble(),
      statut: json['statut'],
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : null,
      personne: json['personne'] != null
          ? PersonneSimple.fromJson(json['personne'])
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        if (personneId != null) 'personne_id': personneId,
        if (typeActivite != null) 'type_activite': typeActivite,
        if (description != null) 'description': description,
        if (nomEtablissement != null) 'nom_etablissement': nomEtablissement,
        if (adresse != null) 'adresse': adresse,
        if (latitude != null) 'latitude': latitude,
        if (longitude != null) 'longitude': longitude,
      };
}

class PersonneSimple {
  final int id;
  final String nom;
  final String prenom;
  final String? nomComplet;

  PersonneSimple({
    required this.id,
    required this.nom,
    required this.prenom,
    this.nomComplet,
  });

  factory PersonneSimple.fromJson(Map<String, dynamic> json) {
    return PersonneSimple(
      id: json['id'] ?? 0,
      nom: json['nom'] ?? '',
      prenom: json['prenom'] ?? '',
      nomComplet: json['nom_complet'],
    );
  }

  String get fullName => nomComplet ?? '$nom $prenom'.trim();
}
