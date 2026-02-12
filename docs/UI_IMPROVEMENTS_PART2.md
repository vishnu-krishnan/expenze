# Additional UI Improvements - January 19, 2026 (Part 2)

## ✅ Completed Changes

### 1. Global Faded Red Delete Buttons
**File**: `frontend/src/styles/buttons.css`
- Updated all `.danger` buttons across the app to use faded red styling
- Background: `rgba(239, 68, 68, 0.1)`
- Color: `#dc2626`
- Border: `rgba(239, 68, 68, 0.2)`
- Softer, less aggressive appearance

### 2. Background & Card Opacity Adjustments
**Files**: 
- `frontend/src/styles/base.css`
- `frontend/src/styles/components.css`

**Changes**:
- Reduced background image opacity from `0.6` to `0.35`
- Increased overlay opacity from `0.7` to `0.85`
- Changed card/panel backgrounds from solid white to `rgba(255, 255, 255, 0.85)`
- **Result**: Less harsh white appearance, better visual balance

### 3. View Header Subtitle Color Improvement
**File**: `frontend/src/styles/layout.css`
- Changed subtitle color from generic `var(--text)` to `#374151` (darker gray)
- **Result**: Better readability for:  
  - "Welcome back! Here's your financial overview."
  - "Track and manage your expenses for this month."
  - "Manage recurring expenses..."
  - etc.

### 4. Monthly Budget Moved to Bottom
**File**: `frontend/src/pages/MonthPlan.jsx`
- Moved Monthly Budget toolbar to appear after the expense table
- **Benefit**: Better layout flow, budget summary visible after reviewing expenses

---

## ⚠️ Database Issue Detected

### Email Change Request Error
**Error**: `column ecr1_0.expires_at does not exist`  
**Location**: `/api/v1/profile/request-email-change`

**Issue**: The `email_change_requests` table is missing the `expires_at` column that the EmailChangeRequest entity expects.

### Resolution Required:
1. Check `backend/src/main/java/com/expenze/entity/EmailChangeRequest.java`
2. Create/update Flyway migration to add missing column
3. Migration should include:
   ```sql
   ALTER TABLE email_change_requests 
   ADD COLUMN expires_at TIMESTAMP;
   ```

---

## 🔄 Remaining UI Tasks (Partial)

### Unpaid Bills Dropdown
- **Requirement**: On hover over "Pending" card in Dashboard, show dropdown list of unpaid bill names
- **Status**: Not yet implemented
- **Complexity**: Requires state management for unpaid items list

### Frequency Color Coding
- **Requirement**: Add different colors for each frequency type in Regular Payments
- **Proposed Colors**:
  - MONTHLY: Blue (`#dbeafe` / `#1e40af`)
  - WEEKLY: Green (`#d1fae5` / `#065f46`)
  - YEARLY: Purple (`#e9d5ff` / `#6b21a8`)
  - ONE_TIME: Yellow (`#fef3c7` / `#92400e`) ✅ Already done
- **Status**: Template located, code prepared, needs final application

---

## 📊 Impact Summary

### Visual Improvements:
- ✅ Softer, more professional delete buttons
- ✅ Better color balance across all pages
- ✅ Improved text readability
- ✅ More logical layout (budget at bottom)

### User Experience:
- Consistent button styling across all pages
- Less eye strain from reduced white backgrounds
- Clearer visual hierarchy

---

## Next Steps Priority:

1. **HIGH**: Fix `email_change_requests` database schema
2. **MEDIUM**: Implement unpaid bills dropdown on Dashboard
3. **LOW**: Apply frequency colors to Regular Payments table

---

**Updated**: January 19, 2026, 4:11 PM IST  
**Status**: Partial completion - DB fix required
