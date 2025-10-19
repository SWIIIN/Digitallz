# ===========================================
# DIGITALLZ KEYWORDS PLATFORM - DEPLOYMENT (PowerShell)
# ===========================================

param(
    [string]$Environment = "production",
    [switch]$SkipTests = $false,
    [switch]$Force = $false
)

# Configuration
$APP_NAME = "digitallz-keywords"
$REGION = "us-east-1"
$CLUSTER_NAME = "digitallz-cluster"
$SERVICE_NAME = "digitallz-service"
$TASK_DEFINITION = "digitallz-task"

# Logging
$LOG_FILE = "C:\logs\digitallz\deploy.log"
$LOG_DIR = Split-Path $LOG_FILE -Parent
if (!(Test-Path $LOG_DIR)) {
    New-Item -ItemType Directory -Path $LOG_DIR -Force
}

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-Host $logMessage
    Add-Content -Path $LOG_FILE -Value $logMessage
}

function Write-Error-Log {
    param([string]$Message)
    Write-Log $Message "ERROR"
    Write-Error $Message
}

function Write-Success-Log {
    param([string]$Message)
    Write-Log $Message "SUCCESS"
    Write-Host $Message -ForegroundColor Green
}

function Write-Warning-Log {
    param([string]$Message)
    Write-Log $Message "WARNING"
    Write-Host $Message -ForegroundColor Yellow
}

# Pre-deployment checks
function Test-PreDeployment {
    Write-Log "🔍 Running pre-deployment checks..."
    
    # Check if AWS CLI is installed
    try {
        $null = Get-Command aws -ErrorAction Stop
    }
    catch {
        Write-Error-Log "AWS CLI is not installed"
        exit 1
    }
    
    # Check if Docker is installed
    try {
        $null = Get-Command docker -ErrorAction Stop
    }
    catch {
        Write-Error-Log "Docker is not installed"
        exit 1
    }
    
    # Check if Node.js is installed
    try {
        $null = Get-Command node -ErrorAction Stop
    }
    catch {
        Write-Error-Log "Node.js is not installed"
        exit 1
    }
    
    # Check AWS credentials
    try {
        $null = aws sts get-caller-identity 2>$null
    }
    catch {
        Write-Error-Log "AWS credentials not configured"
        exit 1
    }
    
    # Check if ECR repository exists
    try {
        $null = aws ecr describe-repositories --repository-names $APP_NAME --region $REGION 2>$null
    }
    catch {
        Write-Log "Creating ECR repository..."
        aws ecr create-repository --repository-name $APP_NAME --region $REGION
    }
    
    Write-Success-Log "✅ Pre-deployment checks passed"
}

# Build and push Docker images
function Build-AndPush {
    Write-Log "🏗️ Building and pushing Docker images..."
    
    # Get ECR login token
    $ECR_LOGIN = aws ecr get-login-password --region $REGION
    $ECR_LOGIN | docker login --username AWS --password-stdin (aws sts get-caller-identity --query Account --output text).dkr.ecr.$REGION.amazonaws.com
    
    # Build frontend image
    Write-Log "Building frontend image..."
    Set-Location frontend
    docker build -t "$APP_NAME-frontend:latest" .
    docker tag "$APP_NAME-frontend:latest" "$((aws sts get-caller-identity --query Account --output text)).dkr.ecr.$REGION.amazonaws.com/$APP_NAME-frontend:latest"
    docker push "$((aws sts get-caller-identity --query Account --output text)).dkr.ecr.$REGION.amazonaws.com/$APP_NAME-frontend:latest"
    Set-Location ..
    
    # Build backend image
    Write-Log "Building backend image..."
    Set-Location backend
    docker build -t "$APP_NAME-backend:latest" .
    docker tag "$APP_NAME-backend:latest" "$((aws sts get-caller-identity --query Account --output text)).dkr.ecr.$REGION.amazonaws.com/$APP_NAME-backend:latest"
    docker push "$((aws sts get-caller-identity --query Account --output text)).dkr.ecr.$REGION.amazonaws.com/$APP_NAME-backend:latest"
    Set-Location ..
    
    Write-Success-Log "✅ Docker images built and pushed"
}

# Deploy infrastructure
function Deploy-Infrastructure {
    Write-Log "🏗️ Deploying infrastructure..."
    
    # Deploy CloudFormation stack
    aws cloudformation deploy `
        --template-file deployment/aws/cloudformation.yml `
        --stack-name digitallz-infrastructure `
        --parameter-overrides Environment=$Environment `
        --capabilities CAPABILITY_IAM `
        --region $REGION
    
    Write-Success-Log "✅ Infrastructure deployed"
}

# Deploy application
function Deploy-Application {
    Write-Log "🚀 Deploying application..."
    
    # Update ECS service
    aws ecs update-service `
        --cluster $CLUSTER_NAME `
        --service $SERVICE_NAME `
        --force-new-deployment `
        --region $REGION
    
    # Wait for deployment to complete
    Write-Log "Waiting for deployment to complete..."
    aws ecs wait services-stable `
        --cluster $CLUSTER_NAME `
        --services $SERVICE_NAME `
        --region $REGION
    
    Write-Success-Log "✅ Application deployed"
}

# Run database migrations
function Invoke-Migrations {
    Write-Log "🗄️ Running database migrations..."
    
    # Get task ARN
    $TASK_ARN = aws ecs list-tasks --cluster $CLUSTER_NAME --service-name $SERVICE_NAME --region $REGION --query 'taskArns[0]' --output text
    
    # Run migrations
    aws ecs execute-command `
        --cluster $CLUSTER_NAME `
        --task $TASK_ARN `
        --container backend `
        --command "npm run db:migrate" `
        --interactive `
        --region $REGION
    
    Write-Success-Log "✅ Database migrations completed"
}

# Health check
function Test-Health {
    Write-Log "🏥 Running health checks..."
    
    # Get load balancer DNS
    $LB_DNS = aws elbv2 describe-load-balancers --names digitallz-alb --region $REGION --query 'LoadBalancers[0].DNSName' --output text
    
    # Wait for service to be ready
    for ($i = 1; $i -le 30; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://$LB_DNS/health" -Method GET -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                Write-Success-Log "✅ Health check passed"
                return
            }
        }
        catch {
            Start-Sleep -Seconds 10
        }
    }
    
    Write-Error-Log "Health check failed"
    exit 1
}

# Post-deployment tasks
function Invoke-PostDeployment {
    Write-Log "🔧 Running post-deployment tasks..."
    
    # Update Route 53 records
    aws route53 change-resource-record-sets `
        --hosted-zone-id Z1234567890 `
        --change-batch file://production/route53-changes.json
    
    # Invalidate CloudFront cache
    aws cloudfront create-invalidation `
        --distribution-id E1234567890 `
        --paths "/*"
    
    # Send deployment notification
    $body = @{
        text = "🚀 Digitallz Keywords Platform deployed successfully to production!"
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK" `
        -Method POST `
        -Body $body `
        -ContentType "application/json"
    
    Write-Success-Log "✅ Post-deployment tasks completed"
}

# Rollback function
function Invoke-Rollback {
    Write-Error-Log "Deployment failed. Rolling back..."
    
    # Get previous task definition
    $PREVIOUS_TASK_DEF = aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $REGION --query 'services[0].deployments[1].taskDefinition' --output text
    
    # Update service to previous task definition
    aws ecs update-service `
        --cluster $CLUSTER_NAME `
        --service $SERVICE_NAME `
        --task-definition $PREVIOUS_TASK_DEF `
        --region $REGION
    
    Write-Log "Rollback completed"
}

# Main deployment function
function Start-Deployment {
    Write-Log "🚀 Starting Digitallz Keywords Platform deployment to $Environment"
    
    try {
        # Run deployment steps
        Test-PreDeployment
        Build-AndPush
        Deploy-Infrastructure
        Deploy-Application
        Invoke-Migrations
        Test-Health
        Invoke-PostDeployment
        
        Write-Success-Log "🎉 Deployment completed successfully!"
        Write-Success-Log "🌐 Application URL: https://digitallz.com"
        Write-Success-Log "📊 Monitoring: https://grafana.digitallz.com"
        Write-Success-Log "📝 Logs: https://cloudwatch.aws.amazon.com"
    }
    catch {
        Invoke-Rollback
        Write-Error-Log "Deployment failed: $($_.Exception.Message)"
        exit 1
    }
}

# Run main function
Start-Deployment
