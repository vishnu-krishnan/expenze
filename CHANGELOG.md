# Expenze Application Changelog

## Version 1.0.0 - 2025-12-08

### Added
- **Dashboard Features**
  - Month navigation with Previous/Next buttons and month picker
  - 4 summary cards: Current Month, Total Expenses, Upcoming Payments, Savings Goal
  - Line chart showing last 6 months trend (Planned vs Actual)
  - Pie chart showing category-wise expense breakdown for current month
  - Real-time data updates when changing months
  - Formatted month display (MMM-YY format)

- **Categories Management**
  - Add new categories with sort order
  - Edit existing categories
  - Delete categories with usage warning
  - Duplicate prevention (case-insensitive)
  - Enhanced delete confirmation showing template usage
  - Sort order explanation tooltip

- **Payment Templates**
  - Create templates with start/end dates
  - View templates with months remaining calculation
  - Edit and delete templates
  - Active/Inactive status display
  - Category assignment

- **Monthly Plan**
  - Generate month from templates
  - Add manual payment items
  - Edit planned/actual amounts inline
  - Mark items as paid
  - Add notes to items
  - Delete items
  - Category-grouped display
  - Real-time totals calculation

- **API Endpoints**
  - GET /api/categories - List all categories
  - POST /api/categories - Create category
  - PUT /api/categories/:id - Update category
  - DELETE /api/categories/:id - Delete category
  - GET /api/templates - List all templates
  - POST /api/templates - Create template
  - PUT /api/templates/:id - Update template
  - DELETE /api/templates/:id - Delete template
  - GET /api/month/:key - Get month plan and items
  - POST /api/month/generate - Generate month from templates
  - PUT /api/items/:id - Update payment item
  - POST /api/items - Create manual item
  - DELETE /api/items/:id - Delete item
  - GET /api/summary/last6 - Get last 6 months summary
  - GET /api/category-expenses/:monthKey - Get category expenses for pie chart

### Design
- Professional teal color scheme (#0d9488)
- Inter font family for modern typography
- Responsive layout (mobile, tablet, desktop)
- Smooth animations and transitions
- Card-based UI with hover effects
- Gradient header
- Breadcrumb navigation

### Calculations
- Total Planned: Sum of all planned amounts
- Total Actual: Sum of all actual amounts
- Difference: Planned - Actual (remaining budget)
  - Positive (green) = Under budget
  - Negative (red) = Over budget
- Savings %: (Difference / Planned) × 100

### Known Issues
- Month picker display issue in some browsers (showing text instead of control)
- Need to verify data persistence across page reloads

### Technical Stack
- Backend: Node.js + Express
- Database: SQLite3
- Frontend: Vanilla JavaScript
- Charts: Chart.js
- Styling: Custom CSS with CSS variables

---

## Future Enhanations Planned
- Export data to CSV/PDF
- Budget alerts and notifications
- Recurring payment automation
- Multi-currency support
- Dark mode toggle
- Data backup/restore
- Mobile app version
