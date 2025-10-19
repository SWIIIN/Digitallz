# 🗄️ Base de Données Digitallz

## 📋 Vue d'ensemble

La base de données Digitallz utilise **PostgreSQL** avec **Prisma ORM** pour gérer les données de la plateforme de recherche de mots-clés.

### 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│  🗄️ Base de Données PostgreSQL                        │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │    Users    │ │Subscriptions│ │  Keywords   │      │
│  │ (Utilisateurs)│ │ (Abonnements)│ │ (Mots-clés) │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │SearchHistory│ │   Trends    │ │PlatformData │      │
│  │ (Historique)│ │ (Tendances) │ │ (Plateformes)│      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │  Payments   │ │   Logs      │ │   Cache     │      │
│  │ (Paiements) │ │ (Journaux)  │ │ (Cache)     │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Modèles de données

### 👤 User (Utilisateurs)
```sql
CREATE TABLE "User" (
    "id" TEXT PRIMARY KEY,
    "email" TEXT UNIQUE NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT,
    "passwordResetToken" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);
```

**Index :**
- `User_email_key` (UNIQUE)
- `User_email_idx`
- `User_role_idx`
- `User_isActive_idx`
- `User_createdAt_idx`

### 💳 Subscription (Abonnements)
```sql
CREATE TABLE "Subscription" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "plan" "SubscriptionPlan" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "features" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);
```

**Index :**
- `Subscription_userId_idx`
- `Subscription_plan_idx`
- `Subscription_status_idx`
- `Subscription_endDate_idx`

### 🔍 Keyword (Mots-clés)
```sql
CREATE TABLE "Keyword" (
    "id" TEXT PRIMARY KEY,
    "term" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "searchVolume" INTEGER NOT NULL,
    "trend" "TrendDirection" NOT NULL,
    "competition" "CompetitionLevel" NOT NULL,
    "potentialRevenue" DECIMAL(10,2) NOT NULL,
    "cpc" DECIMAL(10,2),
    "difficulty" INTEGER,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Index :**
- `Keyword_term_platform_key` (UNIQUE)
- `Keyword_term_idx`
- `Keyword_platform_idx`
- `Keyword_searchVolume_idx`
- `Keyword_competition_idx`
- `Keyword_potentialRevenue_idx`
- `Keyword_lastUpdated_idx`

### 📊 SearchHistory (Historique des recherches)
```sql
CREATE TABLE "SearchHistory" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "keyword" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "resultsCount" INTEGER NOT NULL,
    "searchDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Index :**
- `SearchHistory_userId_idx`
- `SearchHistory_keyword_idx`
- `SearchHistory_platform_idx`
- `SearchHistory_searchDate_idx`

### 📈 Trend (Tendances)
```sql
CREATE TABLE "Trend" (
    "id" TEXT PRIMARY KEY,
    "keywordId" TEXT NOT NULL REFERENCES "Keyword"("id") ON DELETE CASCADE,
    "date" TIMESTAMP(3) NOT NULL,
    "searchVolume" INTEGER NOT NULL,
    "trendScore" DECIMAL(5,2),
    "competitionScore" DECIMAL(5,2),
    "opportunityScore" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Index :**
- `Trend_keywordId_idx`
- `Trend_date_idx`
- `Trend_searchVolume_idx`

### 🌐 PlatformData (Données des plateformes)
```sql
CREATE TABLE "PlatformData" (
    "id" TEXT PRIMARY KEY,
    "platform" "Platform" NOT NULL UNIQUE,
    "totalKeywords" INTEGER NOT NULL DEFAULT 0,
    "avgSearchVolume" INTEGER NOT NULL DEFAULT 0,
    "avgCompetition" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "avgCpc" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Index :**
- `PlatformData_platform_key` (UNIQUE)

### 💰 Payment (Paiements)
```sql
CREATE TABLE "Payment" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "subscriptionId" TEXT NOT NULL REFERENCES "Subscription"("id") ON DELETE CASCADE,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "method" "PaymentMethod" NOT NULL,
    "stripePaymentIntentId" TEXT,
    "stripeSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);
```

**Index :**
- `Payment_userId_idx`
- `Payment_subscriptionId_idx`
- `Payment_status_idx`
- `Payment_createdAt_idx`

---

## 🔧 Configuration et déploiement

### 📦 Installation
```bash
# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp env.example .env

# Configurer la base de données
npm run db:setup

# Avec données de test
npm run db:setup:seed
```

### 🚀 Scripts disponibles
```bash
# Configuration initiale
npm run db:setup              # Configuration de base
npm run db:setup:seed         # Configuration avec données de test

# Migrations
npm run db:migrate            # Exécuter les migrations
npm run db:generate           # Générer le client Prisma
npm run db:push               # Pousser le schéma vers la DB

# Données
npm run db:seed               # Peupler la base de données
npm run db:reset              # Réinitialiser et repeupler

# Maintenance
npm run db:backup             # Sauvegarder la base de données
npm run db:restore            # Restaurer la base de données
npm run db:maintenance        # Maintenance de la base de données

# Outils
npm run db:studio             # Interface Prisma Studio
```

### 🔧 Variables d'environnement
```env
# Base de données
DATABASE_URL="postgresql://username:password@localhost:5432/digitallz"
DIRECT_URL="postgresql://username:password@localhost:5432/digitallz"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# APIs externes
AMAZON_API_KEY="your_amazon_api_key"
ETSY_API_KEY="your_etsy_api_key"
```

---

## 📊 Optimisations et performances

### 🔍 Index optimisés
```sql
-- Index composites pour les requêtes fréquentes
CREATE INDEX idx_keyword_platform_volume ON "Keyword"("platform", "searchVolume");
CREATE INDEX idx_keyword_platform_competition ON "Keyword"("platform", "competition");
CREATE INDEX idx_search_history_user_date ON "SearchHistory"("userId", "searchDate");
CREATE INDEX idx_trend_keyword_date ON "Trend"("keywordId", "date");

-- Index partiels pour les données actives
CREATE INDEX idx_active_users ON "User"("isActive") WHERE "isActive" = true;
CREATE INDEX idx_active_subscriptions ON "Subscription"("status") WHERE "status" = 'ACTIVE';
```

### 📈 Statistiques et monitoring
```sql
-- Vérifier les statistiques des tables
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples
FROM pg_stat_user_tables 
WHERE schemaname = 'public';

-- Vérifier l'utilisation des index
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public';

-- Vérifier la taille de la base de données
SELECT pg_size_pretty(pg_database_size(current_database()));
```

### 🧹 Maintenance automatique
```bash
# Tâches de maintenance quotidiennes
0 2 * * * npm run db:backup              # Sauvegarde quotidienne
0 3 * * 0 npm run db:maintenance         # Maintenance hebdomadaire

# Nettoyage des données anciennes
# - Historique de recherche > 1 an
# - Tendances > 2 ans
# - Logs > 3 mois
```

---

## 🔒 Sécurité et conformité

### 🛡️ Sécurité des données
- **Chiffrement** : Mots de passe hashés avec bcrypt
- **Tokens** : JWT avec expiration
- **Validation** : Validation des données avec Joi
- **Audit** : Logs de toutes les opérations sensibles

### 📋 Conformité RGPD
- **Droit à l'oubli** : Suppression des données utilisateur
- **Portabilité** : Export des données utilisateur
- **Consentement** : Gestion des préférences
- **Audit** : Traçabilité des accès

### 🔐 Accès et permissions
```sql
-- Rôles utilisateurs
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'MODERATOR');

-- Permissions par rôle
-- USER: Lecture de ses propres données
-- MODERATOR: Lecture de toutes les données + modération
-- ADMIN: Accès complet à toutes les données
```

---

## 📊 Métriques et monitoring

### 📈 Métriques clés
- **Utilisateurs actifs** : DAU/MAU
- **Recherches** : Volume et tendances
- **Performance** : Temps de réponse des requêtes
- **Erreurs** : Taux d'erreur et types
- **Sauvegardes** : Succès et taille

### 🔍 Monitoring des requêtes
```sql
-- Requêtes lentes (> 1 seconde)
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
WHERE mean_time > 1000
ORDER BY mean_time DESC;

-- Requêtes les plus fréquentes
SELECT 
    query,
    calls,
    total_time,
    mean_time
FROM pg_stat_statements 
ORDER BY calls DESC
LIMIT 10;
```

### 📊 Tableaux de bord
- **Grafana** : Métriques en temps réel
- **Prometheus** : Collecte des métriques
- **Prisma Studio** : Interface de gestion des données
- **Logs** : Winston pour les logs structurés

---

## 🚨 Dépannage et support

### ❌ Problèmes courants
```bash
# Connexion à la base de données
Error: connect ECONNREFUSED
Solution: Vérifier que PostgreSQL est démarré

# Migrations échouées
Error: Migration failed
Solution: npm run db:reset && npm run db:seed

# Permissions insuffisantes
Error: permission denied
Solution: Vérifier les permissions de l'utilisateur DB

# Espace disque insuffisant
Error: no space left on device
Solution: Nettoyer les logs et sauvegardes anciennes
```

### 🔧 Commandes de diagnostic
```bash
# Vérifier la connexion
npm run health:check

# Vérifier les migrations
npx prisma migrate status

# Vérifier le schéma
npx prisma db pull

# Vérifier les données
npx prisma studio
```

### 📞 Support
- **Documentation** : [docs.digitallz.com](https://docs.digitallz.com)
- **Issues** : [GitHub Issues](https://github.com/digitallz/database/issues)
- **Email** : database-support@digitallz.com
- **Chat** : [Slack #database](https://digitallz.slack.com/channels/database)

---

*Dernière mise à jour : Janvier 2024*
*Version : 1.0.0*
