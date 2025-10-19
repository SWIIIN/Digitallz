# 🚀 Guide de Déploiement Render pour Digitallz

## 📋 Vue d'ensemble

Ce guide vous accompagne pour déployer le backend Digitallz sur Render (alternative gratuite à Railway).

## 🎯 **Étapes de Déploiement**

### **Étape 1 : Création du Compte Render** ⏱️ 5 minutes

1. **Allez sur Render** :
   - Visitez https://render.com
   - Cliquez sur "Get Started for Free"
   - Connectez-vous avec GitHub

2. **Vérifiez votre compte** :
   - Confirmez votre email
   - Votre compte est prêt !

### **Étape 2 : Déploiement du Backend** ⏱️ 10 minutes

1. **Créez un nouveau Web Service** :
   - Cliquez sur "New" → "Web Service"
   - Connectez votre repository GitHub
   - Sélectionnez votre repository Digitallz

2. **Configurez le service** :
   - **Name** : `digitallz-backend`
   - **Root Directory** : `backend`
   - **Environment** : `Node`
   - **Build Command** : `npm install && npm run build`
   - **Start Command** : `npm start`

3. **Déployez** :
   - Cliquez sur "Create Web Service"
   - Render va automatiquement déployer votre backend
   - Attendez 2-3 minutes

### **Étape 3 : Ajout des Bases de Données** ⏱️ 5 minutes

1. **Ajoutez PostgreSQL** :
   - Cliquez sur "New" → "PostgreSQL"
   - **Name** : `digitallz-postgres`
   - **Plan** : Free
   - Cliquez sur "Create Database"

2. **Ajoutez Redis** :
   - Cliquez sur "New" → "Redis"
   - **Name** : `digitallz-redis`
   - **Plan** : Free
   - Cliquez sur "Create Redis"

### **Étape 4 : Configuration des Variables d'Environnement** ⏱️ 5 minutes

1. **Ouvrez votre Web Service** :
   - Allez dans votre service `digitallz-backend`
   - Cliquez sur l'onglet "Environment"

2. **Ajoutez les variables suivantes** :
   ```env
   NODE_ENV=production
   PORT=3001
   JWT_SECRET=votre_jwt_secret_super_securise_32_caracteres_minimum
   JWT_REFRESH_SECRET=votre_jwt_refresh_secret_super_securise_32_caracteres_minimum
   CORS_ORIGIN=https://digitallz.com,https://www.digitallz.com
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   CACHE_TTL=3600
   ENABLE_ANALYTICS=true
   ENABLE_CACHING=true
   ENABLE_RATE_LIMITING=true
   ENABLE_MONITORING=true
   ENABLE_LOGGING=true
   ```

3. **Les variables de base de données** sont automatiquement ajoutées :
   - `DATABASE_URL` (PostgreSQL)
   - `REDIS_URL` (Redis)

### **Étape 5 : Configuration DNS** ⏱️ 5 minutes

1. **Allez sur Hostinger** :
   - Ouvrez le panneau Hostinger
   - Allez dans "DNS Zone Editor"

2. **Ajoutez un enregistrement CNAME** :
   - **Type** : CNAME
   - **Name** : api
   - **Value** : `votre-app.onrender.com` (remplacez par votre URL Render)
   - **TTL** : 3600

3. **Vérifiez la configuration** :
   - Attendez 5-10 minutes pour la propagation DNS
   - Testez : https://api.digitallz.com/health

## 🧪 **Tests de Validation**

### ✅ **Test 1 : Backend Render**
```bash
# Testez votre URL Render directe
# Ex: https://digitallz-backend.onrender.com/health
# Réponse attendue :
{
  "status": "healthy",
  "timestamp": "2024-01-XX...",
  "database": "connected"
}
```

### ✅ **Test 2 : API via DNS**
```bash
# Testez https://api.digitallz.com/health
# Même réponse que ci-dessus
```

### ✅ **Test 3 : Frontend + Backend**
```bash
# Testez https://digitallz.com
# Vérifiez que la recherche fonctionne
# Vérifiez que les données sont récupérées de l'API
```

## 🚨 **Résolution de Problèmes**

### ❌ **Erreur : "Service not responding"**
```bash
# Solutions :
1. Vérifiez que Render est déployé
2. Regardez les logs dans Render Dashboard
3. Vérifiez les variables d'environnement
4. Redéployez le service
```

### ❌ **Erreur : "Database connection failed"**
```bash
# Solutions :
1. Vérifiez que PostgreSQL est actif
2. Vérifiez la variable DATABASE_URL
3. Attendez que la base soit prête (2-3 minutes)
4. Redéployez le service
```

### ❌ **Erreur : "CORS error"**
```bash
# Solutions :
1. Vérifiez CORS_ORIGIN dans les variables
2. Ajoutez votre domaine exact
3. Redéployez le service
4. Videz le cache du navigateur
```

## 📊 **Monitoring Render**

### 🔍 **Surveillance**
- **Render Dashboard** : https://dashboard.render.com
- **Logs** : Disponibles dans chaque service
- **Métriques** : CPU, RAM, requêtes
- **Uptime** : Monitoring automatique

### 💰 **Coûts**
- **Web Service** : GRATUIT (750h/mois)
- **PostgreSQL** : GRATUIT (1GB)
- **Redis** : GRATUIT (25MB)
- **Total** : 0€/mois

## 🎉 **Félicitations !**

Une fois ces étapes terminées, votre plateforme **Digitallz** sera :

- ✅ **Frontend** : https://digitallz.com (Hostinger)
- ✅ **Backend** : https://api.digitallz.com (Render)
- ✅ **Base de données** : PostgreSQL (Render)
- ✅ **Cache** : Redis (Render)
- ✅ **Gratuit** : 0€/mois

## 📞 **Support**

Si vous rencontrez des problèmes :
1. Consultez les logs Render
2. Vérifiez les variables d'environnement
3. Testez chaque composant individuellement
4. Contactez le support Render si nécessaire

---

*Dernière mise à jour : Janvier 2024*
*Version : 1.0.0*
