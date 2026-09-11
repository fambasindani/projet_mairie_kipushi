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

  // Pénalités
  final double? tauxMajorationRetard;
  final double? tauxInteretMensuel;
  final int? delaiGraceJours;
  final double? tauxMajorationApresMiseEnDemeure;

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
    this.tauxMajorationRetard,
    this.tauxInteretMensuel,
    this.delaiGraceJours,
    this.tauxMajorationApresMiseEnDemeure,
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
      tauxMajorationRetard: _parseDouble(json['taux_majoration_retard']),
      tauxInteretMensuel: _parseDouble(json['taux_interet_mensuel']),
      delaiGraceJours: json['delai_grace_jours'],
      tauxMajorationApresMiseEnDemeure: _parseDouble(json['taux_majoration_apres_mise_en_demeure']),
    );
  }

  static double? _parseDouble(dynamic val) {
    if (val == null) return null;
    if (val is num) return val.toDouble();
    return double.tryParse(val.toString());
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

  static const categories = [
    'patente',
    'foncier',
    'revenus_locatifs',
    'personnel_minimum',
    'vehicule',
    'permis_construire',
    'etalage',
    'journaliere',
    'hebdomadaire',
    'peage_urbain',
    'pont_bascule',
    'chargement',
    'dechargement',
    'autre',
  ];

  static String categorieLabel(String? cat) {
    switch (cat) {
      case 'patente': return 'Patente';
      case 'foncier': return 'Foncier';
      case 'revenus_locatifs': return 'Revenus locatifs';
      case 'personnel_minimum': return 'Personnel minimum';
      case 'vehicule': return 'Véhicule';
      case 'permis_construire': return 'Permis de construire';
      case 'etalage': return 'Étalage';
      case 'journaliere': return 'Journalière';
      case 'hebdomadaire': return 'Hebdomadaire';
      case 'peage_urbain': return 'Péage urbain';
      case 'pont_bascule': return 'Pont bascule';
      case 'chargement': return 'Chargement';
      case 'dechargement': return 'Déchargement';
      case 'autre': return 'Autre';
      default: return cat ?? '—';
    }
  }
}
