# ===========================================
# DIGITALLZ - DÉPLOIEMENT HOSTINGER
# ===========================================

Write-Host "🚀 Déploiement de Digitallz sur Hostinger..." -ForegroundColor Green

# Configuration
$DOMAIN = "digitallz.com"
$HOSTINGER_USER = Read-Host "Entrez votre nom d'utilisateur Hostinger"
$HOSTINGER_HOST = Read-Host "Entrez votre serveur Hostinger (ex: server.hostinger.com)"
$HOSTINGER_PATH = "/public_html"

Write-Host "📦 Préparation des fichiers..." -ForegroundColor Yellow

# Aller dans le dossier frontend
Set-Location frontend

# Vérifier que le build existe
if (-not (Test-Path "out")) {
    Write-Host "❌ Le dossier 'out' n'existe pas. Exécutez d'abord 'npm run build'" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Fichiers statiques prêts !" -ForegroundColor Green

# Créer le fichier .htaccess
$htaccessContent = @"
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
"@

# Écrire le fichier .htaccess
$htaccessContent | Out-File -FilePath "out\.htaccess" -Encoding UTF8

Write-Host "📁 Création de l'archive ZIP..." -ForegroundColor Yellow

# Créer une archive ZIP
$zipPath = "digitallz-frontend.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath
}

# Utiliser PowerShell pour créer l'archive
Compress-Archive -Path "out\*" -DestinationPath $zipPath -Force

Write-Host "✅ Archive créée : $zipPath" -ForegroundColor Green

Write-Host "📤 Instructions de déploiement :" -ForegroundColor Cyan
Write-Host "1. Connectez-vous à votre panneau Hostinger (hpanel.hostinger.com)" -ForegroundColor White
Write-Host "2. Ouvrez le File Manager" -ForegroundColor White
Write-Host "3. Naviguez vers /public_html" -ForegroundColor White
Write-Host "4. Supprimez tous les fichiers existants" -ForegroundColor White
Write-Host "5. Uploadez le fichier : $zipPath" -ForegroundColor White
Write-Host "6. Extrayez l'archive dans /public_html" -ForegroundColor White
Write-Host "7. Votre site sera disponible sur : https://$DOMAIN" -ForegroundColor Green

Write-Host "`n🎉 Déploiement prêt !" -ForegroundColor Green
Write-Host "📁 Fichier à uploader : $zipPath" -ForegroundColor Yellow
Write-Host "🌐 URL finale : https://$DOMAIN" -ForegroundColor Cyan

# Retourner au dossier parent
Set-Location ..
