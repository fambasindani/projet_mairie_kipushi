class RecuPerception {
  final int id;
  final String numero;
  final int taxeId;
  final int? personneId;
  final bool valide;
  final String typePerception;
  final String dateEmission;
  final String? heureEmission;
  final String? categorieVehicule;
  final String? plaqueImmatriculation;
  final double montant;
  final String? trajet;
  final String? chauffeurNom;
  final String? conducteurNom;
  final String? numeroPiece;
  final String? designation;
  final double? poids;
  final String? observations;
  final int percepteurId;
  final String? createdAt;
  final TaxeRef? taxe;
  final PersonneSimple? personne;
  final PersonneSimple? percepteur;

  static const Map<String, String> typeLabels = {
    'peage_urbain': 'Péage urbain',
    'pont_bascule': 'Pont bascule',
    'etalage': 'Étalage',
    'chargement': 'Chargement',
    'dechargement': 'Déchargement',
    'autre': 'Autre',
  };

  static const Map<String, String> typePrefixes = {
    'peage_urbain': 'PEA',
    'pont_bascule': 'PON',
    'etalage': 'ETA',
    'chargement': 'CHA',
    'dechargement': 'DEC',
    'autre': 'AUT',
  };

  RecuPerception({
    required this.id,
    required this.numero,
    required this.taxeId,
    this.personneId,
    this.valide = false,
    required this.typePerception,
    required this.dateEmission,
    this.heureEmission,
    this.categorieVehicule,
    this.plaqueImmatriculation,
    required this.montant,
    this.trajet,
    this.chauffeurNom,
    this.conducteurNom,
    this.numeroPiece,
    this.designation,
    this.poids,
    this.observations,
    required this.percepteurId,
    this.createdAt,
    this.taxe,
    this.personne,
    this.percepteur,
  });

  factory RecuPerception.fromJson(Map<String, dynamic> json) {
    return RecuPerception(
      id: json['id'] ?? 0,
      numero: json['numero'] ?? '',
      taxeId: json['taxe_id'] ?? 0,
      personneId: json['personne_id'],
      valide: json['valide'] ?? false,
      typePerception: json['type_perception'] ?? '',
      dateEmission: json['date_emission'] ?? '',
      heureEmission: json['heure_emission'],
      categorieVehicule: json['categorie_vehicule'],
      plaqueImmatriculation: json['plaque_immatriculation'],
      montant: _toDouble(json['montant']),
      trajet: json['trajet'],
      chauffeurNom: json['chauffeur_nom'],
      conducteurNom: json['conducteur_nom'],
      numeroPiece: json['Numero_Piece'],
      designation: json['designation'],
      poids: _toDoubleNullable(json['poids']),
      observations: json['observations'],
      percepteurId: json['percepteur_id'] ?? 0,
      createdAt: json['created_at'],
      taxe: json['taxe'] != null ? TaxeRef.fromJson(json['taxe']) : null,
      personne: json['personne'] != null ? PersonneSimple.fromJson(json['personne']) : null,
      percepteur: json['percepteur'] != null ? PersonneSimple.fromJson(json['percepteur']) : null,
    );
  }

  static double _toDouble(dynamic v) {
    if (v == null) return 0;
    if (v is num) return v.toDouble();
    return double.tryParse(v.toString()) ?? 0;
  }

  static double? _toDoubleNullable(dynamic v) {
    if (v == null) return null;
    if (v is num) return v.toDouble();
    return double.tryParse(v.toString());
  }

  String get typeLabel => typeLabels[typePerception] ?? typePerception;
  String getNumero() => numero;
  bool get isVehicle => typePerception == 'peage_urbain' || typePerception == 'pont_bascule';
  bool get isMarchandise => typePerception == 'chargement' || typePerception == 'dechargement';
}

class TaxeRef {
  final int id;
  final String nom;
  final double? montant;

  TaxeRef({required this.id, required this.nom, this.montant});

  factory TaxeRef.fromJson(Map<String, dynamic> json) {
    return TaxeRef(
      id: json['id'] ?? 0,
      nom: json['nom'] ?? '',
      montant: _parseDouble(json['montant'] ?? json['taux']),
    );
  }

  static double? _parseDouble(dynamic v) {
    if (v == null) return null;
    if (v is num) return v.toDouble();
    return double.tryParse(v.toString());
  }
}

class PersonneSimple {
  final int id;
  final String nom;
  final String? prenom;
  final String? postnom;

  PersonneSimple({required this.id, required this.nom, this.prenom, this.postnom});

  factory PersonneSimple.fromJson(Map<String, dynamic> json) {
    return PersonneSimple(
      id: json['id'] ?? 0,
      nom: json['nom'] ?? json['nom_utilisateur'] ?? '',
      prenom: json['prenom'],
      postnom: json['postnom'],
    );
  }

  String get displayName {
    final parts = [nom, postnom, prenom].where((s) => s != null && s.isNotEmpty);
    return parts.join(' ');
  }
}
