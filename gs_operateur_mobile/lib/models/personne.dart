class Personne {
  final int id;
  final String? type;
  final String nom;
  final String postnom;
  final String prenom;
  final String? denominationSociale;
  final String? formeJuridique;
  final String? sexe;
  final String? telephone;
  final String? email;
  final String? adresse;
  final String? cni;
  final DateTime? dateNaissance;
  final String? lieuNaissance;
  final int? idProvince;
  final int? idVille;
  final int? communeId;
  final int? idQuartier;
  final String? nomComplet;
  final String? avatar;
  final String? statut;
  final DateTime? createdAt;

  Personne({
    required this.id,
    this.type,
    required this.nom,
    required this.postnom,
    required this.prenom,
    this.denominationSociale,
    this.formeJuridique,
    this.sexe,
    this.telephone,
    this.email,
    this.adresse,
    this.cni,
    this.dateNaissance,
    this.lieuNaissance,
    this.idProvince,
    this.idVille,
    this.communeId,
    this.idQuartier,
    this.nomComplet,
    this.avatar,
    this.statut,
    this.createdAt,
  });

  factory Personne.fromJson(Map<String, dynamic> json) {
    return Personne(
      id: json['id'] ?? 0,
      type: json['type'],
      nom: json['nom'] ?? '',
      postnom: json['postnom'] ?? '',
      prenom: json['prenom'] ?? '',
      denominationSociale: json['denomination_sociale'],
      formeJuridique: json['forme_juridique'],
      sexe: json['sexe'],
      telephone: json['telephone'],
      email: json['email'],
      adresse: json['adresse'],
      cni: json['cni'] ?? json['cni_numero'],
      dateNaissance: json['date_naissance'] != null
          ? DateTime.tryParse(json['date_naissance'])
          : null,
      lieuNaissance: json['lieu_naissance'],
      idProvince: json['id_province'],
      idVille: json['id_ville'],
      communeId: json['commune_id'],
      idQuartier: json['id_quartier'],
      nomComplet: json['nom_complet'],
      avatar: json['avatar'],
      statut: json['statut'],
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'])
          : null,
    );
  }

  String get fullName {
    if (type == 'morale' && denominationSociale != null && denominationSociale!.isNotEmpty) {
      return denominationSociale!;
    }
    return '$nom $postnom $prenom'.trim();
  }

  Map<String, dynamic> toJson() => {
        if (type != null) 'type': type,
        if (nom.isNotEmpty) 'nom': nom,
        if (postnom.isNotEmpty) 'postnom': postnom,
        if (prenom.isNotEmpty) 'prenom': prenom,
        if (denominationSociale != null) 'denomination_sociale': denominationSociale,
        if (formeJuridique != null) 'forme_juridique': formeJuridique,
        if (sexe != null) 'sexe': sexe,
        if (telephone != null && telephone!.isNotEmpty) 'telephone': telephone,
        if (email != null && email!.isNotEmpty) 'email': email,
        if (adresse != null && adresse!.isNotEmpty) 'adresse': adresse,
        if (cni != null && cni!.isNotEmpty) 'cni': cni,
        if (dateNaissance != null)
          'date_naissance': dateNaissance!.toIso8601String().substring(0, 10),
        if (lieuNaissance != null) 'lieu_naissance': lieuNaissance,
        if (idProvince != null) 'id_province': idProvince,
        if (idVille != null) 'id_ville': idVille,
        if (communeId != null) 'commune_id': communeId,
        if (idQuartier != null) 'id_quartier': idQuartier,
      };
}
