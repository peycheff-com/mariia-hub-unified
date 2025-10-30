#!/bin/bash

# Kubernetes Deployment Automation Script for Mariia Hub
# ====================================================

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
HELM_CHART_DIR="$PROJECT_DIR/helm/mariia-hub"
VALUES_FILE="$PROJECT_DIR/k8s/overlays/production/values.yaml"
NAMESPACE="mariia-hub"
RELEASE_NAME="mariia-hub"
CONTEXT=""

# Default values
ENVIRONMENT="production"
DRY_RUN=false
VERBOSE=false
SKIP_TESTS=false
SKIP_HELM_DEPENDENCIES=false
TIMEOUT=600
REPLICA_COUNT=3

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
Usage: $(basename "$0") [OPTIONS]

Deploy Mariia Hub to Kubernetes using Helm

OPTIONS:
    -e, --environment ENV       Deployment environment (production|staging|development) [default: production]
    -n, --namespace NAMESPACE    Kubernetes namespace [default: mariia-hub]
    -r, --release RELEASE       Helm release name [default: mariia-hub]
    -c, --context CONTEXT       Kubernetes context
    -f, --values FILE           Override values file
    -t, --timeout SECONDS       Deployment timeout [default: 600]
    --replicas COUNT            Number of replicas [default: 3]
    --dry-run                   Perform a dry run without applying changes
    --skip-tests                Skip helm tests
    --skip-dependencies         Skip helm dependency update
    -v, --verbose               Enable verbose output
    -h, --help                  Show this help message

EXAMPLES:
    # Deploy to production
    $(basename "$0") --environment production

    # Deploy with dry run
    $(basename "$0") --dry-run --verbose

    # Deploy to staging with custom values
    $(basename "$0") --environment staging --values custom-values.yaml

    # Deploy with specific context and namespace
    $(basename "$0") --context my-cluster --namespace my-namespace

EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -n|--namespace)
                NAMESPACE="$2"
                shift 2
                ;;
            -r|--release)
                RELEASE_NAME="$2"
                shift 2
                ;;
            -c|--context)
                CONTEXT="$2"
                shift 2
                ;;
            -f|--values)
                VALUES_FILE="$2"
                shift 2
                ;;
            -t|--timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            --replicas)
                REPLICA_COUNT="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --skip-dependencies)
                SKIP_HELM_DEPENDENCIES=true
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

    # Check if helm is installed
    if ! command -v helm &> /dev/null; then
        log "ERROR" "helm is not installed or not in PATH"
        exit 1
    fi

    # Check if we can connect to the cluster
    if [[ -n "$CONTEXT" ]]; then
        if ! kubectl cluster-info --context "$CONTEXT" &> /dev/null; then
            log "ERROR" "Cannot connect to Kubernetes cluster with context: $CONTEXT"
            exit 1
        fi
    else
        if ! kubectl cluster-info &> /dev/null; then
            log "ERROR" "Cannot connect to Kubernetes cluster"
            exit 1
        fi
    fi

    # Check if helm chart directory exists
    if [[ ! -d "$HELM_CHART_DIR" ]]; then
        log "ERROR" "Helm chart directory not found: $HELM_CHART_DIR"
        exit 1
    fi

    # Check if values file exists
    if [[ ! -f "$VALUES_FILE" ]]; then
        log "ERROR" "Values file not found: $VALUES_FILE"
        exit 1
    fi

    log "INFO" "Prerequisites validation completed successfully"
}

# Set kubectl context
set_context() {
    if [[ -n "$CONTEXT" ]]; then
        log "INFO" "Setting kubectl context to: $CONTEXT"
        kubectl config use-context "$CONTEXT"
    fi
}

# Create namespace if it doesn't exist
create_namespace() {
    log "INFO" "Ensuring namespace exists: $NAMESPACE"

    if kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log "INFO" "Namespace $NAMESPACE already exists"
    else
        log "INFO" "Creating namespace: $NAMESPACE"
        kubectl create namespace "$NAMESPACE"
    fi
}

# Apply Kubernetes manifests (namespaces, storage classes, etc.)
apply_manifests() {
    log "INFO" "Applying Kubernetes manifests..."

    local manifest_files=(
        "$PROJECT_DIR/k8s/namespaces/namespaces.yaml"
        "$PROJECT_DIR/k8s/storage/storage-classes.yaml"
        "$PROJECT_DIR/k8s/storage/persistent-volumes.yaml"
    )

    for manifest_file in "${manifest_files[@]}"; do
        if [[ -f "$manifest_file" ]]; then
            log "INFO" "Applying manifest: $(basename "$manifest_file")"
            if [[ "$DRY_RUN" == true ]]; then
                kubectl apply --dry-run=client -f "$manifest_file"
            else
                kubectl apply -f "$manifest_file"
            fi
        else
            log "WARN" "Manifest file not found: $manifest_file"
        fi
    done
}

# Apply secrets and configmaps
apply_secrets_and_configmaps() {
    log "INFO" "Applying secrets and configmaps..."

    local secrets_file="$PROJECT_DIR/k8s/secrets/secrets.yaml"
    local configmaps_file="$PROJECT_DIR/k8s/configmaps/app-config.yaml"

    if [[ -f "$secrets_file" ]]; then
        log "INFO" "Applying secrets: $(basename "$secrets_file")"
        if [[ "$DRY_RUN" == true ]]; then
            kubectl apply --dry-run=client -f "$secrets_file" -n "$NAMESPACE"
        else
            kubectl apply -f "$secrets_file" -n "$NAMESPACE"
        fi
    else
        log "WARN" "Secrets file not found: $secrets_file"
    fi

    if [[ -f "$configmaps_file" ]]; then
        log "INFO" "Applying configmaps: $(basename "$configmaps_file")"
        if [[ "$DRY_RUN" == true ]]; then
            kubectl apply --dry-run=client -f "$configmaps_file" -n "$NAMESPACE"
        else
            kubectl apply -f "$configmaps_file" -n "$NAMESPACE"
        fi
    else
        log "WARN" "Configmaps file not found: $configmaps_file"
    fi
}

# Update Helm dependencies
update_helm_dependencies() {
    if [[ "$SKIP_HELM_DEPENDENCIES" == false ]]; then
        log "INFO" "Updating Helm dependencies..."
        cd "$HELM_CHART_DIR"
        helm dependency update
        cd "$PROJECT_DIR"
    else
        log "INFO" "Skipping Helm dependency update"
    fi
}

# Deploy with Helm
deploy_with_helm() {
    log "INFO" "Deploying with Helm..."

    local helm_args=(
        --namespace "$NAMESPACE"
        --values "$VALUES_FILE"
        --set replicaCount="$REPLICA_COUNT"
        --timeout "${TIMEOUT}s"
    )

    if [[ "$DRY_RUN" == true ]]; then
        helm_args+=(--dry-run --debug)
    fi

    if [[ "$VERBOSE" == true ]]; then
        helm_args+=(--debug)
    fi

    if [[ "$SKIP_TESTS" == true ]]; then
        helm_args+=(--skip-tests)
    fi

    # Check if release already exists
    if helm status "$RELEASE_NAME" --namespace "$NAMESPACE" &> /dev/null; then
        log "INFO" "Upgrading existing Helm release: $RELEASE_NAME"
        helm upgrade "$RELEASE_NAME" "$HELM_CHART_DIR" "${helm_args[@]}"
    else
        log "INFO" "Installing new Helm release: $RELEASE_NAME"
        helm install "$RELEASE_NAME" "$HELM_CHART_DIR" "${helm_args[@]}"
    fi
}

# Verify deployment
verify_deployment() {
    log "INFO" "Verifying deployment..."

    # Wait for rollout to complete
    log "INFO" "Waiting for deployment rollout to complete..."
    kubectl rollout status deployment/"$RELEASE_NAME" --namespace "$NAMESPACE" --timeout="${TIMEOUT}s"

    # Check pod status
    log "INFO" "Checking pod status..."
    local ready_pods
    ready_pods=$(kubectl get pods --namespace "$NAMESPACE" -l app.kubernetes.io/instance="$RELEASE_NAME" --no-headers | awk '{print $2}' | grep -c '1/1' || true)
    total_pods=$(kubectl get pods --namespace "$NAMESPACE" -l app.kubernetes.io/instance="$RELEASE_NAME" --no-headers | wc -l)

    log "INFO" "Pods ready: $ready_pods/$total_pods"

    if [[ "$ready_pods" -eq "$total_pods" ]] && [[ "$total_pods" -gt 0 ]]; then
        log "INFO" "All pods are ready"
    else
        log "WARN" "Not all pods are ready. Checking pod details..."
        kubectl get pods --namespace "$NAMESPACE" -l app.kubernetes.io/instance="$RELEASE_NAME"
    fi

    # Check service status
    log "INFO" "Checking service status..."
    if kubectl get service "$RELEASE_NAME-service" --namespace "$NAMESPACE" &> /dev/null; then
        local service_ip
        service_ip=$(kubectl get service "$RELEASE_NAME-service" --namespace "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")

        if [[ -n "$service_ip" ]]; then
            log "INFO" "Service is accessible at: $service_ip"
        else
            log "INFO" "Service is running (internal access)"
        fi
    fi

    # Run health check
    log "INFO" "Running health check..."
    local pod_name
    pod_name=$(kubectl get pods --namespace "$NAMESPACE" -l app.kubernetes.io/instance="$RELEASE_NAME" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

    if [[ -n "$pod_name" ]]; then
        if kubectl exec --namespace "$NAMESPACE" "$pod_name" -- curl -f http://localhost:8080/health &> /dev/null; then
            log "INFO" "Health check passed"
        else
            log "WARN" "Health check failed"
        fi
    fi
}

# Show deployment summary
show_deployment_summary() {
    log "INFO" "Deployment Summary:"
    echo "=========================="
    echo "Environment: $ENVIRONMENT"
    echo "Namespace: $NAMESPACE"
    echo "Release: $RELEASE_NAME"
    echo "Replicas: $REPLICA_COUNT"
    echo "Timeout: ${TIMEOUT}s"
    echo "Dry Run: $DRY_RUN"
    echo "=========================="

    if [[ "$DRY_RUN" == false ]]; then
        echo ""
        log "INFO" "To check deployment status:"
        echo "  kubectl get pods --namespace $NAMESPACE"
        echo "  kubectl get services --namespace $NAMESPACE"
        echo "  helm status $RELEASE_NAME --namespace $NAMESPACE"
        echo ""
        log "INFO" "To rollback:"
        echo "  helm rollback $RELEASE_NAME --namespace $NAMESPACE"
    fi
}

# Main deployment function
main() {
    log "INFO" "Starting Kubernetes deployment for Mariia Hub"
    log "INFO" "Project directory: $PROJECT_DIR"
    log "INFO" "Environment: $ENVIRONMENT"

    parse_args "$@"
    validate_prerequisites
    set_context
    create_namespace
    apply_manifests
    apply_secrets_and_configmaps
    update_helm_dependencies
    deploy_with_helm

    if [[ "$DRY_RUN" == false ]]; then
        verify_deployment
    fi

    show_deployment_summary

    log "INFO" "Deployment completed successfully!"
}

# Trap cleanup function
cleanup() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        log "ERROR" "Deployment failed with exit code: $exit_code"
    fi
    exit $exit_code
}

# Set trap for cleanup
trap cleanup EXIT

# Run main function
main "$@"