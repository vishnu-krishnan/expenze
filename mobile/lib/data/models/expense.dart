class Expense {
  final int? id;
  final String monthKey;
  final int? categoryId;
  final String name;
  final double plannedAmount;
  final double actualAmount;
  final bool isPaid;
  final String? dueDate;
  final String? paidDate;
  final String? notes;
  final String priority;
  final int synced;
  final String? createdAt;
  final String? updatedAt;

  Expense({
    this.id,
    required this.monthKey,
    this.categoryId,
    required this.name,
    this.plannedAmount = 0.0,
    this.actualAmount = 0.0,
    this.isPaid = false,
    this.dueDate,
    this.paidDate,
    this.notes,
    this.priority = 'MEDIUM',
    this.synced = 0,
    this.createdAt,
    this.updatedAt,
  });

  // Convert Expense to Map for database
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'month_key': monthKey,
      'category_id': categoryId,
      'name': name,
      'planned_amount': plannedAmount,
      'actual_amount': actualAmount,
      'is_paid': isPaid ? 1 : 0,
      'due_date': dueDate,
      'paid_date': paidDate,
      'notes': notes,
      'priority': priority,
      'synced': synced,
      'created_at': createdAt ?? DateTime.now().toIso8601String(),
      'updated_at': updatedAt ?? DateTime.now().toIso8601String(),
    };
  }

  // Create Expense from Map
  factory Expense.fromMap(Map<String, dynamic> map) {
    return Expense(
      id: map['id'],
      monthKey: map['month_key'],
      categoryId: map['category_id'],
      name: map['name'],
      plannedAmount: (map['planned_amount'] ?? 0.0).toDouble(),
      actualAmount: (map['actual_amount'] ?? 0.0).toDouble(),
      isPaid: map['is_paid'] == 1,
      dueDate: map['due_date'],
      paidDate: map['paid_date'],
      notes: map['notes'],
      priority: map['priority'] ?? 'MEDIUM',
      synced: map['synced'] ?? 0,
      createdAt: map['created_at'],
      updatedAt: map['updated_at'],
    );
  }

  // Create Expense from API response
  factory Expense.fromJson(Map<String, dynamic> json) {
    return Expense(
      id: json['id'],
      monthKey: json['monthKey'] ?? json['month_key'],
      categoryId: json['categoryId'] ?? json['category_id'],
      name: json['name'],
      plannedAmount:
          (json['plannedAmount'] ?? json['planned_amount'] ?? 0.0).toDouble(),
      actualAmount:
          (json['actualAmount'] ?? json['actual_amount'] ?? 0.0).toDouble(),
      isPaid: json['isPaid'] ?? json['is_paid'] ?? false,
      dueDate: json['dueDate'] ?? json['due_date'],
      paidDate: json['paidDate'] ?? json['paid_date'],
      notes: json['notes'],
      priority: json['priority'] ?? 'MEDIUM',
      synced: 1, // Data from API is already synced
      createdAt: json['createdAt'] ?? json['created_at'],
      updatedAt: json['updatedAt'] ?? json['updated_at'],
    );
  }

  // Convert to JSON for API
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'monthKey': monthKey,
      'categoryId': categoryId,
      'name': name,
      'plannedAmount': plannedAmount,
      'actualAmount': actualAmount,
      'isPaid': isPaid,
      'dueDate': dueDate,
      'paidDate': paidDate,
      'priority': priority,
      'notes': notes,
    };
  }

  // Copy with method for updates
  Expense copyWith({
    int? id,
    String? monthKey,
    int? categoryId,
    String? name,
    double? plannedAmount,
    double? actualAmount,
    bool? isPaid,
    String? dueDate,
    String? paidDate,
    String? notes,
    String? priority,
    int? synced,
    String? createdAt,
    String? updatedAt,
  }) {
    return Expense(
      id: id ?? this.id,
      monthKey: monthKey ?? this.monthKey,
      categoryId: categoryId ?? this.categoryId,
      name: name ?? this.name,
      plannedAmount: plannedAmount ?? this.plannedAmount,
      actualAmount: actualAmount ?? this.actualAmount,
      isPaid: isPaid ?? this.isPaid,
      dueDate: dueDate ?? this.dueDate,
      paidDate: paidDate ?? this.paidDate,
      notes: notes ?? this.notes,
      priority: priority ?? this.priority,
      synced: synced ?? this.synced,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
