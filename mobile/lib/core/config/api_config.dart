class ApiConfig {
  // Base URL - Update this to match your backend
  static const String baseUrl =
      'http://10.0.2.2:8080'; // Android emulator localhost
  // For physical device, use your computer's IP:
  // static const String baseUrl = 'http://192.168.1.x:8080';

  // API Endpoints
  static const String loginEndpoint = '/api/v1/login';
  static const String registerEndpoint = '/api/v1/register';
  static const String profileEndpoint = '/api/v1/profile';
  static const String monthEndpoint = '/api/v1/month';
  static const String summaryEndpoint = '/api/v1/summary/last6';
  static const String categoryExpensesEndpoint = '/api/v1/category-expenses';
  static const String regularEndpoint = '/api/v1/regular';
  static const String smsImportEndpoint = '/api/v1/sms/import';

  // Timeouts
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);

  // Get full URL
  static String getUrl(String endpoint) {
    return '$baseUrl$endpoint';
  }
}
