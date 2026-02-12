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
      version: 5,
      onCreate: _createDB,
      onUpgrade: _onUpgrade,
    );
  }

  Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      try {
        await db.execute('ALTER TABLE regular_payments ADD COLUMN notes TEXT');
        await db
            .execute('ALTER TABLE regular_payments ADD COLUMN start_date TEXT');
        await db
            .execute('ALTER TABLE regular_payments ADD COLUMN end_date TEXT');
        await db
            .execute('ALTER TABLE regular_payments ADD COLUMN frequency TEXT');
      } catch (_) {}
    }
    if (oldVersion < 3) {
      try {
        await db.execute('ALTER TABLE users ADD COLUMN password TEXT');
      } catch (_) {}
    }
    if (oldVersion < 4) {
      try {
        await db.execute('ALTER TABLE users ADD COLUMN full_name TEXT');
      } catch (_) {}
    }
    if (oldVersion < 5) {
      try {
        await db.execute('ALTER TABLE users ADD COLUMN phone TEXT');
      } catch (_) {}
    }
  }

  Future<void> _createDB(Database db, int version) async {
    // Users table
    await db.execute('''
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        full_name TEXT,
        email TEXT,
        phone TEXT,
        password TEXT,
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
        notes TEXT,
        start_date TEXT,
        end_date TEXT,
        frequency TEXT,
        is_active INTEGER DEFAULT 1,
        synced INTEGER DEFAULT 0,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY (category_id) REFERENCES categories (id)
      )
    ''');

    // SMS messages table
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

    // Sync queue table
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
    final now = DateTime.now().toIso8601String();
    final categories = [
      {'name': 'Food & Dining', 'icon': '🍔', 'color': '#0d9488'},
      {'name': 'Transportation', 'icon': '🚗', 'color': '#3b82f6'},
      {'name': 'Shopping', 'icon': '🛍️', 'color': '#f59e0b'},
      {'name': 'Bills & Utilities', 'icon': '💡', 'color': '#ef4444'},
      {'name': 'Entertainment', 'icon': '🎬', 'color': '#8b5cf6'},
      {'name': 'Healthcare', 'icon': '🏥', 'color': '#ec4899'},
    ];

    for (var cat in categories) {
      await db.insert('categories', {
        ...cat,
        'synced': 0,
        'created_at': now,
      });
    }
  }

  Future<void> close() async {
    final db = await instance.database;
    db.close();
  }

  Future<void> clearAllData() async {
    final db = await instance.database;
    await db.delete('users');
    await db.delete('expenses');
    await db.delete('month_plans');
    await db.delete('regular_payments');
    await db.delete('sms_messages');
    await db.delete('sync_queue');
  }

  // Auth related
  Future<Map<String, dynamic>?> getUser(String username) async {
    final db = await instance.database;
    final res = await db.query('users',
        where: 'username = ?', whereArgs: [username], limit: 1);
    return res.isNotEmpty ? res.first : null;
  }

  Future<int> registerUser({
    required String username,
    required String password,
    String? fullName,
    String? email,
  }) async {
    final db = await instance.database;
    return await db.insert('users', {
      'username': username,
      'password': password,
      'full_name': fullName,
      'email': email,
      'created_at': DateTime.now().toIso8601String(),
    });
  }

  Future<int> upsertUser({
    required String username,
    String? fullName,
    String? email,
    double? defaultBudget,
  }) async {
    final db = await instance.database;
    final now = DateTime.now().toIso8601String();

    Map<String, dynamic>? existing;
    if (email != null && email.isNotEmpty) {
      final res = await db.query('users',
          where: 'email = ?', whereArgs: [email], limit: 1);
      if (res.isNotEmpty) existing = res.first;
    }
    existing ??= (await db.query('users',
            where: 'username = ?', whereArgs: [username], limit: 1))
        .firstOrNull;

    final data = <String, dynamic>{
      'username': username,
      'full_name': fullName ?? existing?['full_name'],
      'email': email,
      'default_budget': defaultBudget ?? (existing?['default_budget'] ?? 0.0),
      'updated_at': now,
      'synced': 0,
    };

    if (existing != null) {
      await db
          .update('users', data, where: 'id = ?', whereArgs: [existing['id']]);
      return existing['id'] as int;
    } else {
      data['created_at'] = now;
      return await db.insert('users', data);
    }
  }

  Future<void> updateUserProfile(int id, Map<String, dynamic> data) async {
    final db = await instance.database;
    await db.update(
        'users',
        {
          ...data,
          'updated_at': DateTime.now().toIso8601String(),
        },
        where: 'id = ?',
        whereArgs: [id]);
  }
}
