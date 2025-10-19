# 🚀 Guide de Déploiement en Production

Ce guide vous accompagne dans le déploiement de la plateforme Digitallz en production.

## 📋 Prérequis

### Outils requis
- **AWS CLI** v2.0+
- **Docker** v20.0+
- **kubectl** v1.20+
- **Helm** v3.0+
- **Node.js** v18.0+
- **npm** v8.0+

### Comptes et services
- **AWS Account** avec accès ECS, RDS, ElastiCache, CloudFormation
- **ECR** (Elastic Container Registry)
- **Route 53** pour le DNS
- **Certificate Manager** pour SSL
- **Sentry** pour le monitoring d'erreurs
- **SendGrid** pour l'email

## 🔧 Configuration

### 1. Variables d'environnement

Copiez le fichier d'exemple et configurez vos variables :

```bash
cp env.production.example .env.production
```

Éditez `.env.production` avec vos valeurs réelles :

```bash
# Base de données
DATABASE_PASSWORD=votre_mot_de_passe_securise
REDIS_PASSWORD=votre_mot_de_passe_redis

# APIs externes
AMAZON_API_KEY=votre_cle_amazon
ETSY_API_KEY=votre_cle_etsy
# ... autres APIs

# Paiements
STRIPE_SECRET_KEY=sk_live_votre_cle_stripe
STRIPE_WEBHOOK_SECRET=whsec_votre_secret_webhook

# Monitoring
SENTRY_DSN=votre_dsn_sentry
```

### 2. Configuration AWS

Configurez vos credentials AWS :

```bash
aws configure
```

Vérifiez votre configuration :

```bash
aws sts get-caller-identity
```

### 3. Configuration Docker

Assurez-vous que Docker est en cours d'exécution :

```bash
docker --version
docker ps
```

## 🚀 Déploiement

### Option 1 : Déploiement automatisé (Recommandé)

#### Linux/Mac
```bash
# Déploiement en staging
./scripts/deploy.sh staging v1.0.0

# Déploiement en production
./scripts/deploy.sh production v1.0.0
```

#### Windows
```powershell
# Déploiement en staging
.\scripts\deploy.ps1 staging v1.0.0

# Déploiement en production
.\scripts\deploy.ps1 production v1.0.0
```

### Option 2 : Déploiement manuel

#### 1. Construction des images

```bash
# Frontend
cd frontend
docker build -f Dockerfile.prod -t digitallz-frontend:latest .

# Backend
cd ../backend
docker build -f Dockerfile.prod -t digitallz-backend:latest .
```

#### 2. Push vers ECR

```bash
# Login ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# Tag et push
docker tag digitallz-frontend:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/digitallz-frontend:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/digitallz-frontend:latest

docker tag digitallz-backend:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/digitallz-backend:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/digitallz-backend:latest
```

#### 3. Déploiement de l'infrastructure

```bash
aws cloudformation deploy \
  --template-file deployment/aws/cloudformation.yml \
  --stack-name digitallz-production \
  --parameter-overrides \
    Environment=production \
    DomainName=digitallz.com \
    DatabasePassword=votre_mot_de_passe \
    RedisPassword=votre_mot_de_passe_redis \
  --capabilities CAPABILITY_IAM
```

#### 4. Déploiement de l'application

```bash
aws ecs update-service \
  --cluster digitallz-production-cluster \
  --service digitallz-production-service \
  --force-new-deployment
```

## 🔍 Vérification du déploiement

### 1. Health Check

```bash
# Récupérer l'URL du load balancer
LB_DNS=$(aws cloudformation describe-stacks \
  --stack-name digitallz-production \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text)

# Vérifier la santé de l'application
curl https://$LB_DNS/health
```

### 2. Tests de fonctionnalité

```bash
# Tests E2E
npm run test:e2e -- --baseURL=https://$LB_DNS

# Tests de performance
npm run test:performance
```

### 3. Monitoring

- **Grafana** : https://votre-domaine:3001
- **Prometheus** : https://votre-domaine:9090
- **Logs** : CloudWatch Logs

## 🔄 Gestion des déploiements

### Rollback

```bash
# Script automatisé
./scripts/deploy.sh rollback

# Manuel
aws ecs update-service \
  --cluster digitallz-production-cluster \
  --service digitallz-production-service \
  --task-definition PREVIOUS_TASK_DEFINITION_ARN
```

### Mise à jour

```bash
# Nouvelle version
./scripts/deploy.sh production v1.1.0

# Mise à jour de l'infrastructure
aws cloudformation deploy \
  --template-file deployment/aws/cloudformation.yml \
  --stack-name digitallz-production \
  --capabilities CAPABILITY_IAM
```

### Nettoyage

```bash
# Nettoyer les anciennes images
./scripts/deploy.sh cleanup

# Supprimer la stack complète
aws cloudformation delete-stack --stack-name digitallz-production
```

## 📊 Monitoring et Alertes

### Métriques surveillées

- **Performance** : Temps de réponse, throughput
- **Erreurs** : Taux d'erreur 4xx/5xx
- **Ressources** : CPU, mémoire, disque
- **Base de données** : Connexions, requêtes lentes
- **Cache** : Hit rate, utilisation mémoire

### Alertes configurées

- **Disponibilité** : < 99.9%
- **Temps de réponse** : > 2s
- **Taux d'erreur** : > 5%
- **Utilisation CPU** : > 80%
- **Utilisation mémoire** : > 90%

### Logs

- **Application** : CloudWatch Logs
- **Nginx** : Access/Error logs
- **Base de données** : Query logs
- **Système** : System logs

## 🔒 Sécurité

### Certificats SSL

```bash
# Générer un certificat Let's Encrypt
certbot certonly --webroot -w /var/www/html -d digitallz.com -d www.digitallz.com

# Ou utiliser AWS Certificate Manager
aws acm request-certificate \
  --domain-name digitallz.com \
  --subject-alternative-names www.digitallz.com \
  --validation-method DNS
```

### Firewall

- **Ports ouverts** : 80, 443, 22
- **Ports fermés** : 3000, 3001, 5432, 6379
- **IP restrictions** : Admin access only

### Backup

```bash
# Backup base de données
pg_dump -h your-db-host -U postgres digitallz > backup_$(date +%Y%m%d).sql

# Backup Redis
redis-cli --rdb backup_redis_$(date +%Y%m%d).rdb
```

## 🚨 Dépannage

### Problèmes courants

#### 1. Service non disponible

```bash
# Vérifier les logs ECS
aws logs get-log-events \
  --log-group-name /aws/ecs/digitallz-production \
  --log-stream-name backend/backend/container-id

# Vérifier la santé du service
aws ecs describe-services \
  --cluster digitallz-production-cluster \
  --services digitallz-production-service
```

#### 2. Erreurs de base de données

```bash
# Vérifier la connectivité
aws rds describe-db-instances --db-instance-identifier digitallz-production-database

# Vérifier les logs
aws logs get-log-events \
  --log-group-name /aws/rds/instance/digitallz-production-database/postgresql
```

#### 3. Problèmes de cache

```bash
# Vérifier Redis
aws elasticache describe-replication-groups \
  --replication-group-id digitallz-production-redis

# Tester la connectivité
redis-cli -h your-redis-host -p 6379 -a your-password ping
```

### Commandes utiles

```bash
# Voir les tâches en cours
aws ecs list-tasks --cluster digitallz-production-cluster

# Redémarrer un service
aws ecs update-service \
  --cluster digitallz-production-cluster \
  --service digitallz-production-service \
  --force-new-deployment

# Voir les métriques CloudWatch
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=digitallz-production-service \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 300 \
  --statistics Average
```

## 📞 Support

En cas de problème :

1. **Vérifiez les logs** : CloudWatch, ECS, RDS
2. **Consultez les métriques** : Grafana, Prometheus
3. **Testez la connectivité** : Health checks, API endpoints
4. **Contactez l'équipe** : support@digitallz.com

## 📚 Ressources

- [Documentation AWS ECS](https://docs.aws.amazon.com/ecs/)
- [Documentation Docker](https://docs.docker.com/)
- [Documentation Nginx](https://nginx.org/en/docs/)
- [Documentation Prometheus](https://prometheus.io/docs/)
- [Documentation Grafana](https://grafana.com/docs/)
