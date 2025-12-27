# Expenze - Personal Finance Tracker

A modern, responsive web application for managing personal finances with monthly budgeting, expense tracking, and visual analytics.

## Features

### 📊 Dashboard
- **Month Navigation**: Navigate between months with Previous/Next buttons or month picker
- **Summary Cards**: Current month overview, total expenses, upcoming payments, savings goal
- **Line Chart**: Last 6 months trend (Planned vs Actual)
- **Pie Chart**: Category-wise expense breakdown for current month

### 📁 Categories
- Create, edit, and delete expense categories
- Sort order management
- Duplicate prevention
- Usage tracking (shows which templates use each category)

### 📝 Payment Templates
- Create recurring payment templates
- Set start and end dates
- View months remaining for each template
- Active/Inactive status

### 📅 Monthly Plan
- Generate month from templates automatically
- Add manual payment items
- Edit planned and actual amounts inline
- Mark payments as paid
- Add notes to each item
- Real-time totals calculation

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm

### Setup
```bash
# Clone or navigate to the project directory
cd /home/seq_vishnu/WORK/RnD/expenze

# Install dependencies
npm install

# Start the server
node server.js
```

The application will be available at `http://localhost:3000`

## Usage

### Starting the Application
```bash
node server.js
```

### Importing Data from CSV
```bash
node scripts/importCsv.js path/to/your/data.csv
```

### Viewing Logs
Application logs are written to `app.log` in the project root directory.

```bash
# View logs in real-time
tail -f app.log

# View last 50 lines
tail -50 app.log
```

## Project Structure

```
expenze/
├── public/
│   ├── index.html      # Main HTML file
│   ├── app.js          # Frontend JavaScript
│   └── style.css       # Styling
├── scripts/
│   └── importCsv.js    # CSV import utility
├── server.js           # Express server
├── database.js         # SQLite database setup
├── logger.js           # Logging utility
├── CHANGELOG.md        # Version history
├── package.json        # Dependencies
└── app.log             # Application logs (generated)
```

## API Endpoints

### Categories
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Templates
- `GET /api/templates` - List all templates
- `POST /api/templates` - Create template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template

### Monthly Plans
- `GET /api/month/:key` - Get month plan (YYYY-MM format)
- `POST /api/month/generate` - Generate month from templates
- `PUT /api/items/:id` - Update payment item
- `POST /api/items` - Create manual item
- `DELETE /api/items/:id` - Delete item

### Analytics
- `GET /api/summary/last6` - Get last 6 months summary
- `GET /api/category-expenses/:monthKey` - Get category expenses for pie chart

## Troubleshooting

### Month Picker Not Working

**Symptoms**: Month picker shows text like "October 2025" but can't be changed

**Solutions**:
1. **Hard refresh the browser**: Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. **Clear browser cache**: Go to browser settings and clear cache
3. **Check console for errors**: Press `F12` and check the Console tab for JavaScript errors
4. **Verify server is running**: Check that `node server.js` is running without errors

### Data Not Showing (All Zeros)

**Symptoms**: Dashboard and monthly plan show ₹0.00 for all values

**Possible Causes**:
1. **No data in database**: Generate a month plan first
2. **Wrong month selected**: Check if the selected month has data
3. **Database not initialized**: Check if `expenze.db` file exists

**Solutions**:
1. Go to "Monthly Plan" tab
2. Select a month
3. Click "Generate from Templates" button
4. Add some payment items manually if needed
5. Enter actual amounts and mark as paid

### Charts Not Displaying

**Symptoms**: Chart areas are blank or show "No data"

**Solutions**:
1. Ensure you have data for at least one month
2. Check browser console (F12) for Chart.js errors
3. Verify Chart.js CDN is loading (check Network tab in F12)
4. Try refreshing the page

### Server Won't Start

**Symptoms**: Error when running `node server.js`

**Solutions**:
1. Check if port 3000 is already in use:
   ```bash
   # Linux/Mac
   lsof -i :3000
   
   # Kill the process if needed
   kill -9 <PID>
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Check for syntax errors in `server.js`

### Debugging Tips

1. **Check Application Logs**:
   ```bash
   tail -f app.log
   ```

2. **Check Browser Console**:
   - Press `F12`
   - Go to Console tab
   - Look for errors (red text)

3. **Check Network Requests**:
   - Press `F12`
   - Go to Network tab
   - Reload page
   - Check if API calls are returning 200 status

4. **Verify Database**:
   ```bash
   # Check if database file exists
   ls -la expenze.db
   
   # View database contents (if sqlite3 is installed)
   sqlite3 expenze.db "SELECT * FROM categories;"
   ```

## Calculations Explained

### Difference (Remaining Budget)
```
Difference = Planned - Actual
```
- **Positive (Green)**: Under budget, money saved
- **Negative (Red)**: Over budget, overspent
- **Example**: Planned ₹10,000, Actual ₹8,000 → Diff: ₹2,000 (saved 20%)

### Savings Percentage
```
Savings % = (Difference / Planned) × 100
```

## Technology Stack

- **Backend**: Node.js + Express.js
- **Database**: SQLite3
- **Frontend**: Vanilla JavaScript (ES6+)
- **Charts**: Chart.js
- **Styling**: Custom CSS with CSS Variables
- **Font**: Inter (Google Fonts)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Check `CHANGELOG.md` for recent changes
2. Check `app.log` for any errors
3. Test changes thoroughly before committing
4. Update `CHANGELOG.md` with your changes

## License

Private project - All rights reserved

## Support

For issues or questions:
1. Check this README's Troubleshooting section
2. Review `app.log` for error messages
3. Check browser console for frontend errors
4. Review `CHANGELOG.md` for known issues
