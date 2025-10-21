# Script de deploiement simple pour Hostinger
Write-Host "Deploiement Digitallz sur Hostinger" -ForegroundColor Green

# 1. Build du frontend
Write-Host "Building du frontend..." -ForegroundColor Yellow
cd frontend
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors du build" -ForegroundColor Red
    exit 1
}

# 2. Creer le dossier de deploiement
Write-Host "Creation du dossier de deploiement..." -ForegroundColor Yellow
$deployDir = "..\deploy-hostinger"
if (Test-Path $deployDir) {
    Remove-Item $deployDir -Recurse -Force
}
New-Item -ItemType Directory -Path $deployDir

# 3. Copier les fichiers
Write-Host "Copie des fichiers..." -ForegroundColor Yellow
Copy-Item ".next\static" "$deployDir\static" -Recurse
Copy-Item "public" "$deployDir\public" -Recurse -ErrorAction SilentlyContinue

Write-Host "Deploiement prepare !" -ForegroundColor Green
Write-Host "Dossier: $deployDir" -ForegroundColor Cyan
Write-Host "Prochaines etapes:" -ForegroundColor Yellow
Write-Host "1. Uploadez le contenu de deploy-hostinger vers public_html sur Hostinger" -ForegroundColor White
Write-Host "2. Creez un fichier index.html" -ForegroundColor White
Write-Host "3. Testez le site" -ForegroundColor White