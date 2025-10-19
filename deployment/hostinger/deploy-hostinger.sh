#!/bin/bash

# ===========================================
# DIGITALLZ - DÉPLOIEMENT HOSTINGER
# ===========================================

echo "🚀 Préparation du déploiement pour Hostinger..."

# Configuration
DOMAIN="digitallz.com"
HOSTINGER_USER="votre_utilisateur"
HOSTINGER_HOST="votre_serveur.hostinger.com"
HOSTINGER_PATH="/public_html"

# Créer le dossier de déploiement
mkdir -p deployment/hostinger/files

# 1. Préparer le frontend Next.js pour la production
echo "📦 Préparation du frontend..."
cd frontend

# Installer les dépendances
npm install

# Build pour la production
npm run build

# Exporter en statique
npm run export

# Copier les fichiers statiques
cp -r out/* ../deployment/hostinger/files/

cd ..

# 2. Créer le fichier .htaccess pour Next.js
cat > deployment/hostinger/files/.htaccess << 'EOF'
# Next.js on Hostinger
RewriteEngine On

# Handle client-side routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [QSA,L]

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
EOF

# 3. Créer le fichier de configuration pour l'API
cat > deployment/hostinger/files/api-config.js << 'EOF'
// Configuration API pour Hostinger
window.API_CONFIG = {
    BASE_URL: 'https://digitallz-api.railway.app', // Votre backend sur Railway
    ENDPOINTS: {
        SEARCH: '/api/keywords/search',
        TRENDS: '/api/keywords/trends',
        PLATFORMS: '/api/platforms',
        HEALTH: '/api/health'
    }
};
EOF

# 4. Créer le script de déploiement
cat > deployment/hostinger/deploy.sh << 'EOF'
#!/bin/bash

# Script de déploiement pour Hostinger
echo "🚀 Déploiement sur Hostinger..."

# Configuration
HOSTINGER_USER="votre_utilisateur"
HOSTINGER_HOST="votre_serveur.hostinger.com"
HOSTINGER_PATH="/public_html"

# Upload des fichiers
echo "📤 Upload des fichiers..."
rsync -avz --delete deployment/hostinger/files/ $HOSTINGER_USER@$HOSTINGER_HOST:$HOSTINGER_PATH/

echo "✅ Déploiement terminé !"
echo "🌐 Votre site est disponible sur : https://digitallz.com"
EOF

chmod +x deployment/hostinger/deploy.sh

echo "✅ Fichiers préparés pour Hostinger !"
echo "📁 Dossier de déploiement : deployment/hostinger/files/"
echo "🚀 Script de déploiement : deployment/hostinger/deploy.sh"
