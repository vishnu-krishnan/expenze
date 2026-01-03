#!/bin/bash
# Script to run the existing PostgreSQL container ('postgres')

# Load environment variables from .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

echo "Starting PostgreSQL container..."

if docker ps -a --format '{{.Names}}' | grep -q '^postgres$'; then
    # Check if already running
    if docker ps --format '{{.Names}}' | grep -q '^postgres$'; then
        echo "PostgreSQL container is already running."
    else
        docker start postgres
        echo "PostgreSQL container started."
    fi
else
    echo "Container 'postgres' does not exist. Please check your setup."
fi
