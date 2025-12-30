#!/bin/bash

# Expenze Application Management Script
# Usage: ./expenze.sh [start|stop|restart|status|logs]

set -e

# Auto-detect project directory (where this script is located)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$SCRIPT_DIR"
PID_FILE="$PROJECT_DIR/.server.pid"
LOG_FILE="$PROJECT_DIR/app.log"

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
    pgrep -f "node backend/server.js" || echo ""
}

is_server_running() {
    local pid=$(get_server_pid)
    [ -n "$pid" ]
}

start_server() {
    echo "=========================================="
    echo "  Starting Expenze Application"
    echo "=========================================="
    echo ""
    
    if is_server_running; then
        print_warning "Server is already running (PID: $(get_server_pid))"
        echo ""
        print_info "Use './expenze.sh stop' to stop it first"
        return 1
    fi
    
    # Step 1: Check PostgreSQL Docker Container
    print_info "Checking PostgreSQL via Docker..."
    if docker ps --format '{{.Names}}' | grep -q '^postgres$'; then
        print_success "PostgreSQL is running (Docker check)"
    else
        if docker ps -a --format '{{.Names}}' | grep -q '^postgres$'; then
            print_info "Starting PostgreSQL container..."
            docker start postgres > /dev/null 2>&1
            sleep 2
            print_success "PostgreSQL started"
        else
            print_warning "PostgreSQL container 'postgres' not found. Ensure DB is accessible."
            # We don't exit here, in case user is using external DB or local install, 
            # but usually for this project it's docker.
        fi
    fi
    
    echo ""
    
    # Step 2: Check Node Dependencies (Root)
    print_info "Checking Node.js dependencies..."
    if [ ! -d "node_modules" ]; then
        print_warning "node_modules not found. Installing..."
        npm install
        print_success "Dependencies installed"
    else
        print_info "Dependencies found."
    fi

    # Step 3: Build Frontend
    print_info "Building Frontend..."
    npm run build

    echo ""
    
    # Step 4: Start Services
    print_info "Starting Services..."

    # Start Backend
    print_info "Starting Backend on port 3000..."
    nohup npm run dev:backend > "expenze.log" 2>&1 &
    BACKEND_PID=$!
    
    # Start Frontend (Dev)
    print_info "Starting Frontend (Vite) on port 5173..."
    # We use >> to append to same log, or could use separate if really needed, but user asked for single.
    # Mixing logs might be messy but it's what was asked.
    nohup npm run dev:frontend >> "expenze.log" 2>&1 &
    FRONTEND_PID=$!

    sleep 3
    
    if ps -p $BACKEND_PID > /dev/null; then
        print_success "Backend started (PID: $BACKEND_PID)"
    else
        print_error "Backend failed to start. Check expenze.log"
    fi

    if ps -p $FRONTEND_PID > /dev/null; then
        print_success "Frontend started (PID: $FRONTEND_PID)"
    else
        print_error "Frontend failed to start. Check expenze.log"
    fi
    
    echo ""
    print_success "Expenze started!"
    echo ""
    print_info "Access URLs:"
    print_info "  Production/API: http://localhost:3000"
    print_info "  Dev Frontend:   http://localhost:5173"
    print_info "  Logs:           expenze.log"
    echo ""
}

stop_server() {
    echo "=========================================="
    echo "  Stopping Expenze Application"
    echo "=========================================="
    echo ""
    
    # Kill by pattern match is risky if multiple nodes run, but simplest for now.
    # Pattern matching 'node backend/server.js' and 'vite'
    
    local node_pid=$(pgrep -f "node backend/server.js")
    if [ -n "$node_pid" ]; then
        print_info "Stopping Backend (PID: $node_pid)..."
        kill $node_pid 2>/dev/null || true
    fi

    local vite_pid=$(lsof -t -i:5173)
    if [ -n "$vite_pid" ]; then
        print_info "Stopping Frontend (PID: $vite_pid)..."
        kill $vite_pid 2>/dev/null || true
    fi
    
    sleep 2
    print_success "Stopped."
    echo ""
}

restart_server() {
    echo "=========================================="
    echo "  Restarting Expenze Application"
    echo "=========================================="
    echo ""
    
    stop_server
    sleep 2
    start_server
}

show_status() {
    echo "=========================================="
    echo "  Expenze Application Status"
    echo "=========================================="
    echo ""
    
    # Server status
    if is_server_running; then
        local pid=$(get_server_pid)
        print_success "Server is running (PID: $pid)"
        print_info "URL: http://localhost:3000"
    else
        print_error "Server is not running"
    fi
    
    echo ""
}

show_logs() {
    echo "=========================================="
    echo "  Showing Server Logs (Ctrl+C to exit)"
    echo "=========================================="
    echo ""
    
    if [ -f "$LOG_FILE" ]; then
        tail -f "$LOG_FILE"
    else
        print_error "Log file not found: $LOG_FILE"
        return 1
    fi
}

show_help() {
    cat << EOF
Expenze Management Script

Usage: ./expenze.sh [COMMAND]

Commands:
  start      Start the server
  stop       Stop the server
  restart    Restart the server
  status     Show server status
  logs       Show and follow server logs
  help       Show this help message

Examples:
  ./expenze.sh start
  ./expenze.sh stop
  ./expenze.sh restart
  ./expenze.sh status
  ./expenze.sh logs

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
