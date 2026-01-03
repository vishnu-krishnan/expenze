#!/bin/bash

# Expenze Application Management Script
# Usage: ./expenze.sh [start|stop|restart|status|logs|docker-start|docker-stop]

set -e

# Load environment variables from .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Auto-detect project directory (where this script is located)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$SCRIPT_DIR"
PID_FILE="$PROJECT_DIR/.server.pid"
LOG_FILE="$PROJECT_DIR/app.log"
BACKEND_LOG_FILE="$PROJECT_DIR/backend.log"
FRONTEND_LOG_FILE="$PROJECT_DIR/frontend.log"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "  $1"
}

get_server_pid() {
    # Match java process running the backend jar
    pgrep -f "expenze-backend-0.0.1-SNAPSHOT.jar" || echo ""
}

is_server_running() {
    local pid=$(get_server_pid)
    [ -n "$pid" ]
}

start_server() {
    echo "=========================================="
    echo "  Starting Expenze Application (Local Dev Mode)"
    echo "=========================================="
    echo ""
    if [ -f .env ]; then
        print_info "loaded environment variables from .env"
    fi
    
    if is_server_running; then
        print_warning "Server is already running (PID: $(get_server_pid))"
        echo ""
        print_info "Use './expenze.sh stop' to stop it first"
        return 1
    fi
    
    # Step 1: Check PostgreSQL Docker Container (for local dev)
    print_info "Checking PostgreSQL via Docker..."
    if docker ps --format '{{.Names}}' | grep -q '^postgres$'; then
        print_success "PostgreSQL is running (Docker check)"
    else
        if docker ps -a --format '{{.Names}}' | grep -q '^postgres$'; then
            print_info "Starting PostgreSQL container 'postgres'..."
            docker start postgres > /dev/null 2>&1
            sleep 2
            print_success "PostgreSQL started"
        else
            print_warning "PostgreSQL container 'postgres' not found. Trying 'expenze-db' if exists..."
            # Try finding the db from docker-compose if 'postgres' doesn't exist
             if docker ps -a --format '{{.Names}}' | grep -q '^expenze-db$'; then
                docker start expenze-db > /dev/null 2>&1
                print_success "PostgreSQL (expenze-db) started"
             else
                print_warning "No postgres container found. Ensure DB is accessible at $PGHOST:$PGPORT"
             fi
        fi
    fi
    
    echo ""
    
    # Step 2: Build Backend (Fast)
    print_info "Building Backend (Maven)..."
    mvn -f backend/pom.xml clean install -DskipTests > build.log 2>&1 || {
         print_error "Build failed! Check build.log"
         return 1
    }
    print_success "Backend Built successfully."

    # Step 3: Check Node Dependencies (Root) - For Frontend
    print_info "Checking Frontend dependencies..."
    if [ ! -d "node_modules" ]; then
        print_warning "node_modules not found. Installing..."
        npm install
        print_success "Dependencies installed"
    else
        print_info "Dependencies found."
    fi

    echo ""
    
    # Step 4: Start Services
    print_info "Starting Services..."

    # Start Backend
    print_info "Starting Spring Boot Backend on port 8080..."
    nohup java -jar backend/target/expenze-backend-0.0.1-SNAPSHOT.jar > "$BACKEND_LOG_FILE" 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > "$PID_FILE"
    
    # Start Frontend (Dev)
    print_info "Starting Frontend (Vite) on port 5173..."
    # Using existing dev command
    nohup npm run dev:frontend > "$FRONTEND_LOG_FILE" 2>&1 &
    FRONTEND_PID=$!

    sleep 5
    
    if ps -p $BACKEND_PID > /dev/null; then
        print_success "Backend started (PID: $BACKEND_PID)"
    else
        print_error "Backend failed to start. Check backend.log"
    fi

    if ps -p $FRONTEND_PID > /dev/null; then
        print_success "Frontend started (PID: $FRONTEND_PID)"
    else
        print_error "Frontend failed to start. Check frontend.log"
    fi
    
    echo ""
    print_success "Expenze started (Local Mode)!"
    echo ""
    print_info "Access URLs:"
    print_info "  Backend API:    http://localhost:8080"
    print_info "  Dev Frontend:   http://localhost:5173"
    print_info "  Logs:           tail -f backend.log frontend.log"
    echo ""
}

stop_server() {
    echo "=========================================="
    echo "  Stopping Expenze Application (Local Dev Mode)"
    echo "=========================================="
    echo ""
    
    local java_pid=$(get_server_pid)
    if [ -n "$java_pid" ]; then
        print_info "Stopping Backend (PID: $java_pid)..."
        kill $java_pid 2>/dev/null || true
    fi

    local vite_pid=$(lsof -t -i:5173 2>/dev/null || echo "")
    if [ -n "$vite_pid" ]; then
        print_info "Stopping Frontend (PID: $vite_pid)..."
        kill $vite_pid 2>/dev/null || true
    fi
    
    # Fallback to pid file if needed
    if [ -f "$PID_FILE" ]; then
        local pid_from_file=$(cat "$PID_FILE")
        if [ "$pid_from_file" != "$java_pid" ] && kill -0 $pid_from_file 2>/dev/null; then
             print_info "Stopping Backend (PID from file: $pid_from_file)..."
             kill $pid_from_file 2>/dev/null || true
        fi
        rm -f "$PID_FILE"
    fi

    sleep 2
    print_success "Stopped."
    echo ""
}

restart_server() {
    echo "=========================================="
    echo "  Restarting Expenze (Local Dev Mode)"
    echo "=========================================="
    stop_server
    sleep 2
    start_server
}

docker_start() {
    echo "=========================================="
    echo "  Starting Expenze via Docker Compose"
    echo "=========================================="
    echo ""
    
    # Ensure no zombie containers are holding the names
    if docker ps -a --format '{{.Names}}' | grep -E '^(backend|frontend)$' > /dev/null; then
         print_info "Cleaning up old containers..."
         docker rm -f backend frontend > /dev/null 2>&1 || true
    fi

    print_info "Building and Starting Containers..."
    docker-compose up --build -d
    
    echo ""
    if docker-compose ps | grep "Up"; then
         print_success "Containers started successfully!"
         echo ""
         print_info "Access URLs:"
         print_info "  Frontend:       http://localhost:3000"
         print_info "  Backend API:    http://localhost:8080"
         print_info "  Logs:           docker-compose logs -f"
    else
         print_error "Failed to start containers. Check logs."
         docker-compose logs
    fi
    echo ""
}

docker_stop() {
    echo "=========================================="
    echo "  Stopping Expenze via Docker Compose"
    echo "=========================================="
    echo ""
    
    print_info "Stopping Containers..."
    docker-compose down
    
    print_success "Containers stopped and removed."
    echo ""
}

docker_restart() {
    echo "=========================================="
    echo "  Restarting Expenze via Docker Compose"
    echo "=========================================="
    docker_stop
    sleep 2
    docker_start
}

show_status() {
    echo "=========================================="
    echo "  Expenze Application Status"
    echo "=========================================="
    echo ""
    
    # Check Local Server
    if is_server_running; then
        local pid=$(get_server_pid)
        print_success "Local Backend is running (PID: $pid)"
    else
        print_info "Local Backend is not running"
    fi
    
    if lsof -i:5173 > /dev/null; then
        print_success "Local Frontend is running (Port 5173)"
    else
         print_info "Local Frontend is not running"
    fi
    
    echo ""
    print_info "--- Docker Status ---"
    docker-compose ps
    echo ""
}

show_logs() {
    echo "=========================================="
    echo "  Showing Local Logs (Ctrl+C to exit)"
    echo "=========================================="
    echo "  (For docker logs, use: docker-compose logs -f)"
    echo ""
    
    tail -f "$BACKEND_LOG_FILE" "$FRONTEND_LOG_FILE"
}

show_help() {
    cat << EOF
Expenze Management Script

Usage: ./expenze.sh [COMMAND]

Commands:
  start          Start server in Local Dev Mode (Java + Vite)
  stop           Stop Local Dev Mode server
  restart        Restart Local Dev Mode server
  status         Show status (Local & Docker)
  logs           Show Local logs
  
  docker-start   Build & Start all services via Docker Compose
  docker-stop    Stop all Docker services
  
  help           Show this help message

Examples:
  ./expenze.sh start
  ./expenze.sh docker-start
EOF
}

# Main script
case "${1:-}" in
    start)
        start_server
        ;;
    stop)
        stop_server
        ;;
    restart)
        restart_server
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    docker-start)
        docker_start
        ;;
    docker-stop)
        docker_stop
        ;;
    docker-restart)
        docker_restart
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "Error: Invalid command '${1:-}'"
        echo ""
        show_help
        exit 1
        ;;
esac
