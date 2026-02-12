import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

class DatabaseHelper {
  static final DatabaseHelper instance = DatabaseHelper._init();
  static Database? _database;

  DatabaseHelper._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('expenze.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 1,
      onCreate: _createDB,
    );
  }

  Future<void> _createDB(Database db, int version) async {
    // Users table
    await db.execute('''
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT,
        default_budget REAL DEFAULT 0,
        synced INTEGER DEFAULT 0,
        created_at TEXT,
        updated_at TEXT
      )
    ''');

    // Categories table
    await db.execute('''
      CREATE TABLE categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        icon TEXT,
        color TEXT,
        synced INTEGER DEFAULT 0,
        created_at TEXT,
        updated_at TEXT
      )
    ''');

    // Month plans table
    await db.execute('''
      CREATE TABLE month_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        month_key TEXT NOT NULL,
        total_planned REAL DEFAULT 0,
        total_actual REAL DEFAULT 0,
        synced INTEGER DEFAULT 0,
        created_at TEXT,
        updated_at TEXT,
        UNIQUE(month_key)
      )
    ''');

    // Expenses table
    await db.execute('''
      CREATE TABLE expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        month_key TEXT NOT NULL,
        category_id INTEGER,
        name TEXT NOT NULL,
        planned_amount REAL DEFAULT 0,
        actual_amount REAL DEFAULT 0,
        is_paid INTEGER DEFAULT 0,
        due_date TEXT,
        paid_date TEXT,
        notes TEXT,
        synced INTEGER DEFAULT 0,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY (category_id) REFERENCES categories (id)
      )
    ''');

    // Regular payments/templates table
    await db.execute('''
      CREATE TABLE regular_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category_id INTEGER,
        default_planned_amount REAL DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        synced INTEGER DEFAULT 0,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY (category_id) REFERENCES categories (id)
      )
    ''');

    // SMS messages table (for imported transactions)
    await db.execute('''
      CREATE TABLE sms_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender TEXT,
        message TEXT,
        timestamp TEXT,
        amount REAL,
        transaction_type TEXT,
        merchant TEXT,
        processed INTEGER DEFAULT 0,
        expense_id INTEGER,
        created_at TEXT,
        FOREIGN KEY (expense_id) REFERENCES expenses (id)
      )
    ''');

    // Sync queue table (for offline changes)
    await db.execute('''
      CREATE TABLE sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        record_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        data TEXT,
        created_at TEXT,
        synced INTEGER DEFAULT 0
      )
    ''');

    // Insert default categories
    await db.insert('categories', {
      'name': 'Food & Dining',
      'icon': '🍔',
      'color': '#0d9488',
      'synced': 0,
      'created_at': DateTime.now().toIso8601String(),
    });

    await db.insert('categories', {
      'name': 'Transportation',
      'icon': '🚗',
      'color': '#3b82f6',
      'synced': 0,
      'created_at': DateTime.now().toIso8601String(),
    });

    await db.insert('categories', {
      'name': 'Shopping',
      'icon': '🛍️',
      'color': '#f59e0b',
      'synced': 0,
      'created_at': DateTime.now().toIso8601String(),
    });

    await db.insert('categories', {
      'name': 'Bills & Utilities',
      'icon': '💡',
      'color': '#ef4444',
      'synced': 0,
      'created_at': DateTime.now().toIso8601String(),
    });

    await db.insert('categories', {
      'name': 'Entertainment',
      'icon': '🎬',
      'color': '#8b5cf6',
      'synced': 0,
      'created_at': DateTime.now().toIso8601String(),
    });

    await db.insert('categories', {
      'name': 'Healthcare',
      'icon': '🏥',
      'color': '#ec4899',
      'synced': 0,
      'created_at': DateTime.now().toIso8601String(),
    });
  }

  // Close database
  Future<void> close() async {
    final db = await instance.database;
    db.close();
  }

  // Clear all data (for logout)
  Future<void> clearAllData() async {
    final db = await instance.database;
    await db.delete('users');
    await db.delete('expenses');
    await db.delete('month_plans');
    await db.delete('regular_payments');
    await db.delete('sms_messages');
    await db.delete('sync_queue');
    // Keep categories as they're default data
  }

  // Upsert user by email (used for Google login and local users)
  Future<int> upsertUser({
    required String username,
    String? email,
    double? defaultBudget,
  }) async {
    final db = await instance.database;
    final now = DateTime.now().toIso8601String();

    // Try to find existing user by email (preferred) or username
    Map<String, dynamic>? existing;
    if (email != null && email.isNotEmpty) {
      final res = await db.query(
        'users',
        where: 'email = ?',
        whereArgs: [email],
        limit: 1,
      );
      if (res.isNotEmpty) existing = res.first;
    }

    existing ??= (await db.query(
      'users',
      where: 'username = ?',
      whereArgs: [username],
      limit: 1,
    ))
        .firstOrNull;

    final data = <String, dynamic>{
      'username': username,
      'email': email,
      'default_budget': defaultBudget ?? (existing?['default_budget'] ?? 0.0),
      'updated_at': now,
      'synced': 0,
    };

    if (existing != null) {
      await db.update(
        'users',
        data,
        where: 'id = ?',
        whereArgs: [existing['id']],
      );
      return existing['id'] as int;
    } else {
      data['created_at'] = now;
      return await db.insert('users', data);
    }
  }
}
