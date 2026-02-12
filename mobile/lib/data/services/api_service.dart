import 'package:dio/dio.dart';
import 'package:logger/logger.dart';
import '../../core/config/api_config.dart';

class ApiService {
  late final Dio _dio;
  final Logger _logger = Logger();
  String? _token;

  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: ApiConfig.connectTimeout,
      receiveTimeout: ApiConfig.receiveTimeout,
      headers: {
        'Content-Type': 'application/json',
      },
    ));

    // Add interceptors for logging and error handling
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        if (_token != null) {
          options.headers['Authorization'] = 'Bearer $_token';
        }
        _logger.d('REQUEST[${options.method}] => PATH: ${options.path}');
        return handler.next(options);
      },
      onResponse: (response, handler) {
        _logger.d('RESPONSE[${response.statusCode}] => DATA: ${response.data}');
        return handler.next(response);
      },
      onError: (error, handler) {
        _logger.e(
            'ERROR[${error.response?.statusCode}] => MESSAGE: ${error.message}');
        return handler.next(error);
      },
    ));
  }

  void setToken(String? token) {
    _token = token;
  }

  // Auth endpoints
  Future<Response> login(String username, String password) async {
    try {
      return await _dio.post(
        ApiConfig.loginEndpoint,
        data: {
          'username': username,
          'password': password,
        },
      );
    } catch (e) {
      rethrow;
    }
  }

  Future<Response> register(Map<String, dynamic> data) async {
    try {
      return await _dio.post(ApiConfig.registerEndpoint, data: data);
    } catch (e) {
      rethrow;
    }
  }

  // Profile endpoints
  Future<Response> getProfile() async {
    try {
      return await _dio.get(ApiConfig.profileEndpoint);
    } catch (e) {
      rethrow;
    }
  }

  // Month Plan endpoints
  Future<Response> getMonth(String monthKey) async {
    try {
      return await _dio.get('${ApiConfig.monthEndpoint}/$monthKey');
    } catch (e) {
      rethrow;
    }
  }

  // Summary endpoints
  Future<Response> getSummary() async {
    try {
      return await _dio.get(ApiConfig.summaryEndpoint);
    } catch (e) {
      rethrow;
    }
  }

  // Category expenses
  Future<Response> getCategoryExpenses(String monthKey) async {
    try {
      return await _dio.get('${ApiConfig.categoryExpensesEndpoint}/$monthKey');
    } catch (e) {
      rethrow;
    }
  }

  // Regular payments
  Future<Response> getRegularPayments() async {
    try {
      return await _dio.get(ApiConfig.regularEndpoint);
    } catch (e) {
      rethrow;
    }
  }

  // SMS Import
  Future<Response> importSms(List<Map<String, dynamic>> messages) async {
    try {
      return await _dio.post(
        ApiConfig.smsImportEndpoint,
        data: {'messages': messages},
      );
    } catch (e) {
      rethrow;
    }
  }
}
