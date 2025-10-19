# 🚀 DÉPLOIEMENT DIGITALLZ SUR HOSTINGER

## 📋 **PLAN DE DÉPLOIEMENT COMPLET**

### **🎯 Architecture Recommandée**
```
┌─────────────────────────────────────────┐
│  🌐 digitallz.com (Hostinger)          │
│  ├── Frontend Next.js (Statique)       │
│  └── Fichiers statiques                │
├─────────────────────────────────────────┤
│  🔧 Backend API (Railway - GRATUIT)    │
│  ├── Node.js + Express                 │
│  ├── PostgreSQL (Supabase - GRATUIT)   │
│  └── Redis (Redis Cloud - GRATUIT)     │
└─────────────────────────────────────────┘
```

## 🛠️ **ÉTAPES DE DÉPLOIEMENT**

### **1. 🌐 Frontend sur Hostinger (15 minutes)**

#### **Option A : Upload Manuel**
1. **Préparez les fichiers** :
   ```bash
   cd frontend
   npm install
   npm run build
   npm run export
   ```

2. **Compressez le dossier `out/`** en ZIP

3. **Connectez-vous à Hostinger** :
   - Allez sur https://hpanel.hostinger.com
   - Ouvrez le **File Manager**
   - Naviguez vers `/public_html`
   - Supprimez tous les fichiers existants
   - Uploadez votre fichier ZIP
   - Extrayez-le dans `/public_html`

4. **Configurez le .htaccess** :
   - Créez un fichier `.htaccess` dans `/public_html`
   - Copiez le contenu du fichier `deployment/hostinger/.htaccess`

#### **Option B : Upload via FTP/SFTP**
1. **Utilisez FileZilla** ou un client FTP
2. **Connectez-vous** avec vos identifiants Hostinger
3. **Uploadez** le contenu du dossier `out/` vers `/public_html`

### **2. 🔧 Backend sur Railway (20 minutes)**

1. **Allez sur https://railway.app**
2. **Connectez votre compte GitHub**
3. **Créez un nouveau projet** :
   - Cliquez sur "New Project"
   - Sélectionnez "Deploy from GitHub repo"
   - Choisissez votre repository
   - Sélectionnez le dossier `backend`

4. **Ajoutez les services** :
   - **PostgreSQL** : Cliquez sur "New" → "Database" → "PostgreSQL"
   - **Redis** : Cliquez sur "New" → "Database" → "Redis"

5. **Configurez les variables d'environnement** :
   ```env
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=[URL de votre base PostgreSQL Railway]
   REDIS_URL=[URL de votre Redis Railway]
   JWT_SECRET=votre_jwt_secret_super_securise
   STRIPE_SECRET_KEY=sk_live_votre_cle_stripe
   STRIPE_PUBLISHABLE_KEY=pk_live_votre_cle_publique_stripe
   AMAZON_ACCESS_KEY=votre_cle_amazon
   AMAZON_SECRET_KEY=votre_secret_amazon
   AMAZON_ASSOCIATE_TAG=votre_tag_associe
   ETSY_API_KEY=votre_cle_etsy
   EBAY_APP_ID=votre_app_id_ebay
   SHOPIFY_ACCESS_TOKEN=votre_token_shopify
   GUMROAD_ACCESS_TOKEN=votre_token_gumroad
   ```

6. **Déployez** : Railway déploiera automatiquement

### **3. 🗄️ Base de Données (10 minutes)**

1. **Connectez-vous à votre base PostgreSQL Railway**
2. **Exécutez les migrations** :
   ```bash
   # Via Railway CLI ou interface web
   npx prisma migrate deploy
   npx prisma generate
   ```

3. **Vérifiez** : Allez sur https://votre-app.railway.app/health

### **4. 🔗 Configuration DNS (5 minutes)**

1. **Allez sur Hostinger** → **DNS Zone Editor**
2. **Ajoutez un enregistrement CNAME** :
   - **Type** : CNAME
   - **Name** : api
   - **Value** : votre-app.railway.app
   - **TTL** : 3600

3. **Vérifiez** : https://api.digitallz.com devrait pointer vers votre API

## 🧪 **TESTS DE VALIDATION**

### **✅ Test 1 : Frontend**
```bash
# Ouvrez https://digitallz.com
# Vérifiez que :
- ✅ La page se charge
- ✅ Le design s'affiche correctement
- ✅ Les boutons fonctionnent
- ✅ Pas d'erreurs dans la console
```

### **✅ Test 2 : API Backend**
```bash
# Testez https://api.digitallz.com/health
# Réponse attendue :
{
  "status": "healthy",
  "timestamp": "2024-01-XX...",
  "database": "connected"
}
```

### **✅ Test 3 : Recherche de Mots-clés**
```bash
# Testez la recherche sur https://digitallz.com
# Vérifiez que :
- ✅ La recherche fonctionne
- ✅ Les résultats s'affichent
- ✅ Les données sont récupérées de l'API
```

## 🚨 **RÉSOLUTION DE PROBLÈMES**

### **❌ Erreur : "API not responding"**
```bash
# Solution :
1. Vérifiez que Railway est déployé
2. Vérifiez les variables d'environnement
3. Regardez les logs Railway
4. Testez l'URL de l'API directement
```

### **❌ Erreur : "Database connection failed"**
```bash
# Solution :
1. Vérifiez la variable DATABASE_URL
2. Vérifiez que PostgreSQL est actif sur Railway
3. Exécutez les migrations
4. Testez la connexion
```

### **❌ Erreur : "CORS error"**
```bash
# Solution :
1. Ajoutez digitallz.com aux CORS_ORIGIN
2. Redéployez le backend
3. Videz le cache du navigateur
```

## 📊 **MONITORING ET MAINTENANCE**

### **🔍 Surveillance**
- **Railway Dashboard** : https://railway.app/dashboard
- **Hostinger Panel** : https://hpanel.hostinger.com
- **Logs** : Disponibles dans Railway

### **💰 Coûts Estimés**
- **Hostinger** : $3.99/mois (VPS) ou $1.99/mois (Shared)
- **Railway** : GRATUIT (limite 500h/mois)
- **PostgreSQL** : GRATUIT (Railway)
- **Redis** : GRATUIT (Railway)
- **Total** : ~$4/mois

## 🎉 **FÉLICITATIONS !**

Une fois ces étapes terminées, votre plateforme **Digitallz Keywords Platform** sera :

- ✅ **En ligne** sur https://digitallz.com
- ✅ **Fonctionnelle** avec toutes les intégrations
- ✅ **Sécurisée** avec HTTPS
- ✅ **Optimisée** pour les performances
- ✅ **Prête** pour les utilisateurs

**Votre plateforme sera officiellement lancée ! 🚀**
