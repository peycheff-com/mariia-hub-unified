#!/bin/bash

# Service Mesh Management Script for Mariia Hub
# ===========================================

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
NAMESPACE="mariia-hub"
ISTIO_NAMESPACE="istio-system"

# Default values
ACTION="deploy"
ISTIO_VERSION="1.19.0"
ENABLE_TELEMETRY=true
ENABLE_SECURITY=true
ENABLE_OBSERVABILITY=true
ENABLE_TRAFFIC_MANAGEMENT=true
VERBOSE=false
FORCE=false

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    case $level in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} [$timestamp] $message"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} [$timestamp] $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} [$timestamp] $message"
            ;;
        "DEBUG")
            if [[ "$VERBOSE" == true ]]; then
                echo -e "${BLUE}[DEBUG]${NC} [$timestamp] $message"
            fi
            ;;
        *)
            echo "[$timestamp] $message"
            ;;
    esac
}

# Help function
show_help() {
    cat << EOF
Usage: $(basename "$0") [ACTION] [OPTIONS]

Manage Istio service mesh for Mariia Hub

ACTIONS:
    deploy                  Deploy Istio service mesh
    update                  Update Istio configuration
    status                  Show mesh status
    analyze                 Analyze mesh configuration
    cleanup                 Cleanup Istio resources
    canary                  Deploy canary configuration
    rollback                Rollback mesh configuration
    monitor                 Enable monitoring
    security                 Configure security policies

OPTIONS:
    -v, --version VERSION   Istio version [default: 1.19.0]
    -n, --namespace NAMESPACE  Kubernetes namespace [default: mariia-hub]
    --no-telemetry          Disable telemetry
    --no-security           Disable security features
    --no-observability      Disable observability
    --no-traffic-mgmt       Disable traffic management
    -f, --force             Force operation without confirmation
    -v, --verbose           Enable verbose output
    -h, --help              Show this help message

EXAMPLES:
    # Deploy Istio with all features
    $(basename "$0") deploy

    # Deploy with minimal features
    $(basename "$0") deploy --no-security --no-telemetry

    # Update mesh configuration
    $(basename "$0") update --version 1.19.0

    # Show mesh status
    $(basename "$0") status

    # Analyze mesh configuration
    $(basename "$0") analyze

EOF
}

# Parse command line arguments
parse_args() {
    ACTION=${1:-deploy}
    shift

    while [[ $# -gt 0 ]]; do
        case $1 in
            -v|--version)
                ISTIO_VERSION="$2"
                shift 2
                ;;
            -n|--namespace)
                NAMESPACE="$2"
                shift 2
                ;;
            --no-telemetry)
                ENABLE_TELEMETRY=false
                shift
                ;;
            --no-security)
                ENABLE_SECURITY=false
                shift
                ;;
            --no-observability)
                ENABLE_OBSERVABILITY=false
                shift
                ;;
            --no-traffic-mgmt)
                ENABLE_TRAFFIC_MANAGEMENT=false
                shift
                ;;
            -f|--force)
                FORCE=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log "ERROR" "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# Validate prerequisites
validate_prerequisites() {
    log "INFO" "Validating prerequisites..."

    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        log "ERROR" "kubectl is not installed or not in PATH"
        exit 1
    fi

    # Check if istioctl is installed
    if ! command -v istioctl &> /dev/null; then
        log "WARN" "istioctl is not installed. Installing Istio CLI..."
        install_istioctl
    fi

    # Check cluster connection
    if ! kubectl cluster-info &> /dev/null; then
        log "ERROR" "Cannot connect to Kubernetes cluster"
        exit 1
    fi

    # Check if cluster has sufficient resources
    local nodes
    nodes=$(kubectl get nodes --no-headers | wc -l)
    if [[ $nodes -lt 2 ]]; then
        log "WARN" "Cluster has fewer than 2 nodes. Istio may not work optimally."
    fi

    log "INFO" "Prerequisites validation completed successfully"
}

# Install istioctl
install_istioctl() {
    log "INFO" "Installing Istio CLI (istioctl)..."

    local temp_dir
    temp_dir=$(mktemp -d)

    # Download istioctl
    curl -L "https://istio.io/downloadIstioctl" | ISTIO_VERSION="$ISTIO_VERSION" sh -

    # Move to bin directory
    if [[ -d "$HOME/bin" ]]; then
        mv "$HOME/.istioctl/bin/istioctl" "$HOME/bin/"
        export PATH="$HOME/bin:$PATH"
    else
        sudo mv "$HOME/.istioctl/bin/istioctl" "/usr/local/bin/"
    fi

    # Cleanup
    rm -rf "$temp_dir" "$HOME/.istioctl"

    log "INFO" "istioctl installed successfully"
}

# Create namespaces
create_namespaces() {
    log "INFO" "Creating namespaces..."

    # Create istio-system namespace
    if ! kubectl get namespace "$ISTIO_NAMESPACE" &> /dev/null; then
        kubectl create namespace "$ISTIO_NAMESPACE"
        log "INFO" "Created namespace: $ISTIO_NAMESPACE"
    fi

    # Create application namespace with istio injection
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        kubectl create namespace "$NAMESPACE"
        log "INFO" "Created namespace: $NAMESPACE"
    fi

    # Enable istio injection for application namespace
    kubectl label namespace "$NAMESPACE" istio-injection=enabled --overwrite

    log "INFO" "Namespaces created and configured successfully"
}

# Deploy Istio control plane
deploy_istio() {
    log "INFO" "Deploying Istio control plane..."

    # Create IstioOperator manifest
    cat > /tmp/istio-operator.yaml << EOF
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
metadata:
  name: mariia-hub-istio
  namespace: $ISTIO_NAMESPACE
spec:
  profile: production
  values:
    global:
      meshID: mesh1
      multiCluster:
        enabled: false
      network: network1
EOF

    # Add component configurations based on flags
    if [[ "$ENABLE_TELEMETRY" == true ]]; then
        cat >> /tmp/istio-operator.yaml << EOF
  components:
    telemetry:
      enabled: true
      k8s:
        resources:
          requests:
            cpu: 500m
            memory: 2Gi
EOF
    fi

    if [[ "$ENABLE_SECURITY" == true ]]; then
        cat >> /tmp/istio-operator.yaml << EOF
  components:
    security:
      enabled: true
      k8s:
        resources:
          requests:
            cpu: 200m
            memory: 1Gi
EOF
    fi

    # Install Istio
    istioctl install -f /tmp/istio-operator.yaml -y --skip-confirmation

    # Cleanup
    rm -f /tmp/istio-operator.yaml

    log "INFO" "Istio control plane deployed successfully"
}

# Deploy mesh configuration
deploy_mesh_config() {
    log "INFO" "Deploying mesh configuration..."

    local mesh_config_file="$PROJECT_DIR/k8s/monitoring/istio-service-mesh.yaml"

    if [[ -f "$mesh_config_file" ]]; then
        log "INFO" "Applying mesh configuration from: $mesh_config_file"
        kubectl apply -f "$mesh_config_file"
    else
        log "WARN" "Mesh configuration file not found: $mesh_config_file"
        return 1
    fi

    log "INFO" "Mesh configuration deployed successfully"
}

# Verify Istio installation
verify_istio() {
    log "INFO" "Verifying Istio installation..."

    # Wait for pods to be ready
    log "INFO" "Waiting for Istio pods to be ready..."
    kubectl wait --for=condition=ready pod -l app=istiod -n "$ISTIO_NAMESPACE" --timeout=300s

    # Check control plane status
    log "INFO" "Checking control plane status..."
    istioctl verify-install

    # Check pilot status
    local pilot_status
    pilot_status=$(kubectl get pod -l app=istiod -n "$ISTIO_NAMESPACE" -o jsonpath='{.items[0].status.phase}')
    if [[ "$pilot_status" == "Running" ]]; then
        log "INFO" "Pilot is running"
    else
        log "WARN" "Pilot status: $pilot_status"
    fi

    # Check ingress gateway status
    local ingress_status
    ingress_status=$(kubectl get pod -l app=istio-ingressgateway -n "$ISTIO_NAMESPACE" -o jsonpath='{.items[0].status.phase}')
    if [[ "$ingress_status" == "Running" ]]; then
        log "INFO" "Ingress gateway is running"
    else
        log "WARN" "Ingress gateway status: $ingress_status"
    fi

    log "INFO" "Istio verification completed"
}

# Show mesh status
show_status() {
    log "INFO" "Service Mesh Status:"
    echo "======================="

    # Istio version
    echo "Istio Version:"
    istioctl version --remote=false

    echo ""
    echo "Control Plane Status:"
    kubectl get pods -n "$ISTIO_NAMESPACE"

    echo ""
    echo "Application Pods (with sidecars):"
    kubectl get pods -n "$NAMESPACE" -l istio-injection=enabled

    echo ""
    echo "Gateways:"
    kubectl get gateways -n "$NAMESPACE"

    echo ""
    echo "Virtual Services:"
    kubectl get virtualservices -n "$NAMESPACE"

    echo ""
    echo "Destination Rules:"
    kubectl get destinationrules -n "$NAMESPACE"

    echo ""
    echo "Authorization Policies:"
    kubectl get authorizationpolicies -n "$NAMESPACE"

    echo ""
    echo "Peer Authentication:"
    kubectl get peerauthentication -n "$NAMESPACE"
}

# Analyze mesh configuration
analyze_mesh() {
    log "INFO" "Analyzing mesh configuration..."

    # Check configuration validity
    log "INFO" "Validating mesh configuration..."
    istioctl analyze -n "$NAMESPACE"

    # Check proxy status
    log "INFO" "Checking proxy status..."
    istioctl proxy-status

    # Check mesh configuration
    log "INFO" "Checking mesh configuration..."
    istioctl config clustermesh status

    # Check for common issues
    log "INFO" "Checking for common issues..."

    # Check if sidecar injection is working
    local injected_pods
    injected_pods=$(kubectl get pods -n "$NAMESPACE" -l istio-injection=enabled --no-headers | wc -l)
    if [[ $injected_pods -eq 0 ]]; then
        log "WARN" "No pods with istio sidecar injection found"
    else
        log "INFO" "Found $injected_pods pods with sidecar injection"
    fi

    # Check traffic policies
    local destination_rules
    destination_rules=$(kubectl get destinationrules -n "$NAMESPACE" --no-headers | wc -l)
    log "INFO" "Found $destination_rules destination rules"

    # Check authentication policies
    local auth_policies
    auth_policies=$(kubectl get peerauthentication -n "$NAMESPACE" --no-headers | wc -l)
    log "INFO" "Found $auth_policies peer authentication policies"

    log "INFO" "Mesh analysis completed"
}

# Deploy canary configuration
deploy_canary() {
    log "INFO" "Deploying canary configuration..."

    # Create canary virtual service
    cat > /tmp/canary-virtualservice.yaml << EOF
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: mariia-hub-canary
  namespace: $NAMESPACE
spec:
  hosts:
  - mariaborysevych.com
  gateways:
  - mariia-hub-gateway
  http:
  - match:
    - headers:
        canary:
          exact: "true"
    route:
    - destination:
        host: mariia-hub-app-service
        subset: v2
        port:
          number: 80
      weight: 100
  - route:
    - destination:
        host: mariia-hub-app-service
        subset: v1
        port:
          number: 80
      weight: 90
    - destination:
        host: mariia-hub-app-service
        subset: v2
        port:
          number: 80
      weight: 10
EOF

    kubectl apply -f /tmp/canary-virtualservice.yaml
    rm -f /tmp/canary-virtualservice.yaml

    log "INFO" "Canary configuration deployed (10% traffic to v2)"
}

# Rollback mesh configuration
rollback_mesh() {
    log "INFO" "Rolling back mesh configuration..."

    if [[ "$FORCE" != true ]]; then
        read -p "Are you sure you want to rollback Istio configuration? [y/N]: " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "INFO" "Rollback cancelled"
            exit 0
        fi
    fi

    # Remove mesh configuration
    local mesh_config_file="$PROJECT_DIR/k8s/monitoring/istio-service-mesh.yaml"
    if [[ -f "$mesh_config_file" ]]; then
        kubectl delete -f "$mesh_config_file" --ignore-not-found=true
    fi

    # Remove namespaces
    kubectl delete namespace "$NAMESPACE" --ignore-not-found=true
    kubectl delete namespace "$ISTIO_NAMESPACE" --ignore-not-found=true

    log "INFO" "Mesh configuration rolled back"
}

# Cleanup Istio resources
cleanup_istio() {
    log "INFO" "Cleaning up Istio resources..."

    if [[ "$FORCE" != true ]]; then
        read -p "Are you sure you want to cleanup all Istio resources? [y/N]: " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "INFO" "Cleanup cancelled"
            exit 0
        fi
    fi

    # Remove mesh configuration
    rollback_mesh

    # Remove Istio installation
    istioctl manifest generate | kubectl delete -f -

    # Remove CRDs
    kubectl delete crds --ignore-not-found=true \
        authorizationpolicies.security.istio.io \
        peerauthentications.security.istio.io \
        requestauthentications.security.istio.io \
        destinationrules.networking.istio.io \
        envoyfilters.networking.istio.io \
        gateways.networking.istio.io \
        serviceentries.networking.istio.io \
        sidecars.networking.istio.io \
        virtualservices.networking.istio.io \
        workloadentries.networking.istio.io \
        workloadgroups.networking.istio.io

    log "INFO" "Istio cleanup completed"
}

# Enable monitoring
enable_monitoring() {
    log "INFO" "Enabling monitoring for service mesh..."

    # Apply monitoring configuration
    kubectl apply -f - << EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: istio-telemetry
  namespace: $ISTIO_NAMESPACE
  labels:
    istio.io/rev: default
data:
  mesh: |
    accessLogEncoding: JSON
    defaultConfig:
      tracing:
        sampling: 100.0
      proxyStatsMatcher:
        inclusionRegexps:
        - ".*_upstream_rq_total.*"
        - ".*_upstream_rq_2xx.*"
        - ".*_downstream_rq_total.*"
        - ".*_downstream_rq_2xx.*"
EOF

    log "INFO" "Monitoring enabled for service mesh"
}

# Configure security policies
configure_security() {
    log "INFO" "Configuring security policies..."

    # Apply mTLS policy
    kubectl apply -f - << EOF
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: $NAMESPACE
spec:
  mtls:
    mode: STRICT
EOF

    # Apply authorization policy
    kubectl apply -f - << EOF
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: allow-all
  namespace: $NAMESPACE
spec:
  {}
EOF

    log "INFO" "Security policies configured"
}

# Main execution function
main() {
    log "INFO" "Starting service mesh management for Mariia Hub"
    log "INFO" "Action: $ACTION"
    log "INFO" "Istio Version: $ISTIO_VERSION"
    log "INFO" "Namespace: $NAMESPACE"

    parse_args "$@"
    validate_prerequisites

    case $ACTION in
        deploy)
            create_namespaces
            deploy_istio
            deploy_mesh_config
            verify_istio
            ;;
        update)
            deploy_mesh_config
            verify_istio
            ;;
        status)
            show_status
            ;;
        analyze)
            analyze_mesh
            ;;
        cleanup)
            cleanup_istio
            ;;
        canary)
            deploy_canary
            ;;
        rollback)
            rollback_mesh
            ;;
        monitor)
            enable_monitoring
            ;;
        security)
            configure_security
            ;;
        *)
            log "ERROR" "Unknown action: $ACTION"
            show_help
            exit 1
            ;;
    esac

    log "INFO" "Service mesh operation completed successfully!"
}

# Trap cleanup function
cleanup() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        log "ERROR" "Operation failed with exit code: $exit_code"
    fi
    exit $exit_code
}

# Set trap for cleanup
trap cleanup EXIT

# Run main function
main "$@"