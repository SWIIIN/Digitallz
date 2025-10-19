# 📊 Diagrammes d'Architecture Système

## 🏗️ Architecture Globale

```
┌─────────────────────────────────────────────────────────────────┐
│                        DIGITALLZ KEYWORDS PLATFORM              │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (Next.js)     │  Backend (Node.js)    │  Data (Python) │
│  ┌─────────────────┐    │  ┌─────────────────┐   │  ┌──────────┐  │
│  │   Dashboard     │    │  │   API Gateway   │   │  │Collectors│  │
│  │   Search UI     │◄──►│  │   Auth Service  │◄──►│  │Processors│  │
│  │   Analytics     │    │  │   Keyword API   │   │  │ML Models │  │
│  └─────────────────┘    │  └─────────────────┘   │  └──────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│  CDN (CloudFlare)  │  Load Balancer  │  Database (PostgreSQL)  │
│  Cache (Redis)     │  Queue (Bull)   │  Storage (S3)          │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Flux de Données

### 1. Recherche de Mots-clés
```
User Input → Frontend → API Gateway → Auth → Keyword Service → Cache → Database
     │                                                                    │
     └────────────────── Response ←──────────────────────────────────────┘
```

### 2. Collecte de Données
```
Scheduler → Data Collector → External APIs → Queue → Processor → Database
     │                                                              │
     └────────────────── Analytics ←────────────────────────────────┘
```

### 3. Traitement ML
```
Raw Data → Feature Extraction → ML Model → Predictions → Database
     │                                                      │
     └────────────────── Insights ←─────────────────────────┘
```

## 🗄️ Architecture de Base de Données

### Schéma Principal
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     USERS       │    │  KEYWORD_DATA   │    │ KEYWORD_SEARCHES│
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (UUID)       │◄──►│ id (UUID)       │◄──►│ id (UUID)       │
│ email           │    │ keyword         │    │ user_id (FK)    │
│ password_hash   │    │ platform        │    │ keyword         │
│ subscription    │    │ search_volume   │    │ platform        │
│ created_at      │    │ competition     │    │ results (JSON)  │
│ updated_at      │    │ cpc             │    │ created_at      │
└─────────────────┘    │ trend_data      │    └─────────────────┘
                       │ last_updated    │
                       └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  SUBSCRIPTIONS  │    │  ANALYTICS      │    │  CACHE_DATA     │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (UUID)       │    │ id (UUID)       │    │ key (String)    │
│ user_id (FK)    │    │ keyword         │    │ value (JSON)    │
│ plan_name       │    │ platform        │    │ expires_at      │
│ status          │    │ metrics         │    │ created_at      │
│ stripe_id       │    │ created_at      │    └─────────────────┘
└─────────────────┘    └─────────────────┘
```

## 🔌 Intégrations Externes

### APIs Externes
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AMAZON API    │    │    ETSY API     │    │    EBAY API     │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ Keywords        │    │ Keywords        │    │ Keywords        │
│ Search Volume   │    │ Search Volume   │    │ Search Volume   │
│ Competition     │    │ Competition     │    │ Competition     │
│ Trends          │    │ Trends          │    │ Trends          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────┐
                    │  DATA COLLECTOR │
                    ├─────────────────┤
                    │ Rate Limiting   │
                    │ Error Handling  │
                    │ Data Validation │
                    │ Queue Management│
                    └─────────────────┘
```

## 🚀 Déploiement et Scaling

### Architecture de Production
```
┌─────────────────────────────────────────────────────────────────┐
│                        LOAD BALANCER                           │
└─────────────────┬───────────────────────────────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
    ▼             ▼             ▼
┌─────────┐  ┌─────────┐  ┌─────────┐
│Frontend │  │Frontend │  │Frontend │
│Instance │  │Instance │  │Instance │
└─────────┘  └─────────┘  └─────────┘
    │             │             │
    └─────────────┼─────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API GATEWAY                             │
├─────────────────────────────────────────────────────────────────┤
│  Auth  │  Rate Limiting  │  CORS  │  Logging  │  Monitoring   │
└─────────────────┬───────────────────────────────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
    ▼             ▼             ▼
┌─────────┐  ┌─────────┐  ┌─────────┐
│Backend  │  │Backend  │  │Backend  │
│Instance │  │Instance │  │Instance │
└─────────┘  └─────────┘  └─────────┘
    │             │             │
    └─────────────┼─────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE CLUSTER                            │
├─────────────────────────────────────────────────────────────────┤
│  Primary DB  │  Read Replicas  │  Cache (Redis)  │  Queue      │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Monitoring et Observabilité

### Stack de Monitoring
```
┌─────────────────────────────────────────────────────────────────┐
│                    MONITORING STACK                            │
├─────────────────────────────────────────────────────────────────┤
│  Prometheus  │  Grafana  │  ELK Stack  │  Jaeger  │  Sentry   │
│  (Metrics)   │ (Dashboards)│ (Logs)    │ (Traces) │ (Errors)  │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ALERTING SYSTEM                             │
├─────────────────────────────────────────────────────────────────┤
│  Slack  │  Email  │  PagerDuty  │  Webhooks  │  SMS           │
└─────────────────────────────────────────────────────────────────┘
```

## 🔒 Architecture de Sécurité

### Couches de Sécurité
```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                             │
├─────────────────────────────────────────────────────────────────┤
│  WAF (Web App Firewall)                                        │
│  DDoS Protection                                               │
│  SSL/TLS Termination                                           │
├─────────────────────────────────────────────────────────────────┤
│  Authentication (JWT + OAuth)                                  │
│  Authorization (RBAC)                                          │
│  Rate Limiting                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Data Encryption (AES-256)                                     │
│  Database Encryption                                           │
│  API Key Management                                            │
├─────────────────────────────────────────────────────────────────┤
│  Audit Logging                                                 │
│  Security Monitoring                                           │
│  Incident Response                                             │
└─────────────────────────────────────────────────────────────────┘
```

## 💰 Architecture de Coûts

### Répartition des Coûts
```
┌─────────────────────────────────────────────────────────────────┐
│                    COST BREAKDOWN                              │
├─────────────────────────────────────────────────────────────────┤
│  Compute (EC2/EKS)     │  40%  │  $400-1200/mois              │
│  Database (RDS)        │  25%  │  $250-750/mois               │
│  Storage (S3)          │  10%  │  $100-300/mois               │
│  CDN (CloudFlare)      │  15%  │  $150-450/mois               │
│  Monitoring            │  5%   │  $50-150/mois                │
│  External APIs         │  5%   │  $50-300/mois                │
├─────────────────────────────────────────────────────────────────┤
│  TOTAL ESTIMATED       │ 100%  │  $1000-3000/mois             │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 CI/CD Pipeline

### Pipeline de Déploiement
```
┌─────────────────────────────────────────────────────────────────┐
│                    CI/CD PIPELINE                              │
├─────────────────────────────────────────────────────────────────┤
│  Git Push → GitHub Actions → Build → Test → Deploy → Monitor   │
│     │           │            │       │       │         │       │
│     ▼           ▼            ▼       ▼       ▼         ▼       │
│  Code      Automated     Docker   Unit    Staging   Production │
│  Commit    Build        Images   Tests   Deploy    Deploy      │
│     │           │            │       │       │         │       │
│     └───────────┼────────────┼───────┼───────┼─────────┼───────┘
│                 │            │       │       │         │
│                 ▼            ▼       ▼       ▼         ▼
│            Artifacts    Registry  Reports  Health   Alerts     │
└─────────────────────────────────────────────────────────────────┘
```

## 📈 Scaling Strategy

### Stratégie de Montée en Charge
```
┌─────────────────────────────────────────────────────────────────┐
│                    SCALING STRATEGY                            │
├─────────────────────────────────────────────────────────────────┤
│  Phase 1 (0-1K users)    │  Single instance, Basic monitoring  │
│  Phase 2 (1K-10K users)  │  Load balancer, Read replicas      │
│  Phase 3 (10K-100K users)│  Auto-scaling, CDN, Caching        │
│  Phase 4 (100K+ users)   │  Microservices, Multi-region       │
├─────────────────────────────────────────────────────────────────┤
│  Horizontal Scaling:  Add more instances                       │
│  Vertical Scaling:    Upgrade instance types                   │
│  Database Scaling:    Read replicas, Sharding                  │
│  Cache Scaling:       Redis Cluster                            │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Performance Targets

### Objectifs de Performance
```
┌─────────────────────────────────────────────────────────────────┐
│                    PERFORMANCE TARGETS                         │
├─────────────────────────────────────────────────────────────────┤
│  Response Time:     < 200ms (95th percentile)                  │
│  Throughput:        > 1000 requests/second                     │
│  Availability:      99.9% uptime                               │
│  Error Rate:        < 0.1%                                     │
│  Database:          < 50ms query time                          │
│  Cache Hit Rate:    > 90%                                      │
├─────────────────────────────────────────────────────────────────┤
│  Monitoring:        Real-time dashboards                       │
│  Alerting:          < 1 minute detection                       │
│  Recovery:          < 5 minutes MTTR                           │
└─────────────────────────────────────────────────────────────────┘
```

Cette architecture est conçue pour être **modulaire**, **scalable** et **maintenable**. Elle peut s'adapter à la croissance de votre plateforme et supporter des millions d'utilisateurs.
