# Digitallz Platform Deployment Script (PowerShell)
# Usage: .\deploy.ps1 [environment] [version]

param(
    [string]$Environment = "staging",
    [string]$Version = "latest",
    [string]$Region = "us-east-1",
    [string]$AwsAccountId = ""
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

# Configuration
$ProjectName = "digitallz"
$FrontendImage = "${AwsAccountId}.dkr.ecr.${Region}.amazonaws.com/${ProjectName}-frontend:${Version}"
$BackendImage = "${AwsAccountId}.dkr.ecr.${Region}.amazonaws.com/${ProjectName}-backend:${Version}"
$StackName = "${ProjectName}-${Environment}"

# Functions
function Write-Log {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ✅ $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ⚠️ $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ❌ $Message" -ForegroundColor $Red
    exit 1
}

function Test-Prerequisites {
    Write-Log "Checking prerequisites..."
    
    # Check if required tools are installed
    if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
        Write-Error "AWS CLI is not installed"
    }
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Error "Docker is not installed"
    }
    if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
        Write-Error "kubectl is not installed"
    }
    if (-not (Get-Command helm -ErrorAction SilentlyContinue)) {
        Write-Error "Helm is not installed"
    }
    
    # Check AWS credentials
    try {
        aws sts get-caller-identity | Out-Null
    }
    catch {
        Write-Error "AWS credentials not configured"
    }
    
    # Get AWS Account ID if not provided
    if (-not $AwsAccountId) {
        $AwsAccountId = (aws sts get-caller-identity --query Account --output text)
    }
    
    # Check if ECR repositories exist
    try {
        aws ecr describe-repositories --repository-names "${ProjectName}-frontend" --region $Region | Out-Null
    }
    catch {
        Write-Log "Creating ECR repository for frontend..."
        aws ecr create-repository --repository-name "${ProjectName}-frontend" --region $Region
    }
    
    try {
        aws ecr describe-repositories --repository-names "${ProjectName}-backend" --region $Region | Out-Null
    }
    catch {
        Write-Log "Creating ECR repository for backend..."
        aws ecr create-repository --repository-name "${ProjectName}-backend" --region $Region
    }
    
    Write-Success "Prerequisites check completed"
}

function Build-Images {
    Write-Log "Building Docker images..."
    
    # Build frontend image
    Write-Log "Building frontend image..."
    Set-Location frontend
    docker build -f Dockerfile.prod -t $FrontendImage .
    Set-Location ..
    
    # Build backend image
    Write-Log "Building backend image..."
    Set-Location backend
    docker build -f Dockerfile.prod -t $BackendImage .
    Set-Location ..
    
    Write-Success "Docker images built successfully"
}

function Push-Images {
    Write-Log "Pushing images to ECR..."
    
    # Login to ECR
    aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin "${AwsAccountId}.dkr.ecr.${Region}.amazonaws.com"
    
    # Push frontend image
    Write-Log "Pushing frontend image..."
    docker push $FrontendImage
    
    # Push backend image
    Write-Log "Pushing backend image..."
    docker push $BackendImage
    
    Write-Success "Images pushed to ECR successfully"
}

function Deploy-Infrastructure {
    Write-Log "Deploying infrastructure..."
    
    # Deploy CloudFormation stack
    aws cloudformation deploy `
        --template-file deployment/aws/cloudformation.yml `
        --stack-name $StackName `
        --parameter-overrides `
            Environment=$Environment `
            DomainName="${ProjectName}.com" `
            DatabasePassword=$env:DATABASE_PASSWORD `
            RedisPassword=$env:REDIS_PASSWORD `
        --capabilities CAPABILITY_IAM `
        --region $Region
    
    Write-Success "Infrastructure deployed successfully"
}

function Deploy-Application {
    Write-Log "Deploying application..."
    
    # Update ECS service with new images
    aws ecs update-service `
        --cluster "${StackName}-cluster" `
        --service "${StackName}-service" `
        --force-new-deployment `
        --region $Region
    
    # Wait for deployment to complete
    Write-Log "Waiting for deployment to complete..."
    aws ecs wait services-stable `
        --cluster "${StackName}-cluster" `
        --services "${StackName}-service" `
        --region $Region
    
    Write-Success "Application deployed successfully"
}

function Test-Deployment {
    Write-Log "Running post-deployment tests..."
    
    # Get load balancer DNS
    $LbDns = (aws cloudformation describe-stacks `
        --stack-name $StackName `
        --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' `
        --output text `
        --region $Region)
    
    # Health check
    Write-Log "Performing health check..."
    for ($i = 1; $i -le 30; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "https://${LbDns}/health" -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Success "Health check passed"
                break
            }
        }
        catch {
            if ($i -eq 30) {
                Write-Error "Health check failed after 30 attempts"
            }
            Start-Sleep -Seconds 10
        }
    }
    
    # Run smoke tests
    Write-Log "Running smoke tests..."
    npm run test:e2e -- --baseURL="https://${LbDns}"
    
    Write-Success "All tests passed"
}

function Remove-OldImages {
    Write-Log "Cleaning up old images..."
    
    # Delete old images (keep last 5 versions)
    $oldImages = aws ecr list-images --repository-name "${ProjectName}-frontend" --region $Region --query 'imageIds[5:].[imageDigest]' --output text
    if ($oldImages) {
        $oldImages | ForEach-Object {
            aws ecr batch-delete-image --repository-name "${ProjectName}-frontend" --image-ids imageDigest=$_ --region $Region
        }
    }
    
    $oldImages = aws ecr list-images --repository-name "${ProjectName}-backend" --region $Region --query 'imageIds[5:].[imageDigest]' --output text
    if ($oldImages) {
        $oldImages | ForEach-Object {
            aws ecr batch-delete-image --repository-name "${ProjectName}-backend" --image-ids imageDigest=$_ --region $Region
        }
    }
    
    Write-Success "Cleanup completed"
}

function Start-Rollback {
    Write-Log "Rolling back deployment..."
    
    # Get previous task definition
    $PreviousTaskDef = (aws ecs describe-services `
        --cluster "${StackName}-cluster" `
        --services "${StackName}-service" `
        --query 'services[0].deployments[?status==`PRIMARY`].taskDefinition' `
        --output text `
        --region $Region)
    
    # Update service to previous task definition
    aws ecs update-service `
        --cluster "${StackName}-cluster" `
        --service "${StackName}-service" `
        --task-definition $PreviousTaskDef `
        --region $Region
    
    Write-Success "Rollback completed"
}

# Main deployment function
function Start-Deployment {
    Write-Log "Starting deployment for $Environment environment with version $Version"
    
    # Check if environment variables are set
    if (-not $env:DATABASE_PASSWORD -or -not $env:REDIS_PASSWORD) {
        Write-Error "DATABASE_PASSWORD and REDIS_PASSWORD environment variables must be set"
    }
    
    # Run deployment steps
    Test-Prerequisites
    Build-Images
    Push-Images
    
    if ($Environment -eq "production") {
        Deploy-Infrastructure
    }
    
    Deploy-Application
    Test-Deployment
    Remove-OldImages
    
    Write-Success "Deployment completed successfully!"
    
    # Get deployment information
    $LbDns = (aws cloudformation describe-stacks `
        --stack-name $StackName `
        --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' `
        --output text `
        --region $Region)
    
    Write-Log "Application URL: https://${LbDns}"
    Write-Log "Grafana Dashboard: https://${LbDns}:3001"
    Write-Log "Prometheus: https://${LbDns}:9090"
}

# Handle script arguments
switch ($args[0]) {
    "rollback" {
        Start-Rollback
    }
    "test" {
        Test-Deployment
    }
    "cleanup" {
        Remove-OldImages
    }
    default {
        Start-Deployment
    }
}
