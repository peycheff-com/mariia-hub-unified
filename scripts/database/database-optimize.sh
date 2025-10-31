#!/bin/bash
# Unified database optimization script
# Usage: ./database-optimize.sh [--level basic|performance|production]

LEVEL="basic"

while [[ $# -gt 0 ]]; do
    case $1 in
        --level)
            LEVEL="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "Running database optimization at level: $LEVEL"

# Run appropriate optimization based on level
if [ "$LEVEL" = "basic" ]; then
    echo "Running basic optimization..."
    cat scripts/database/optimize-database.sql | psql "$DATABASE_URL"
elif [ "$LEVEL" = "performance" ]; then
    echo "Running performance optimization..."
    cat scripts/database/optimize-database-performance.sql | psql "$DATABASE_URL"
elif [ "$LEVEL" = "production" ]; then
    echo "Running production optimization..."
    cat scripts/database/production-database-optimization.sql | psql "$DATABASE_URL"
    cat scripts/database/refactor-package-functions.sql | psql "$DATABASE_URL"
fi

echo "Database optimization complete!"
