# DIGITALLZ - DEPLOYMENT HOSTINGER

Write-Host "Deployment de Digitallz sur Hostinger..." -ForegroundColor Green

# Configuration
$DOMAIN = "digitallz.com"
$FRONTEND_PATH = "frontend/out"

Write-Host "Preparation des fichiers..." -ForegroundColor Yellow

# Verifier que le dossier out existe
if (-not (Test-Path $FRONTEND_PATH)) {
    Write-Host "ERREUR: Le dossier '$FRONTEND_PATH' n'existe pas. Executez d'abord 'npm run build' dans le dossier frontend" -ForegroundColor Red
    exit 1
}

Write-Host "Fichiers statiques prets !" -ForegroundColor Green

Write-Host "Creation de l'archive ZIP..." -ForegroundColor Yellow

# Creer une archive ZIP
$zipPath = "digitallz-frontend.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath
}

# Utiliser PowerShell pour creer l'archive
Compress-Archive -Path "$FRONTEND_PATH\*" -DestinationPath $zipPath -Force

Write-Host "Archive creee : $zipPath" -ForegroundColor Green

Write-Host ""
Write-Host "Instructions de deploiement :" -ForegroundColor Cyan
Write-Host "1. Connectez-vous a votre panneau Hostinger (hpanel.hostinger.com)" -ForegroundColor White
Write-Host "2. Ouvrez le File Manager" -ForegroundColor White
Write-Host "3. Naviguez vers /public_html" -ForegroundColor White
Write-Host "4. Supprimez tous les fichiers existants" -ForegroundColor White
Write-Host "5. Uploadez le fichier : $zipPath" -ForegroundColor White
Write-Host "6. Extrayez l'archive dans /public_html" -ForegroundColor White
Write-Host "7. Votre site sera disponible sur : https://$DOMAIN" -ForegroundColor Green

Write-Host ""
Write-Host "Deploiement pret !" -ForegroundColor Green
Write-Host "Fichier a uploader : $zipPath" -ForegroundColor Yellow
Write-Host "URL finale : https://$DOMAIN" -ForegroundColor Cyan

Write-Host ""
Write-Host "Prochaines etapes :" -ForegroundColor Magenta
Write-Host "1. Deployez le frontend sur Hostinger (instructions ci-dessus)" -ForegroundColor White
Write-Host "2. Configurez le backend sur Railway ou un VPS" -ForegroundColor White
Write-Host "3. Configurez les DNS pour pointer api.digitallz.com vers votre backend" -ForegroundColor White
Write-Host "4. Testez la plateforme complete" -ForegroundColor White