#!/bin/bash

# Pre-Production Cleanup Script
# This script removes all development clutter before production deployment
# WARNING: This script permanently deletes files. BACKUP YOUR REPO FIRST!

set -e

echo "🚨 WARNING: This will permanently delete development files!"
echo "📦 Make sure you have a backup branch: git checkout -b backup-before-cleanup"
echo ""
read -p "Continue with cleanup? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cleanup cancelled."
    exit 1
fi

echo "🧹 Starting pre-production cleanup..."

# 1. Remove sensitive environment files
echo "🔒 Removing sensitive environment files..."
find . -maxdepth 2 -name ".env*" -not -name ".env.example" -type f -delete

# 2. Remove development directories
echo "📁 Removing development directories..."
DEV_DIRS=(
    "browser-extension"
    "desktop-automation"
    "docs/development"
    "scripts/dev"
    "security-reports"
    "monitoring"
    ".claude"
    ".nyc_output"
    "coverage"
    "supabase/migrations_backup"
)

for dir in "${DEV_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        rm -rf "$dir"
        echo "  ✓ Removed $dir"
    fi
done

# 3. Remove development-only docs
echo "📚 Cleaning up documentation..."
DEV_DOCS=(
    "docs/DEVELOPMENT_PLAN.md"
    "docs/COMPREHENSIVE_TODO_LIST.md"
    "docs/AI_AGENT_PROMPTS_PARALLEL_DEVELOPMENT.md"
    "docs/TODO_TICKETS.md"
    "docs/AGENT_PROMPTS.md"
    "docs/PRODUCTION_CLEANUP_AGENT.md"
    "docs/COMPREHENSIVE_REPO_AUDIT_PROMPT_FINAL.md"
    "docs/COMPREHENSIVE_SECURITY_SUMMARY.md"
    "docs/REPOSITORY_CLEANUP_AUDIT_PROMPT.md"
)

for doc in "${DEV_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        rm "$doc"
        echo "  ✓ Removed $doc"
    fi
done

# 4. Remove test files (keep test config but not test files)
echo "🧪 Removing test files..."
find src -name "*.test.ts" -type f -delete
find src -name "*.test.tsx" -type f -delete
find src -name "__tests__" -type d -exec rm -rf {} + 2>/dev/null || true
rm -rf test tests 2>/dev/null || true

# 5. Remove development-only pages
echo "📄 Removing development pages..."
DEV_PAGES=(
    "src/pages/DemoSEO.tsx"
    "src/pages/VerifyContent.tsx"
    "src/pages/Reviews-old.tsx"
    "src/pages/AdminAI.tsx"
)

for page in "${DEV_PAGES[@]}"; do
    if [ -f "$page" ]; then
        rm "$page"
        echo "  ✓ Removed $page"
    fi
done

# 6. Remove console statements
echo "💻 Removing console statements..."
find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "console\." | while read file; do
    # Create temp file without console statements
    grep -v "console\." "$file" > "$file.tmp" && mv "$file.tmp" "$file"
    echo "  ✓ Cleaned $file"
done

# 7. Remove TODO and FIXME comments
echo "📝 Removing TODO/FIXME comments..."
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' '/\/\/ TODO.*\|\/\/ FIXME.*\|\/\/ DEBUG.*\|\/\* TODO.*\*\/\|\/\* FIXME.*\*\/\|\/\* DEBUG.*\*\//d'

# 8. Remove debugger statements
echo "🐛 Removing debugger statements..."
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' '/debugger;/d'

# 9. Remove unused README files in assets
echo "🖼️ Cleaning asset documentation..."
find public/assets -name "README.md" -type f -delete 2>/dev/null || true

# 10. Remove temporary scripts
echo "📜 Removing temporary scripts..."
TEMP_SCRIPTS=(
    "scripts/create-placeholders.js"
    "scripts/generate-media.js"
    "scripts/migrate-multi-city.js"
    "scripts/seed-preview-data.ts"
    "scripts/seed-staging-data.ts"
    "scripts/setup-staging-domain.sh"
    "scripts/setup-supabase-staging.sh"
    "scripts/start-stripe-webhooks.sh"
    "scripts/security-audit.cjs"
    "scripts/security-scan.js"
    "scripts/update-dependencies.cjs"
    "scripts/validate-translations.js"
    "scripts/run-repo-cleanup-audit.js"
)

for script in "${TEMP_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        rm "$script"
        echo "  ✓ Removed $script"
    fi
done

# 11. Remove empty directories
echo "📂 Removing empty directories..."
find . -type d -empty -delete 2>/dev/null || true

# 12. Clean package.json for production
echo "📦 Cleaning package.json..."
if [ -f "package.json" ]; then
    # Create production package.json
    node -e "
        const pkg = JSON.parse(require('fs').readFileSync('package.json', 'utf8'));

        // Keep only production dependencies
        pkg.dependencies = pkg.dependencies || {};
        pkg.devDependencies = {};

        // Keep only essential scripts
        pkg.scripts = {
            build: pkg.scripts.build || 'vite build',
            preview: pkg.scripts.preview || 'vite preview',
            start: pkg.scripts.start || 'node server.js'
        };

        // Remove dev-specific fields
        delete pkg.eslintConfig;
        delete pkg.prettier;
        delete pkg.jest;
        delete pkg['lint-staged'];

        require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    "
    echo "  ✓ Updated package.json for production"
fi

# 13. Clean Docker files
echo "🐳 Cleaning Docker configurations..."
rm -f docker-compose.override.yml docker-compose.yml 2>/dev/null || true
rm -f Dockerfile.dev 2>/dev/null || true

# 14. Remove development configuration files
echo "⚙️ Removing development configs..."
DEV_CONFIGS=(
    ".nycrc.json"
    "jest.a11y.config.js"
    "lighthouserc.js"
    "vitest.config.ts"
    "playwright.config.ts"
    "tsconfig.app.json"
    "tsconfig.node.json"
    "tsconfig.base.json"
)

for config in "${DEV_CONFIGS[@]}"; do
    if [ -f "$config" ]; then
        rm "$config"
        echo "  ✓ Removed $config"
    fi
done

# 15. Remove .gitignore entries that are no longer needed
echo "🙈 Updating .gitignore..."
if [ -f ".gitignore" ]; then
    # Remove dev-specific entries
    grep -v "coverage\|nyc_output\|test-results\|playwright-report\|test-results" .gitignore > .gitignore.tmp
    mv .gitignore.tmp .gitignore
fi

# 16. Create production README
echo "📖 Creating production README..."
cat > README.md << 'EOF'
# Mariia Hub - Production

## Quick Start

1. Install dependencies:
```bash
npm ci --production
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your production values
```

3. Build the application:
```bash
npm run build
```

4. Start the server:
```bash
npm start
```

## Environment Variables

See `.env.example` for required environment variables.

## Deployment

Deploy using the provided Dockerfile:
```bash
docker build -t mariia-hub .
docker run -p 80:80 mariia-hub
```

## Support

For production support, see the technical documentation.
EOF

echo "  ✓ Created production README"

# 17. Final cleanup summary
echo ""
echo "✨ Cleanup completed!"
echo ""
echo "📊 Summary:"
echo "  - Development directories removed"
echo "  - Sensitive files deleted"
echo "  - Console statements removed"
echo "  - Test files removed"
echo "  - Documentation cleaned"
echo "  - Package.json optimized for production"
echo ""
echo "🚀 Repository is ready for production deployment!"
echo ""
echo "📋 Next steps:"
echo "  1. Review changes with: git status"
echo "  2. Commit changes: git add . && git commit -m 'chore: pre-production cleanup'"
echo "  3. Tag release: git tag -a v1.0.0 -m 'Production release v1.0.0'"
echo "  4. Push: git push && git push --tags"
echo "  5. Deploy to production"
echo ""
echo "💡 Tip: You can restore development files from the backup branch if needed."