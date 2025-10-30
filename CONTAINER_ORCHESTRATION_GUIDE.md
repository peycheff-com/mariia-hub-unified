# Container Orchestration and Management Guide

This comprehensive guide covers the container orchestration and management infrastructure for the Mariia Hub beauty and fitness booking platform.

## Table of Contents

1. [Overview](#overview)
2. [Kubernetes Infrastructure](#kubernetes-infrastructure)
3. [Helm Charts](#helm-charts)
4. [Docker Compose Enhanced Configurations](#docker-compose-enhanced-configurations)
5. [Service Mesh Integration](#service-mesh-integration)
6. [Automation Scripts](#automation-scripts)
7. [Deployment Strategies](#deployment-strategies)
8. [Monitoring and Observability](#monitoring-and-observability)
9. [Security Implementation](#security-implementation)
10. [Troubleshooting Guide](#troubleshooting-guide)

## Overview

The container orchestration infrastructure provides production-ready deployment capabilities with the following key features:

- **Kubernetes Deployment**: Full K8s manifests with Helm charts for scalable deployment
- **Advanced Docker Compose**: Enhanced configurations for blue-green deployments and production features
- **Service Mesh**: Istio integration for traffic management, security, and observability
- **Automation**: Comprehensive scripts for deployment, monitoring, and lifecycle management
- **Monitoring**: Integrated Prometheus, Grafana, and Loki for full observability
- **Security**: End-to-end security with mTLS, authentication, and authorization

## Kubernetes Infrastructure

### Directory Structure

```
k8s/
├── base/                    # Base Kubernetes manifests
│   └── deployment.yaml      # Main application deployment
├── overlays/               # Environment-specific overlays
│   ├── production/         # Production environment
│   ├── staging/           # Staging environment
│   └── development/       # Development environment
├── namespaces/            # Namespace configurations
│   └── namespaces.yaml    # Multi-namespace setup
├── storage/               # Storage configurations
│   ├── storage-classes.yaml
│   └── persistent-volumes.yaml
├── configmaps/           # Configuration management
│   └── app-config.yaml
├── secrets/              # Secret management
│   └── secrets.yaml
└── monitoring/           # Monitoring configurations
    ├── ingress-nginx.yaml
    ├── cert-manager.yaml
    └── istio-service-mesh.yaml
```

### Key Features

- **Multi-Environment Support**: Separate overlays for production, staging, and development
- **Advanced Storage**: Multiple storage classes for different workloads (SSD, HDD, backup)
- **Persistent Volumes**: Proper volume provisioning with backup strategies
- **Configuration Management**: Comprehensive ConfigMaps and Secrets
- **Networking**: Advanced Ingress with SSL/TLS, rate limiting, and security headers
- **Monitoring**: Built-in service monitoring and health checks

### Deployment Commands

```bash
# Deploy to production
./scripts/kubernetes/deploy-k8s.sh --environment production --namespace mariia-hub

# Deploy to staging
./scripts/kubernetes/deploy-k8s.sh --environment staging --namespace mariia-hub-staging

# Deploy with dry run
./scripts/kubernetes/deploy-k8s.sh --dry-run --verbose

# Deploy with custom values
./scripts/kubernetes/deploy-k8s.sh --values custom-values.yaml
```

## Helm Charts

### Chart Structure

```
helm/mariia-hub/
├── Chart.yaml              # Chart metadata and dependencies
├── values.yaml            # Default configuration values
├── templates/              # Kubernetes templates
│   ├── _helpers.tpl      # Template helpers
│   ├── deployment.yaml   # Application deployment
│   ├── service.yaml      # Service configuration
│   ├── ingress.yaml      # Ingress configuration
│   ├── hpa.yaml          # Horizontal Pod Autoscaler
│   ├── pvc.yaml          # Persistent Volume Claims
│   └── configmap.yaml    # Configuration
└── charts/               # Dependencies
    ├── postgresql/       # PostgreSQL chart
    └── redis/           # Redis chart
```

### Configuration Options

Key configuration options in `values.yaml`:

```yaml
# Image Configuration
image:
  registry: docker.io
  repository: mariia-hub
  tag: "1.0.0"
  pullPolicy: IfNotPresent

# Scaling
replicaCount: 3
autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

# Resources
resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 250m
    memory: 256Mi

# Ingress
ingress:
  enabled: true
  className: "nginx"
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/rate-limit: "100"

# PostgreSQL (Bitnami chart)
postgresql:
  enabled: true
  auth:
    existingSecret: mariia-hub-postgres-secrets
  primary:
    persistence:
      storageClass: "mariia-hub-ssd-premium"
      size: 100Gi

# Redis (Bitnami chart)
redis:
  enabled: true
  auth:
    existingSecret: mariia-hub-redis-secrets
  master:
    persistence:
      storageClass: "mariia-hub-redis-io-optimized"
      size: 20Gi
```

### Helm Commands

```bash
# Install the chart
helm install mariia-hub ./helm/mariia-hub --namespace mariia-hub --create-namespace

# Upgrade the chart
helm upgrade mariia-hub ./helm/mariia-hub --namespace mariia-hub

# Rollback
helm rollback mariia-hub 1 --namespace mariia-hub

# Test deployment
helm test mariia-hub --namespace mariia-hub

# Uninstall
helm uninstall mariia-hub --namespace mariia-hub
```

## Docker Compose Enhanced Configurations

### Available Configurations

1. **docker-compose.yml**: Basic development configuration
2. **docker-compose.enhanced-prod.yml**: Production-ready with advanced features
3. **docker-compose.blue-green.yml**: Blue-green deployment configuration

### Enhanced Production Features

The enhanced production configuration includes:

- **Advanced Service Configuration**: Resource limits, health checks, and restart policies
- **Database High Availability**: Primary-replica PostgreSQL with automated backups
- **Redis Clustering**: Master-replica Redis with persistence
- **Load Balancing**: Nginx with upstream configuration and SSL termination
- **Monitoring Stack**: Prometheus, Grafana, and Loki for full observability
- **Service Discovery**: Consul for dynamic service discovery
- **Backup Automation**: Automated database backups with S3 integration
- **Log Rotation**: Automated log rotation and cleanup

### Docker Compose Commands

```bash
# Deploy with enhanced production configuration
./scripts/docker/container-lifecycle.sh deploy --type enhanced

# Update with rolling update
./scripts/docker/container-lifecycle.sh update --environment production

# Scale services
./scripts/docker/container-lifecycle.sh scale --replicas 5

# Blue-green deployment
./scripts/docker/container-lifecycle.sh deploy --type blue-green --deployment-color green

# Backup data
./scripts/docker/container-lifecycle.sh backup --environment production

# Restore data
./scripts/docker/container-lifecycle.sh restore /path/to/backup
```

## Service Mesh Integration

### Istio Features

The Istio service mesh provides:

- **Traffic Management**: Request routing, load balancing, and traffic splitting
- **Security**: mTLS, authentication, and authorization policies
- **Observability**: Metrics, logs, and distributed tracing
- **Circuit Breaking**: Automatic circuit breaking for resilience
- **Retry Logic**: Configurable retry policies for reliability
- **Canary Deployments**: Traffic splitting for gradual rollouts

### Service Mesh Components

1. **Gateway**: Ingress gateway for external traffic
2. **Virtual Service**: Traffic routing rules
3. **Destination Rule**: Traffic policies and load balancing
4. **Service Entry**: External service access
5. **Authorization Policy**: Access control policies
6. **Peer Authentication**: mTLS configuration
7. **Sidecar**: Proxy injection configuration

### Service Mesh Commands

```bash
# Deploy Istio service mesh
./scripts/deployment/service-mesh-manager.sh deploy

# Show mesh status
./scripts/deployment/service-mesh-manager.sh status

# Analyze mesh configuration
./scripts/deployment/service-mesh-manager.sh analyze

# Deploy canary configuration
./scripts/deployment/service-mesh-manager.sh canary

# Configure security policies
./scripts/deployment/service-mesh-manager.sh security

# Enable monitoring
./scripts/deployment/service-mesh-manager.sh monitor
```

## Automation Scripts

### Available Scripts

1. **kubernetes/deploy-k8s.sh**: Kubernetes deployment automation
2. **docker/container-lifecycle.sh**: Docker container lifecycle management
3. **deployment/service-mesh-manager.sh**: Service mesh management

### Script Features

- **Error Handling**: Comprehensive error handling and validation
- **Logging**: Detailed logging with timestamps and color coding
- **Backup/Restore**: Automated backup and restore capabilities
- **Health Checks**: Integrated health checking and verification
- **Rollback**: Automatic rollback on failure
- **Dry Run**: Support for dry-run operations
- **Verbose Mode**: Detailed output for debugging

### Usage Examples

```bash
# Deploy with all features
./scripts/kubernetes/deploy-k8s.sh --environment production --verbose

# Container lifecycle management
./scripts/docker/container-lifecycle.sh deploy --type enhanced
./scripts/docker/container-lifecycle.sh update --environment production
./scripts/docker/container-lifecycle.sh backup --environment production

# Service mesh management
./scripts/deployment/service-mesh-manager.sh deploy
./scripts/deployment/service-mesh-manager.sh analyze
./scripts/deployment/service-mesh-manager.sh status
```

## Deployment Strategies

### 1. Rolling Updates

Gradual replacement of old instances with new ones:

```bash
# Kubernetes rolling update
kubectl set image deployment/mariia-hub-app app=mariia-hub:new-version

# Docker Compose rolling update
./scripts/docker/container-lifecycle.sh update --environment production
```

### 2. Blue-Green Deployment

Two identical environments with traffic switching:

```bash
# Deploy blue environment
./scripts/docker/container-lifecycle.sh deploy --type blue-green --deployment-color blue

# Deploy green environment
./scripts/docker/container-lifecycle.sh deploy --type blue-green --deployment-color green

# Switch traffic to green
./scripts/docker/container-lifecycle.sh switch --to green
```

### 3. Canary Deployment

Gradual traffic increase to new version:

```bash
# Deploy canary with Istio
./scripts/deployment/service-mesh-manager.sh canary

# Adjust traffic weights manually
kubectl patch virtualservice mariia-hub-virtualservice -p '{"spec":{"http":[{"route":[{"destination":{"host":"mariia-hub-app-service","subset":"v2"},"weight":20},{"destination":{"host":"mariia-hub-app-service","subset":"v1"},"weight":80}]}]}'
```

## Monitoring and Observability

### Monitoring Stack

1. **Prometheus**: Metrics collection and storage
2. **Grafana**: Visualization and dashboards
3. **Loki**: Log aggregation and analysis
4. **Istio Telemetry**: Service mesh metrics
5. **Health Checks**: Application and infrastructure health

### Key Metrics

- **Application Metrics**: Request rate, error rate, response time
- **Infrastructure Metrics**: CPU, memory, disk, network usage
- **Service Mesh Metrics**: Traffic patterns, latency, error rates
- **Business Metrics**: Booking rates, conversion rates, user activity

### Grafana Dashboards

Pre-configured dashboards for:
- Application performance
- Service mesh metrics
- Infrastructure monitoring
- Business analytics

### Alerting

Configured alerts for:
- High error rates (>5%)
- High latency (>1s P95)
- Resource exhaustion (>90%)
- Service unavailability

## Security Implementation

### Security Layers

1. **Network Security**: Network policies and firewall rules
2. **Application Security**: Authentication and authorization
3. **Data Security**: Encryption at rest and in transit
4. **Container Security**: Image scanning and runtime protection
5. **Service Mesh Security**: mTLS and RBAC

### Security Features

- **mTLS**: Mutual TLS for service-to-service communication
- **JWT Authentication**: Token-based authentication
- **RBAC**: Role-based access control
- **Network Policies**: Microsegmentation
- **Secrets Management**: Encrypted secrets storage
- **Vulnerability Scanning**: Automated image scanning

### Security Commands

```bash
# Apply security policies
./scripts/deployment/service-mesh-manager.sh security

# Enable mTLS
kubectl apply -f k8s/monitoring/istio-service-mesh.yaml

# Check security status
istioctl auth check
```

## Troubleshooting Guide

### Common Issues

1. **Pod Not Starting**
   ```bash
   kubectl describe pod <pod-name>
   kubectl logs <pod-name>
   kubectl get events --sort-by=.metadata.creationTimestamp
   ```

2. **Service Not Accessible**
   ```bash
   kubectl get svc
   kubectl describe svc <service-name>
   kubectl get endpoints <service-name>
   ```

3. **High Error Rates**
   ```bash
   # Check application logs
   kubectl logs -f deployment/mariia-hub-app

   # Check service mesh metrics
   istioctl proxy-status
   istioctl proxy-config clusters <pod-name>
   ```

4. **Backup Issues**
   ```bash
   # Check backup status
   ./scripts/docker/container-lifecycle.sh backup --environment production

   # Restore from backup
   ./scripts/docker/container-lifecycle.sh restore /path/to/backup
   ```

### Debugging Commands

```bash
# Kubernetes debugging
kubectl get pods -o wide
kubectl top nodes
kubectl top pods

# Service mesh debugging
istioctl proxy-status
istioctl analyze
istioctl proxy-config routes <pod-name>

# Docker debugging
docker ps -a
docker logs <container-id>
docker inspect <container-id>
```

### Performance Tuning

1. **Resource Limits**: Adjust CPU and memory limits based on usage
2. **Autoscaling**: Configure horizontal pod autoscaling
3. **Load Balancing**: Optimize load balancing algorithms
4. **Caching**: Implement appropriate caching strategies
5. **Database Optimization**: Optimize queries and indexing

## Best Practices

### Deployment Best Practices

1. **Immutable Infrastructure**: Use immutable container images
2. **Infrastructure as Code**: Manage all infrastructure in version control
3. **Automated Testing**: Include automated tests in deployment pipeline
4. **Blue-Green Deployments**: Use blue-green for zero-downtime deployments
5. **Health Checks**: Implement comprehensive health checks
6. **Backup Strategy**: Regular automated backups with verification

### Security Best Practices

1. **Least Privilege**: Apply principle of least privilege
2. **Regular Updates**: Keep all components updated
3. **Security Scanning**: Regular vulnerability scanning
4. **Audit Logs**: Enable comprehensive audit logging
5. **Network Segmentation**: Implement network policies
6. **Secrets Management**: Use proper secrets management

### Monitoring Best Practices

1. **Comprehensive Metrics**: Monitor all layers of the stack
2. **Alerting**: Configure meaningful alerts with thresholds
3. **Dashboards**: Create role-specific dashboards
4. **SLA Monitoring**: Monitor against service level agreements
5. **Capacity Planning**: Monitor resource usage for capacity planning
6. **Performance Baselines**: Establish performance baselines

## Conclusion

This container orchestration and management infrastructure provides a comprehensive, production-ready platform for the Mariia Hub application. The integration of Kubernetes, Docker Compose, service mesh, and automation scripts ensures reliable, scalable, and maintainable deployments.

For additional information or support, refer to the individual script documentation and configuration files.