# Expenze - Smart Money Management

Expenze is a modern, full-stack expense tracking application designed to help you manage your finances efficiently. It features a React-based frontend and a robust Node.js/Express backend with PostgreSQL database.

## 🚀 Features

*   **Dashboard**: Visual overview of your finances with charts.
*   **Monthly Plan**: Track expenses against a monthly budget.
*   **Recurring Templates**: Fast generation of monthly payments from templates.
*   **Categories**: Customizable expense categories.
*   **Authentication**: Secure Login/Register with Email OTP verification.
*   **Admin Panel**: User management for administrators.

## 🛠 Tech Stack

**Frontend**:
*   React.js (Vite)
*   React Router DOM
*   Chart.js
*   Lucide React (Icons)
*   CSS Modules / Vanilla CSS

**Backend**:
*   Node.js & Express.js
*   PostgreSQL (Database)
*   JWT (Authentication)
*   Nodemailer (Email OTP)

## 📂 Project Structure

```bash
expenze/
├── backend/            # Express Server & API logic
│   ├── server.js       # Entry point
│   ├── database.js     # DB Connection (pg)
│   ├── logger.js       # Logging utility
│   └── ...
├── frontend/           # React Frontend (Vite)
│   ├── src/            # Components & Pages
│   └── dist/           # Production build output
├── .env                # Environment variables
└── expenze.sh          # One-click start script
```

## ⚙️ Prerequisites

*   **Node.js** (v18+)
*   **Docker** (for PostgreSQL)
*   **Git**

## 🏁 Getting Started

### 1. Clone the repository
```bash
git clone <repository-url>
cd expenze
```

### 2. Configure Environment
Copy the example environment file and fill in your details:
```bash
cp .env.example .env
```
Edit `.env`:
*   **Database**: Defaults are set for Docker container.
*   **Email**: Add your Gmail & App Password for OTPs (Optional, defaults to Dev Mode).

### 3. Start the Application
We provide a helper script to manage everything (dependencies, database, build, start).

```bash
# Start everything (Database + Backend + Frontend)
./expenze.sh start

# Restart servers only
./expenze.sh restart
```

The script will:
1.  Start PostgreSQL in a Docker container.
2.  Install dependencies (if missing).
3.  Build the Frontend.
4.  Start the Backend server.

### 4. Access the App
*   **App URL**: [http://localhost:3000](http://localhost:3000)
*   **Dev Frontend**: [http://localhost:5173](http://localhost:5173) (if running dev mode)

## 🗄️ Database Management
You can interact with the database directly using Docker:

```bash
# Enter DB Shell
docker exec -it expenze-postgres psql -U postgres -d expenze

# Common Commands (inside shell)
\dt                 # List tables
SELECT * FROM users; # View users
\q                  # Exit
```

## 📝 License
Proprietary / Internal Use.
