import 'package:dio/dio.dart';
import 'package:logger/logger.dart';
import '../../core/config/api_config.dart';

class ApiService {
  late final Dio _dio;
  final Logger _logger = Logger();
  String? _token;

  ApiService() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConfig.baseUrl,
        connectTimeout: ApiConfig.connectTimeout,
        receiveTimeout: ApiConfig.receiveTimeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Add logging interceptor
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          if (_token != null) {
            options.headers['Authorization'] = 'Bearer $_token';
          }
          _logger.i('REQUEST[${options.method}] => PATH: ${options.path}');
          return handler.next(options);
        },
        onResponse: (response, handler) {
          _logger.i(
              'RESPONSE[${response.statusCode}] => PATH: ${response.requestOptions.path}');
          return handler.next(response);
        },
        onError: (DioException e, handler) {
          _logger.e(
              'ERROR[${e.response?.statusCode}] => PATH: ${e.requestOptions.path}');
          return handler.next(e);
        },
      ),
    );
  }

  void setToken(String? token) {
    _token = token;
  }

  // Auth Operations
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

  Future<Response> verifyOtp(String email, String otp) async {
    try {
      return await _dio.post(
        ApiConfig.verifyOtpEndpoint,
        data: {
          'email': email,
          'otp': otp,
        },
      );
    } catch (e) {
      rethrow;
    }
  }

  Future<Response> resendOtp(String email) async {
    try {
      return await _dio.post(
        ApiConfig.resendOtpEndpoint,
        data: {'email': email},
      );
    } catch (e) {
      rethrow;
    }
  }

  Future<Response> getRegistrationStatus(String email) async {
    try {
      return await _dio.get('${ApiConfig.registrationStatusEndpoint}/$email');
    } catch (e) {
      rethrow;
    }
  }

  Future<Response> getOtpTimeout() async {
    try {
      return await _dio.get(ApiConfig.otpTimeoutEndpoint);
    } catch (e) {
      rethrow;
    }
  }

  Future<Response> resetPassword(String token, String newPassword) async {
    try {
      return await _dio.post(
        ApiConfig.resetPasswordEndpoint,
        data: {
          'token': token,
          'newPassword': newPassword,
        },
      );
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

  Future<Response> updateProfile({String? phone, double? defaultBudget}) async {
    try {
      return await _dio.put(
        ApiConfig.profileEndpoint,
        data: {
          if (phone != null) 'phone': phone,
          if (defaultBudget != null) 'defaultBudget': defaultBudget,
        },
      );
    } catch (e) {
      rethrow;
    }
  }

  Future<Response> requestEmailChange(String newEmail) async {
    try {
      return await _dio.post(
        '${ApiConfig.profileEndpoint}/request-email-change',
        data: {'newEmail': newEmail},
      );
    } catch (e) {
      rethrow;
    }
  }

  Future<Response> verifyEmailChange(String otp) async {
    try {
      return await _dio.post(
        '${ApiConfig.profileEndpoint}/verify-email-change',
        data: {'otp': otp},
      );
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
