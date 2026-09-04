class AppConstants {
  static const String appName = 'GS Opérateur';
  static const String appVersion = '1.0.0';

  static const List<Map<String, String>> provinces = [
    {'id': '1', 'nom': 'Kinshasa'},
    {'id': '2', 'nom': 'Kongo Central'},
    {'id': '3', 'nom': 'Kwango'},
    {'id': '4', 'nom': 'Kwilu'},
    {'id': '5', 'nom': 'Kasaï'},
    {'id': '6', 'nom': 'Kasaï Central'},
    {'id': '7', 'nom': 'Kasaï Oriental'},
    {'id': '8', 'nom': 'Maniema'},
    {'id': '9', 'nom': 'Nord-Kivu'},
    {'id': '10', 'nom': 'Sud-Kivu'},
    {'id': '11', 'nom': 'Tshopo'},
    {'id': '12', 'nom': 'Bas-Uélé'},
    {'id': '13', 'nom': 'Haut-Uélé'},
    {'id': '14', 'nom': 'Ituri'},
    {'id': '15', 'nom': 'Nord-Ubangi'},
    {'id': '16', 'nom': 'Sud-Ubangi'},
    {'id': '17', 'nom': 'Mongala'},
    {'id': '18', 'nom': 'Équateur'},
    {'id': '19', 'nom': 'Tshuapa'},
  ];

  static const List<Map<String, String>> statutsDeclaration = [
    {'value': 'en_attente', 'label': 'En attente', 'color': 'warning'},
    {'value': 'paye', 'label': 'Payé', 'color': 'success'},
    {'value': 'annule', 'label': 'Annulé', 'color': 'error'},
    {'value': 'exonere', 'label': 'Exonéré', 'color': 'info'},
  ];

  static const Map<String, String> statutLabels = {
    'en_attente': 'En attente',
    'paye': 'Payé',
    'annule': 'Annulé',
    'exonere': 'Exonéré',
    'actif': 'Actif',
    'inactif': 'Inactif',
  };
}
