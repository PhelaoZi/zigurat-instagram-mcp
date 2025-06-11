# 🔧 API Reference - Zigurat Instagram MCP

> Documentación técnica completa de las herramientas y funciones disponibles en el MCP

## 📋 Índice

- [Herramientas Principales](#herramientas-principales)
- [Configuración](#configuración)
- [Tipos de Datos](#tipos-de-datos)
- [Manejo de Errores](#manejo-de-errores)
- [Límites y Consideraciones](#límites-y-consideraciones)

## 🛠️ Herramientas Principales

### `analyze_instagram_profile`

Analiza un perfil completo de Instagram extrayendo métricas y metadatos.

**Parámetros:**
```typescript
{
  username: string;           // Handle de Instagram (sin @)
  maxPosts?: number;          // Máximo posts a analizar (default: 50)
  includeStories?: boolean;   // Incluir stories highlights (default: false)
  includeReels?: boolean;     // Incluir reels en análisis (default: true)
}
```

**Respuesta:**
```typescript
{
  profile: {
    username: string;
    fullName: string;
    biography: string;
    followersCount: number;
    followingCount: number;
    postsCount: number;
    isVerified: boolean;
    isPrivate: boolean;
    profilePicUrl: string;
  };
  posts: Post[];
  analytics: {
    avgEngagementRate: number;
    avgLikes: number;
    avgComments: number;
    topHashtags: string[];
    bestPostingTimes: string[];
  };
}
```

**Ejemplo de uso:**
```javascript
const result = await analyzeInstagramProfile({
  username: "zigurat_cca",
  maxPosts: 30,
  includeReels: true
});
```

### `compare_instagram_profiles`

Compara múltiples perfiles de Instagram para análisis competitivo.

**Parámetros:**
```typescript
{
  usernames: string[];        // Array de usernames a comparar
  maxPosts: number;           // Posts por perfil (default: 20)
  metrics: string[];          // Métricas a comparar (default: todas)
}
```

**Respuesta:**
```typescript
{
  comparison: {
    [username: string]: {
      engagementRate: number;
      avgLikes: number;
      avgComments: number;
      postingFrequency: number;
      topHashtags: string[];
    };
  };
  insights: {
    leader: string;           // Perfil con mejor engagement
    opportunities: string[];  // Áreas de mejora identificadas
    recommendations: string[];
  };
}
```

### `analyze_hashtag_performance`

Analiza el rendimiento de hashtags específicos.

**Parámetros:**
```typescript
{
  username: string;
  hashtags?: string[];        // Hashtags específicos (opcional)
  timeframe?: string;         // '7d', '30d', '90d' (default: '30d')
  minOccurrences?: number;    // Mínimo apariciones (default: 2)
}
```

**Respuesta:**
```typescript
{
  hashtagAnalysis: {
    [hashtag: string]: {
      occurrences: number;
      avgEngagement: number;
      avgLikes: number;
      avgComments: number;
      trend: 'up' | 'down' | 'stable';
    };
  };
  recommendations: {
    topPerforming: string[];
    underperforming: string[];
    suggested: string[];
  };
}
```

### `prospect_bars_analysis`

Analiza bares y restaurantes como potenciales clientes.

**Parámetros:**
```typescript
{
  usernames: string[];        // Handles de bares a analizar
  criteria: {
    craftBeerFocus: boolean;  // Filtrar por enfoque cerveza artesanal
    minEngagement: number;    // Engagement mínimo requerido
    audienceSize: 'small' | 'medium' | 'large';
  };
}
```

**Respuesta:**
```typescript
{
  prospects: {
    [username: string]: {
      score: number;            // Score 1-100 de compatibilidad
      profile: InstagramProfile;
      analysis: {
        craftBeerMentions: number;
        competitorMentions: string[];
        audienceCompatibility: number;
        engagementQuality: number;
      };
      recommendation: 'high' | 'medium' | 'low' | 'skip';
      reasoning: string;
    };
  };
  summary: {
    totalAnalyzed: number;
    highPriority: number;
    mediumPriority: number;
    recommended: string[];    // Top usernames recomendados
  };
}
```

### `generate_content_ideas`

Genera ideas de contenido basadas en análisis de performance.

**Parámetros:**
```typescript
{
  username: string;
  contentType?: 'post' | 'story' | 'reel' | 'all';
  basedOn: 'top_performing' | 'trending' | 'competitor_analysis';
  quantity: number;           // Número de ideas a generar
}
```

**Respuesta:**
```typescript
{
  ideas: {
    type: string;
    title: string;
    description: string;
    suggestedHashtags: string[];
    estimatedEngagement: number;
    bestTimingToPost: string;
    reasoning: string;
  }[];
  insights: {
    contentGaps: string[];    // Tipos de contenido faltantes
    opportunities: string[];  // Oportunidades identificadas
  };
}
```

## ⚙️ Configuración

### Variables de Entorno

```env
# Requeridas
APIFY_API_TOKEN=your_token_here

# Configuración de Instagram
ZIGURAT_INSTAGRAM_HANDLE=zigurat_cca
COMPETITORS_HANDLES=kunstmann_chile,tropera_brewing

# Límites de análisis
MAX_POSTS_PER_ANALYSIS=50
ANALYSIS_FREQUENCY_HOURS=24

# Configuración de cache
CACHE_DURATION_MINUTES=60
CACHE_MAX_SIZE_MB=100

# Configuración de reportes
REPORTS_OUTPUT_PATH=./data/reports
DATA_RETENTION_DAYS=90
```

### Configuración MCP Server

```json
{
  "name": "zigurat-instagram",
  "version": "1.0.0",
  "capabilities": {
    "tools": true,
    "resources": true,
    "prompts": false
  },
  "rateLimits": {
    "requestsPerMinute": 30,
    "requestsPerHour": 500
  },
  "caching": {
    "enabled": true,
    "ttl": 3600
  }
}
```

## 📊 Tipos de Datos

### `InstagramProfile`

```typescript
interface InstagramProfile {
  username: string;
  fullName: string;
  biography: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isVerified: boolean;
  isPrivate: boolean;
  profilePicUrl: string;
  externalUrl?: string;
  category?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
}
```

### `InstagramPost`

```typescript
interface InstagramPost {
  id: string;
  shortcode: string;
  timestamp: Date;
  caption: string;
  likesCount: number;
  commentsCount: number;
  mediaType: 'image' | 'video' | 'carousel';
  mediaUrl: string;
  hashtags: string[];
  mentions: string[];
  location?: {
    name: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  engagement: {
    rate: number;
    quality: 'high' | 'medium' | 'low';
  };
}
```

### `AnalyticsMetrics`

```typescript
interface AnalyticsMetrics {
  engagementRate: number;     // (likes + comments) / followers * 100
  avgLikes: number;
  avgComments: number;
  avgViews?: number;          // Para videos/reels
  growthRate: number;         // Crecimiento de followers
  postingFrequency: number;   // Posts por semana
  bestPostingTimes: string[]; // Horarios óptimos
  topHashtags: string[];
  audienceInsights: {
    primaryDemographic: string;
    engagementPatterns: string[];
  };
}
```

## 🚨 Manejo de Errores

### Códigos de Error

| Código | Descripción | Acción Recomendada |
|--------|-------------|--------------------|
| `AUTH_FAILED` | Token Apify inválido | Verificar APIFY_API_TOKEN |
| `RATE_LIMITED` | Límite de requests excedido | Esperar y reintentar |
| `PROFILE_NOT_FOUND` | Usuario no existe | Verificar username |
| `PROFILE_PRIVATE` | Perfil privado | Solo análisis básico disponible |
| `INSUFFICIENT_DATA` | Pocos posts para análisis | Reducir maxPosts o usar perfil más activo |
| `SCRAPING_BLOCKED` | Instagram bloqueó scraping | Esperar 1 hora y reintentar |

### Manejo de Errores en Código

```typescript
try {
  const result = await analyzeInstagramProfile({ username: "zigurat_cca" });
} catch (error) {
  if (error.code === 'RATE_LIMITED') {
    // Implementar retry con backoff exponencial
    await delay(error.retryAfter * 1000);
    return retry();
  } else if (error.code === 'PROFILE_PRIVATE') {
    // Análisis limitado para perfiles privados
    return basicAnalysis(username);
  } else {
    // Log error y notificar
    console.error('Instagram analysis failed:', error);
    throw error;
  }
}
```

## ⚡ Límites y Consideraciones

### Límites de Apify

- **Plan Gratuito:** $5 USD/mes (~2,100 posts)
- **Rate Limits:** 30 requests/minuto
- **Concurrencia:** 5 requests simultáneos
- **Timeout:** 300 segundos por request

### Límites de Instagram

- **Datos Públicos:** Solo perfiles y posts públicos
- **Rate Limiting:** Instagram puede bloquear IPs temporalmente
- **Datos Sensibles:** No se extraen emails, teléfonos, etc.
- **Stories:** Solo highlights públicos disponibles

### Consideraciones de Performance

```typescript
// Análisis eficiente para múltiples perfiles
const profiles = await Promise.all([
  analyzeInstagramProfile({ username: "zigurat_cca", maxPosts: 20 }),
  analyzeInstagramProfile({ username: "kunstmann_chile", maxPosts: 20 })
]);

// Cache para evitar re-análisis
const cachedResult = await getCached(`profile:${username}`);
if (cachedResult && !isExpired(cachedResult)) {
  return cachedResult.data;
}
```

### Optimizaciones Recomendadas

1. **Batch Requests:** Agrupa múltiples usernames en una sola llamada
2. **Caching Inteligente:** Cache resultados por 1 hora para datos que cambian poco
3. **Análisis Incremental:** Solo analiza posts nuevos desde último análisis
4. **Filtros Tempranos:** Filtra perfiles privados antes de análisis completo

---

## 🔗 Referencias Externas

- [Apify Instagram Scrapers](https://apify.com/store?search=instagram)
- [Model Context Protocol Docs](https://modelcontextprotocol.io/)
- [Instagram API Limitations](https://developers.facebook.com/docs/instagram-api/)

---

📧 **¿Preguntas sobre la API?** Contacta a contacto@zigurat.cl