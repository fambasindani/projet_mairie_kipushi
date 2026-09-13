class Env {
  static const String apiBaseUrl = 'https://totalconceptrdc.org/id_operateur/api';
  static const String appName = 'I-KIPUSHI';
  static const String appVersion = '1.0.0';

  static Duration get apiTimeout => const Duration(seconds: 30);
  static Duration get sessionTimeout => const Duration(minutes: 15);

  static const int itemsPerPage = 15;
  static const int maxFileSizeMB = 5;
}
