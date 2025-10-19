# ===========================================
# DIGITALLZ KEYWORDS PLATFORM - PRODUCTION LAUNCH
# ===========================================

param(
    [string]$Environment = "production",
    [switch]$SkipTests = $false,
    [switch]$Force = $false
)

# Configuration
$APP_NAME = "digitallz-keywords"
$REGION = "us-east-1"
$DOMAIN = "digitallz.com"

# Logging
$LOG_FILE = "C:\logs\digitallz\launch.log"
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

function Write-Success-Log {
    param([string]$Message)
    Write-Log $Message "SUCCESS"
    Write-Host $Message -ForegroundColor Green
}

function Write-Error-Log {
    param([string]$Message)
    Write-Log $Message "ERROR"
    Write-Host $Message -ForegroundColor Red
}

# Pre-launch checks
function Test-PreLaunch {
    Write-Log "🔍 Running pre-launch checks..."
    
    # Check if all required files exist
    $requiredFiles = @(
        "frontend/package.json",
        "backend/package.json",
        "docker-compose.yml",
        "deployment/aws/cloudformation.yml"
    )
    
    foreach ($file in $requiredFiles) {
        if (!(Test-Path $file)) {
            Write-Error-Log "Required file missing: $file"
            exit 1
        }
    }
    
    # Check if environment variables are set
    $requiredEnvVars = @(
        "DATABASE_URL",
        "REDIS_URL",
        "JWT_SECRET",
        "STRIPE_SECRET_KEY"
    )
    
    foreach ($var in $requiredEnvVars) {
        if (![Environment]::GetEnvironmentVariable($var)) {
            Write-Error-Log "Required environment variable not set: $var"
            exit 1
        }
    }
    
    Write-Success-Log "✅ Pre-launch checks passed"
}

# Deploy application
function Start-Deployment {
    Write-Log "🚀 Starting deployment..."
    
    # Build and push Docker images
    Write-Log "Building Docker images..."
    Set-Location frontend
    docker build -t "$APP_NAME-frontend:latest" .
    Set-Location ..
    
    Set-Location backend
    docker build -t "$APP_NAME-backend:latest" .
    Set-Location ..
    
    # Deploy with Docker Compose
    Write-Log "Deploying with Docker Compose..."
    docker-compose -f docker-compose.prod.yml up -d
    
    Write-Success-Log "✅ Deployment completed"
}

# Health check
function Test-Health {
    Write-Log "🏥 Running health checks..."
    
    $maxAttempts = 30
    $attempt = 0
    
    do {
        $attempt++
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                Write-Success-Log "✅ Health check passed"
                return $true
            }
        }
        catch {
            Write-Log "Health check attempt $attempt failed, retrying in 10 seconds..."
            Start-Sleep -Seconds 10
        }
    } while ($attempt -lt $maxAttempts)
    
    Write-Error-Log "Health check failed after $maxAttempts attempts"
    return $false
}

# Launch marketing
function Start-Marketing {
    Write-Log "📢 Starting marketing launch..."
    
    # Create social media posts
    Write-Log "Creating social media posts..."
    $socialDir = "production\social-posts"
    if (!(Test-Path $socialDir)) {
        New-Item -ItemType Directory -Path $socialDir -Force
    }
    
    # Twitter post
    @"
🚀 Exciting news! Digitallz Keywords Platform is now LIVE! 

Discover the most searched keywords for digital products across Amazon, Etsy, eBay, Shopify & Gumroad.

🔍 Find profitable niches
📊 Analyze competition
💰 Maximize your revenue

Try it FREE: https://$DOMAIN

#DigitalMarketing #Keywords #Ecommerce #Amazon #Etsy #Shopify
"@ | Out-File -FilePath "$socialDir\twitter.txt" -Encoding UTF8
    
    # LinkedIn post
    @"
🎉 We're thrilled to announce the launch of Digitallz Keywords Platform!

As digital entrepreneurs, we know how challenging it is to find the right keywords for your products. That's why we built a comprehensive platform that aggregates keyword data from all major e-commerce platforms.

Key Features:
✅ Multi-platform keyword research (Amazon, Etsy, eBay, Shopify, Gumroad)
✅ Real-time competition analysis
✅ Revenue potential estimation
✅ Trending keyword discovery
✅ Advanced analytics and insights

Perfect for:
- Digital product creators
- E-commerce sellers
- Marketing agencies
- SEO professionals
- Affiliate marketers

Start your free trial today: https://$DOMAIN

#DigitalMarketing #Ecommerce #Keywords #Entrepreneurship #SEO
"@ | Out-File -FilePath "$socialDir\linkedin.txt" -Encoding UTF8
    
    Write-Success-Log "✅ Marketing materials created"
}

# Send launch notifications
function Send-Notifications {
    Write-Log "📢 Sending launch notifications..."
    
    # Slack notification
    $slackMessage = @{
        text = "🚀 Digitallz Keywords Platform is now LIVE!"
        attachments = @(
            @{
                color = "good"
                fields = @(
                    @{
                        title = "Website"
                        value = "https://$DOMAIN"
                        short = $true
                    },
                    @{
                        title = "Status"
                        value = "All systems operational"
                        short = $true
                    }
                )
            }
        )
    } | ConvertTo-Json -Depth 3
    
    try {
        Invoke-RestMethod -Uri "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK" `
            -Method POST `
            -Body $slackMessage `
            -ContentType "application/json"
    }
    catch {
        Write-Log "Failed to send Slack notification: $($_.Exception.Message)"
    }
    
    Write-Success-Log "✅ Notifications sent"
}

# Main launch function
function Start-Launch {
    Write-Log "🚀 Starting Digitallz Keywords Platform production launch"
    
    try {
        # Pre-launch checks
        Test-PreLaunch
        
        # Deploy application
        Start-Deployment
        
        # Health check
        if (!(Test-Health)) {
            Write-Error-Log "Health check failed, aborting launch"
            exit 1
        }
        
        # Launch marketing
        Start-Marketing
        
        # Send notifications
        Send-Notifications
        
        Write-Success-Log "🎉 Production launch completed successfully!"
        Write-Success-Log "🌐 Application URL: https://$DOMAIN"
        Write-Success-Log "📊 Monitoring: https://grafana.$DOMAIN"
        Write-Success-Log "📝 Logs: Check Docker logs for application logs"
        
    }
    catch {
        Write-Error-Log "Launch failed: $($_.Exception.Message)"
        exit 1
    }
}

# Run main function
Start-Launch
