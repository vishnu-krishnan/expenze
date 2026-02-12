import 'package:flutter/material.dart';
import '../../data/services/database_helper.dart';

class RegularPayment {
  final int? id;
  final String name;
  final int categoryId;
  final String? categoryName;
  final double defaultPlannedAmount;
  final String? notes;
  final String startDate;
  final String? endDate;
  final String frequency;
  final bool isActive;

  RegularPayment({
    this.id,
    required this.name,
    required this.categoryId,
    this.categoryName,
    required this.defaultPlannedAmount,
    this.notes,
    required this.startDate,
    this.endDate,
    required this.frequency,
    required this.isActive,
  });

  factory RegularPayment.fromMap(Map<String, dynamic> map) {
    return RegularPayment(
      id: map['id'],
      name: map['name'],
      categoryId: map['category_id'],
      categoryName: map['categoryName'],
      defaultPlannedAmount: (map['default_planned_amount'] as num).toDouble(),
      notes: map['notes'],
      startDate: map['start_date'] ?? '',
      endDate: map['end_date'],
      frequency: map['frequency'] ?? 'MONTHLY',
      isActive: map['is_active'] == 1,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'category_id': categoryId,
      'default_planned_amount': defaultPlannedAmount,
      'notes': notes,
      'start_date': startDate,
      'end_date': endDate,
      'frequency': frequency,
      'is_active': isActive ? 1 : 0,
      'updated_at': DateTime.now().toIso8601String(),
    };
  }
}

class RegularPaymentProvider with ChangeNotifier {
  final DatabaseHelper _dbHelper = DatabaseHelper.instance;

  List<RegularPayment> _payments = [];
  bool _isLoading = false;

  RegularPaymentProvider();

  List<RegularPayment> get payments => _payments;
  bool get isLoading => _isLoading;

  Future<void> loadPayments() async {
    _isLoading = true;
    notifyListeners();

    try {
      final db = await _dbHelper.database;
      final List<Map<String, dynamic>> maps = await db.rawQuery('''
        SELECT rp.*, c.name as categoryName 
        FROM regular_payments rp
        LEFT JOIN categories c ON rp.category_id = c.id
      ''');
      _payments = maps.map((m) => RegularPayment.fromMap(m)).toList();
    } catch (e) {
      print('Error loading regular payments: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> addPayment(RegularPayment payment) async {
    final db = await _dbHelper.database;
    await db.insert('regular_payments', payment.toMap());
    await loadPayments();
  }

  Future<void> deletePayment(int id) async {
    final db = await _dbHelper.database;
    await db.delete('regular_payments', where: 'id = ?', whereArgs: [id]);
    await loadPayments();
  }
}
