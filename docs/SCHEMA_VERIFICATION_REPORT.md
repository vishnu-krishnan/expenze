# Entity vs Migration Schema Verification Report
**Date**: January 19, 2026, 4:17 PM IST  
**Purpose**: Cross-verify all entity classes against database migrations

---

## ✅ VERIFIED - No Discrepancies Found

### 1. User Entity ✅
**Entity**: `User.java`  
**Table**: `users`  
**Migration**: V1__Initial_Schema.sql

| Entity Field | Column Name | Type | Migration Match |
|--------------|-------------|------|-----------------|
| id | id | BIGSERIAL | ✅ |
| username | username | VARCHAR(255) | ✅ |
| password | password | VARCHAR(255) | ✅ |
| email | email | VARCHAR(255) | ✅ |
| phone | phone | VARCHAR(255) | ✅ |
| role | role | VARCHAR(255) | ✅ |
| createdAt | created_at | TIMESTAMP | ✅ |
| otpCode | otp_code | VARCHAR(255) | ✅ |
| otpExpiry | otp_expiry | TIMESTAMP | ✅ |
| isVerified | is_verified | INTEGER | ✅ |
| defaultBudget | default_budget | NUMERIC(38,2) | ✅ |

---

### 2. Category Entity ✅
**Entity**: `Category.java`  
**Table**: `categories`  
**Migration**: V1__Initial_Schema.sql

| Entity Field | Column Name | Type | Migration Match |
|--------------|-------------|------|-----------------|
| id | id | BIGSERIAL | ✅ |
| userId | user_id | BIGINT | ✅ |
| name | name | VARCHAR(255) | ✅ |
| sortOrder | sort_order | INTEGER | ✅ |
| isActive | is_active | INTEGER | ✅ |
| icon | icon | VARCHAR(255) | ✅ |

---

### 3. MonthPlan Entity ✅
**Entity**: `MonthPlan.java`  
**Table**: `month_plans`  
**Migration**: V1__Initial_Schema.sql

| Entity Field | Column Name | Type | Migration Match |
|--------------|-------------|------|-----------------|
| id | id | BIGSERIAL | ✅ |
| userId | user_id | BIGINT | ✅ |
| monthKey | monthkey | VARCHAR(255) | ✅ |
| createdAt | created_at | TIMESTAMP | ✅ |
| UNIQUE(user_id, monthkey) | - | - | ✅ |

---

### 4. PaymentItem Entity ✅
**Entity**: `PaymentItem.java`  
**Table**: `payment_items`  
**Migrations**: V1, V7, V8

| Entity Field | Column Name | Type | Migration Match |
|--------------|-------------|------|-----------------|
| id | id | BIGSERIAL | ✅ V1 |
| userId | user_id | BIGINT | ✅ V1 |
| monthPlanId | month_plan_id | BIGINT | ✅ V7, V8 |
| categoryId | category_id | BIGINT | ✅ V1 |
| name | name | VARCHAR(255) | ✅ V1 |
| plannedAmount | planned_amount | NUMERIC(38,2) | ✅ V7, V8 |
| actualAmount | actual_amount | NUMERIC(38,2) | ✅ V7, V8 |
| isPaid | is_paid | INTEGER | ✅ V7, V8 |
| notes | notes | TEXT | ✅ V7, V8 |

**Legacy Columns Removed**: ✅
- price (V7, V8)
- type (V7, V8)
- is_planned (V7, V8)
- payment_date (V7, V8)

---

### 5. RegularPayment Entity ✅
**Entity**: `RegularPayment.java`  
**Table**: `regular_payments`  
**Migrations**: V1, V2, V5

| Entity Field | Column Name | Type | Migration Match |
|--------------|-------------|------|-----------------|
| id | id | BIGSERIAL | ✅ V1 |
| userId | user_id | BIGINT | ✅ V1 |
| categoryId | category_id | BIGINT | ✅ V1 |
| name | name | VARCHAR(255) | ✅ V1 |
| defaultPlannedAmount | default_planned_amount | NUMERIC(38,2) | ✅ V2 |
| notes | notes | TEXT | ✅ V2 |
| startDate | start_date | DATE | ✅ V2 |
| endDate | end_date | DATE | ✅ V2 |
| frequency | frequency | VARCHAR(50) | ✅ V2 |
| isActive | is_active | INTEGER | ✅ V1 |
| createdAt | created_at | TIMESTAMP | ✅ V1 |

**Legacy Columns Removed**: ✅
- amount (V5)
- type (V5)
- next_payment_date (V5)

---

### 6. Salary Entity ✅
**Entity**: `Salary.java`  
**Table**: `salaries`  
**Migration**: V1__Initial_Schema.sql

| Entity Field | Column Name | Type | Migration Match |
|--------------|-------------|------|-----------------|
| id | id | BIGSERIAL | ✅ |
| userId | user_id | BIGINT | ✅ |
| monthKey | monthkey | VARCHAR(255) | ✅ |
| amount | amount | NUMERIC(38,2) | ✅ |
| createdAt | created_at | TIMESTAMP | ✅ |
| UNIQUE(user_id, monthkey) | - | - | ✅ |

---

### 7. SystemSetting Entity ⚠️ MISMATCH FOUND
**Entity**: `SystemSetting.java`  
**Table**: `system_settings`  
**Migration**: V1__Initial_Schema.sql

| Entity Field | Column Name | Type | Migration Match | Status |
|--------------|-------------|------|-----------------|---------|
| id | id | BIGSERIAL | ✅ | OK |
| settingKey | key_name | VARCHAR(255) | ✅ | OK |
| settingValue | key_value | VARCHAR(255) | ✅ | OK |
| **settingType** | **-** | VARCHAR | ❌ | **MISSING IN DB** |
| **description** | **-** | TEXT | ❌ | **MISSING IN DB** |
| **category** | **-** | VARCHAR | ❌ | **MISSING IN DB** |
| **isPublic** | **-** | INTEGER | ❌ | **MISSING IN DB** |
| updatedAt | updated_at | TIMESTAMP | ✅ | OK |

**Issue**: Entity has 4 extra fields not in database schema

---

### 8. UserVerification Entity ✅
**Entity**: `UserVerification.java`  
**Table**: `user_verifications`  
**Migration**: V4__Fix_User_Verifications.sql

| Entity Field | Column Name | Type | Migration Match |
|--------------|-------------|------|-----------------|
| email (PK) | email | VARCHAR(255) | ✅ |
| username | username | VARCHAR(255) | ✅ |
| password | password | VARCHAR(255) | ✅ |
| phone | phone | VARCHAR(255) | ✅ |
| otpCode | otp_code | VARCHAR(255) | ✅ |
| expiresAt | expires_at | TIMESTAMP | ✅ |
| deliveryStatus | delivery_status | VARCHAR(255) | ✅ |
| deliveryError | delivery_error | VARCHAR(255) | ✅ |
| createdAt | created_at | TIMESTAMP | ✅ |

---

### 9. PasswordResetToken Entity ✅
**Entity**: `PasswordResetToken.java`  
**Table**: `password_reset_tokens`  
**Migration**: V6__Add_Password_Reset_Token.sql

| Entity Field | Column Name | Type | Migration Match |
|--------------|-------------|------|-----------------|
| id | id | BIGSERIAL | ✅ |
| userId | user_id | BIGINT | ✅ |
| token | token | VARCHAR(255) | ✅ |
| expiryDate | expiry_date | TIMESTAMP | ✅ |
| createdAt | created_at | TIMESTAMP | ✅ |

---

### 10. EmailChangeRequest Entity ✅ (FIXED)
**Entity**: `EmailChangeRequest.java`  
**Table**: `email_change_requests`  
**Migrations**: V1, V9

| Entity Field | Column Name | Type | Migration Match |
|--------------|-------------|------|-----------------|
| id | id | BIGSERIAL | ✅ V1 |
| userId | user_id | BIGINT | ✅ V1 |
| newEmail | new_email | VARCHAR(255) | ✅ V1 |
| otp | otp | VARCHAR(10) | ✅ V9 (renamed) |
| expiresAt | expires_at | TIMESTAMP | ✅ V9 (renamed) |
| createdAt | created_at | TIMESTAMP | ✅ V1 |

**Note**: V9 migration fixes column name mismatches

---

## 🔴 ISSUES FOUND

### Issue #1: SystemSetting Entity Mismatch
**Severity**: MEDIUM  
**Location**: `com.expenze.entity.SystemSetting`

**Problem**: Entity defines 4 columns that don't exist in database:
1. `setting_type` (VARCHAR)
2. `description` (TEXT)
3. `category` (VARCHAR)
4. `is_public` (INTEGER)

**Impact**:
- Application will fail when trying to persist SystemSetting entities
- Queries will fail with "column does not exist" errors

**Solution Required**: Create migration V10 to add missing columns

---

## 📋 Recommendations

### 1. Fix SystemSetting Schema (REQUIRED)
Create `V10__Fix_System_Settings_Schema.sql`:

```sql
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS setting_type VARCHAR(255) DEFAULT 'text';
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS category VARCHAR(255) DEFAULT 'general';
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS is_public INTEGER DEFAULT 0;
```

### 2. Validation Checks Passed ✅
- All other entities match their migrations
- Column names are consistent (snake_case in DB)
- Data types are appropriate
- Constraints (UNIQUE, NOT NULL) are correct
- Legacy columns properly cleaned up

---

## 📊 Summary Statistics

| Status | Count | Entities |
|--------|-------|----------|
| ✅ Perfect Match | 9 | User, Category, MonthPlan, PaymentItem, RegularPayment, Salary, UserVerification, PasswordResetToken, EmailChangeRequest |
| ⚠️ Needs Fix | 1 | SystemSetting |
| **Total** | **10** | **All Entities** |

---

## 🚀 Action Items

1. **CRITICAL**: Create and apply V10 migration for SystemSetting
2. **VERIFY**: Test SystemSetting CRUD operations after migration
3. **MONITOR**: Check logs for any remaining schema errors

---

**Verification Status**: ⚠️ 1 Issue Found  
**Completion**: 90% (9/10 entities verified clean)  
**Next Action**: Create V10 migration
