# 🚀 Guide de Déploiement Digitallz

## 📋 Vue d'ensemble

Ce guide vous accompagne pour déployer la plateforme Digitallz sur votre domaine `digitallz.com` hébergé sur Hostinger.

## 🏗️ Architecture de Déploiement

```
┌─────────────────────────────────────────┐
│  🌐 digitallz.com (Hostinger)          │
│  ├── Frontend Next.js (Statique)       │
│  └── Fichiers statiques                │
├─────────────────────────────────────────┤
│  🔧 Backend API (Railway - GRATUIT)    │
│  ├── Node.js + Express                 │
│  ├── PostgreSQL (Railway)              │
│  └── Redis (Railway)                   │
└─────────────────────────────────────────┘
```

## 🎯 Étapes de Déploiement

### **Étape 1 : Déploiement Frontend sur Hostinger** ⏱️ 15 minutes

#### ✅ **Préparation terminée**
- ✅ Build Next.js créé (`frontend/out/`)
- ✅ Fichier `.htaccess` configuré
- ✅ Archive ZIP créée (`digitallz-frontend.zip`)

#### 📤 **Déploiement sur Hostinger**

1. **Connectez-vous à Hostinger** :
   - Allez sur https://hpanel.hostinger.com
   - Connectez-vous avec vos identifiants

2. **Ouvrez le File Manager** :
   - Cliquez sur "File Manager" dans le panneau
   - Naviguez vers `/public_html`

3. **Supprimez les fichiers existants** :
   - Sélectionnez tous les fichiers dans `/public_html`
   - Supprimez-les (sauf si vous voulez les conserver)

4. **Uploadez l'archive** :
   - Cliquez sur "Upload Files"
   - Sélectionnez le fichier `digitallz-frontend.zip`
   - Attendez la fin de l'upload

5. **Extrayez l'archive** :
   - Clic droit sur `digitallz-frontend.zip`
   - Sélectionnez "Extract"
   - Extrayez dans `/public_html`

6. **Vérifiez le déploiement** :
   - Ouvrez https://digitallz.com
   - Vérifiez que le site s'affiche correctement

### **Étape 2 : Déploiement Backend sur Railway** ⏱️ 20 minutes

#### 🚀 **Création du projet Railway**

1. **Allez sur Railway** :
   - Visitez https://railway.app
   - Connectez-vous avec GitHub

2. **Créez un nouveau projet** :
   - Cliquez sur "New Project"
   - Sélectionnez "Deploy from GitHub repo"
   - Choisissez votre repository Digitallz
   - Sélectionnez le dossier `backend`

3. **Ajoutez les services de base de données** :
   - Cliquez sur "New" → "Database" → "PostgreSQL"
   - Cliquez sur "New" → "Database" → "Redis"

#### ⚙️ **Configuration des variables d'environnement**

1. **Ouvrez les variables d'environnement** :
   - Cliquez sur votre service backend
   - Allez dans l'onglet "Variables"

2. **Ajoutez les variables suivantes** :
   ```env
   NODE_ENV=production
   PORT=3001
   JWT_SECRET=votre_jwt_secret_super_securise_32_caracteres_minimum
   JWT_REFRESH_SECRET=votre_jwt_refresh_secret_super_securise_32_caracteres_minimum
   CORS_ORIGIN=https://digitallz.com,https://www.digitallz.com
   ```

3. **Les variables de base de données** sont automatiquement ajoutées par Railway :
   - `DATABASE_URL` (PostgreSQL)
   - `REDIS_URL` (Redis)

#### 🔧 **Déploiement et test**

1. **Railway déploie automatiquement** votre backend
2. **Attendez que le déploiement soit terminé** (2-3 minutes)
3. **Testez l'API** :
   - Ouvrez l'URL de votre backend (ex: `https://votre-app.railway.app`)
   - Ajoutez `/health` à la fin de l'URL
   - Vous devriez voir : `{"status":"healthy"}`

### **Étape 3 : Configuration DNS** ⏱️ 5 minutes

#### 🌐 **Configuration des sous-domaines**

1. **Allez sur Hostinger** :
   - Ouvrez le panneau Hostinger
   - Allez dans "DNS Zone Editor"

2. **Ajoutez un enregistrement CNAME** :
   - **Type** : CNAME
   - **Name** : api
   - **Value** : `votre-app.railway.app` (remplacez par votre URL Railway)
   - **TTL** : 3600

3. **Vérifiez la configuration** :
   - Attendez 5-10 minutes pour la propagation DNS
   - Testez : https://api.digitallz.com/health

### **Étape 4 : Configuration des APIs Externes** ⏱️ 30 minutes

#### 🔑 **APIs à configurer (optionnel pour les tests)**

Pour des tests complets, vous pouvez configurer :

1. **Amazon Product Advertising API** :
   - Créez un compte Amazon Associates
   - Obtenez vos clés API
   - Ajoutez-les dans Railway

2. **Etsy API** :
   - Créez une app Etsy
   - Obtenez vos clés API
   - Ajoutez-les dans Railway

3. **Stripe (pour les paiements)** :
   - Créez un compte Stripe
   - Obtenez vos clés de test
   - Ajoutez-les dans Railway

## 🧪 **Tests de Validation**

### ✅ **Test 1 : Frontend**
```bash
# Ouvrez https://digitallz.com
# Vérifiez que :
- ✅ La page se charge
- ✅ Le design s'affiche correctement
- ✅ Les boutons fonctionnent
- ✅ Pas d'erreurs dans la console
```

### ✅ **Test 2 : API Backend**
```bash
# Testez https://api.digitallz.com/health
# Réponse attendue :
{
  "status": "healthy",
  "timestamp": "2024-01-XX...",
  "database": "connected"
}
```

### ✅ **Test 3 : Recherche de Mots-clés**
```bash
# Testez la recherche sur https://digitallz.com
# Vérifiez que :
- ✅ La recherche fonctionne
- ✅ Les résultats s'affichent
- ✅ Les données sont récupérées de l'API
```

## 🚨 **Résolution de Problèmes**

### ❌ **Erreur : "API not responding"**
```bash
# Solution :
1. Vérifiez que Railway est déployé
2. Vérifiez les variables d'environnement
3. Regardez les logs Railway
4. Testez l'URL de l'API directement
```

### ❌ **Erreur : "Database connection failed"**
```bash
# Solution :
1. Vérifiez la variable DATABASE_URL
2. Vérifiez que PostgreSQL est actif sur Railway
3. Exécutez les migrations
4. Testez la connexion
```

### ❌ **Erreur : "CORS error"**
```bash
# Solution :
1. Ajoutez digitallz.com aux CORS_ORIGIN
2. Redéployez le backend
3. Videz le cache du navigateur
```

## 📊 **Monitoring et Maintenance**

### 🔍 **Surveillance**
- **Railway Dashboard** : https://railway.app/dashboard
- **Hostinger Panel** : https://hpanel.hostinger.com
- **Logs** : Disponibles dans Railway

### 💰 **Coûts Estimés**
- **Hostinger** : $3.99/mois (VPS) ou $1.99/mois (Shared)
- **Railway** : GRATUIT (limite 500h/mois)
- **PostgreSQL** : GRATUIT (Railway)
- **Redis** : GRATUIT (Railway)
- **Total** : ~$4/mois

## 🎉 **Félicitations !**

Une fois ces étapes terminées, votre plateforme **Digitallz Keywords Platform** sera :

- ✅ **En ligne** sur https://digitallz.com
- ✅ **Fonctionnelle** avec toutes les intégrations
- ✅ **Sécurisée** avec HTTPS
- ✅ **Optimisée** pour les performances
- ✅ **Prête** pour les utilisateurs

**Votre plateforme sera officiellement lancée ! 🚀**

## 📞 **Support**

Si vous rencontrez des problèmes :
1. Vérifiez les logs Railway
2. Testez chaque composant individuellement
3. Vérifiez la configuration DNS
4. Contactez le support si nécessaire

---

*Dernière mise à jour : Janvier 2024*
*Version : 1.0.0*
