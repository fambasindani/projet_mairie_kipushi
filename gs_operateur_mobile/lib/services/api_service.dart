import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/env.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  late Dio _dio;
  String? _token;

  ApiService._internal() {
    _dio = Dio(BaseOptions(
      baseUrl: Env.apiBaseUrl,
      connectTimeout: Env.apiTimeout,
      receiveTimeout: Env.apiTimeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        if (_token == null) {
          final prefs = await SharedPreferences.getInstance();
          _token = prefs.getString('token');
        }
        if (_token != null) {
          options.headers['Authorization'] = 'Bearer $_token';
        }
        return handler.next(options);
      },
      onResponse: (response, handler) {
        return handler.next(response);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          await clearToken();
        }
        return handler.next(error);
      },
    ));
  }

  Future<void> setToken(String token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
  }

  Future<void> clearToken() async {
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
  }

  Future<String?> getToken() async {
    if (_token != null) return _token;
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('token');
    return _token;
  }

  Future<bool> hasToken() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  String getBaseUrl() => _dio.options.baseUrl;

  // GET
  Future<Map<String, dynamic>> get(String path,
      {Map<String, dynamic>? queryParameters}) async {
    try {
      final response =
          await _dio.get(path, queryParameters: queryParameters);
      return response.data;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // POST
  Future<Map<String, dynamic>> post(String path,
      {dynamic data}) async {
    try {
      final response = await _dio.post(path, data: data);
      return response.data;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // POST with FormData (for file uploads)
  Future<Map<String, dynamic>> postFormData(String path,
      {required FormData formData}) async {
    try {
      final response = await _dio.post(path, data: formData);
      return response.data;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // PUT
  Future<Map<String, dynamic>> put(String path,
      {dynamic data}) async {
    try {
      final response = await _dio.put(path, data: data);
      return response.data;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // PATCH
  Future<Map<String, dynamic>> patch(String path,
      {dynamic data}) async {
    try {
      final response = await _dio.patch(path, data: data);
      return response.data;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // DELETE
  Future<Map<String, dynamic>> delete(String path) async {
    try {
      final response = await _dio.delete(path);
      return response.data;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  String _handleError(DioException e) {
    if (e.response != null) {
      final data = e.response!.data;
      if (data is Map && data.containsKey('message')) {
        return data['message'];
      }
      return 'Erreur ${e.response!.statusCode}';
    }
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout) {
      return 'Délai d\'attente dépassé. Vérifiez votre connexion.';
    }
    if (e.type == DioExceptionType.connectionError) {
      return 'Pas de connexion. Vérifiez votre réseau.';
    }
    return 'Erreur inattendue: ${e.message}';
  }
}
