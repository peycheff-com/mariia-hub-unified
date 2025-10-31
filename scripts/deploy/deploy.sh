#!/bin/bash
# Unified deployment script
# Usage: ./deploy.sh [--env dev|staging|production] [--target k8s|docker]

ENV="dev"
TARGET="docker"

while [[ $# -gt 0 ]]; do
    case $1 in
        --env)
            ENV="$2"
            shift 2
            ;;
        --target)
            TARGET="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "Deploying to environment: $ENV with target: $TARGET"

# Run appropriate deployment based on target
if [ "$TARGET" = "k8s" ]; then
    echo "Deploying to Kubernetes..."
    # Read and execute k8s deployment logic from deploy-k8s.sh
    bash <(grep -A 1000 '# K8s deployment' scripts/deploy/deploy-k8s.sh | head -1)
else
    echo "Deploying to Docker..."
    if [ "$ENV" = "production" ]; then
        # Read and execute production deployment logic from deploy-production.sh
        bash <(grep -A 1000 '# Production deployment' scripts/deploy/deploy-production.sh | head -1)
    else
        # Use basic deployment from deploy.sh
        bash <(grep -A 1000 '# Basic deployment' scripts/deploy/deploy.sh | head -1)
    fi
fi

echo "Deployment complete!"
