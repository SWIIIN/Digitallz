# 🔄 Data Processing Architecture - Python + FastAPI

## 📁 Structure du projet

```
data-processor/
├── src/
│   ├── collectors/           # Collecteurs de données
│   │   ├── amazon_collector.py
│   │   ├── etsy_collector.py
│   │   ├── ebay_collector.py
│   │   └── base_collector.py
│   ├── processors/          # Processeurs de données
│   │   ├── keyword_processor.py
│   │   ├── trend_analyzer.py
│   │   ├── competitor_analyzer.py
│   │   └── ml_processor.py
│   ├── models/              # Modèles ML
│   │   ├── keyword_model.py
│   │   ├── trend_model.py
│   │   └── prediction_model.py
│   ├── services/            # Services métier
│   │   ├── data_service.py
│   │   ├── ml_service.py
│   │   └── api_service.py
│   ├── utils/               # Utilitaires
│   │   ├── database.py
│   │   ├── cache.py
│   │   ├── logger.py
│   │   └── helpers.py
│   ├── config/              # Configuration
│   │   ├── settings.py
│   │   ├── database.py
│   │   └── external_apis.py
│   └── main.py              # Point d'entrée FastAPI
├── tests/
├── requirements.txt
├── Dockerfile
└── README.md
```

## 🎯 Collecteurs de données

### Collecteur Amazon
```python
# src/collectors/amazon_collector.py
import asyncio
import aiohttp
from typing import List, Dict, Optional
from dataclasses import dataclass
from .base_collector import BaseCollector

@dataclass
class AmazonKeywordData:
    keyword: str
    search_volume: int
    competition: float
    cpc: float
    trend_score: float
    related_keywords: List[str]
    last_updated: str

class AmazonCollector(BaseCollector):
    def __init__(self, api_key: str, base_url: str):
        super().__init__(api_key, base_url)
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            headers={
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def collect_keyword_data(self, keyword: str) -> AmazonKeywordData:
        """Collecte les données d'un mot-clé depuis l'API Amazon"""
        try:
            # Recherche du mot-clé
            search_data = await self._search_keyword(keyword)
            
            # Analyse des tendances
            trend_data = await self._get_trend_data(keyword)
            
            # Mots-clés liés
            related_keywords = await self._get_related_keywords(keyword)
            
            return AmazonKeywordData(
                keyword=keyword,
                search_volume=search_data.get('search_volume', 0),
                competition=search_data.get('competition', 0.0),
                cpc=search_data.get('cpc', 0.0),
                trend_score=trend_data.get('trend_score', 0.0),
                related_keywords=related_keywords,
                last_updated=self._get_timestamp()
            )
            
        except Exception as e:
            self.logger.error(f"Erreur lors de la collecte Amazon pour {keyword}: {e}")
            raise
    
    async def _search_keyword(self, keyword: str) -> Dict:
        """Recherche un mot-clé via l'API Amazon"""
        url = f"{self.base_url}/keywords/search"
        payload = {
            "keyword": keyword,
            "include_metrics": True,
            "include_trends": True
        }
        
        async with self.session.post(url, json=payload) as response:
            if response.status == 200:
                return await response.json()
            else:
                raise Exception(f"API Amazon error: {response.status}")
    
    async def _get_trend_data(self, keyword: str) -> Dict:
        """Récupère les données de tendance pour un mot-clé"""
        url = f"{self.base_url}/keywords/trends"
        params = {"keyword": keyword, "period": "30d"}
        
        async with self.session.get(url, params=params) as response:
            if response.status == 200:
                return await response.json()
            else:
                return {"trend_score": 0.0}
    
    async def _get_related_keywords(self, keyword: str) -> List[str]:
        """Récupère les mots-clés liés"""
        url = f"{self.base_url}/keywords/related"
        params = {"keyword": keyword, "limit": 10}
        
        async with self.session.get(url, params=params) as response:
            if response.status == 200:
                data = await response.json()
                return data.get('related_keywords', [])
            else:
                return []
    
    async def collect_batch_keywords(self, keywords: List[str]) -> List[AmazonKeywordData]:
        """Collecte les données pour plusieurs mots-clés en parallèle"""
        tasks = [self.collect_keyword_data(keyword) for keyword in keywords]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filtrer les erreurs
        valid_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                self.logger.error(f"Erreur pour {keywords[i]}: {result}")
            else:
                valid_results.append(result)
        
        return valid_results
```

### Collecteur Etsy
```python
# src/collectors/etsy_collector.py
import asyncio
import aiohttp
from typing import List, Dict
from dataclasses import dataclass
from .base_collector import BaseCollector

@dataclass
class EtsyKeywordData:
    keyword: str
    search_volume: int
    competition: float
    cpc: float
    trend_score: float
    related_keywords: List[str]
    category_data: Dict
    last_updated: str

class EtsyCollector(BaseCollector):
    def __init__(self, api_key: str, base_url: str):
        super().__init__(api_key, base_url)
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            headers={
                'Authorization': f'Bearer {self.api_key}',
                'User-Agent': 'Digitallz-Keyword-Collector/1.0'
            }
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def collect_keyword_data(self, keyword: str) -> EtsyKeywordData:
        """Collecte les données d'un mot-clé depuis l'API Etsy"""
        try:
            # Recherche du mot-clé
            search_data = await self._search_keyword(keyword)
            
            # Analyse des tendances
            trend_data = await self._get_trend_data(keyword)
            
            # Mots-clés liés
            related_keywords = await self._get_related_keywords(keyword)
            
            # Données de catégorie
            category_data = await self._get_category_data(keyword)
            
            return EtsyKeywordData(
                keyword=keyword,
                search_volume=search_data.get('search_volume', 0),
                competition=search_data.get('competition', 0.0),
                cpc=search_data.get('cpc', 0.0),
                trend_score=trend_data.get('trend_score', 0.0),
                related_keywords=related_keywords,
                category_data=category_data,
                last_updated=self._get_timestamp()
            )
            
        except Exception as e:
            self.logger.error(f"Erreur lors de la collecte Etsy pour {keyword}: {e}")
            raise
    
    async def _search_keyword(self, keyword: str) -> Dict:
        """Recherche un mot-clé via l'API Etsy"""
        url = f"{self.base_url}/keywords/search"
        params = {
            "keyword": keyword,
            "include_metrics": True
        }
        
        async with self.session.get(url, params=params) as response:
            if response.status == 200:
                return await response.json()
            else:
                raise Exception(f"API Etsy error: {response.status}")
    
    async def _get_trend_data(self, keyword: str) -> Dict:
        """Récupère les données de tendance pour un mot-clé"""
        url = f"{self.base_url}/keywords/trends"
        params = {"keyword": keyword, "period": "30d"}
        
        async with self.session.get(url, params=params) as response:
            if response.status == 200:
                return await response.json()
            else:
                return {"trend_score": 0.0}
    
    async def _get_related_keywords(self, keyword: str) -> List[str]:
        """Récupère les mots-clés liés"""
        url = f"{self.base_url}/keywords/related"
        params = {"keyword": keyword, "limit": 10}
        
        async with self.session.get(url, params=params) as response:
            if response.status == 200:
                data = await response.json()
                return data.get('related_keywords', [])
            else:
                return []
    
    async def _get_category_data(self, keyword: str) -> Dict:
        """Récupère les données de catégorie"""
        url = f"{self.base_url}/keywords/categories"
        params = {"keyword": keyword}
        
        async with self.session.get(url, params=params) as response:
            if response.status == 200:
                return await response.json()
            else:
                return {}
```

## 🔄 Processeurs de données

### Processeur de mots-clés
```python
# src/processors/keyword_processor.py
import pandas as pd
import numpy as np
from typing import List, Dict, Optional
from dataclasses import dataclass
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import cosine_similarity

@dataclass
class ProcessedKeywordData:
    keyword: str
    platform: str
    search_volume: int
    competition: float
    cpc: float
    trend_score: float
    difficulty_score: float
    opportunity_score: float
    related_keywords: List[str]
    cluster_id: Optional[int] = None

class KeywordProcessor:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2)
        )
        self.clusterer = KMeans(n_clusters=10, random_state=42)
    
    def process_keyword_data(self, raw_data: List[Dict]) -> List[ProcessedKeywordData]:
        """Traite les données brutes de mots-clés"""
        processed_data = []
        
        for data in raw_data:
            # Calculer le score de difficulté
            difficulty_score = self._calculate_difficulty_score(data)
            
            # Calculer le score d'opportunité
            opportunity_score = self._calculate_opportunity_score(data)
            
            # Traiter les mots-clés liés
            related_keywords = self._process_related_keywords(data.get('related_keywords', []))
            
            processed = ProcessedKeywordData(
                keyword=data['keyword'],
                platform=data['platform'],
                search_volume=data.get('search_volume', 0),
                competition=data.get('competition', 0.0),
                cpc=data.get('cpc', 0.0),
                trend_score=data.get('trend_score', 0.0),
                difficulty_score=difficulty_score,
                opportunity_score=opportunity_score,
                related_keywords=related_keywords
            )
            
            processed_data.append(processed)
        
        # Clustering des mots-clés
        self._cluster_keywords(processed_data)
        
        return processed_data
    
    def _calculate_difficulty_score(self, data: Dict) -> float:
        """Calcule un score de difficulté basé sur la concurrence et le CPC"""
        competition = data.get('competition', 0.0)
        cpc = data.get('cpc', 0.0)
        search_volume = data.get('search_volume', 0)
        
        # Score basé sur la concurrence (0-1)
        competition_score = min(competition, 1.0)
        
        # Score basé sur le CPC (0-1)
        cpc_score = min(cpc / 10.0, 1.0)  # Normaliser le CPC
        
        # Score basé sur le volume de recherche (inversé)
        volume_score = 1.0 - min(search_volume / 10000, 1.0)
        
        # Moyenne pondérée
        difficulty = (competition_score * 0.4 + cpc_score * 0.3 + volume_score * 0.3)
        
        return round(difficulty, 3)
    
    def _calculate_opportunity_score(self, data: Dict) -> float:
        """Calcule un score d'opportunité basé sur le volume et les tendances"""
        search_volume = data.get('search_volume', 0)
        trend_score = data.get('trend_score', 0.0)
        competition = data.get('competition', 0.0)
        
        # Score basé sur le volume (0-1)
        volume_score = min(search_volume / 5000, 1.0)
        
        # Score basé sur les tendances (0-1)
        trend_score_norm = max(0, min(trend_score, 1.0))
        
        # Score basé sur la concurrence (inversé)
        competition_score = 1.0 - min(competition, 1.0)
        
        # Moyenne pondérée
        opportunity = (volume_score * 0.4 + trend_score_norm * 0.3 + competition_score * 0.3)
        
        return round(opportunity, 3)
    
    def _process_related_keywords(self, related_keywords: List[str]) -> List[str]:
        """Traite et filtre les mots-clés liés"""
        if not related_keywords:
            return []
        
        # Filtrer les mots-clés trop courts ou trop longs
        filtered = [
            kw for kw in related_keywords
            if 3 <= len(kw) <= 50 and kw.isalpha()
        ]
        
        # Limiter à 10 mots-clés
        return filtered[:10]
    
    def _cluster_keywords(self, processed_data: List[ProcessedKeywordData]):
        """Groupe les mots-clés en clusters basés sur la similarité"""
        if len(processed_data) < 2:
            return
        
        # Préparer les données pour le clustering
        keywords = [data.keyword for data in processed_data]
        
        # Vectoriser les mots-clés
        try:
            vectors = self.vectorizer.fit_transform(keywords)
            
            # Clustering
            cluster_labels = self.clusterer.fit_predict(vectors)
            
            # Assigner les clusters
            for i, data in enumerate(processed_data):
                data.cluster_id = int(cluster_labels[i])
                
        except Exception as e:
            self.logger.error(f"Erreur lors du clustering: {e}")
    
    def analyze_keyword_trends(self, keyword_data: List[ProcessedKeywordData]) -> Dict:
        """Analyse les tendances des mots-clés"""
        if not keyword_data:
            return {}
        
        # Statistiques générales
        total_keywords = len(keyword_data)
        avg_search_volume = np.mean([data.search_volume for data in keyword_data])
        avg_competition = np.mean([data.competition for data in keyword_data])
        avg_opportunity = np.mean([data.opportunity_score for data in keyword_data])
        
        # Mots-clés les plus prometteurs
        top_opportunities = sorted(
            keyword_data,
            key=lambda x: x.opportunity_score,
            reverse=True
        )[:10]
        
        # Mots-clés en tendance
        trending_keywords = [
            data for data in keyword_data
            if data.trend_score > 0.7
        ]
        
        return {
            'total_keywords': total_keywords,
            'avg_search_volume': round(avg_search_volume, 2),
            'avg_competition': round(avg_competition, 3),
            'avg_opportunity': round(avg_opportunity, 3),
            'top_opportunities': [
                {
                    'keyword': data.keyword,
                    'opportunity_score': data.opportunity_score,
                    'search_volume': data.search_volume
                }
                for data in top_opportunities
            ],
            'trending_keywords': [
                {
                    'keyword': data.keyword,
                    'trend_score': data.trend_score,
                    'platform': data.platform
                }
                for data in trending_keywords
            ]
        }
```

### Analyseur de tendances
```python
# src/processors/trend_analyzer.py
import pandas as pd
import numpy as np
from typing import List, Dict, Tuple
from datetime import datetime, timedelta
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler

class TrendAnalyzer:
    def __init__(self):
        self.scaler = StandardScaler()
        self.model = LinearRegression()
    
    def analyze_trends(self, keyword_data: List[Dict]) -> Dict:
        """Analyse les tendances des mots-clés"""
        if not keyword_data:
            return {}
        
        # Convertir en DataFrame
        df = pd.DataFrame(keyword_data)
        
        # Analyser les tendances par plateforme
        platform_trends = self._analyze_platform_trends(df)
        
        # Analyser les tendances temporelles
        temporal_trends = self._analyze_temporal_trends(df)
        
        # Prédire les tendances futures
        future_predictions = self._predict_future_trends(df)
        
        return {
            'platform_trends': platform_trends,
            'temporal_trends': temporal_trends,
            'future_predictions': future_predictions,
            'analysis_date': datetime.now().isoformat()
        }
    
    def _analyze_platform_trends(self, df: pd.DataFrame) -> Dict:
        """Analyse les tendances par plateforme"""
        platform_stats = {}
        
        for platform in df['platform'].unique():
            platform_data = df[df['platform'] == platform]
            
            stats = {
                'total_keywords': len(platform_data),
                'avg_search_volume': platform_data['search_volume'].mean(),
                'avg_competition': platform_data['competition'].mean(),
                'avg_cpc': platform_data['cpc'].mean(),
                'trending_keywords': self._get_trending_keywords(platform_data),
                'emerging_keywords': self._get_emerging_keywords(platform_data)
            }
            
            platform_stats[platform] = stats
        
        return platform_stats
    
    def _analyze_temporal_trends(self, df: pd.DataFrame) -> Dict:
        """Analyse les tendances temporelles"""
        # Grouper par date si disponible
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
            daily_stats = df.groupby(df['date'].dt.date).agg({
                'search_volume': 'sum',
                'competition': 'mean',
                'cpc': 'mean'
            }).reset_index()
            
            # Calculer les tendances
            trends = self._calculate_trends(daily_stats)
            
            return {
                'daily_stats': daily_stats.to_dict('records'),
                'trends': trends
            }
        
        return {}
    
    def _predict_future_trends(self, df: pd.DataFrame) -> Dict:
        """Prédit les tendances futures"""
        if len(df) < 10:  # Pas assez de données
            return {}
        
        # Préparer les données pour la prédiction
        X = df[['search_volume', 'competition', 'cpc']].values
        y = df['trend_score'].values if 'trend_score' in df.columns else np.zeros(len(df))
        
        # Normaliser les données
        X_scaled = self.scaler.fit_transform(X)
        
        # Entraîner le modèle
        self.model.fit(X_scaled, y)
        
        # Prédire pour les prochains jours
        predictions = []
        for i in range(7):  # 7 jours
            # Simuler une évolution des données
            future_X = X_scaled + np.random.normal(0, 0.1, X_scaled.shape)
            prediction = self.model.predict(future_X)
            predictions.append({
                'day': i + 1,
                'predicted_trend': float(np.mean(prediction))
            })
        
        return {
            'predictions': predictions,
            'confidence': 0.75  # Score de confiance
        }
    
    def _get_trending_keywords(self, df: pd.DataFrame) -> List[Dict]:
        """Identifie les mots-clés en tendance"""
        if 'trend_score' not in df.columns:
            return []
        
        trending = df[df['trend_score'] > 0.7].nlargest(10, 'trend_score')
        
        return [
            {
                'keyword': row['keyword'],
                'trend_score': row['trend_score'],
                'search_volume': row['search_volume']
            }
            for _, row in trending.iterrows()
        ]
    
    def _get_emerging_keywords(self, df: pd.DataFrame) -> List[Dict]:
        """Identifie les mots-clés émergents"""
        # Mots-clés avec un volume de recherche croissant
        emerging = df[
            (df['search_volume'] > 100) & 
            (df['search_volume'] < 1000) &
            (df['competition'] < 0.5)
        ].nlargest(10, 'search_volume')
        
        return [
            {
                'keyword': row['keyword'],
                'search_volume': row['search_volume'],
                'competition': row['competition'],
                'opportunity_score': self._calculate_opportunity_score(row)
            }
            for _, row in emerging.iterrows()
        ]
    
    def _calculate_trends(self, df: pd.DataFrame) -> Dict:
        """Calcule les tendances des données temporelles"""
        trends = {}
        
        for column in ['search_volume', 'competition', 'cpc']:
            if column in df.columns:
                values = df[column].values
                if len(values) > 1:
                    # Calculer la pente de la tendance
                    x = np.arange(len(values))
                    slope = np.polyfit(x, values, 1)[0]
                    trends[column] = {
                        'slope': float(slope),
                        'direction': 'increasing' if slope > 0 else 'decreasing',
                        'strength': abs(slope)
                    }
        
        return trends
    
    def _calculate_opportunity_score(self, row: pd.Series) -> float:
        """Calcule un score d'opportunité pour un mot-clé"""
        search_volume = row.get('search_volume', 0)
        competition = row.get('competition', 0.0)
        
        # Score basé sur le volume (0-1)
        volume_score = min(search_volume / 5000, 1.0)
        
        # Score basé sur la concurrence (inversé)
        competition_score = 1.0 - min(competition, 1.0)
        
        # Moyenne pondérée
        opportunity = (volume_score * 0.6 + competition_score * 0.4)
        
        return round(opportunity, 3)
```

## 🤖 Modèles d'IA/ML

### Modèle de prédiction
```python
# src/models/prediction_model.py
import pandas as pd
import numpy as np
from typing import List, Dict, Tuple
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os

class KeywordPredictionModel:
    def __init__(self, model_path: str = None):
        self.model = RandomForestRegressor(
            n_estimators=100,
            random_state=42,
            max_depth=10
        )
        self.feature_columns = [
            'search_volume', 'competition', 'cpc', 'trend_score'
        ]
        self.model_path = model_path or 'models/keyword_prediction.joblib'
        self.is_trained = False
    
    def train(self, training_data: List[Dict]) -> Dict:
        """Entraîne le modèle de prédiction"""
        if not training_data:
            raise ValueError("Aucune donnée d'entraînement fournie")
        
        # Convertir en DataFrame
        df = pd.DataFrame(training_data)
        
        # Préparer les features et la target
        X = df[self.feature_columns].values
        y = df['success_score'].values if 'success_score' in df.columns else df['search_volume'].values
        
        # Diviser les données
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Entraîner le modèle
        self.model.fit(X_train, y_train)
        
        # Évaluer le modèle
        y_pred = self.model.predict(X_test)
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        self.is_trained = True
        
        # Sauvegarder le modèle
        self._save_model()
        
        return {
            'mse': mse,
            'r2_score': r2,
            'training_samples': len(X_train),
            'test_samples': len(X_test)
        }
    
    def predict(self, keyword_data: Dict) -> Dict:
        """Prédit le succès d'un mot-clé"""
        if not self.is_trained:
            raise ValueError("Le modèle n'est pas entraîné")
        
        # Préparer les features
        features = np.array([[
            keyword_data.get('search_volume', 0),
            keyword_data.get('competition', 0.0),
            keyword_data.get('cpc', 0.0),
            keyword_data.get('trend_score', 0.0)
        ]])
        
        # Faire la prédiction
        prediction = self.model.predict(features)[0]
        
        # Calculer la confiance
        confidence = self._calculate_confidence(features)
        
        return {
            'predicted_success': float(prediction),
            'confidence': confidence,
            'recommendation': self._get_recommendation(prediction, confidence)
        }
    
    def _calculate_confidence(self, features: np.ndarray) -> float:
        """Calcule la confiance de la prédiction"""
        # Utiliser la variance des prédictions des arbres
        predictions = []
        for tree in self.model.estimators_:
            pred = tree.predict(features)[0]
            predictions.append(pred)
        
        variance = np.var(predictions)
        confidence = max(0, 1 - variance)
        
        return round(confidence, 3)
    
    def _get_recommendation(self, prediction: float, confidence: float) -> str:
        """Génère une recommandation basée sur la prédiction"""
        if confidence < 0.5:
            return "Données insuffisantes pour une recommandation fiable"
        
        if prediction > 0.7:
            return "Excellente opportunité - Recommandé"
        elif prediction > 0.5:
            return "Bonne opportunité - À considérer"
        elif prediction > 0.3:
            return "Opportunité modérée - Analyser davantage"
        else:
            return "Faible opportunité - Non recommandé"
    
    def _save_model(self):
        """Sauvegarde le modèle entraîné"""
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        joblib.dump(self.model, self.model_path)
    
    def load_model(self):
        """Charge un modèle sauvegardé"""
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)
            self.is_trained = True
```

## 🚀 API FastAPI

### Point d'entrée principal
```python
# src/main.py
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
import asyncio
from .services.data_service import DataService
from .services.ml_service import MLService
from .collectors.amazon_collector import AmazonCollector
from .processors.keyword_processor import KeywordProcessor

app = FastAPI(
    title="Digitallz Data Processor",
    description="API de traitement des données de mots-clés",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Services
data_service = DataService()
ml_service = MLService()
keyword_processor = KeywordProcessor()

@app.get("/")
async def root():
    return {"message": "Digitallz Data Processor API"}

@app.post("/collect/keywords")
async def collect_keywords(
    keywords: List[str],
    platforms: List[str] = ["amazon", "etsy"],
    background_tasks: BackgroundTasks = None
):
    """Collecte les données de mots-clés"""
    try:
        # Lancer la collecte en arrière-plan
        background_tasks.add_task(
            _collect_keywords_task,
            keywords,
            platforms
        )
        
        return {
            "message": "Collecte lancée en arrière-plan",
            "keywords": keywords,
            "platforms": platforms
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/process/keywords")
async def process_keywords(limit: int = 100):
    """Traite les données de mots-clés collectées"""
    try:
        # Récupérer les données brutes
        raw_data = await data_service.get_raw_keyword_data(limit)
        
        # Traiter les données
        processed_data = keyword_processor.process_keyword_data(raw_data)
        
        # Sauvegarder les données traitées
        await data_service.save_processed_data(processed_data)
        
        return {
            "message": "Données traitées avec succès",
            "processed_count": len(processed_data)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analyze/trends")
async def analyze_trends(platform: str = None):
    """Analyse les tendances des mots-clés"""
    try:
        # Récupérer les données traitées
        processed_data = await data_service.get_processed_keyword_data(platform)
        
        # Analyser les tendances
        trends = keyword_processor.analyze_keyword_trends(processed_data)
        
        return {
            "trends": trends,
            "platform": platform or "all"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/success")
async def predict_keyword_success(keyword_data: Dict):
    """Prédit le succès d'un mot-clé"""
    try:
        # Charger le modèle ML
        model = ml_service.get_prediction_model()
        
        # Faire la prédiction
        prediction = model.predict(keyword_data)
        
        return {
            "prediction": prediction,
            "input_data": keyword_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def _collect_keywords_task(keywords: List[str], platforms: List[str]):
    """Tâche de collecte en arrière-plan"""
    try:
        for platform in platforms:
            if platform == "amazon":
                async with AmazonCollector(
                    api_key="your_amazon_api_key",
                    base_url="https://api.amazon.com"
                ) as collector:
                    await collector.collect_batch_keywords(keywords)
            
            elif platform == "etsy":
                async with EtsyCollector(
                    api_key="your_etsy_api_key",
                    base_url="https://api.etsy.com"
                ) as collector:
                    await collector.collect_batch_keywords(keywords)
        
        print(f"Collecte terminée pour {len(keywords)} mots-clés sur {len(platforms)} plateformes")
        
    except Exception as e:
        print(f"Erreur lors de la collecte: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## 🔄 Orchestration

### Tâches programmées
```python
# src/scheduler.py
import asyncio
import schedule
import time
from datetime import datetime
from .services.data_service import DataService
from .collectors.amazon_collector import AmazonCollector
from .processors.keyword_processor import KeywordProcessor

class TaskScheduler:
    def __init__(self):
        self.data_service = DataService()
        self.keyword_processor = KeywordProcessor()
    
    def schedule_tasks(self):
        """Programme les tâches récurrentes"""
        # Collecte quotidienne à 2h du matin
        schedule.every().day.at("02:00").do(self.daily_keyword_collection)
        
        # Traitement des données toutes les 4 heures
        schedule.every(4).hours.do(self.process_keyword_data)
        
        # Analyse des tendances quotidienne à 6h du matin
        schedule.every().day.at("06:00").do(self.analyze_trends)
        
        # Nettoyage des données anciennes hebdomadaire
        schedule.every().sunday.at("03:00").do(self.cleanup_old_data)
    
    def daily_keyword_collection(self):
        """Collecte quotidienne des mots-clés"""
        print(f"Début de la collecte quotidienne: {datetime.now()}")
        
        # Mots-clés à collecter quotidiennement
        daily_keywords = [
            "digital products", "online courses", "ebooks", "templates",
            "software", "apps", "designs", "graphics", "music", "videos"
        ]
        
        # Lancer la collecte
        asyncio.run(self._collect_keywords(daily_keywords))
        
        print("Collecte quotidienne terminée")
    
    def process_keyword_data(self):
        """Traite les données de mots-clés"""
        print(f"Début du traitement des données: {datetime.now()}")
        
        # Traiter les données brutes
        asyncio.run(self._process_data())
        
        print("Traitement des données terminé")
    
    def analyze_trends(self):
        """Analyse les tendances"""
        print(f"Début de l'analyse des tendances: {datetime.now()}")
        
        # Analyser les tendances
        asyncio.run(self._analyze_trends())
        
        print("Analyse des tendances terminée")
    
    def cleanup_old_data(self):
        """Nettoie les données anciennes"""
        print(f"Début du nettoyage: {datetime.now()}")
        
        # Supprimer les données de plus de 90 jours
        asyncio.run(self._cleanup_data())
        
        print("Nettoyage terminé")
    
    async def _collect_keywords(self, keywords: List[str]):
        """Collecte les mots-clés"""
        platforms = ["amazon", "etsy", "ebay"]
        
        for platform in platforms:
            try:
                if platform == "amazon":
                    async with AmazonCollector(
                        api_key="your_api_key",
                        base_url="https://api.amazon.com"
                    ) as collector:
                        await collector.collect_batch_keywords(keywords)
                
                # Attendre entre les plateformes
                await asyncio.sleep(5)
                
            except Exception as e:
                print(f"Erreur lors de la collecte {platform}: {e}")
    
    async def _process_data(self):
        """Traite les données"""
        try:
            # Récupérer les données brutes
            raw_data = await self.data_service.get_raw_keyword_data(1000)
            
            # Traiter les données
            processed_data = self.keyword_processor.process_keyword_data(raw_data)
            
            # Sauvegarder
            await self.data_service.save_processed_data(processed_data)
            
        except Exception as e:
            print(f"Erreur lors du traitement: {e}")
    
    async def _analyze_trends(self):
        """Analyse les tendances"""
        try:
            # Récupérer les données traitées
            processed_data = await self.data_service.get_processed_keyword_data()
            
            # Analyser les tendances
            trends = self.keyword_processor.analyze_keyword_trends(processed_data)
            
            # Sauvegarder l'analyse
            await self.data_service.save_trend_analysis(trends)
            
        except Exception as e:
            print(f"Erreur lors de l'analyse: {e}")
    
    async def _cleanup_data(self):
        """Nettoie les données anciennes"""
        try:
            # Supprimer les données de plus de 90 jours
            await self.data_service.cleanup_old_data(days=90)
            
        except Exception as e:
            print(f"Erreur lors du nettoyage: {e}")
    
    def run(self):
        """Lance le planificateur"""
        print("Démarrage du planificateur de tâches")
        
        while True:
            schedule.run_pending()
            time.sleep(60)  # Vérifier toutes les minutes

if __name__ == "__main__":
    scheduler = TaskScheduler()
    scheduler.schedule_tasks()
    scheduler.run()
```

## 🐳 Déploiement Docker

### Dockerfile
```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Installer les dépendances système
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copier les fichiers de dépendances
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code source
COPY . .

# Créer le répertoire des modèles
RUN mkdir -p models

# Exposer le port
EXPOSE 8000

# Commande de démarrage
CMD ["python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  data-processor:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/digitallz
      - REDIS_URL=redis://redis:6379
      - AMAZON_API_KEY=your_amazon_api_key
      - ETSY_API_KEY=your_etsy_api_key
    depends_on:
      - db
      - redis
    volumes:
      - ./models:/app/models
      - ./logs:/app/logs

  scheduler:
    build: .
    command: python src/scheduler.py
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/digitallz
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - ./models:/app/models
      - ./logs:/app/logs

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=digitallz
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

Cette architecture de traitement des données est conçue pour être **scalable**, **performante** et **maintenable**. Elle peut traiter des millions de mots-clés et s'adapter à la croissance de votre plateforme.
