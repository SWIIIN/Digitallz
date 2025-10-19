# 🚀 Guide de Déploiement - Digitallz Keywords Platform

## 📋 Prérequis

### Environnement de développement
- **Node.js** 20 LTS ou supérieur
- **Python** 3.11 ou supérieur
- **PostgreSQL** 15 ou supérieur
- **Redis** 7 ou supérieur
- **Docker** et **Docker Compose**
- **Git** pour le contrôle de version

### Outils recommandés
- **VS Code** avec extensions TypeScript, Python
- **Postman** pour tester les APIs
- **pgAdmin** pour la gestion de base de données
- **RedisInsight** pour la gestion de Redis

## 🏗️ Installation Locale

### 1. Cloner le repository
```bash
git clone https://github.com/your-username/digitallz-keywords-platform.git
cd digitallz-keywords-platform
```

### 2. Configuration de l'environnement
```bash
# Copier les fichiers d'environnement
cp .env.example .env
cp .env.example .env.local
cp .env.example .env.production
```

### 3. Configuration des variables d'environnement
```bash
# .env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/digitallz
REDIS_URL=redis://localhost:6379

# External APIs
AMAZON_API_KEY=your_amazon_api_key
ETSY_API_KEY=your_etsy_api_key
EBAY_API_KEY=your_ebay_api_key

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Monitoring
SENTRY_DSN=your_sentry_dsn
```

### 4. Installation des dépendances
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install

# Data Processor
cd ../data-processor
pip install -r requirements.txt
```

### 5. Configuration de la base de données
```bash
# Démarrer PostgreSQL et Redis
docker-compose up -d db redis

# Migrations
cd backend
npm run db:migrate
npm run db:seed
```

### 6. Démarrage des services
```bash
# Terminal 1 - Frontend
cd frontend
npm run dev

# Terminal 2 - Backend
cd backend
npm run dev

# Terminal 3 - Data Processor
cd data-processor
python -m uvicorn src.main:app --reload

# Terminal 4 - Scheduler
cd data-processor
python src/scheduler.py
```

## 🐳 Déploiement avec Docker

### 1. Configuration Docker
```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3001
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/digitallz
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  data-processor:
    build: ./data-processor
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/digitallz
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=digitallz
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
```

### 2. Configuration Nginx
```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:3000;
    }

    upstream backend {
        server backend:3001;
    }

    upstream data-processor {
        server data-processor:8000;
    }

    server {
        listen 80;
        server_name localhost;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Backend API
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Data Processor API
        location /data/ {
            proxy_pass http://data-processor/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

### 3. Déploiement
```bash
# Construire et démarrer tous les services
docker-compose up -d

# Vérifier les logs
docker-compose logs -f

# Arrêter les services
docker-compose down
```

## ☁️ Déploiement Cloud (AWS)

### 1. Infrastructure avec Terraform
```hcl
# terraform/main.tf
provider "aws" {
  region = "eu-west-1"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "digitallz-vpc"
  }
}

# Subnets
resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name = "digitallz-public-${count.index + 1}"
  }
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  identifier = "digitallz-postgres"
  engine     = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.micro"
  allocated_storage = 20
  storage_type = "gp2"

  db_name  = "digitallz"
  username = "digitallz"
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  skip_final_snapshot = true

  tags = {
    Name = "digitallz-postgres"
  }
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "main" {
  name       = "digitallz-redis-subnet"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "digitallz-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "digitallz-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "app" {
  family                   = "digitallz-app"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn

  container_definitions = jsonencode([
    {
      name  = "frontend"
      image = "${aws_ecr_repository.frontend.repository_url}:latest"
      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
        }
      ]
      environment = [
        {
          name  = "NEXT_PUBLIC_API_URL"
          value = "https://api.digitallz.com"
        }
      ]
    },
    {
      name  = "backend"
      image = "${aws_ecr_repository.backend.repository_url}:latest"
      portMappings = [
        {
          containerPort = 3001
          hostPort      = 3001
        }
      ]
      environment = [
        {
          name  = "DATABASE_URL"
          value = "postgresql://${aws_db_instance.postgres.username}:${var.db_password}@${aws_db_instance.postgres.endpoint}/${aws_db_instance.postgres.db_name}"
        },
        {
          name  = "REDIS_URL"
          value = "redis://${aws_elasticache_cluster.redis.cache_nodes[0].address}:6379"
        }
      ]
    }
  ])
}

# ECS Service
resource "aws_ecs_service" "main" {
  name            = "digitallz-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "frontend"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.app]
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "digitallz-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false
}

# S3 Bucket pour les assets
resource "aws_s3_bucket" "assets" {
  bucket = "digitallz-assets-${random_string.bucket_suffix.result}"
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}
```

### 2. Déploiement avec GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: eu-west-1
    
    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1
    
    - name: Build and push frontend
      run: |
        cd frontend
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY-frontend:$IMAGE_TAG .
        docker push $ECR_REGISTRY/$ECR_REPOSITORY-frontend:$IMAGE_TAG
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        ECR_REPOSITORY: digitallz
        IMAGE_TAG: ${{ github.sha }}
    
    - name: Build and push backend
      run: |
        cd backend
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY-backend:$IMAGE_TAG .
        docker push $ECR_REGISTRY/$ECR_REPOSITORY-backend:$IMAGE_TAG
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        ECR_REPOSITORY: digitallz
        IMAGE_TAG: ${{ github.sha }}
    
    - name: Deploy to ECS
      run: |
        aws ecs update-service --cluster digitallz-cluster --service digitallz-service --force-new-deployment
```

## 📊 Monitoring et Observabilité

### 1. Configuration Prometheus
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'frontend'
    static_configs:
      - targets: ['frontend:3000']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'backend'
    static_configs:
      - targets: ['backend:3001']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'data-processor'
    static_configs:
      - targets: ['data-processor:8000']
    metrics_path: '/metrics'
    scrape_interval: 5s
```

### 2. Configuration Grafana
```json
{
  "dashboard": {
    "title": "Digitallz Platform",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{instance}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "5xx errors"
          }
        ]
      }
    ]
  }
}
```

### 3. Configuration Sentry
```javascript
// frontend/src/lib/sentry.js
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.BrowserTracing(),
  ],
})
```

## 🔒 Sécurité

### 1. Configuration SSL/TLS
```bash
# Génération des certificats avec Let's Encrypt
certbot certonly --webroot -w /var/www/html -d digitallz.com -d api.digitallz.com
```

### 2. Configuration de sécurité
```yaml
# security/security.yml
security:
  headers:
    - "X-Frame-Options: DENY"
    - "X-Content-Type-Options: nosniff"
    - "X-XSS-Protection: 1; mode=block"
    - "Strict-Transport-Security: max-age=31536000; includeSubDomains"
  
  rate_limiting:
    requests_per_minute: 60
    burst_size: 10
  
  authentication:
    jwt_secret: ${JWT_SECRET}
    refresh_token_expiry: 7d
    access_token_expiry: 15m
  
  database:
    encryption_at_rest: true
    ssl_mode: require
```

## 📈 Scaling et Performance

### 1. Configuration Auto-scaling
```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: digitallz-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: digitallz-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### 2. Configuration de cache
```yaml
# redis/redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

## 🚀 Checklist de Déploiement

### Pré-déploiement
- [ ] Tests unitaires passent
- [ ] Tests d'intégration passent
- [ ] Tests de performance passent
- [ ] Documentation mise à jour
- [ ] Variables d'environnement configurées
- [ ] Certificats SSL valides
- [ ] Sauvegarde de la base de données

### Déploiement
- [ ] Déploiement en staging réussi
- [ ] Tests de régression passent
- [ ] Déploiement en production
- [ ] Vérification des services
- [ ] Tests de smoke
- [ ] Monitoring activé

### Post-déploiement
- [ ] Vérification des logs
- [ ] Vérification des métriques
- [ ] Tests de charge
- [ ] Documentation utilisateur mise à jour
- [ ] Formation de l'équipe

## 🔧 Maintenance

### Tâches quotidiennes
- Vérification des logs d'erreur
- Vérification des métriques de performance
- Vérification des sauvegardes

### Tâches hebdomadaires
- Mise à jour des dépendances
- Analyse des performances
- Nettoyage des logs anciens

### Tâches mensuelles
- Mise à jour de sécurité
- Analyse des coûts
- Optimisation des performances
- Planification de la capacité

Ce guide vous permet de déployer votre plateforme de manière professionnelle et scalable ! 🚀
