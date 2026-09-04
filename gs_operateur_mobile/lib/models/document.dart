class Document {
  final int id;
  final int? personneId;
  final String typeDocument;
  final String? numero;
  final String? fichier;
  final bool? estValide;
  final DateTime? createdAt;
  final PersonneRef? personne;

  Document({
    required this.id,
    this.personneId,
    required this.typeDocument,
    this.numero,
    this.fichier,
    this.estValide,
    this.createdAt,
    this.personne,
  });

  factory Document.fromJson(Map<String, dynamic> json) {
    return Document(
      id: json['id'] ?? 0,
      personneId: json['personne_id'],
      typeDocument: json['type_document'] ?? json['type'] ?? '',
      numero: json['numero'],
      fichier: json['fichier'],
      estValide: json['est_valide'],
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'])
          : null,
      personne: json['personne'] != null
          ? PersonneRef.fromJson(json['personne'])
          : null,
    );
  }
}

class PersonneRef {
  final int id;
  final String? nomComplet;

  PersonneRef({required this.id, this.nomComplet});

  factory PersonneRef.fromJson(Map<String, dynamic> json) {
    return PersonneRef(
      id: json['id'] ?? 0,
      nomComplet: json['nom_complet'],
    );
  }
}

class DocumentType {
  final String value;
  final String label;

  DocumentType({required this.value, required this.label});

  static List<DocumentType> get all => [
        DocumentType(value: 'CNI', label: 'Carte Nationale d\'Identité'),
        DocumentType(value: 'PASSEPORT', label: 'Passeport'),
        DocumentType(value: 'RCCM', label: 'RCCM'),
        DocumentType(value: 'PATENTE', label: 'Patente'),
        DocumentType(value: 'QUITTANCE', label: 'Quittance'),
        DocumentType(value: 'STATUTS', label: 'Statuts'),
        DocumentType(value: 'AVATAR', label: 'Photo'),
        DocumentType(value: 'AUTRE', label: 'Autre'),
      ];
}
