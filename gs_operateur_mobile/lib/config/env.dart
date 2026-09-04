import 'package:flutter_dotenv/flutter_dotenv.dart';

class Env {
  static String get apiBaseUrl => dotenv.env['API_BASE_URL'] ?? 'http://10.0.2.2:8000/api';
  static String get appName => dotenv.env['APP_NAME'] ?? 'GS Opérateur';
  static String get appVersion => dotenv.env['APP_VERSION'] ?? '1.0.0';

  static Duration get apiTimeout => Duration(seconds: int.tryParse(dotenv.env['API_TIMEOUT_SECONDS'] ?? '30') ?? 30);
  static Duration get sessionTimeout => Duration(minutes: int.tryParse(dotenv.env['SESSION_TIMEOUT_MINUTES'] ?? '15') ?? 15);

  static int get itemsPerPage => int.tryParse(dotenv.env['ITEMS_PER_PAGE'] ?? '15') ?? 15;
  static int get maxFileSizeMB => int.tryParse(dotenv.env['MAX_FILE_SIZE_MB'] ?? '5') ?? 5;
}
