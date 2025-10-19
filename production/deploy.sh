#!/bin/bash

# ===========================================
# DIGITALLZ KEYWORDS PLATFORM - DEPLOYMENT
# ===========================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="digitallz-keywords"
ENVIRONMENT=${1:-production}
REGION="us-east-1"
CLUSTER_NAME="digitallz-cluster"
SERVICE_NAME="digitallz-service"
TASK_DEFINITION="digitallz-task"

# Logging
LOG_FILE="/var/log/digitallz/deploy.log"
mkdir -p $(dirname $LOG_FILE)

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a $LOG_FILE
    exit 1
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a $LOG_FILE
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a $LOG_FILE
}

# Pre-deployment checks
pre_deployment_checks() {
    log "🔍 Running pre-deployment checks..."
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        error "AWS CLI is not installed"
    fi
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        error "AWS credentials not configured"
    fi
    
    # Check if ECR repository exists
    if ! aws ecr describe-repositories --repository-names $APP_NAME --region $REGION &> /dev/null; then
        log "Creating ECR repository..."
        aws ecr create-repository --repository-name $APP_NAME --region $REGION
    fi
    
    log "✅ Pre-deployment checks passed"
}

# Build and push Docker images
build_and_push() {
    log "🏗️ Building and pushing Docker images..."
    
    # Get ECR login token
    aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$REGION.amazonaws.com
    
    # Build frontend image
    log "Building frontend image..."
    cd frontend
    docker build -t $APP_NAME-frontend:latest .
    docker tag $APP_NAME-frontend:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$REGION.amazonaws.com/$APP_NAME-frontend:latest
    docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$REGION.amazonaws.com/$APP_NAME-frontend:latest
    cd ..
    
    # Build backend image
    log "Building backend image..."
    cd backend
    docker build -t $APP_NAME-backend:latest .
    docker tag $APP_NAME-backend:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$REGION.amazonaws.com/$APP_NAME-backend:latest
    docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$REGION.amazonaws.com/$APP_NAME-backend:latest
    cd ..
    
    log "✅ Docker images built and pushed"
}

# Deploy infrastructure
deploy_infrastructure() {
    log "🏗️ Deploying infrastructure..."
    
    # Deploy CloudFormation stack
    aws cloudformation deploy \
        --template-file deployment/aws/cloudformation.yml \
        --stack-name digitallz-infrastructure \
        --parameter-overrides Environment=$ENVIRONMENT \
        --capabilities CAPABILITY_IAM \
        --region $REGION
    
    log "✅ Infrastructure deployed"
}

# Deploy application
deploy_application() {
    log "🚀 Deploying application..."
    
    # Update ECS service
    aws ecs update-service \
        --cluster $CLUSTER_NAME \
        --service $SERVICE_NAME \
        --force-new-deployment \
        --region $REGION
    
    # Wait for deployment to complete
    log "Waiting for deployment to complete..."
    aws ecs wait services-stable \
        --cluster $CLUSTER_NAME \
        --services $SERVICE_NAME \
        --region $REGION
    
    log "✅ Application deployed"
}

# Run database migrations
run_migrations() {
    log "🗄️ Running database migrations..."
    
    # Get task ARN
    TASK_ARN=$(aws ecs list-tasks --cluster $CLUSTER_NAME --service-name $SERVICE_NAME --region $REGION --query 'taskArns[0]' --output text)
    
    # Run migrations
    aws ecs execute-command \
        --cluster $CLUSTER_NAME \
        --task $TASK_ARN \
        --container backend \
        --command "npm run db:migrate" \
        --interactive \
        --region $REGION
    
    log "✅ Database migrations completed"
}

# Health check
health_check() {
    log "🏥 Running health checks..."
    
    # Get load balancer DNS
    LB_DNS=$(aws elbv2 describe-load-balancers --names digitallz-alb --region $REGION --query 'LoadBalancers[0].DNSName' --output text)
    
    # Wait for service to be ready
    for i in {1..30}; do
        if curl -f "http://$LB_DNS/health" &> /dev/null; then
            log "✅ Health check passed"
            return 0
        fi
        sleep 10
    done
    
    error "Health check failed"
}

# Post-deployment tasks
post_deployment() {
    log "🔧 Running post-deployment tasks..."
    
    # Update Route 53 records
    aws route53 change-resource-record-sets \
        --hosted-zone-id Z1234567890 \
        --change-batch file://production/route53-changes.json
    
    # Invalidate CloudFront cache
    aws cloudfront create-invalidation \
        --distribution-id E1234567890 \
        --paths "/*"
    
    # Send deployment notification
    curl -X POST "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK" \
        -H "Content-Type: application/json" \
        -d '{"text":"🚀 Digitallz Keywords Platform deployed successfully to production!"}'
    
    log "✅ Post-deployment tasks completed"
}

# Rollback function
rollback() {
    error "Deployment failed. Rolling back..."
    
    # Get previous task definition
    PREVIOUS_TASK_DEF=$(aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $REGION --query 'services[0].deployments[1].taskDefinition' --output text)
    
    # Update service to previous task definition
    aws ecs update-service \
        --cluster $CLUSTER_NAME \
        --service $SERVICE_NAME \
        --task-definition $PREVIOUS_TASK_DEF \
        --region $REGION
    
    log "Rollback completed"
}

# Main deployment function
main() {
    log "🚀 Starting Digitallz Keywords Platform deployment to $ENVIRONMENT"
    
    # Set up error handling
    trap rollback ERR
    
    # Run deployment steps
    pre_deployment_checks
    build_and_push
    deploy_infrastructure
    deploy_application
    run_migrations
    health_check
    post_deployment
    
    log "🎉 Deployment completed successfully!"
    log "🌐 Application URL: https://digitallz.com"
    log "📊 Monitoring: https://grafana.digitallz.com"
    log "📝 Logs: https://cloudwatch.aws.amazon.com"
}

# Run main function
main "$@"
