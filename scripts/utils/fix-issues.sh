#!/bin/bash
# Unified issue fixing script
# Usage: ./fix-issues.sh [--type eslint|accessibility]

TYPE="all"

while [[ $# -gt 0 ]]; do
    case $1 in
        --type)
            TYPE="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "Fixing issues of type: $TYPE"

# Run appropriate fix based on type
if [ "$TYPE" = "eslint" ] || [ "$TYPE" = "all" ]; then
    echo "Running ESLint fix..."
    node scripts/utils/fix-eslint.cjs
fi

if [ "$TYPE" = "accessibility" ] || [ "$TYPE" = "all" ]; then
    echo "Fixing accessibility issues..."
    node scripts/utils/fix-accessibility-issues.js
fi

echo "Issue fixing complete!"
