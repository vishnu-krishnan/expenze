# Smart Category Templates - Feature Design

## 📋 Overview

Allow users to define **sub-options** for categories that auto-populate expense names, reducing manual input and ensuring consistency.

---

## 🎯 Use Cases

### Example 1: Fuel
**Category**: Fuel  
**Sub-options**: Bike, Car, Generator  
**Usage**: Select "Fuel" → Choose "Bike" → Auto-creates "Fuel - Bike"

### Example 2: Groceries
**Category**: Groceries  
**Sub-options**: Weekly, Monthly, Emergency, Vegetables, Meat  
**Usage**: Select "Groceries" → Choose "Weekly" → Auto-creates "Groceries - Weekly"

### Example 3: Utilities
**Category**: Utilities  
**Sub-options**: Electricity, Water, Gas, Internet, Phone  
**Usage**: Select "Utilities" → Choose "Electricity" → Auto-creates "Utilities - Electricity"

---

## 🗄️ Database Schema

### New Table: `category_templates`

```sql
CREATE TABLE category_templates (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    sub_option VARCHAR(100) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_category_templates_user_category ON category_templates(user_id, category_id);
```

**Fields**:
- `id`: Primary key
- `user_id`: Owner of template
- `category_id`: Which category this belongs to
- `sub_option`: The sub-option text (e.g., "Bike", "Car")
- `sort_order`: Display order
- `is_active`: Soft delete flag

---

## 🏗️ Backend Implementation

### 1. Entity: `CategoryTemplate.java`

```java
package com.expenze.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "category_templates")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "category_id", nullable = false)
    private Long categoryId;

    @Column(name = "sub_option", nullable = false, length = 100)
    private String subOption;

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(name = "is_active")
    @Builder.Default
    private Integer isActive = 1;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
```

### 2. DTO: `CategoryTemplateDto.java`

```java
package com.expenze.dto;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CategoryTemplateDto {
    private Long id;
    private Long categoryId;
    private String categoryName; // Enriched
    private String subOption;
    private Integer sortOrder;
}
```

### 3. API Endpoints

```java
@RestController
@RequestMapping("/api/v1/category-templates")
public class CategoryTemplateController {

    // Get all templates for a category
    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<CategoryTemplateDto>> getTemplatesByCategory(
        @AuthenticationPrincipal CustomUserDetails user,
        @PathVariable Long categoryId
    );

    // Get all templates for user (grouped by category)
    @GetMapping
    public ResponseEntity<Map<String, List<CategoryTemplateDto>>> getAllTemplates(
        @AuthenticationPrincipal CustomUserDetails user
    );

    // Add new template
    @PostMapping
    public ResponseEntity<CategoryTemplateDto> addTemplate(
        @AuthenticationPrincipal CustomUserDetails user,
        @RequestBody CategoryTemplateDto dto
    );

    // Update template
    @PutMapping("/{id}")
    public ResponseEntity<CategoryTemplateDto> updateTemplate(
        @AuthenticationPrincipal CustomUserDetails user,
        @PathVariable Long id,
        @RequestBody CategoryTemplateDto dto
    );

    // Delete template
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTemplate(
        @AuthenticationPrincipal CustomUserDetails user,
        @PathVariable Long id
    );
}
```

---

## 🎨 Frontend Implementation

### 1. Monthly Plan - Smart Input

**Current**:
```jsx
<input 
  type="text" 
  placeholder="Item name" 
  value={newItem.name}
  onChange={e => setNewItem({...newItem, name: e.target.value})}
/>
```

**New**:
```jsx
// Step 1: Select Category
<select 
  value={newItem.categoryId}
  onChange={e => handleCategoryChange(e.target.value)}
>
  <option value="">Select Category</option>
  {categories.map(c => (
    <option key={c.id} value={c.id}>{c.name}</option>
  ))}
</select>

// Step 2: If category has templates, show sub-options
{categoryTemplates[newItem.categoryId]?.length > 0 && (
  <select 
    value={newItem.subOption}
    onChange={e => handleSubOptionChange(e.target.value)}
  >
    <option value="">Select Type</option>
    {categoryTemplates[newItem.categoryId].map(t => (
      <option key={t.id} value={t.subOption}>{t.subOption}</option>
    ))}
    <option value="__custom__">+ Custom Name</option>
  </select>
)}

// Step 3: Show generated name or allow custom
{newItem.subOption && newItem.subOption !== '__custom__' ? (
  <div className="generated-name">
    📝 {categoryName} - {newItem.subOption}
  </div>
) : (
  <input 
    type="text" 
    placeholder="Item name" 
    value={newItem.name}
    onChange={e => setNewItem({...newItem, name: e.target.value})}
  />
)}
```

### 2. Profile Settings - Template Management

**New Section**: "Category Templates"

```jsx
<div className="panel">
  <h3>Category Templates</h3>
  <p>Define quick options for your categories</p>

  {categories.map(category => (
    <div key={category.id} className="template-group">
      <h4>{category.name}</h4>
      
      {/* Existing templates */}
      <div className="template-list">
        {templates[category.id]?.map(t => (
          <div key={t.id} className="template-item">
            <input 
              value={t.subOption}
              onChange={e => updateTemplate(t.id, e.target.value)}
            />
            <button onClick={() => deleteTemplate(t.id)}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Add new */}
      <div className="add-template">
        <input 
          placeholder="Add new option..."
          value={newTemplates[category.id] || ''}
          onChange={e => setNewTemplates({
            ...newTemplates, 
            [category.id]: e.target.value
          })}
        />
        <button onClick={() => addTemplate(category.id)}>
          <Plus size={14} /> Add
        </button>
      </div>
    </div>
  ))}
</div>
```

---

## 📊 User Flow

### Adding an Expense (Monthly Plan)

```
1. User clicks "Add Item"
2. Selects Category: "Fuel"
3. System shows sub-options: [Bike, Car, Generator, + Custom]
4. User selects: "Bike"
5. System auto-fills name: "Fuel - Bike"
6. User enters amount: 500
7. Clicks Save
```

### Managing Templates (Profile)

```
1. User goes to Profile → Category Templates
2. Finds "Fuel" category
3. Sees existing: [Bike, Car]
4. Adds new: "Generator"
5. Saves
6. Now "Generator" appears in Monthly Plan dropdown
```

---

## 🎯 Default Templates (Seed Data)

### Common Categories with Sub-options

```javascript
const defaultTemplates = {
  "Fuel": ["Bike", "Car", "Scooter"],
  "Groceries": ["Weekly", "Monthly", "Vegetables", "Fruits", "Meat"],
  "Utilities": ["Electricity", "Water", "Gas", "Internet", "Phone"],
  "Transport": ["Bus", "Train", "Auto", "Cab", "Metro"],
  "Food": ["Breakfast", "Lunch", "Dinner", "Snacks"],
  "Shopping": ["Clothes", "Electronics", "Home", "Personal Care"],
  "Healthcare": ["Medicine", "Doctor", "Lab Tests", "Pharmacy"],
  "Entertainment": ["Movies", "Dining Out", "Subscriptions", "Events"]
};
```

---

## 🚀 Migration

### V12: Create Category Templates Table

```sql
-- Create category_templates table
CREATE TABLE IF NOT EXISTS category_templates (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    sub_option VARCHAR(100) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_category_template_category FOREIGN KEY (category_id) 
        REFERENCES categories(id) ON DELETE CASCADE,
    CONSTRAINT fk_category_template_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_category_templates_user_category 
    ON category_templates(user_id, category_id);

-- Insert default templates for existing users
-- (Optional: Can be done via service layer on first login)
```

---

## 💡 Advanced Features (Future)

### 1. Smart Suggestions
- Learn from user's past expenses
- Suggest most-used sub-options first
- Auto-complete based on history

### 2. Bulk Operations
- Import/export templates
- Copy templates from another user
- Share template sets

### 3. Template Metadata
- Add default amounts per sub-option
- Add priority levels
- Add notes/descriptions

---

## 📈 Benefits

| Benefit | Impact |
|---------|--------|
| Faster data entry | ⏱️ 50% less typing |
| Consistent naming | 📊 Better reports |
| User-friendly | 😊 Improved UX |
| Customizable | 🎨 Flexible for all users |
| Scalable | 🚀 Works for any category |

---

## 🎨 UI Mockup

```
┌─────────────────────────────────────────┐
│ Add New Expense                         │
├─────────────────────────────────────────┤
│ Category:  [Fuel ▼]                     │
│ Type:      [Bike ▼]                     │
│            ├─ Bike                      │
│            ├─ Car                       │
│            ├─ Generator                 │
│            └─ + Custom Name             │
│                                         │
│ Name:      📝 Fuel - Bike (auto)        │
│ Amount:    [500]                        │
│ Priority:  [MEDIUM ▼]                   │
│                                         │
│ [Cancel]              [Save]            │
└─────────────────────────────────────────┘
```

---

## ✅ Implementation Checklist

### Phase 1: Backend
- [ ] Create `CategoryTemplate` entity
- [ ] Create migration V12
- [ ] Create `CategoryTemplateDto`
- [ ] Create repository
- [ ] Create service layer
- [ ] Create controller with CRUD endpoints
- [ ] Add default templates seed data

### Phase 2: Frontend
- [ ] Create template management UI in Profile
- [ ] Fetch templates on category selection
- [ ] Show sub-option dropdown
- [ ] Auto-generate item name
- [ ] Allow custom name override
- [ ] Save template selection with expense

### Phase 3: Polish
- [ ] Add sorting/reordering
- [ ] Add search/filter
- [ ] Add bulk operations
- [ ] Mobile optimization
- [ ] Documentation

---

**Estimated Effort**: 4-6 hours  
**Complexity**: Medium  
**User Impact**: High (Major UX improvement)  
**Priority**: High (Great feature for user adoption)

---

**This is an excellent idea!** It will make the app much more user-friendly and reduce repetitive typing. Should I start implementing this feature?
