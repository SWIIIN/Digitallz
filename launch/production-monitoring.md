# 🔧 Monitoring et Alertes de Production

## 📊 Vue d'ensemble du monitoring

### 🎯 Objectifs du monitoring
- **Disponibilité** : 99.9% d'uptime garanti
- **Performance** : Temps de réponse < 200ms
- **Sécurité** : Détection des intrusions en temps réel
- **Business** : Suivi des métriques clés
- **Proactivité** : Détection des problèmes avant l'impact utilisateur

### 🏗️ Architecture de monitoring

```
┌─────────────────────────────────────────────────────────┐
│  📊 Monitoring Stack                                   │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │ Prometheus  │ │   Grafana   │ │  CloudWatch │      │
│  │ (Métriques) │ │ (Dashboards)│ │ (AWS Logs)  │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │   Sentry    │ │   PagerDuty │ │   Slack     │      │
│  │ (Erreurs)   │ │ (Alertes)   │ │ (Notifs)    │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
└─────────────────────────────────────────────────────────┘
```

---

## 📈 Métriques techniques

### 🖥️ Infrastructure

#### 🖥️ Serveurs et instances
```yaml
# Métriques système
- cpu_usage_percent: < 80%
- memory_usage_percent: < 85%
- disk_usage_percent: < 90%
- network_io_bytes: Monitoring des entrées/sorties
- load_average: < 2.0 (1 minute)

# Métriques AWS ECS
- ecs_cpu_utilization: < 80%
- ecs_memory_utilization: < 85%
- ecs_running_tasks: Nombre de tâches actives
- ecs_service_events: Événements de service
```

#### 🗄️ Base de données
```yaml
# Métriques PostgreSQL
- postgres_connections: < 80% du max
- postgres_queries_per_second: Monitoring des requêtes
- postgres_slow_queries: Requêtes > 1 seconde
- postgres_deadlocks: Nombre de deadlocks
- postgres_replication_lag: < 1 seconde

# Métriques Redis
- redis_memory_usage: < 80% du max
- redis_connected_clients: < 1000
- redis_commands_per_second: Monitoring des commandes
- redis_hit_ratio: > 95%
```

#### 🌐 Réseau et CDN
```yaml
# Métriques CloudFront
- cloudfront_requests: Nombre de requêtes
- cloudfront_cache_hit_ratio: > 90%
- cloudfront_origin_latency: < 100ms
- cloudfront_4xx_errors: < 1%
- cloudfront_5xx_errors: < 0.1%

# Métriques ALB
- alb_target_response_time: < 200ms
- alb_healthy_hosts: 100% des cibles
- alb_unhealthy_hosts: 0 cibles
- alb_5xx_errors: < 0.1%
```

### 🚀 Application

#### 🔍 API et endpoints
```yaml
# Métriques API
- api_requests_total: Nombre total de requêtes
- api_request_duration_seconds: Durée des requêtes
- api_requests_per_second: Requêtes par seconde
- api_4xx_errors: Erreurs client (4xx)
- api_5xx_errors: Erreurs serveur (5xx)

# Métriques par endpoint
- /api/keywords/search: Durée et erreurs
- /api/keywords/trends: Durée et erreurs
- /api/analytics/dashboard: Durée et erreurs
- /api/auth/login: Durée et erreurs
```

#### 🔐 Authentification et sécurité
```yaml
# Métriques d'auth
- auth_login_attempts: Tentatives de connexion
- auth_login_success_rate: Taux de succès
- auth_failed_logins: Échecs de connexion
- auth_jwt_tokens_issued: Tokens émis
- auth_jwt_tokens_expired: Tokens expirés

# Métriques de sécurité
- security_rate_limit_exceeded: Limites dépassées
- security_suspicious_activity: Activité suspecte
- security_blocked_ips: IPs bloquées
- security_failed_requests: Requêtes échouées
```

#### 💾 Cache et performance
```yaml
# Métriques Redis
- cache_hits: Requêtes en cache
- cache_misses: Requêtes non en cache
- cache_hit_ratio: Taux de hit
- cache_evictions: Évictions du cache
- cache_memory_usage: Utilisation mémoire

# Métriques de performance
- response_time_p50: 50e percentile
- response_time_p95: 95e percentile
- response_time_p99: 99e percentile
- throughput_requests_per_second: Débit
```

---

## 📊 Métriques business

### 👥 Utilisateurs
```yaml
# Métriques utilisateurs
- users_total: Nombre total d'utilisateurs
- users_active_daily: Utilisateurs actifs quotidiens
- users_active_monthly: Utilisateurs actifs mensuels
- users_new_daily: Nouveaux utilisateurs/jour
- users_churn_daily: Utilisateurs perdus/jour

# Métriques d'engagement
- sessions_per_user: Sessions par utilisateur
- session_duration_avg: Durée moyenne des sessions
- pages_per_session: Pages par session
- bounce_rate: Taux de rebond
- return_rate: Taux de retour
```

### 💰 Revenue et conversion
```yaml
# Métriques de revenue
- revenue_total: Revenus totaux
- revenue_monthly: Revenus mensuels
- revenue_per_user: Revenus par utilisateur
- mrr: Monthly Recurring Revenue
- arr: Annual Recurring Revenue

# Métriques de conversion
- conversion_signup_rate: Taux d'inscription
- conversion_trial_to_paid: Taux de conversion trial → payant
- conversion_free_to_paid: Taux de conversion gratuit → payant
- churn_rate: Taux d'attrition
- ltv: Lifetime Value
```

### 🔍 Recherches et usage
```yaml
# Métriques de recherche
- searches_total: Nombre total de recherches
- searches_per_user: Recherches par utilisateur
- searches_per_day: Recherches par jour
- searches_success_rate: Taux de succès des recherches
- searches_avg_duration: Durée moyenne des recherches

# Métriques d'usage
- api_calls_total: Appels API totaux
- api_calls_per_user: Appels API par utilisateur
- api_quota_usage: Utilisation des quotas
- api_rate_limit_hits: Limites de taux atteintes
```

---

## 🚨 Système d'alertes

### 🔴 Alertes critiques (P0)
```yaml
# Disponibilité
- site_down: Site inaccessible
- api_down: API inaccessible
- database_down: Base de données inaccessible
- redis_down: Redis inaccessible

# Performance
- response_time_high: Temps de réponse > 1s
- error_rate_high: Taux d'erreur > 5%
- cpu_usage_critical: CPU > 95%
- memory_usage_critical: Mémoire > 95%

# Sécurité
- security_breach: Intrusion détectée
- ddos_attack: Attaque DDoS
- suspicious_activity: Activité suspecte
- data_leak: Fuite de données
```

### 🟡 Alertes importantes (P1)
```yaml
# Performance
- response_time_elevated: Temps de réponse > 500ms
- error_rate_elevated: Taux d'erreur > 2%
- cpu_usage_high: CPU > 80%
- memory_usage_high: Mémoire > 80%

# Business
- conversion_rate_low: Taux de conversion < 5%
- churn_rate_high: Taux d'attrition > 10%
- revenue_drop: Baisse de revenus > 20%
- user_growth_stagnant: Croissance utilisateurs < 5%
```

### 🟢 Alertes informatives (P2)
```yaml
# Monitoring
- backup_failed: Sauvegarde échouée
- log_rotation_failed: Rotation des logs échouée
- certificate_expiring: Certificat SSL expire dans 30 jours
- disk_space_low: Espace disque < 20%

# Business
- new_user_milestone: Nouveau palier d'utilisateurs
- revenue_milestone: Nouveau palier de revenus
- feature_usage_spike: Pic d'utilisation d'une fonctionnalité
```

---

## 📱 Canaux de notification

### 🔔 Slack
```yaml
# Configuration Slack
channels:
  - name: "#alerts-critical"
    severity: P0
    mentions: "@here"
    
  - name: "#alerts-important"
    severity: P1
    mentions: "@channel"
    
  - name: "#alerts-info"
    severity: P2
    mentions: "none"

# Format des messages
message_format: |
  🚨 *{severity}* - {alert_name}
  📊 *Métrique*: {metric_name} = {current_value}
  🎯 *Seuil*: {threshold}
  ⏰ *Temps*: {timestamp}
  🔗 *Lien*: {dashboard_url}
```

### 📧 Email
```yaml
# Configuration Email
recipients:
  - email: "alerts@digitallz.com"
    severity: P0, P1
    
  - email: "dev-team@digitallz.com"
    severity: P0
    
  - email: "management@digitallz.com"
    severity: P0, P1

# Template email
subject: "[{severity}] {alert_name} - {timestamp}"
body: |
  Alert: {alert_name}
  Severity: {severity}
  Metric: {metric_name}
  Current Value: {current_value}
  Threshold: {threshold}
  Time: {timestamp}
  Dashboard: {dashboard_url}
```

### 📱 PagerDuty
```yaml
# Configuration PagerDuty
escalation_policy:
  - level_1: "on-call-engineer"
    timeout: "5 minutes"
    
  - level_2: "senior-engineer"
    timeout: "15 minutes"
    
  - level_3: "engineering-manager"
    timeout: "30 minutes"

# Intégration
pagerduty_integration:
  service_key: "YOUR_SERVICE_KEY"
  escalation_policy: "digitallz-production"
```

---

## 📊 Dashboards Grafana

### 🏠 Dashboard principal
```yaml
# Métriques système
- CPU Usage (4 panneaux)
- Memory Usage (4 panneaux)
- Disk Usage (4 panneaux)
- Network I/O (4 panneaux)

# Métriques application
- Request Rate (1 panneau)
- Response Time (1 panneau)
- Error Rate (1 panneau)
- Active Users (1 panneau)

# Métriques business
- Revenue (1 panneau)
- Conversions (1 panneau)
- Searches (1 panneau)
- Churn (1 panneau)
```

### 🔍 Dashboard API
```yaml
# Métriques API
- API Requests per Second
- API Response Time (P50, P95, P99)
- API Error Rate (4xx, 5xx)
- API Endpoints Performance

# Métriques par endpoint
- /api/keywords/search
- /api/keywords/trends
- /api/analytics/dashboard
- /api/auth/login
```

### 💰 Dashboard business
```yaml
# Métriques revenue
- Monthly Recurring Revenue (MRR)
- Annual Recurring Revenue (ARR)
- Revenue per User (ARPU)
- Customer Lifetime Value (LTV)

# Métriques conversion
- Signup Rate
- Trial to Paid Conversion
- Free to Paid Conversion
- Churn Rate
```

---

## 🔧 Configuration Prometheus

### 📊 Règles d'alertes
```yaml
# Règles d'alertes Prometheus
groups:
  - name: digitallz.rules
    rules:
      # Disponibilité
      - alert: SiteDown
        expr: up{job="digitallz-frontend"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Site Digitallz is down"
          description: "Frontend service is not responding"
          
      - alert: APIDown
        expr: up{job="digitallz-backend"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "API Digitallz is down"
          description: "Backend service is not responding"
          
      # Performance
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }}s"
          
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }}%"
          
      # Infrastructure
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage detected"
          description: "CPU usage is {{ $value }}%"
          
      - alert: HighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
          description: "Memory usage is {{ $value }}%"
```

### 📈 Métriques personnalisées
```yaml
# Métriques business personnalisées
- name: digitallz_users_total
  help: "Total number of users"
  type: counter
  
- name: digitallz_searches_total
  help: "Total number of searches"
  type: counter
  
- name: digitallz_revenue_total
  help: "Total revenue in euros"
  type: counter
  
- name: digitallz_conversion_rate
  help: "Conversion rate percentage"
  type: gauge
```

---

## 🛠️ Outils de monitoring

### 📊 Stack technique
```yaml
# Métriques et alertes
prometheus:
  version: "2.40.0"
  retention: "30d"
  scrape_interval: "15s"
  
grafana:
  version: "9.3.0"
  dashboards: "digitallz-dashboards"
  datasources: "prometheus,cloudwatch"
  
# Logs et erreurs
sentry:
  version: "latest"
  dsn: "YOUR_SENTRY_DSN"
  environment: "production"
  
# Alertes et notifications
pagerduty:
  service_key: "YOUR_SERVICE_KEY"
  escalation_policy: "digitallz-production"
  
# Logs centralisés
cloudwatch:
  log_groups:
    - "/aws/ecs/digitallz-frontend"
    - "/aws/ecs/digitallz-backend"
    - "/aws/rds/digitallz-postgres"
    - "/aws/elasticache/digitallz-redis"
```

### 🔧 Configuration des services
```yaml
# Configuration Prometheus
prometheus_config:
  global:
    scrape_interval: 15s
    evaluation_interval: 15s
    
  rule_files:
    - "digitallz.rules"
    
  alerting:
    alertmanagers:
      - static_configs:
          - targets:
              - "alertmanager:9093"
              
  scrape_configs:
    - job_name: 'digitallz-frontend'
      static_configs:
        - targets: ['frontend:3000']
      metrics_path: '/metrics'
      scrape_interval: 15s
      
    - job_name: 'digitallz-backend'
      static_configs:
        - targets: ['backend:3001']
      metrics_path: '/metrics'
      scrape_interval: 15s
      
    - job_name: 'digitallz-postgres'
      static_configs:
        - targets: ['postgres:5432']
      scrape_interval: 30s
      
    - job_name: 'digitallz-redis'
      static_configs:
        - targets: ['redis:6379']
      scrape_interval: 30s
```

---

## 📋 Procédures de maintenance

### 🔄 Maintenance préventive
```yaml
# Tâches quotidiennes
daily:
  - name: "Check system health"
    time: "09:00"
    duration: "15 minutes"
    
  - name: "Review alerts and incidents"
    time: "09:15"
    duration: "30 minutes"
    
  - name: "Check backup status"
    time: "10:00"
    duration: "10 minutes"
    
  - name: "Review performance metrics"
    time: "16:00"
    duration: "20 minutes"

# Tâches hebdomadaires
weekly:
  - name: "Security scan"
    day: "Monday"
    time: "02:00"
    duration: "2 hours"
    
  - name: "Database maintenance"
    day: "Sunday"
    time: "03:00"
    duration: "1 hour"
    
  - name: "Log rotation and cleanup"
    day: "Sunday"
    time: "04:00"
    duration: "30 minutes"
```

### 🚨 Procédures d'incident
```yaml
# Incident P0 (Critique)
p0_incident:
  response_time: "5 minutes"
  escalation_time: "15 minutes"
  resolution_time: "1 hour"
  
  steps:
    1: "Acknowledge alert"
    2: "Assess impact and scope"
    3: "Implement immediate fix or workaround"
    4: "Communicate status to stakeholders"
    5: "Post-incident review and documentation"
    
# Incident P1 (Important)
p1_incident:
  response_time: "15 minutes"
  escalation_time: "1 hour"
  resolution_time: "4 hours"
  
  steps:
    1: "Acknowledge alert"
    2: "Investigate root cause"
    3: "Implement fix"
    4: "Monitor resolution"
    5: "Document lessons learned"
```

---

## 📊 Rapports et métriques

### 📈 Rapports quotidiens
```yaml
# Métriques système
- Uptime: 99.9%
- Response time: < 200ms
- Error rate: < 0.1%
- CPU usage: < 80%
- Memory usage: < 80%

# Métriques business
- New users: 50
- Active users: 500
- Searches: 1,000
- Revenue: 1,000€
- Conversion rate: 10%
```

### 📊 Rapports hebdomadaires
```yaml
# Métriques de performance
- Average response time
- Peak traffic times
- Error trends
- Resource utilization
- Security incidents

# Métriques business
- User growth rate
- Revenue growth rate
- Feature adoption
- Customer satisfaction
- Support tickets
```

### 📋 Rapports mensuels
```yaml
# Métriques de disponibilité
- Uptime percentage
- Incident count and duration
- MTTR (Mean Time To Resolution)
- MTBF (Mean Time Between Failures)

# Métriques business
- Monthly Recurring Revenue (MRR)
- Customer Acquisition Cost (CAC)
- Customer Lifetime Value (LTV)
- Churn rate
- Net Promoter Score (NPS)
```

---

*Dernière mise à jour : Janvier 2024*
*Version : 1.0.0*
