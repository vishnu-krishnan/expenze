import 'package:sqflite/sqflite.dart';
import '../services/database_helper.dart';
import '../models/expense.dart';

class ExpenseRepository {
  final DatabaseHelper _dbHelper = DatabaseHelper.instance;

  // Get all expenses for a month
  Future<List<Expense>> getExpensesByMonth(String monthKey) async {
    final db = await _dbHelper.database;
    final List<Map<String, dynamic>> maps = await db.query(
      'expenses',
      where: 'month_key = ?',
      whereArgs: [monthKey],
      orderBy: 'created_at DESC',
    );

    return List.generate(maps.length, (i) => Expense.fromMap(maps[i]));
  }

  // Get expense by ID
  Future<Expense?> getExpenseById(int id) async {
    final db = await _dbHelper.database;
    final List<Map<String, dynamic>> maps = await db.query(
      'expenses',
      where: 'id = ?',
      whereArgs: [id],
      limit: 1,
    );

    if (maps.isEmpty) return null;
    return Expense.fromMap(maps.first);
  }

  // Insert expense
  Future<int> insertExpense(Expense expense) async {
    final db = await _dbHelper.database;
    final id = await db.insert(
      'expenses',
      expense.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );

    // Add to sync queue
    await _addToSyncQueue('expenses', id, 'INSERT', expense.toMap());

    return id;
  }

  // Update expense
  Future<int> updateExpense(Expense expense) async {
    final db = await _dbHelper.database;
    final result = await db.update(
      'expenses',
      expense.toMap(),
      where: 'id = ?',
      whereArgs: [expense.id],
    );

    // Add to sync queue
    await _addToSyncQueue('expenses', expense.id!, 'UPDATE', expense.toMap());

    return result;
  }

  // Delete expense
  Future<int> deleteExpense(int id) async {
    final db = await _dbHelper.database;
    final result = await db.delete(
      'expenses',
      where: 'id = ?',
      whereArgs: [id],
    );

    // Add to sync queue
    await _addToSyncQueue('expenses', id, 'DELETE', {});

    return result;
  }

  // Get month summary
  Future<Map<String, dynamic>> getMonthSummary(String monthKey) async {
    final db = await _dbHelper.database;

    final result = await db.rawQuery('''
      SELECT 
        SUM(planned_amount) as total_planned,
        SUM(actual_amount) as total_actual,
        COUNT(CASE WHEN is_paid = 0 THEN 1 END) as pending_count
      FROM expenses
      WHERE month_key = ?
    ''', [monthKey]);

    return {
      'planned': result.first['total_planned'] ?? 0.0,
      'actual': result.first['total_actual'] ?? 0.0,
      'pending_count': result.first['pending_count'] ?? 0,
    };
  }

  // Get category breakdown for a month
  Future<List<Map<String, dynamic>>> getCategoryBreakdown(
      String monthKey) async {
    final db = await _dbHelper.database;

    final result = await db.rawQuery('''
      SELECT 
        c.id,
        c.name as category_name,
        c.icon,
        c.color,
        SUM(e.actual_amount) as total_actual
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.month_key = ?
      GROUP BY c.id
      HAVING total_actual > 0
      ORDER BY total_actual DESC
    ''', [monthKey]);

    return result;
  }

  // Get last 6 months summary
  Future<List<Map<String, dynamic>>> getLast6MonthsSummary() async {
    final db = await _dbHelper.database;

    final result = await db.rawQuery('''
      SELECT 
        month_key,
        SUM(planned_amount) as total_planned,
        SUM(actual_amount) as total_actual
      FROM expenses
      WHERE month_key >= date('now', '-6 months')
      GROUP BY month_key
      ORDER BY month_key DESC
      LIMIT 6
    ''');

    return result;
  }

  // Mark expense as paid
  Future<int> markAsPaid(int id, double actualAmount) async {
    final db = await _dbHelper.database;
    final result = await db.update(
      'expenses',
      {
        'is_paid': 1,
        'actual_amount': actualAmount,
        'paid_date': DateTime.now().toIso8601String(),
        'updated_at': DateTime.now().toIso8601String(),
        'synced': 0,
      },
      where: 'id = ?',
      whereArgs: [id],
    );

    // Add to sync queue
    await _addToSyncQueue('expenses', id, 'UPDATE', {
      'is_paid': 1,
      'actual_amount': actualAmount,
      'paid_date': DateTime.now().toIso8601String(),
    });

    return result;
  }

  // Add to sync queue
  Future<void> _addToSyncQueue(
    String tableName,
    int recordId,
    String action,
    Map<String, dynamic> data,
  ) async {
    final db = await _dbHelper.database;
    await db.insert('sync_queue', {
      'table_name': tableName,
      'record_id': recordId,
      'action': action,
      'data': data.toString(), // In production, use json.encode
      'created_at': DateTime.now().toIso8601String(),
      'synced': 0,
    });
  }

  // Get unsynced changes
  Future<List<Map<String, dynamic>>> getUnsyncedChanges() async {
    final db = await _dbHelper.database;
    return await db.query(
      'sync_queue',
      where: 'synced = ?',
      whereArgs: [0],
      orderBy: 'created_at ASC',
    );
  }

  // Mark as synced
  Future<void> markAsSynced(int syncQueueId) async {
    final db = await _dbHelper.database;
    await db.update(
      'sync_queue',
      {'synced': 1},
      where: 'id = ?',
      whereArgs: [syncQueueId],
    );
  }
}
