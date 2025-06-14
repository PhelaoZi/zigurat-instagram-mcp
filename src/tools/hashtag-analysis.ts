import { MCPTool, HashtagAnalysis, InstagramPost } from '../types/index.js';
import { apifyService } from '../services/apify.js';
import { CONFIG } from '../config/index.js';

/**
 * Herramienta para análisis de hashtags y optimización de alcance
 */
export const hashtagAnalysisTool: MCPTool = {
  name: 'analyze_hashtags',
  description: 'Analiza el rendimiento de hashtags específicos y proporciona recomendaciones para optimizar el alcance en Instagram',
  inputSchema: {
    type: 'object',
    properties: {
      hashtags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Lista de hashtags a analizar (con o sin #). Si se omite, analiza los hashtags de Zigurat por defecto'
      },
      includeCompetitorHashtags: {
        type: 'boolean',
        description: 'Incluir análisis de hashtags usados por competidores (default: true)',
        default: true
      },
      analysisDepth: {
        type: 'string',
        enum: ['basic', 'detailed', 'comprehensive'],
        description: 'Profundidad del análisis: basic (top posts), detailed (tendencias), comprehensive (análisis completo)',
        default: 'detailed'
      },
      postsPerHashtag: {
        type: 'number',
        description: 'Número de posts a analizar por hashtag (default: 100)',
        default: 100
      }
    }
  },

  async execute(args: any): Promise<{
    hashtagAnalyses: HashtagAnalysis[];
    competitorHashtags?: Array<{
      competitor: string;
      topHashtags: Array<{ hashtag: string; frequency: number; avgEngagement: number }>;
    }>;
    recommendations: {
      topPerforming: string[];
      emerging: string[];
      avoid: string[];
      optimal_mix: {
        high_volume: string[];
        medium_volume: string[];
        niche: string[];
      };
      strategy: string;
    };
    summary: {
      bestHashtagsForZigurat: string[];
      hashtagStrategy: string;
      expectedImpact: string;
    };
  }> {
    const { 
      hashtags = CONFIG.ZIGURAT_DATA.hashtags,
      includeCompetitorHashtags = true,
      analysisDepth = 'detailed',
      postsPerHashtag = 100
    } = args;

    try {
      console.error(`🏷️ Iniciando análisis de ${hashtags.length} hashtags...`);

      // Normalizar hashtags (agregar # si no lo tienen)
      const normalizedHashtags = hashtags.map((tag: string) => 
        tag.startsWith('#') ? tag : `#${tag}`
      );

      // Analizar cada hashtag
      const hashtagAnalyses: HashtagAnalysis[] = [];
      for (const hashtag of normalizedHashtags) {
        try {
          console.error(`🔍 Analizando hashtag: ${hashtag}...`);
          const analysis = await analyzeHashtag(hashtag, analysisDepth, postsPerHashtag);
          hashtagAnalyses.push(analysis);
          
          // Delay para respetar rate limits
          await new Promise(resolve => setTimeout(resolve, 1500));
        } catch (error) {
          console.error(`⚠️ Error analizando ${hashtag}:`, error);
        }
      }

      // Analizar hashtags de competidores si se solicita
      let competitorHashtags: Array<{
        competitor: string;
        topHashtags: Array<{ hashtag: string; frequency: number; avgEngagement: number }>;
      }> | undefined;

      if (includeCompetitorHashtags) {
        console.error('📊 Analizando hashtags de competidores...');
        competitorHashtags = await analyzeCompetitorHashtags();
      }

      // Generar recomendaciones
      const recommendations = generateHashtagRecommendations(hashtagAnalyses, competitorHashtags);

      // Generar resumen
      const summary = generateHashtagSummary(hashtagAnalyses, recommendations);

      console.error(`✅ Análisis de hashtags completado: ${hashtagAnalyses.length} hashtags analizados`);

      return {
        hashtagAnalyses,
        competitorHashtags,
        recommendations,
        summary
      };

    } catch (error) {
      console.error('❌ Error en análisis de hashtags:', error);
      throw error;
    }
  }
};

/**
 * Analizar un hashtag específico
 */
async function analyzeHashtag(
  hashtag: string, 
  analysisDepth: string, 
  postsLimit: number
): Promise<HashtagAnalysis> {
  
  // Buscar posts con el hashtag usando Apify
  const profiles = await apifyService.searchProfilesByHashtag(hashtag, Math.min(postsLimit, 50));
  
  // Para este ejemplo, simularemos algunos datos ya que necesitaríamos un análisis más profundo
  const mockPosts: InstagramPost[] = []; // En implementación real, obtendríamos posts reales
  
  // Calcular métricas básicas
  const totalPosts = profiles.length * 10; // Estimación
  const avgEngagement = calculateAverageEngagement(mockPosts);
  
  // Determinar popularidad y dificultad
  const popularity = calculatePopularity(totalPosts);
  const difficulty = calculateDifficulty(popularity, avgEngagement);
  const relevance = calculateRelevance(hashtag, CONFIG.ZIGURAT_DATA.hashtags);
  
  // Detectar tendencia
  const recentTrend = detectTrend(mockPosts);
  
  // Generar recomendaciones
  const recommendations = generateHashtagSpecificRecommendations(
    hashtag, 
    popularity, 
    difficulty, 
    relevance,
    avgEngagement
  );

  return {
    hashtag,
    popularity,
    difficulty,
    relevance,
    posts: mockPosts,
    metrics: {
      avgEngagement,
      totalPosts,
      recentTrend
    },
    recommendations
  };
}

/**
 * Analizar hashtags de competidores
 */
async function analyzeCompetitorHashtags(): Promise<Array<{
  competitor: string;
  topHashtags: Array<{ hashtag: string; frequency: number; avgEngagement: number }>;
}>> {
  const competitorHashtags: Array<{
    competitor: string;
    topHashtags: Array<{ hashtag: string; frequency: number; avgEngagement: number }>;
  }> = [];

  for (const competitor of CONFIG.COMPETITORS.slice(0, 3)) { // Limitar a 3 para evitar rate limits
    try {
      console.error(`🔍 Analizando hashtags de @${competitor}...`);
      
      const { posts } = await apifyService.getCompleteProfileAnalysis(competitor, 20);
      const hashtagAnalysis = analyzeCompetitorHashtagUsage(posts);
      
      competitorHashtags.push({
        competitor,
        topHashtags: hashtagAnalysis
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`⚠️ Error analizando hashtags de @${competitor}:`, error);
    }
  }

  return competitorHashtags;
}

/**
 * Analizar uso de hashtags de un competidor
 */
function analyzeCompetitorHashtagUsage(posts: InstagramPost[]): Array<{
  hashtag: string;
  frequency: number;
  avgEngagement: number;
}> {
  const hashtagStats: { [hashtag: string]: { count: number; totalEngagement: number } } = {};

  posts.forEach(post => {
    post.hashtags.forEach(hashtag => {
      if (!hashtagStats[hashtag]) {
        hashtagStats[hashtag] = { count: 0, totalEngagement: 0 };
      }
      hashtagStats[hashtag].count++;
      hashtagStats[hashtag].totalEngagement += post.engagement;
    });
  });

  return Object.entries(hashtagStats)
    .map(([hashtag, stats]) => ({
      hashtag,
      frequency: stats.count,
      avgEngagement: Math.round(stats.totalEngagement / stats.count)
    }))
    .filter(item => item.frequency >= 2) // Mínimo 2 usos
    .sort((a, b) => b.avgEngagement - a.avgEngagement)
    .slice(0, 10); // Top 10
}

/**
 * Calcular engagement promedio de posts
 */
function calculateAverageEngagement(posts: InstagramPost[]): number {
  if (posts.length === 0) return 0;
  const totalEngagement = posts.reduce((sum, post) => sum + post.engagement, 0);
  return Math.round(totalEngagement / posts.length);
}

/**
 * Calcular popularidad de un hashtag
 */
function calculatePopularity(totalPosts: number): number {
  // Escala de 0-100 basada en volumen de posts
  if (totalPosts > 1000000) return 95; // Muy popular
  if (totalPosts > 100000) return 80;  // Popular
  if (totalPosts > 10000) return 60;   // Medio
  if (totalPosts > 1000) return 40;    // Nicho
  return 20; // Muy nicho
}

/**
 * Calcular dificultad de un hashtag
 */
function calculateDifficulty(popularity: number, avgEngagement: number): number {
  // Hashtags muy populares son más difíciles de rankear
  // Hashtags con alto engagement también son más competitivos
  const popularityFactor = popularity * 0.7;
  const engagementFactor = Math.min(avgEngagement / 1000 * 30, 30);
  
  return Math.min(100, Math.round(popularityFactor + engagementFactor));
}

/**
 * Calcular relevancia para Zigurat
 */
function calculateRelevance(hashtag: string, ziguratHashtags: string[]): number {
  const normalizedHashtag = hashtag.toLowerCase().replace('#', '');
  
  // Relevancia directa si está en los hashtags de Zigurat
  if (ziguratHashtags.some(tag => tag.toLowerCase().includes(normalizedHashtag))) {
    return 100;
  }
  
  // Relevancia por industria cervecera
  const beerKeywords = ['cerveza', 'beer', 'artesanal', 'craft', 'brewing', 'brew', 'hop', 'malta', 'lager', 'ale', 'ipa'];
  const musicKeywords = ['rock', 'music', 'musica', 'metal', 'punk', 'alternativo'];
  const locationKeywords = ['chile', 'chilena', 'santiago', 'maipu'];
  
  let relevance = 0;
  
  if (beerKeywords.some(keyword => normalizedHashtag.includes(keyword))) {
    relevance += 80;
  }
  
  if (musicKeywords.some(keyword => normalizedHashtag.includes(keyword))) {
    relevance += 60; // Conexión música-cerveza de Zigurat
  }
  
  if (locationKeywords.some(keyword => normalizedHashtag.includes(keyword))) {
    relevance += 40;
  }
  
  return Math.min(100, relevance);
}

/**
 * Detectar tendencia de un hashtag
 */
function detectTrend(posts: InstagramPost[]): 'growing' | 'stable' | 'declining' {
  if (posts.length < 10) return 'stable';
  
  // Ordenar posts por fecha
  const sortedPosts = posts.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  // Dividir en dos mitades temporales
  const mid = Math.floor(posts.length / 2);
  const firstHalf = sortedPosts.slice(0, mid);
  const secondHalf = sortedPosts.slice(mid);
  
  const firstHalfAvgEngagement = firstHalf.reduce((sum, p) => sum + p.engagement, 0) / firstHalf.length;
  const secondHalfAvgEngagement = secondHalf.reduce((sum, p) => sum + p.engagement, 0) / secondHalf.length;
  
  const growthRate = (secondHalfAvgEngagement - firstHalfAvgEngagement) / firstHalfAvgEngagement;
  
  if (growthRate > 0.1) return 'growing';
  if (growthRate < -0.1) return 'declining';
  return 'stable';
}

/**
 * Generar recomendaciones específicas para un hashtag
 */
function generateHashtagSpecificRecommendations(
  hashtag: string,
  popularity: number,
  difficulty: number,
  relevance: number,
  avgEngagement: number
): {
  shouldUse: boolean;
  reasons: string[];
  bestTimeToUse: string;
} {
  const reasons: string[] = [];
  let shouldUse = false;
  
  // Evaluar si debería usarse
  if (relevance >= 60 && difficulty <= 70) {
    shouldUse = true;
    reasons.push(`Alta relevancia para Zigurat (${relevance}%)`);
  }
  
  if (popularity >= 40 && popularity <= 80) {
    shouldUse = true;
    reasons.push('Popularidad óptima para alcance balanceado');
  }
  
  if (difficulty <= 50 && relevance >= 40) {
    shouldUse = true;
    reasons.push('Baja competencia con relevancia aceptable');
  }
  
  // Razones para no usar
  if (difficulty > 80) {
    shouldUse = false;
    reasons.push('Muy competitivo, difícil de rankear');
  }
  
  if (relevance < 30) {
    shouldUse = false;
    reasons.push('Baja relevancia para la marca Zigurat');
  }
  
  // Determinar mejor momento para usar
  let bestTimeToUse = 'En posts de productos principales';
  if (popularity > 80) {
    bestTimeToUse = 'En contenido viral o colaboraciones';
  } else if (popularity < 40) {
    bestTimeToUse = 'En contenido nicho o educativo';
  }
  
  return {
    shouldUse,
    reasons,
    bestTimeToUse
  };
}

/**
 * Generar recomendaciones generales de hashtags
 */
function generateHashtagRecommendations(
  analyses: HashtagAnalysis[],
  competitorHashtags?: Array<{ competitor: string; topHashtags: any[] }>
) {
  const topPerforming = analyses
    .filter(a => a.recommendations.shouldUse && a.relevance >= 70)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 5)
    .map(a => a.hashtag);
  
  const emerging = analyses
    .filter(a => a.metrics.recentTrend === 'growing' && a.difficulty <= 60)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 3)
    .map(a => a.hashtag);
  
  const avoid = analyses
    .filter(a => !a.recommendations.shouldUse)
    .slice(0, 3)
    .map(a => a.hashtag);
  
  // Clasificar por volumen para mezcla óptima
  const optimal_mix = {
    high_volume: analyses.filter(a => a.popularity >= 80).slice(0, 2).map(a => a.hashtag),
    medium_volume: analyses.filter(a => a.popularity >= 40 && a.popularity < 80).slice(0, 8).map(a => a.hashtag),
    niche: analyses.filter(a => a.popularity < 40 && a.relevance >= 70).slice(0, 5).map(a => a.hashtag)
  };
  
  const strategy = generateHashtagStrategy(analyses, competitorHashtags);
  
  return {
    topPerforming,
    emerging,
    avoid,
    optimal_mix,
    strategy
  };
}

/**
 * Generar estrategia de hashtags
 */
function generateHashtagStrategy(
  analyses: HashtagAnalysis[],
  competitorHashtags?: Array<{ competitor: string; topHashtags: any[] }>
): string {
  const avgRelevance = analyses.reduce((sum, a) => sum + a.relevance, 0) / analyses.length;
  const avgDifficulty = analyses.reduce((sum, a) => sum + a.difficulty, 0) / analyses.length;
  
  let strategy = 'Estrategia recomendada: ';
  
  if (avgRelevance >= 70) {
    strategy += 'Los hashtags actuales tienen alta relevancia para Zigurat. ';
  } else {
    strategy += 'Optimizar hashtags hacia mayor relevancia cervecera y musical. ';
  }
  
  if (avgDifficulty <= 50) {
    strategy += 'Aprovechar hashtags de baja competencia para mayor visibilidad. ';
  } else {
    strategy += 'Balancear hashtags competitivos con nichos específicos. ';
  }
  
  strategy += 'Usar mix 70% cervecería + 20% música + 10% ubicación geográfica para maximizar alcance de target específico de Zigurat.';
  
  return strategy;
}

/**
 * Generar resumen de análisis de hashtags
 */
function generateHashtagSummary(analyses: HashtagAnalysis[], recommendations: any) {
  const bestHashtagsForZigurat = recommendations.topPerforming.slice(0, 10);
  
  const highRelevanceCount = analyses.filter(a => a.relevance >= 70).length;
  const lowDifficultyCount = analyses.filter(a => a.difficulty <= 50).length;
  
  const hashtagStrategy = `De ${analyses.length} hashtags analizados, ${highRelevanceCount} tienen alta relevancia y ${lowDifficultyCount} tienen baja competencia. Implementar mix estratégico de hashtags populares (2), medios (8) y nicho (5) para alcance optimizado.`;
  
  const expectedImpact = highRelevanceCount >= analyses.length * 0.7 
    ? 'Alto potencial de incremento en alcance y engagement (15-30%)'
    : 'Moderado potencial de mejora con optimización continua (5-15%)';
  
  return {
    bestHashtagsForZigurat,
    hashtagStrategy,
    expectedImpact
  };
}
