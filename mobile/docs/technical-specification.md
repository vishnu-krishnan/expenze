# Technical Specification: Identity and Authorization Overhaul

System Overview
The system utilizes a local SQLite database (sqflite) to manage user identity and authentication. The presentation layer uses Provider for state management, linking the AuthProvider to the DatabaseHelper for all secure operations.

Architecture Diagram
[Auth UI] -> [AuthProvider] -> [DatabaseHelper] -> [SQLite (users table)]

Component Breakdown
1. DatabaseHelper (v4):
   - Table: users
   - Columns: id, username (UNIQUE), full_name, email, password, default_budget, created_at, updated_at.
   - Methods: registerUser, getUser, updateUserProfile, upsertUser.

2. AuthProvider:
   - State: token, user (Map), error, isGoogleAvailable.
   - Methods: login, register, updateProfile, initialize.

3. DashboardScreen:
   - Logic: _getTimeBasedGreeting() using DateTime.now().hour.
   - Logic: _handleMonthChange via GestureDetector(onHorizontalDragEnd).

Data Flow
- Signup: RegisterScreen -> AuthProvider.register() -> DB Insert.
- Login: LoginScreen -> AuthProvider.login() -> DB Query (username) -> Password Comparison.
- Profile Update: ProfileScreen -> AuthProvider.updateProfile() -> DB Update -> Prefs Sync.

API Contracts (Internal)
- login(username, password) -> Future<bool>
- register(username, password, fullName, email) -> Future<bool>
- updateProfile({fullName, username, phone, defaultBudget}) -> Future<void>

Validation Rules
- Username: Non-empty, Unique.
- Passcode: Non-empty (Min 4 chars).
- Full Name: Non-empty.

Security Model
- Credentials stored locally in plain text (V1). Future enhancement: Argon2/PBKDF2 hashing.
- Session managed via SharedPreferences (auth_token).

Testing Plan
- Unit: Verify DatabaseHelper upsert/retrieval.
- Integration: Verify Login/Register flow transitions correctly to Dashboard.
- Edge: Duplicate username registration, invalid password login.

Rollback Plan
- Revert schema to version 2; remove password and full_name requirements in AuthProvider.
