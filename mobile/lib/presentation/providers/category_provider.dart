import 'package:flutter/material.dart';
import '../../data/services/database_helper.dart';
import '../../data/models/category.dart';

class CategoryProvider with ChangeNotifier {
  final DatabaseHelper _dbHelper = DatabaseHelper.instance;

  List<Category> _categories = [];
  bool _isLoading = false;

  CategoryProvider();

  List<Category> get categories => _categories;
  bool get isLoading => _isLoading;

  Future<void> loadCategories() async {
    _isLoading = true;
    notifyListeners();

    try {
      final db = await _dbHelper.database;
      final List<Map<String, dynamic>> maps = await db.query('categories');
      _categories = maps.map((m) => Category.fromMap(m)).toList();
    } catch (e) {
      print('Error loading categories: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> addCategory(String name, String icon) async {
    final db = await _dbHelper.database;
    await db.insert('categories', {
      'name': name,
      'icon': icon,
    });
    await loadCategories();
  }

  Future<void> updateCategory(int id, String name, String icon) async {
    final db = await _dbHelper.database;
    await db.update(
      'categories',
      {'name': name, 'icon': icon},
      where: 'id = ?',
      whereArgs: [id],
    );
    await loadCategories();
  }

  Future<void> deleteCategory(int id) async {
    final db = await _dbHelper.database;
    await db.delete(
      'categories',
      where: 'id = ?',
      whereArgs: [id],
    );
    await loadCategories();
  }
}
