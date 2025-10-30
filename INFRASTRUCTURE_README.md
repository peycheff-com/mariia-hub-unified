# Infrastructure as Code Implementation

This document describes the comprehensive Infrastructure as Code (IaC) implementation for the Mariia Hub beauty and fitness booking platform.

## Overview

The infrastructure implementation provides:

1. **Terraform Configuration** - Complete infrastructure provisioning for Vercel and Supabase
2. **Docker Containerization** - Multi-stage builds for development, testing, and production
3. **Docker Compose** - Orchestration for local development and production deployments
4. **Security & Compliance** - Automated security scanning and compliance checks
5. **Backup & Disaster Recovery** - Automated backup procedures and disaster recovery plans
6. **Monitoring & Observability** - Comprehensive monitoring and logging setup

## Table of Contents

- [Terraform Infrastructure](#terraform-infrastructure)
- [Docker Configuration](#docker-configuration)
- [Docker Compose Orchestration](#docker-compose-orchestration)
- [Environment Management](#environment-management)
- [Security & Compliance](#security--compliance)
- [Backup & Disaster Recovery](#backup--disaster-recovery)
- [Monitoring & Observability](#monitoring--observability)
- [Deployment Guide](#deployment-guide)
- [Troubleshooting](#troubleshooting)

## Terraform Infrastructure

### Structure

```
infrastructure/terraform/
├── main.tf                    # Main Terraform configuration
├── variables.tf               # Input variables
├── outputs.tf                 # Output values
├── terraform.tfvars.example   # Example variables file
└── modules/
    └── supabase/
        ├── main.tf           # Supabase module configuration
        ├── variables.tf      # Module variables
        ├── outputs.tf        # Module outputs
        └── terraform.tfvars.example
```

### Features

#### Vercel Infrastructure
- **Project Management**: Automated Vercel project creation and configuration
- **Domain Management**: DNS configuration and SSL certificates
- **Environment Variables**: Secure environment variable management
- **Edge Functions**: Configurable edge functions and middleware
- **Analytics**: Built-in analytics and monitoring
- **Rate Limiting**: API rate limiting and protection

#### Supabase Infrastructure
- **Database Management**: PostgreSQL database with extensions
- **Authentication**: Complete auth configuration with OAuth providers
- **Storage**: File storage with buckets and policies
- **Real-time**: WebSocket connections for real-time features
- **Backups**: Automated database backups and PITR
- **Security**: Row-level security and access controls

### Usage

#### Initialize Terraform
```bash
cd infrastructure/terraform
terraform init
```

#### Plan Deployment
```bash
terraform plan -var-file="terraform.tfvars"
```

#### Apply Infrastructure
```bash
terraform apply -var-file="terraform.tfvars"
```

#### Destroy Infrastructure
```bash
terraform destroy -var-file="terraform.tfvars"
```

### Variables

Key variables include:

- `vercel_api_token`: Vercel API token for authentication
- `supabase_access_token`: Supabase access token
- `domain_name`: Primary domain for the application
- `environment`: Deployment environment (dev/staging/prod)
- `supabase_project_url`: Supabase project URL
- `stripe_publishable_key`: Stripe publishable key

See `variables.tf` for complete list.

## Docker Configuration

### Multi-stage Dockerfile

The Dockerfile implements four stages:

1. **Builder**: Compiles and builds the React/Vite application
2. **Production**: Optimized Nginx runtime with security features
3. **Development**: Development server with hot reload
4. **Testing**: Test execution environment

### Features

#### Production Optimizations
- **Security**: Non-root user, minimal attack surface
- **Performance**: Gzip/Brotli compression, caching headers
- **Health Checks**: Built-in health monitoring
- **Monitoring**: Structured logging and metrics
- **Scalability**: Ready for horizontal scaling

#### Security Features
- **CSP Headers**: Content Security Policy configuration
- **Security Headers**: HSTS, XSS protection, frame options
- **Rate Limiting**: Built-in rate limiting
- **Input Validation**: Request validation and sanitization

### Usage

#### Build Production Image
```bash
docker build -t mariia-hub:latest .
```

#### Build Development Image
```bash
docker build --target development -t mariia-hub:dev .
```

#### Run Production Container
```bash
docker run -p 8080:8080 --name mariia-hub mariia-hub:latest
```

## Docker Compose Orchestration

### Files

- `docker-compose.yml`: Main development configuration
- `docker-compose.prod.yml`: Production configuration
- `docker-compose.override.yml`: Development overrides
- `.dockerignore`: Docker build context optimization

### Services

#### Development Environment
- **app**: Main application with hot reload
- **supabase-db**: PostgreSQL database
- **supabase-kong**: API gateway
- **redis**: Caching and session storage
- **redis-commander**: Redis management UI
- **pgadmin**: Database management UI
- **mailhog**: Email testing service
- **minio**: S3-compatible storage

#### Production Environment
- **app**: Load-balanced application containers
- **postgres**: Primary database with replication
- **postgres-replica**: Read replica for performance
- **redis**: Production Redis with persistence
- **nginx**: Load balancer and reverse proxy
- **prometheus**: Metrics collection
- **grafana**: Visualization dashboard
- **loki**: Log aggregation
- **backup**: Automated backup service

### Usage

#### Start Development Environment
```bash
# Copy environment file
cp .env.docker .env

# Start services
docker-compose up -d

# View logs
docker-compose logs -f app
```

#### Start Production Environment
```bash
# Load production environment
source .env.production

# Deploy production
docker-compose -f docker-compose.prod.yml up -d

# Check health
docker-compose -f docker-compose.prod.yml ps
```

#### Scale Services
```bash
# Scale application containers
docker-compose up -d --scale app=3

# Scale database replicas
docker-compose -f docker-compose.prod.yml up -d --scale postgres-replica=2
```

## Environment Management

### Environments

1. **Development**: Local development with hot reload
2. **Staging**: Production-like environment for testing
3. **Production**: Production deployment with full monitoring

### Environment Variables

Key environment variables by category:

#### Application
- `NODE_ENV`: Node.js environment
- `VITE_APP_ENV`: Frontend environment
- `VITE_APP_URL`: Application URL
- `VITE_DEFAULT_CURRENCY`: Default currency (PLN)

#### Database
- `POSTGRES_DB`: Database name
- `POSTGRES_USER`: Database user
- `POSTGRES_PASSWORD`: Database password
- `REDIS_PASSWORD`: Redis password

#### External Services
- `VITE_SUPABASE_URL`: Supabase URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- `VITE_STRIPE_PUBLISHABLE_KEY`: Stripe key
- `VITE_GA4_MEASUREMENT_ID`: Google Analytics ID

### Configuration Files

- `.env.docker`: Development environment variables
- `.env.staging`: Staging environment variables
- `.env.production`: Production environment variables

## Security & Compliance

### Security Features

#### Container Security
- **Non-root Users**: All containers run as non-root
- **Minimal Images**: Alpine-based images for minimal attack surface
- **Security Scanning**: Automated vulnerability scanning
- **Resource Limits**: CPU and memory limits enforced

#### Network Security
- **Isolated Networks**: Services in isolated Docker networks
- **Firewall Rules**: Network traffic restrictions
- **SSL/TLS**: Encrypted communications
- **VPN Access**: Secure access to infrastructure

#### Application Security
- **CSP Headers**: Content Security Policy
- **Input Validation**: Request validation and sanitization
- **Rate Limiting**: API rate limiting
- **JWT Security**: Secure token handling

### Compliance

#### GDPR Compliance
- **Data Protection**: Personal data protection measures
- **Consent Management**: User consent tracking
- **Data Retention**: Configurable data retention policies
- **Right to Erasure**: Data deletion capabilities

#### SOC2 Compliance
- **Access Controls**: Role-based access control
- **Audit Logging**: Comprehensive audit trails
- **Data Encryption**: Encryption at rest and in transit
- **Monitoring**: Security monitoring and alerting

### Security Scanning

```bash
# Run security scan
npm run security-audit

# Container security scan
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image mariia-hub:latest

# Infrastructure security scan
terraform fmt -check
terraform validate
tflint --recursive
```

## Backup & Disaster Recovery

### Backup Strategy

#### Database Backups
- **Automated Backups**: Scheduled database backups
- **Point-in-Time Recovery**: PITR capabilities
- **Cross-region Backup**: Multi-region backup storage
- **Backup Encryption**: Encrypted backup storage

#### Application Backups
- **Volume Backups**: Docker volume backups
- **Configuration Backups**: Infrastructure configuration
- **Code Backups**: Version-controlled code repositories
- **Asset Backups**: User-uploaded content backups

### Backup Automation

#### Database Backup Script
```bash
#!/bin/bash
# Daily database backup
pg_dump -h postgres -U $POSTGRES_USER $POSTGRES_DB | \
gzip > /backups/db_$(date +%Y%m%d_%H%M%S).sql.gz

# Upload to S3
aws s3 cp /backups/db_$(date +%Y%m%d_%H%M%S).sql.gz \
s3://$BACKUP_BUCKET/database/
```

#### Backup Schedule
- **Database**: Every 6 hours, retained for 30 days
- **Files**: Daily, retained for 90 days
- **Configuration**: On change, retained indefinitely
- **Logs**: Weekly, retained for 1 year

### Disaster Recovery

#### Recovery Procedures
1. **Infrastructure Recovery**: Terraform apply from version control
2. **Database Recovery**: Restore from latest backup
3. **Application Recovery**: Deploy latest application version
4. **Data Validation**: Verify data integrity
5. **Service Verification**: Health checks for all services

#### Recovery Time Objective (RTO)
- **Critical Services**: 4 hours
- **Non-critical Services**: 24 hours
- **Full Recovery**: 48 hours

#### Recovery Point Objective (RPO)
- **Database**: 15 minutes
- **Application Files**: 24 hours
- **Configuration**: Real-time

## Monitoring & Observability

### Monitoring Stack

#### Prometheus
- **Metrics Collection**: Application and infrastructure metrics
- **Alerting**: Configurable alerting rules
- **Storage**: Long-term metrics storage
- **Querying**: PromQL for metric queries

#### Grafana
- **Dashboards**: Pre-configured monitoring dashboards
- **Visualization**: Charts and graphs for metrics
- **Alerting**: Visual alert management
- **Users**: Role-based access control

#### Loki
- **Log Aggregation**: Centralized log collection
- **Log Parsing**: Structured log parsing
- **Search**: Full-text log search
- **Retention**: Configurable log retention

### Key Metrics

#### Application Metrics
- **Response Time**: API response times
- **Error Rate**: Application error rates
- **Throughput**: Requests per second
- **User Metrics**: Active users, sessions

#### Infrastructure Metrics
- **CPU Usage**: Container and host CPU usage
- **Memory Usage**: Memory consumption
- **Disk Usage**: Storage utilization
- **Network I/O**: Network traffic

#### Database Metrics
- **Connection Count**: Active database connections
- **Query Performance**: Slow query monitoring
- **Replication Lag**: Database replication lag
- **Backup Status**: Backup success rates

### Alerting

#### Critical Alerts
- **Service Down**: Service availability
- **High Error Rate**: Application errors
- **Resource Exhaustion**: CPU/memory/disk
- **Security Events**: Security incidents

#### Warning Alerts
- **High Response Time**: Performance degradation
- **Resource Usage**: High resource utilization
- **Backup Failures**: Backup process failures

## Deployment Guide

### Prerequisites

#### Required Tools
- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+
- Terraform 1.5+
- Git 2.30+

#### Required Accounts
- Vercel account with API token
- Supabase account with access token
- Cloud provider account (AWS/GCP/Azure)
- Domain name (optional)

### Quick Start

#### 1. Clone Repository
```bash
git clone https://github.com/ivanborysevych/mariia-hub-unified.git
cd mariia-hub-unified
```

#### 2. Setup Environment
```bash
# Copy environment templates
cp .env.docker.example .env.docker
cp infrastructure/terraform/terraform.tfvars.example terraform.tfvars

# Edit environment files
vim .env.docker
vim terraform.tfvars
```

#### 3. Deploy Infrastructure
```bash
# Deploy Terraform infrastructure
cd infrastructure/terraform
terraform init
terraform apply -var-file="terraform.tfvars"

# Deploy application
cd ../..
./scripts/infrastructure/deploy.sh development --build
```

#### 4. Verify Deployment
```bash
# Check application health
curl http://localhost:8080/health

# Check services status
docker-compose ps

# View logs
docker-compose logs -f app
```

### Production Deployment

#### 1. Prepare Production Environment
```bash
# Setup production environment
cp .env.docker.example .env.production
# Edit with production values
vim .env.production
```

#### 2. Deploy Infrastructure
```bash
# Deploy production infrastructure
cd infrastructure/terraform
terraform apply -var-file="production.tfvars"

# Deploy application
cd ../..
./scripts/infrastructure/deploy.sh production --backup --health-check
```

#### 3. Configure DNS
```bash
# Update DNS records to point to load balancer
# Configure SSL certificates
# Setup monitoring alerts
```

### CI/CD Integration

#### GitHub Actions
```yaml
name: Deploy Infrastructure
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: ./scripts/infrastructure/deploy.sh production
```

#### Vercel Integration
```json
{
  "build": {
    "env": {
      "SUPABASE_URL": "@supabase_url",
      "SUPABASE_ANON_KEY": "@supabase_anon_key"
    }
  }
}
```

## Troubleshooting

### Common Issues

#### Docker Issues
```bash
# Container won't start
docker-compose logs app
docker-compose ps

# Permission denied
sudo chown -R $USER:$USER .

# Out of disk space
docker system prune -a
```

#### Database Issues
```bash
# Database connection failed
docker-compose exec postgres psql -U postgres -d mariia_hub

# Slow queries
docker-compose exec postgres psql -U postgres -d mariia_hub \
  -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Database locks
docker-compose exec postgres psql -U postgres -d mariia_hub \
  -c "SELECT * FROM pg_locks WHERE NOT granted;"
```

#### Network Issues
```bash
# DNS resolution
docker-compose exec app nslookup supabase-db

# Port conflicts
netstat -tulpn | grep :8080

# Network connectivity
docker-compose exec app ping postgres
```

### Performance Issues

#### Slow Response Times
```bash
# Check resource usage
docker stats

# Check database performance
docker-compose exec postgres psql -U postgres -d mariia_hub \
  -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"

# Check nginx configuration
docker-compose exec nginx nginx -t
```

#### Memory Issues
```bash
# Check memory usage
free -h
docker stats --no-stream

# Clear Redis cache
docker-compose exec redis redis-cli FLUSHALL
```

### Security Issues

#### SSL Certificate Issues
```bash
# Check certificate validity
openssl s_client -connect mariaborysevych.com:443

# Renew certificates
certbot renew
```

#### Access Control Issues
```bash
# Check firewall rules
iptables -L

# Check Docker network security
docker network ls
docker network inspect mariia-hub-network
```

### Getting Help

#### Logs and Diagnostics
```bash
# Generate diagnostic report
./scripts/infrastructure/diagnostic.sh

# Export logs
docker-compose logs --no-color > application.log

# Check system resources
df -h
free -h
top
```

#### Support Channels
- **Documentation**: This README and inline code comments
- **Issues**: GitHub Issues for bug reports and feature requests
- **Community**: Discord/Slack community for general questions
- **Support**: Direct support for critical issues

## Best Practices

### Development
- Use environment-specific configuration files
- Keep secrets out of version control
- Use Docker Compose for local development
- Implement health checks for all services
- Use structured logging

### Production
- Use infrastructure as code for all deployments
- Implement automated backups
- Monitor everything that matters
- Use immutable infrastructure
- Implement zero-downtime deployments

### Security
- Regularly update base images
- Scan for vulnerabilities
- Use least privilege access
- Encrypt sensitive data
- Monitor security events

### Performance
- Optimize Docker image sizes
- Use caching effectively
- Monitor resource usage
- Implement rate limiting
- Use CDN for static assets

This infrastructure implementation provides a solid foundation for the Mariia Hub platform with scalability, security, and maintainability built in from the ground up.