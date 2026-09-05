class DeclarationPaiement {
  final int id;
  final int? personneId;
  final int? taxeId;
  final double montantBase;
  final double montantTaxe;
  final double penalites;
  final double montantTotal;
  final String devise;
  final String statut;
  final String? referencePaiement;
  final String? exercice;
  final String? periodeDebut;
  final String? periodeFin;
  final DateTime? dateLimitePaiement;
  final DateTime? dateDeclaration;
  final DateTime? datePaiement;
  final PersonneRef? personne;
  final TaxeRef? taxe;
  final String? observations;

  DeclarationPaiement({
    required this.id,
    this.personneId,
    this.taxeId,
    this.montantBase = 0,
    this.montantTaxe = 0,
    this.penalites = 0,
    required this.montantTotal,
    this.devise = 'CDF',
    required this.statut,
    this.referencePaiement,
    this.exercice,
    this.periodeDebut,
    this.periodeFin,
    this.dateLimitePaiement,
    this.dateDeclaration,
    this.datePaiement,
    this.personne,
    this.taxe,
    this.observations,
  });

  factory DeclarationPaiement.fromJson(Map<String, dynamic> json) {
    return DeclarationPaiement(
      id: json['id'] ?? 0,
      personneId: json['personne_id'],
      taxeId: json['taxe_id'],
      montantBase: _parseDouble(json['montant_base']),
      montantTaxe: _parseDouble(json['montant_taxe']),
      penalites: _parseDouble(json['penalites']),
      montantTotal: _parseDouble(json['montant_total']),
      devise: json['devise'] ?? 'CDF',
      statut: json['statut'] ?? 'en_attente',
      referencePaiement: json['reference_paiement'],
      exercice: json['exercice']?.toString(),
      periodeDebut: json['periode_debut'],
      periodeFin: json['periode_fin'],
      dateLimitePaiement: json['date_limite_paiement'] != null
          ? DateTime.tryParse(json['date_limite_paiement'])
          : null,
      dateDeclaration: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'])
          : null,
      datePaiement: json['date_paiement'] != null
          ? DateTime.tryParse(json['date_paiement'])
          : null,
      personne: json['personne'] != null
          ? PersonneRef.fromJson(json['personne'])
          : null,
      taxe: json['taxe'] != null ? TaxeRef.fromJson(json['taxe']) : null,
      observations: json['observations'],
    );
  }

  static double _parseDouble(dynamic val) {
    if (val == null) return 0;
    if (val is num) return val.toDouble();
    return double.tryParse(val.toString()) ?? 0;
  }

  bool get isEnAttente => statut == 'en_attente';
  bool get isPaye => statut == 'paye';

  String get montantFormate =>
      '${montantTotal.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]} ')} $devise';
}

class PersonneRef {
  final int id;
  final String? nomComplet;
  final String? nom;
  final String? prenom;

  PersonneRef({required this.id, this.nomComplet, this.nom, this.prenom});

  factory PersonneRef.fromJson(Map<String, dynamic> json) {
    return PersonneRef(
      id: json['id'] ?? 0,
      nomComplet: json['nom_complet'],
      nom: json['nom'],
      prenom: json['prenom'],
    );
  }

  String get displayName {
    if (nomComplet != null && nomComplet!.isNotEmpty) return nomComplet!;
    if (nom != null && prenom != null) return '$nom $prenom'.trim();
    if (nom != null) return nom!;
    return 'N/A';
  }
}

class TaxeRef {
  final int id;
  final String? nom;
  final String? code;

  TaxeRef({required this.id, this.nom, this.code});

  factory TaxeRef.fromJson(Map<String, dynamic> json) {
    return TaxeRef(
      id: json['id'] ?? 0,
      nom: json['nom'],
      code: json['code'],
    );
  }
}

class PaiementStats {
  final double totalTtc;
  final double totalHt;
  final double totalTva;
  final double moyenne;
  final Map<String, int> parStatut;
  final Map<String, double> parDevise;

  PaiementStats({
    required this.totalTtc,
    required this.totalHt,
    required this.totalTva,
    required this.moyenne,
    required this.parStatut,
    required this.parDevise,
  });

  factory PaiementStats.fromJson(Map<String, dynamic> json) {
    return PaiementStats(
      totalTtc: (json['total_ttc'] ?? 0).toDouble(),
      totalHt: (json['total_ht'] ?? 0).toDouble(),
      totalTva: (json['total_tva'] ?? 0).toDouble(),
      moyenne: (json['moyenne'] ?? 0).toDouble(),
      parStatut: Map<String, int>.from(json['par_statut'] ?? {}),
      parDevise: (json['par_devise'] ?? {}).map(
        (k, v) => MapEntry(k, (v is num ? v.toDouble() : 0.0)),
      ),
    );
  }
}
