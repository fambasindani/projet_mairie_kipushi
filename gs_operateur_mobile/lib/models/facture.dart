class Facture {
  final int id;
  final int? declarationPaiementId;
  final String numero;
  final double montantHt;
  final double montantTva;
  final double montantTtc;
  final String devise;
  final String statut;
  final DateTime? dateEmission;
  final DateTime? dateEcheance;
  final DeclarationRef? declarationPaiement;

  Facture({
    required this.id,
    this.declarationPaiementId,
    required this.numero,
    required this.montantHt,
    required this.montantTva,
    required this.montantTtc,
    this.devise = 'CDF',
    required this.statut,
    this.dateEmission,
    this.dateEcheance,
    this.declarationPaiement,
  });

  factory Facture.fromJson(Map<String, dynamic> json) {
    return Facture(
      id: json['id'] ?? 0,
      declarationPaiementId: json['declaration_paiement_id'],
      numero: json['numero'] ?? '',
      montantHt: (json['montant_ht'] ?? 0).toDouble(),
      montantTva: (json['montant_tva'] ?? 0).toDouble(),
      montantTtc: (json['montant_ttc'] ?? 0).toDouble(),
      devise: json['devise'] ?? 'CDF',
      statut: json['statut'] ?? 'brouillon',
      dateEmission: json['date_emission'] != null ? DateTime.parse(json['date_emission']) : null,
      dateEcheance: json['date_echeance'] != null ? DateTime.parse(json['date_echeance']) : null,
      declarationPaiement: json['declaration_paiement'] != null
          ? DeclarationRef.fromJson(json['declaration_paiement'])
          : null,
    );
  }
}

class DeclarationRef {
  final int id;
  final PersonneRef? personne;

  DeclarationRef({required this.id, this.personne});

  factory DeclarationRef.fromJson(Map<String, dynamic> json) {
    return DeclarationRef(
      id: json['id'] ?? 0,
      personne: json['personne'] != null ? PersonneRef.fromJson(json['personne']) : null,
    );
  }
}

class PersonneRef {
  final int id;
  final String? nomComplet;

  PersonneRef({required this.id, this.nomComplet});

  factory PersonneRef.fromJson(Map<String, dynamic> json) {
    return PersonneRef(id: json['id'] ?? 0, nomComplet: json['nom_complet']);
  }
}
