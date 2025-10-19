# 🔌 API Documentation - Digitallz

L'API Digitallz vous permet d'intégrer la recherche de mots-clés dans vos applications et workflows.

## 🚀 Démarrage rapide

### Authentification

Toutes les requêtes API nécessitent une clé API. Obtenez votre clé dans votre [tableau de bord](https://digitallz.com/dashboard/api).

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://api.digitallz.com/v1/keywords/search
```

### Base URL

```
https://api.digitallz.com/v1
```

### Format des réponses

Toutes les réponses sont au format JSON :

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0.0"
  }
}
```

---

## 🔍 Endpoints de recherche

### Recherche de mots-clés

**POST** `/keywords/search`

Recherche des données de mots-clés sur une plateforme spécifique.

#### Paramètres

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `keyword` | string | ✅ | Mot-clé à rechercher |
| `platform` | string | ✅ | Plateforme (amazon, etsy, ebay, shopify, gumroad) |
| `includeRelated` | boolean | ❌ | Inclure les mots-clés liés (défaut: false) |
| `includeTrends` | boolean | ❌ | Inclure les données de tendances (défaut: false) |
| `includeCompetitors` | boolean | ❌ | Inclure l'analyse de concurrence (défaut: false) |
| `includeDifficulty` | boolean | ❌ | Inclure le calcul de difficulté (défaut: false) |

#### Exemple de requête

```bash
curl -X POST https://api.digitallz.com/v1/keywords/search \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "digital marketing course",
    "platform": "amazon",
    "includeRelated": true,
    "includeTrends": true
  }'
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "keyword": "digital marketing course",
    "platform": "amazon",
    "data": {
      "id": "kw_123456",
      "searchVolume": 1500,
      "competition": 0.6,
      "cpc": 2.50,
      "trendScore": 0.75,
      "difficultyScore": 0.65,
      "opportunityScore": 0.8,
      "lastUpdated": "2024-01-15T10:30:00Z"
    },
    "relatedKeywords": [
      {
        "keyword": "online marketing training",
        "searchVolume": 800,
        "competition": 0.3,
        "relevance": 0.9,
        "type": "related"
      }
    ],
    "trends": [
      {
        "date": "2024-01-01",
        "volume": 1200,
        "score": 0.7
      },
      {
        "date": "2024-01-15",
        "volume": 1500,
        "score": 0.75
      }
    ],
    "analysis": {
      "totalKeywords": 1,
      "avgSearchVolume": 1500,
      "avgCompetition": 0.6,
      "topOpportunities": [],
      "trendingKeywords": []
    }
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0.0"
  }
}
```

### Tendances des mots-clés

**GET** `/keywords/trends/{keyword}`

Récupère les données de tendances pour un mot-clé spécifique.

#### Paramètres de requête

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `platform` | string | ✅ | Plateforme |
| `dateRange` | string | ❌ | Période (7d, 30d, 90d, 1y) |

#### Exemple de requête

```bash
curl "https://api.digitallz.com/v1/keywords/trends/digital-marketing-course?platform=amazon&dateRange=30d" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Mots-clés populaires

**GET** `/keywords/popular`

Récupère les mots-clés les plus populaires.

#### Paramètres de requête

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `platform` | string | ❌ | Plateforme (toutes si non spécifié) |
| `limit` | integer | ❌ | Nombre de résultats (défaut: 20) |
| `sortBy` | string | ❌ | Tri (volume, trend, opportunity) |

#### Exemple de requête

```bash
curl "https://api.digitallz.com/v1/keywords/popular?platform=amazon&limit=10&sortBy=volume" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Suggestions de mots-clés

**GET** `/keywords/suggestions`

Récupère des suggestions de mots-clés basées sur un terme de recherche.

#### Paramètres de requête

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `keyword` | string | ✅ | Terme de recherche |
| `platform` | string | ✅ | Plateforme |
| `limit` | integer | ❌ | Nombre de suggestions (défaut: 10) |

#### Exemple de requête

```bash
curl "https://api.digitallz.com/v1/keywords/suggestions?keyword=digital&platform=amazon&limit=5" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## 📊 Endpoints d'analytics

### Recherches récentes

**GET** `/keywords/recent`

Récupère l'historique des recherches de l'utilisateur.

#### Exemple de requête

```bash
curl "https://api.digitallz.com/v1/keywords/recent" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Analyse de concurrence

**GET** `/keywords/competitors/{keyword}`

Analyse les concurrents pour un mot-clé spécifique.

#### Paramètres de requête

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `platform` | string | ✅ | Plateforme |
| `limit` | integer | ❌ | Nombre de concurrents (défaut: 20) |

#### Exemple de requête

```bash
curl "https://api.digitallz.com/v1/keywords/competitors/digital-marketing-course?platform=amazon&limit=10" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Difficulté des mots-clés

**GET** `/keywords/difficulty/{keyword}`

Calcule le niveau de difficulté pour un mot-clé.

#### Paramètres de requête

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `platform` | string | ✅ | Plateforme |

#### Exemple de requête

```bash
curl "https://api.digitallz.com/v1/keywords/difficulty/digital-marketing-course?platform=amazon" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## 🔄 Endpoints de batch

### Analyse en lot

**POST** `/keywords/bulk-analyze`

Analyse plusieurs mots-clés simultanément.

#### Paramètres

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `keywords` | array | ✅ | Liste des mots-clés (max 50) |
| `platform` | string | ✅ | Plateforme |
| `includeRelated` | boolean | ❌ | Inclure les mots-clés liés |
| `includeTrends` | boolean | ❌ | Inclure les tendances |

#### Exemple de requête

```bash
curl -X POST https://api.digitallz.com/v1/keywords/bulk-analyze \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": [
      "digital marketing course",
      "online business course",
      "social media marketing"
    ],
    "platform": "amazon",
    "includeRelated": true
  }'
```

---

## 📈 Endpoints de métriques

### Dashboard

**GET** `/analytics/dashboard`

Récupère les métriques du dashboard.

#### Exemple de requête

```bash
curl "https://api.digitallz.com/v1/analytics/dashboard" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Tendances globales

**GET** `/analytics/trends`

Récupère les tendances globales des plateformes.

#### Paramètres de requête

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `timeRange` | string | ❌ | Période (7d, 30d, 90d, 1y) |
| `platform` | string | ❌ | Plateforme (toutes si non spécifié) |

#### Exemple de requête

```bash
curl "https://api.digitallz.com/v1/analytics/trends?timeRange=30d&platform=amazon" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Comparaison des plateformes

**GET** `/analytics/platforms`

Compare les métriques entre les plateformes.

#### Exemple de requête

```bash
curl "https://api.digitallz.com/v1/analytics/platforms" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## ⚠️ Gestion des erreurs

### Codes d'erreur HTTP

| Code | Description |
|------|-------------|
| `200` | Succès |
| `400` | Requête invalide |
| `401` | Non autorisé |
| `403` | Accès interdit |
| `404` | Ressource non trouvée |
| `429` | Limite de taux dépassée |
| `500` | Erreur serveur |

### Format des erreurs

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Le paramètre 'keyword' est requis",
    "details": {
      "field": "keyword",
      "reason": "missing_required_field"
    }
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0.0"
  }
}
```

### Codes d'erreur personnalisés

| Code | Description |
|------|-------------|
| `INVALID_REQUEST` | Requête invalide |
| `MISSING_API_KEY` | Clé API manquante |
| `INVALID_API_KEY` | Clé API invalide |
| `RATE_LIMIT_EXCEEDED` | Limite de taux dépassée |
| `PLATFORM_NOT_SUPPORTED` | Plateforme non supportée |
| `KEYWORD_TOO_SHORT` | Mot-clé trop court |
| `KEYWORD_TOO_LONG` | Mot-clé trop long |
| `INVALID_DATE_RANGE` | Période invalide |
| `QUOTA_EXCEEDED` | Quota dépassé |

---

## 🔒 Limites et quotas

### Limites par plan

| Plan | Requêtes/mois | Requêtes/minute | Mots-clés/batch |
|------|---------------|-----------------|-----------------|
| Gratuit | 100 | 10 | 5 |
| Pro | 1,000 | 60 | 25 |
| Business | 10,000 | 300 | 50 |
| Enterprise | Illimité | 1,000 | 100 |

### Headers de limite

Chaque réponse inclut des headers indiquant vos limites :

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1642248000
X-Quota-Limit: 1000
X-Quota-Remaining: 999
X-Quota-Reset: 1642248000
```

---

## 🔐 Authentification

### Clé API

Obtenez votre clé API dans votre tableau de bord :

1. Connectez-vous à [digitallz.com](https://digitallz.com)
2. Allez dans "Paramètres" > "API"
3. Générez une nouvelle clé
4. Copiez et sauvegardez-la

### Utilisation

Incluez votre clé API dans l'header `Authorization` :

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://api.digitallz.com/v1/keywords/search
```

### Rotation des clés

- Les clés API n'expirent pas automatiquement
- Vous pouvez les régénérer à tout moment
- L'ancienne clé devient invalide immédiatement

---

## 📚 SDKs et exemples

### JavaScript/Node.js

```bash
npm install digitallz-api
```

```javascript
const DigitallzAPI = require('digitallz-api');

const api = new DigitallzAPI('YOUR_API_KEY');

// Recherche de mots-clés
const result = await api.keywords.search({
  keyword: 'digital marketing course',
  platform: 'amazon',
  includeRelated: true
});

console.log(result.data);
```

### Python

```bash
pip install digitallz-api
```

```python
from digitallz import DigitallzAPI

api = DigitallzAPI('YOUR_API_KEY')

# Recherche de mots-clés
result = api.keywords.search(
    keyword='digital marketing course',
    platform='amazon',
    include_related=True
)

print(result.data)
```

### PHP

```bash
composer require digitallz/api-client
```

```php
<?php
require_once 'vendor/autoload.php';

use Digitallz\API\Client;

$api = new Client('YOUR_API_KEY');

// Recherche de mots-clés
$result = $api->keywords->search([
    'keyword' => 'digital marketing course',
    'platform' => 'amazon',
    'includeRelated' => true
]);

echo json_encode($result->data);
?>
```

---

## 🔗 Webhooks

### Configuration

Configurez vos webhooks dans votre tableau de bord :

1. Allez dans "Paramètres" > "Webhooks"
2. Ajoutez une URL de webhook
3. Sélectionnez les événements à écouter
4. Testez votre configuration

### Événements disponibles

| Événement | Description |
|-----------|-------------|
| `keyword.analyzed` | Mot-clé analysé |
| `opportunity.found` | Nouvelle opportunité détectée |
| `trend.changed` | Tendance modifiée |
| `quota.exceeded` | Quota dépassé |

### Format des webhooks

```json
{
  "event": "keyword.analyzed",
  "data": {
    "keyword": "digital marketing course",
    "platform": "amazon",
    "volume": 1500,
    "competition": 0.6,
    "opportunity": 0.8
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 🆘 Support

### Documentation

- **📖 Guide complet** : [docs.digitallz.com](https://docs.digitallz.com)
- **🎥 Tutoriels vidéo** : [youtube.com/digitallz](https://youtube.com/digitallz)
- **💬 Communauté** : [community.digitallz.com](https://community.digitallz.com)

### Contact

- **📧 Email** : api-support@digitallz.com
- **💬 Chat** : Disponible sur la plateforme
- **📱 Téléphone** : +33 1 23 45 67 89

### Status

- **📊 Status API** : [status.digitallz.com](https://status.digitallz.com)
- **🐛 Bug reports** : [github.com/digitallz/api/issues](https://github.com/digitallz/api/issues)

---

*Dernière mise à jour : Janvier 2024*
*Version API : 1.0.0*
