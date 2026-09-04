class Taxe {
  final int id;
  final String code;
  final String nom;
  final String? description;
  final double taux;
  final String? unite;
  final String? categorie;
  final String? periodicite;
  final bool estActif;
  final bool estLocale;
  final int nombreDeclarations;
  final DateTime? createdAt;

  Taxe({
    required this.id,
    required this.code,
    required this.nom,
    this.description,
    this.taux = 0,
    this.unite,
    this.categorie,
    this.periodicite,
    this.estActif = true,
    this.estLocale = true,
    this.nombreDeclarations = 0,
    this.createdAt,
  });

  factory Taxe.fromJson(Map<String, dynamic> json) {
    return Taxe(
      id: int.tryParse('${json['id']}') ?? 0,
      code: json['code'] ?? '',
      nom: json['nom'] ?? '',
      description: json['description'],
      taux: double.tryParse('${json['taux'] ?? 0}') ?? 0,
      unite: json['unite'],
      categorie: json['categorie'],
      periodicite: json['periodicite'],
      estActif: json['est_actif'] ?? true,
      estLocale: json['est_locale'] ?? true,
      nombreDeclarations: json['nombre_declarations'] ?? json['declarations_paiements_count'] ?? 0,
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at']) : null,
    );
  }

  @override
  bool operator ==(Object other) => identical(this, other) || other is Taxe && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;

  String get uniteLabel {
    switch (unite) {
      case 'pourcentage': return '%';
      case 'montant_fixe': return 'CDF';
      case 'par_unite': return '/unité';
      default: return '';
    }
  }

  String get tauxFormate => '$taux $uniteLabel';
}
