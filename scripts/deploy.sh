#!/bin/bash

# Digitallz Platform Deployment Script
# Usage: ./deploy.sh [environment] [version]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}
REGION=${3:-us-east-1}
AWS_ACCOUNT_ID=${4:-$(aws sts get-caller-identity --query Account --output text)}

# Configuration
PROJECT_NAME="digitallz"
FRONTEND_IMAGE="${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${PROJECT_NAME}-frontend:${VERSION}"
BACKEND_IMAGE="${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${PROJECT_NAME}-backend:${VERSION}"
STACK_NAME="${PROJECT_NAME}-${ENVIRONMENT}"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌${NC} $1"
    exit 1
}

check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if required tools are installed
    command -v aws >/dev/null 2>&1 || error "AWS CLI is not installed"
    command -v docker >/dev/null 2>&1 || error "Docker is not installed"
    command -v kubectl >/dev/null 2>&1 || error "kubectl is not installed"
    command -v helm >/dev/null 2>&1 || error "Helm is not installed"
    
    # Check AWS credentials
    aws sts get-caller-identity >/dev/null 2>&1 || error "AWS credentials not configured"
    
    # Check if ECR repositories exist
    aws ecr describe-repositories --repository-names "${PROJECT_NAME}-frontend" --region ${REGION} >/dev/null 2>&1 || {
        log "Creating ECR repository for frontend..."
        aws ecr create-repository --repository-name "${PROJECT_NAME}-frontend" --region ${REGION}
    }
    
    aws ecr describe-repositories --repository-names "${PROJECT_NAME}-backend" --region ${REGION} >/dev/null 2>&1 || {
        log "Creating ECR repository for backend..."
        aws ecr create-repository --repository-name "${PROJECT_NAME}-backend" --region ${REGION}
    }
    
    success "Prerequisites check completed"
}

build_images() {
    log "Building Docker images..."
    
    # Build frontend image
    log "Building frontend image..."
    cd frontend
    docker build -f Dockerfile.prod -t ${FRONTEND_IMAGE} .
    cd ..
    
    # Build backend image
    log "Building backend image..."
    cd backend
    docker build -f Dockerfile.prod -t ${BACKEND_IMAGE} .
    cd ..
    
    success "Docker images built successfully"
}

push_images() {
    log "Pushing images to ECR..."
    
    # Login to ECR
    aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com
    
    # Push frontend image
    log "Pushing frontend image..."
    docker push ${FRONTEND_IMAGE}
    
    # Push backend image
    log "Pushing backend image..."
    docker push ${BACKEND_IMAGE}
    
    success "Images pushed to ECR successfully"
}

deploy_infrastructure() {
    log "Deploying infrastructure..."
    
    # Deploy CloudFormation stack
    aws cloudformation deploy \
        --template-file deployment/aws/cloudformation.yml \
        --stack-name ${STACK_NAME} \
        --parameter-overrides \
            Environment=${ENVIRONMENT} \
            DomainName=${PROJECT_NAME}.com \
            DatabasePassword=${DATABASE_PASSWORD} \
            RedisPassword=${REDIS_PASSWORD} \
        --capabilities CAPABILITY_IAM \
        --region ${REGION}
    
    success "Infrastructure deployed successfully"
}

deploy_application() {
    log "Deploying application..."
    
    # Update ECS service with new images
    aws ecs update-service \
        --cluster ${STACK_NAME}-cluster \
        --service ${STACK_NAME}-service \
        --force-new-deployment \
        --region ${REGION}
    
    # Wait for deployment to complete
    log "Waiting for deployment to complete..."
    aws ecs wait services-stable \
        --cluster ${STACK_NAME}-cluster \
        --services ${STACK_NAME}-service \
        --region ${REGION}
    
    success "Application deployed successfully"
}

run_tests() {
    log "Running post-deployment tests..."
    
    # Get load balancer DNS
    LB_DNS=$(aws cloudformation describe-stacks \
        --stack-name ${STACK_NAME} \
        --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
        --output text \
        --region ${REGION})
    
    # Health check
    log "Performing health check..."
    for i in {1..30}; do
        if curl -f https://${LB_DNS}/health >/dev/null 2>&1; then
            success "Health check passed"
            break
        fi
        if [ $i -eq 30 ]; then
            error "Health check failed after 30 attempts"
        fi
        sleep 10
    done
    
    # Run smoke tests
    log "Running smoke tests..."
    npm run test:e2e -- --baseURL=https://${LB_DNS}
    
    success "All tests passed"
}

cleanup() {
    log "Cleaning up old images..."
    
    # Delete old images (keep last 5 versions)
    aws ecr list-images --repository-name "${PROJECT_NAME}-frontend" --region ${REGION} --query 'imageIds[5:].[imageDigest]' --output text | while read digest; do
        aws ecr batch-delete-image --repository-name "${PROJECT_NAME}-frontend" --image-ids imageDigest=${digest} --region ${REGION} || true
    done
    
    aws ecr list-images --repository-name "${PROJECT_NAME}-backend" --region ${REGION} --query 'imageIds[5:].[imageDigest]' --output text | while read digest; do
        aws ecr batch-delete-image --repository-name "${PROJECT_NAME}-backend" --image-ids imageDigest=${digest} --region ${REGION} || true
    done
    
    success "Cleanup completed"
}

rollback() {
    log "Rolling back deployment..."
    
    # Get previous task definition
    PREVIOUS_TASK_DEF=$(aws ecs describe-services \
        --cluster ${STACK_NAME}-cluster \
        --services ${STACK_NAME}-service \
        --query 'services[0].deployments[?status==`PRIMARY`].taskDefinition' \
        --output text \
        --region ${REGION})
    
    # Update service to previous task definition
    aws ecs update-service \
        --cluster ${STACK_NAME}-cluster \
        --service ${STACK_NAME}-service \
        --task-definition ${PREVIOUS_TASK_DEF} \
        --region ${REGION}
    
    success "Rollback completed"
}

# Main deployment function
main() {
    log "Starting deployment for ${ENVIRONMENT} environment with version ${VERSION}"
    
    # Check if environment variables are set
    if [ -z "$DATABASE_PASSWORD" ] || [ -z "$REDIS_PASSWORD" ]; then
        error "DATABASE_PASSWORD and REDIS_PASSWORD environment variables must be set"
    fi
    
    # Run deployment steps
    check_prerequisites
    build_images
    push_images
    
    if [ "$ENVIRONMENT" = "production" ]; then
        deploy_infrastructure
    fi
    
    deploy_application
    run_tests
    cleanup
    
    success "Deployment completed successfully!"
    
    # Get deployment information
    LB_DNS=$(aws cloudformation describe-stacks \
        --stack-name ${STACK_NAME} \
        --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
        --output text \
        --region ${REGION})
    
    log "Application URL: https://${LB_DNS}"
    log "Grafana Dashboard: https://${LB_DNS}:3001"
    log "Prometheus: https://${LB_DNS}:9090"
}

# Handle script arguments
case "${1:-}" in
    "rollback")
        rollback
        ;;
    "test")
        run_tests
        ;;
    "cleanup")
        cleanup
        ;;
    *)
        main
        ;;
esac
