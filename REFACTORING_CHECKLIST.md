# Quick-Start Refactoring Checklist

Use this checklist to execute the refactoring phase by phase.

---

## Pre-Refactoring Setup

### ✅ Create Backup
```bash
# Create git tag for rollback
git tag refactor-start
git push origin refactor-start

# Create tar backup (excluding large directories)
tar -czf mariia-hub-backup-$(date +%Y%m%d).tar.gz \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.next' \
  --exclude='.turbo' \
  .

# Verify backup
tar -tzf mariia-hub-backup-$(date +%Y%m%d).tar.gz | head -20
```

### ✅ Document Current State
```bash
# Count files before
echo "=== BEFORE REFACTORING ==="
find . -name "docker-compose*.yml" -o -name "Dockerfile*" | wc -l | xargs echo "Docker files:"
find . -name "*.config.*" | wc -l | xargs echo "Config files:"
find scripts -type f | wc -l | xargs echo "Scripts:"
find infrastructure infra k8s helm -type f 2>/dev/null | wc -l | xargs echo "Infrastructure files:"
```

---

## Phase 1: Critical Consolidations (Week 1)

### ✅ 1.1 Docker Consolidation

```bash
# Remove redundant docker-compose files
rm docker-compose.blue-green.yml
rm docker-compose.enhanced-prod.yml

# Remove redundant Dockerfiles
rm Dockerfile.dev
rm Dockerfile.lighthouse
rm Dockerfile.playwright
rm Dockerfile.test

# Keep only:
# - docker-compose.yml (will add profiles)
# - docker-compose.test.yml (for CI)
# - Dockerfile (will consolidate into multi-stage)

git add .
git commit -m "refactor(phase1): Remove redundant Docker configurations"
```

**Verify**: Docker still builds correctly
```bash
docker build -t mariia-hub:test .
docker-compose up -d
```

### ✅ 1.2 Infrastructure Directory Merger

```bash
# Create new unified structure
mkdir -p infra/{docker,nginx,terraform,k8s,backup}

# Copy from infrastructure/ (keep as source of truth)
cp -r infrastructure/* infra/

# Check for files in infra/ that don't exist in infrastructure/
# Verify if any are newer/needed
diff -r infrastructure infra --brief | grep "Only in infra"

# Merge unique files if any exist, else remove infra/
rm -rf infrastructure/
rm -rf infra/scripts/terraform/  # Duplicate of infra/terraform

# Migrate k8s/ files to infra/k8s/
cp -r k8s/* infra/k8s/
rm -rf k8s/

git add .
git commit -m "refactor(phase1): Merge infrastructure directories

- Consolidate infrastructure/, infra/, k8s/ into single infra/
- Remove duplicate terraform configs
- Single source of truth for all infrastructure"
```

**Verify**: All infra files are in `infra/`
```bash
ls -la infra/
```

### ✅ 1.3 Config File Consolidation

```bash
# Create config directory
mkdir -p config

# Move all config files to config/
mv *.config.* config/ 2>/dev/null || true
mv lighthouserc.js config/ 2>/dev/null || true
mv jest.a11y.config.js config/ 2>/dev/null || true
mv vercel.config.production.js config/ 2>/dev/null || true

git add .
git commit -m "refactor(phase1): Consolidate configuration files

- Move all *.config.* files to config/
- Move standalone config files (lighthouserc, jest.a11y, etc.)
- Reduce root directory clutter"
```

**Verify**: Config files moved
```bash
ls config/
```

---

## Phase 2: Infrastructure Optimization (Week 2)

### ✅ 2.1 Terraform Consolidation

```bash
# Verify which terraform setup is more complete
wc -l infra/terraform/main.tf infra/scripts/terraform/main.tf

# Keep infra/terraform (appears more complete)
# Remove duplicate
rm -rf infra/scripts/terraform/

git add .
git commit -m "refactor(phase2): Consolidate Terraform configurations

- Keep infra/terraform as source of truth
- Remove duplicate in infra/scripts/terraform/"
```

**Verify**: Terraform still valid
```bash
cd infra/terraform && terraform init && terraform validate
```

### ✅ 2.2 Nginx Configuration Merger

```bash
# Compare nginx configs
diff infrastructure/nginx/nginx.conf infra/nginx/nginx.conf

# Keep the more complete version (likely infrastructure/nginx/nginx.conf)
# Merge unique configs from infra/nginx/ if any
# Remove infrastructure/ (already done in Phase 1)

# Verify nginx configs are consolidated
ls infra/nginx/
```

**Verify**: Nginx configs are valid
```bash
nginx -t -c infra/nginx/nginx.conf
```

### ✅ 2.3 Helm Chart Decision

```bash
# DECISION REQUIRED: Are you using Helm or Kustomize?
# Check if helm/ is actively maintained

# If NOT using Helm actively:
rm -rf helm/
git add .
git commit -m "refactor(phase2): Remove unused Helm charts

- Helm charts not actively maintained
- Using Kustomize in infra/k8s/ instead"

# If USING Helm:
# - Update helm/ templates to match infra/k8s/
# - Remove infra/k8s/overlays/ (use helm values instead)
```

**Note**: Make explicit decision and document in commit message

---

## Phase 3: Script Rationalization (Week 3)

### ✅ 3.1 Script Categorization

```bash
# Create categories
mkdir -p scripts/{deploy,backup,security,monitoring,utils}

# Analyze scripts and categorize (MANUAL PROCESS)
# This requires understanding what each script does

# Example categorizations:
# Deployment scripts
mv deploy.sh scripts/deploy/
mv deploy-production.sh scripts/deploy/production.sh
mv rollback.sh scripts/deploy/rollback.sh

# Backup scripts
mv *backup*.sh scripts/backup/
mv *disaster*.sh scripts/backup/

# Security scripts
mv *security*.sh scripts/security/
mv *secret*.sh scripts/security/

# Remove obviously duplicate/overlapping scripts
# (MANUAL REVIEW REQUIRED)
```

**Critical**: This phase requires manual analysis of script functionality.

### ✅ 3.2 Merge Overlapping Scripts

```bash
# Identify scripts that do similar things
# For example, deploy.sh and deploy-production.sh could be merged:

cat > scripts/deploy/deploy.sh << 'EOF'
#!/bin/bash
# Unified deployment script with environment parameter

ENV=${1:-development}
case $ENV in
  production)
    echo "Deploying to production..."
    # production-specific logic
    ;;
  staging)
    echo "Deploying to staging..."
    # staging-specific logic
    ;;
  *)
    echo "Deploying to development..."
    # dev logic
    ;;
esac
EOF

chmod +x scripts/deploy/deploy.sh

# Remove merged scripts
rm scripts/deploy/production.sh
```

### ✅ 3.3 Document Scripts

```bash
# Create scripts/README.md
cat > scripts/README.md << 'EOF'
# Scripts Documentation

## Directory Structure

- `deploy/` - Deployment-related scripts
- `backup/` - Backup and disaster recovery
- `security/` - Security scanning and auditing
- `monitoring/` - Monitoring and observability
- `utils/` - General utility scripts

## Usage Examples

### Deploy
```bash
./scripts/deploy/deploy.sh production
./scripts/deploy/rollback.sh
```

### Backup
```bash
./scripts/backup/backup.sh
./scripts/backup/restore.sh latest
```
EOF

git add .
git commit -m "refactor(phase3): Script rationalization

- Categorize 100+ scripts into 4 functional directories
- Merge overlapping functionality
- Create documentation
- Target: 15-20 essential scripts remaining"
```

---

## Phase 4: Final Cleanups (Week 4)

### ✅ 4.1 Remove Obsolete Directories

```bash
# Remove completely empty directories
find . -type d -empty -delete

# Remove obsolete config management
rm -rf config/environment/

# Archive Helm if removed
if [ ! -d "helm" ]; then
  echo "Helm charts removed in Phase 2"
fi
```

### ✅ 4.2 Update Documentation

```bash
# Update README.md with new structure
# Update CLAUDE.md
# Update any other documentation

git add .
git commit -m "refactor(phase4): Documentation updates

- Update README.md with new structure
- Update deployment instructions
- Update developer onboarding guide"
```

### ✅ 4.3 Update CI/CD Pipelines

```bash
# Update .github/workflows/ to use:
# - New docker-compose.test.yml location
# - New script locations
# - Updated file paths

git add .
git commit -m "refactor(phase4): Update CI/CD pipelines

- Update workflows for new docker-compose location
- Update script references
- Verify all pipelines function correctly"
```

---

## Post-Refactoring Validation

### ✅ Verify Everything Works

```bash
# Count files after
echo "=== AFTER REFACTORING ==="
find . -name "docker-compose*.yml" -o -name "Dockerfile*" | wc -l | xargs echo "Docker files:"
find config -type f | wc -l | xargs echo "Config files:"
find scripts -type f | wc -l | xargs echo "Scripts:"
find infra -type f 2>/dev/null | wc -l | xargs echo "Infrastructure files:"

# Test application builds
npm run build

# Test Docker
docker-compose -f docker-compose.yml up -d
docker-compose down

# Run tests
npm test

# Check git status
git status
git log --oneline --graph -10
```

### ✅ Calculate Metrics

```bash
# Compare before/after
echo "=== REFACTORING METRICS ==="
echo "Docker files: 12 → 3 (75% reduction)"
echo "Infrastructure dirs: 4 → 1 (75% reduction)"
echo "Config files: 11 → 6 (45% reduction)"
echo "Scripts: 100 → 15-20 (80-85% reduction)"
echo ""
echo "Total files eliminated: ~90-95 files (60% reduction)"
```

### ✅ Create Summary

```bash
# Tag completion
git tag refactor-complete
git push origin refactor-complete

# Create summary report
cat > REFACTORING_SUMMARY.md << 'EOF'
# Refactoring Complete

## What Was Done
- ✅ Consolidated 6 Dockerfiles → 1 multi-stage Dockerfile
- ✅ Consolidated 6 docker-compose files → 2 (base + test)
- ✅ Merged 4 infrastructure directories → 1 (infra/)
- ✅ Consolidated 11 config files → 6 (in config/)
- ✅ Rationalized 100 scripts → 15-20 (organized)
- ✅ Total: ~90-95 files eliminated

## Files Changed
- Created: /infra/ (consolidated infrastructure)
- Created: /config/ (consolidated configs)
- Modified: /scripts/ (organized and reduced)
- Deleted: /infrastructure/, /k8s/, multiple Docker files

## Benefits
- 60% reduction in infrastructure/config/script files
- Single source of truth for each concern
- Improved developer experience
- Easier maintenance and onboarding

## Next Steps
- Update team documentation
- Train team on new structure
- Monitor for any issues
- Consider additional optimizations

Completed: $(date)
EOF

git add REFACTORING_SUMMARY.md
git commit -m "docs: Add refactoring completion summary"
```

---

## Rollback Procedure (If Needed)

```bash
# If something goes wrong, rollback:
git reset --hard refactor-start

# Restore from backup if needed:
tar -xzf mariia-hub-backup-YYYYMMDD.tar.gz

# Verify rollback
git status
```

---

## Success Criteria

Phase is complete when:
- [ ] Application builds successfully
- [ ] Docker containers start without errors
- [ ] All tests pass (npm test)
- [ ] CI/CD pipelines pass
- [ ] No critical functionality broken
- [ ] Documentation updated
- [ ] File counts match targets

---

## Notes

- **Phase 3 (Scripts)** requires the most manual analysis
- **Document every change** in commit messages
- **Test after each phase**, not just at the end
- **Ask for help** if unsure about consolidating a specific file

---

**Estimated Total Time**: 4 weeks
**Total Effort**: High (but one-time investment with long-term benefits)
