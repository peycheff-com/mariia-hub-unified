# Infrastructure Directory Audit Report

## Executive Summary
- Total directories analyzed: 4 (infrastructure/, infra/, k8s/, helm/)
- Purpose: Identify overlaps, duplicates, and create consolidation strategy
- Target: Merge into single infrastructure directory (infra/)


## Directory Analysis

### 1. infrastructure/ Directory
drwxr-xr-x - ivan 30 Oct 18:18 docker
drwxr-xr-x - ivan 30 Oct 18:18 nginx
drwxr-xr-x - ivan 30 Oct 18:21 supabase
drwx------ - ivan 30 Oct 18:15 terraform

### 2. infra/ Directory
drwxr-xr-x - ivan 23 Oct 19:05 backup
drwx------ - ivan 23 Oct 19:22 cloudfront
drwxr-xr-x - ivan 23 Oct 19:06 docker
drwxr-xr-x - ivan 23 Oct 19:05 monitoring
drwxr-xr-x - ivan 23 Oct 19:15 nginx
drwxr-xr-x - ivan 23 Oct 19:18 postgres
drwxr-xr-x - ivan 23 Oct 19:19 redis
drwxr-xr-x - ivan 23 Oct 19:15 scripts

### 3. k8s/ Directory
drwx------ - ivan 23 Oct 19:15 autoscaling
drwxr-xr-x - ivan 30 Oct 18:27 base
drwxr-xr-x - ivan 30 Oct 18:26 configmaps
drwxr-xr-x - ivan 23 Oct 19:20 deployments
drwxr-xr-x - ivan 23 Oct 19:07 hpa
drwxr-xr-x - ivan 23 Oct 19:08 ingress
drwxr-xr-x - ivan 30 Oct 18:33 monitoring
drwxr-xr-x - ivan 30 Oct 18:25 namespaces
drwxr-xr-x - ivan 30 Oct 18:25 overlays
drwxr-xr-x - ivan 30 Oct 18:27 secrets
drwxr-xr-x - ivan 23 Oct 19:07 services
drwxr-xr-x - ivan 30 Oct 18:25 storage

### 4. helm/ Directory
drwxr-xr-x - ivan 30 Oct 18:27 mariia-hub

## File-by-File Comparison

### Docker Configs echo - infrastructure/docker/:
## File-by-File Comparison

### Docker Configs echo - infrastructure/docker/:
infrastructure/docker/entrypoint.sh
infrastructure/docker/healthcheck.sh
 echo - infra/docker/:
 echo - infra/docker/:
infra/docker/healthcheck.sh
 echo ### Terraform Configs echo - infrastructure/terraform/:
 echo ### Terraform Configs echo - infrastructure/terraform/:
 echo ### Terraform Configs echo - infrastructure/terraform/:
infrastructure/terraform/outputs.tf
infrastructure/terraform/main.tf
infrastructure/terraform/variables.tf
infrastructure/terraform/terraform.tfvars.example
infrastructure/terraform/modules/supabase/outputs.tf
infrastructure/terraform/modules/supabase/main.tf
infrastructure/terraform/modules/supabase/variables.tf
infrastructure/terraform/modules/supabase/terraform.tfvars.example
 echo - infra/scripts/terraform/:
 echo - infra/scripts/terraform/:
infra/scripts/terraform/outputs.tf
infra/scripts/terraform/main.tf
infra/scripts/terraform/networking.tf
infra/scripts/terraform/security.tf
infra/scripts/terraform/variables.tf
infra/scripts/terraform/terraform.tfvars.example
 echo ### Nginx Configs echo - infrastructure/nginx/:
 echo ### Nginx Configs echo - infrastructure/nginx/:
 echo ### Nginx Configs echo - infrastructure/nginx/:
infrastructure/nginx/mime.types
infrastructure/nginx/nginx.conf
 echo - infra/nginx/:
 echo - infra/nginx/:
infra/nginx/autoscaling-config.conf
infra/nginx/default.conf
infra/nginx/nginx.conf
infra/nginx/load-balancer.conf
 echo ### Kubernetes Manifests echo - k8s/base/:
 echo ### Kubernetes Manifests echo - k8s/base/:
 echo ### Kubernetes Manifests echo - k8s/base/:
k8s/base/deployment.yaml
 echo - helm/mariia-hub/templates/:
 echo - helm/mariia-hub/templates/:
helm/mariia-hub/templates/deployment.yaml
helm/mariia-hub/templates/ingress.yaml
helm/mariia-hub/templates/service.yaml
helm/mariia-hub/templates/hpa.yaml
helm/mariia-hub/templates/pvc.yaml
helm/mariia-hub/templates/configmap.yaml
helm/mariia-hub/templates/_helpers.tpl
 cat INFRASTRUCTURE_AUDIT.md

### Monitoring Configs
- infra/monitoring/: $(find infra/monitoring -type f 2>/dev/null | wc -l) files
- k8s/monitoring/: $(find k8s/monitoring -type f 2>/dev/null | wc -l) files

## Duplication Analysis

### Docker
- infrastructure/docker/healthcheck.sh vs infra/docker/healthcheck.sh
- Decision: Keep infrastructure/docker/ (more complete)

### Terraform
- infrastructure/terraform/ (complete setup with modules)
- infra/scripts/terraform/ (subset, basic configs)
- Decision: Keep infrastructure/terraform/ as canonical source

### Nginx
- infrastructure/nginx/nginx.conf (7.3KB - comprehensive)
- infra/nginx/nginx.conf (2.0KB - basic)
- Additional configs in infra/nginx/: defaults.conf, load-balancer.conf, autoscaling-config.conf
- Decision: Merge - use infrastructure/nginx/nginx.conf as base, add unique configs from infra/nginx/

### Kubernetes vs Helm
- k8s/ (Kustomize manifests, 19 files across 12 subdirs)
- helm/mariia-hub/ (Helm charts, 9 template files)
- Decision: **USE KUSTOMIZE** - k8s/ is more complete, Helm templates appear to be duplicate

### Postgres
- infra/postgres/ (production configs with backup scripts)
- Not present in other directories
- Decision: **KEEP** - unique to infra/

### Redis
- infra/redis/ (production configs)
- Not present in other directories
- Decision: **KEEP** - unique to infra/

### Backup
- infra/backup/ (backup automation scripts)
- Decision: **KEEP** - unique to infra/

### CloudFront
- infra/cloudfront/ (CDN configuration)
- Decision: **KEEP** - unique to infra/

## Merger Strategy

### Phase 1: Create Unified Structure
```
infra/
├── docker/           (FROM infrastructure/docker/)
├── nginx/            (MERGE - infrastructure/nginx/ as base)
├── terraform/        (FROM infrastructure/terraform/)
├── k8s/              (FROM k8s/ - Kustomize)
├── monitoring/       (MERGE if needed)
├── postgres/         (FROM infra/postgres/)
├── redis/            (FROM infra/redis/)
├── backup/           (FROM infra/backup/)
└── cloudfront/       (FROM infra/cloudfront/)
```

### Phase 2: Execute Migration
1. Copy infrastructure/* → infra/ (preserve complete setups)
2. Merge nginx/ configs (use infrastructure/nginx.conf as base)
3. Copy k8s/ → infra/k8s/ (preserve Kustomize manifests)
4. Remove infrastructure/, helm/ directories
5. Clean up infra/scripts/ (move terraform to infra/terraform/)

### Phase 3: Cleanup
- Remove helm/ (if Kustomize is preferred)
- Remove infrastructure/
- Remove empty directories

## Risk Assessment

### HIGH RISK
- **Removing infrastructure/**: Primary canonical source
- **Nginx config merge**: Critical for deployment
- **Kubernetes/Helm decision**: Architecture impact

### MEDIUM RISK
- **Terraform migration**: Ensure no broken references
- **Postgres/Redis configs**: Verify work correctly

### LOW RISK
- **Backup scripts**: Isolated functionality
- **CloudFront configs**: Independent configuration

## Recommended Actions

1. ✅ **CREATE BACKUP** (already done with .archive/)
2. 🔄 **COPY infrastructure/ → infra/** (preserve canonical sources)
3. 🔄 **MERGE nginx/ configs** (combine unique features)
4. 🔄 **MOVE k8s/ → infra/k8s/** (preserve Kustomize)
5. 🔄 **REMOVE infrastructure/ and helm/** (after verification)
6. ✅ **TEST** (terraform validate, nginx -t)
7. ✅ **COMMIT** (document all changes)

## Success Criteria

- All infrastructure in single infra/ directory
- No duplicates or overlaps
- Terraform validates: \`terraform init && terraform validate\`
- Nginx validates: \`nginx -t\`
- Kubernetes manifests work: \`kubectl apply --dry-run\`
- Build and deployment tests pass

---
*Generated: $(date)*
*Next: Execute Stream 1D - Infrastructure Directory Consolidation*
