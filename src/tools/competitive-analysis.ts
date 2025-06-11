import { MCPTool, CompetitiveAnalysis, InstagramProfile, InstagramPost } from '../types/index.js';
import { apifyService } from '../services/apify.js';
import { CONFIG } from '../config/index.js';

/**
 * Herramienta para análisis competitivo entre perfiles de Instagram
 */
export const competitiveAnalysisTool: MCPTool = {
  name: 'competitive_analysis',
  description: 'Realiza un análisis competitivo comparando Zigurat CCA con otros perfiles de Instagram de cervecerías',
  inputSchema: {
    type: 'object',
    properties: {
      competitors: {
        type: 'array',
        items: { type: 'string' },
        description: 'Lista de usernames competidores a analizar (sin @). Si se omite, usa los competidores por defecto de Zigurat'
      },
      includeZigurat: {
        type: 'boolean',
        description: 'Incluir análisis de Zigurat CCA en la comparación (default: true)',
        default: true
      },
      postsLimit: {
        type: 'number',
        description: 'Número de posts a analizar por perfil (default: 30)',
        default: 30
      },
      analysisType: {
        type: 'string',
        enum: ['full', 'quick', 'metrics_only'],
        description: 'Tipo de análisis: full (completo), quick (básico), metrics_only (solo métricas)',
        default: 'full'
      }
    }
  },

  async execute(args: any): Promise<{
    zigurat?: CompetitiveAnalysis;
    competitors: CompetitiveAnalysis[];
    summary: {
      marketPosition: string;
      keyInsights: string[];
      strategicRecommendations: string[];
      competitiveMatrix: Array<{
        username: string;
        followers: number;
        avgEngagement: number;
        postFrequency: number;
        contentScore: number;
        overallScore: number;
      }>;
    };
  }> {
    const { 
      competitors = CONFIG.COMPETITORS, 
      includeZigurat = true, 
      postsLimit = 30,
      analysisType = 'full'
    } = args;

    try {
      console.error(`📊 Iniciando análisis competitivo de ${competitors.length} marcas...`);

      const analyses: CompetitiveAnalysis[] = [];
      let ziguratAnalysis: CompetitiveAnalysis | undefined;

      // Analizar Zigurat como baseline si se solicita
      let ziguratData: { profile: InstagramProfile; posts: InstagramPost[] } | undefined;
      if (includeZigurat) {
        console.error(`🍺 Analizando baseline: @${CONFIG.ZIGURAT_HANDLE}...`);
        ziguratData = await apifyService.getCompleteProfileAnalysis(CONFIG.ZIGURAT_HANDLE, postsLimit);
        ziguratAnalysis = await analyzeProfile(ziguratData, ziguratData, 'self', analysisType);
      }

      // Analizar competidores
      for (const competitor of competitors) {
        try {
          console.error(`🔍 Analizando competidor: @${competitor}...`);
          const competitorData = await apifyService.getCompleteProfileAnalysis(competitor, postsLimit);
          
          const analysis = await analyzeProfile(
            competitorData, 
            ziguratData || competitorData, // Usar Zigurat como baseline o self-comparison
            includeZigurat ? 'competitor' : 'peer',
            analysisType
          );
          
          analyses.push(analysis);
          
          // Delay entre análisis para respetar rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`⚠️ Error analizando @${competitor}:`, error);
          // Continuar con otros competidores aunque uno falle
        }
      }

      // Generar resumen y matriz competitiva
      const summary = generateCompetitiveSummary(analyses, ziguratAnalysis);

      console.error(`✅ Análisis competitivo completado: ${analyses.length} perfiles analizados`);

      return {
        zigurat: ziguratAnalysis,
        competitors: analyses,
        summary
      };

    } catch (error) {
      console.error('❌ Error en análisis competitivo:', error);
      throw error;
    }
  }
};

/**
 * Analizar un perfil individual en contexto competitivo
 */
async function analyzeProfile(
  profileData: { profile: InstagramProfile; posts: InstagramPost[] },
  baselineData: { profile: InstagramProfile; posts: InstagramPost[] },
  comparisonType: 'self' | 'competitor' | 'peer',
  analysisType: string
): Promise<CompetitiveAnalysis> {
  const { profile, posts } = profileData;
  const { profile: baseline, posts: baselinePosts } = baselineData;

  // Calcular métricas básicas
  const metrics = calculateCompetitiveMetrics(posts);
  const baselineMetrics = calculateCompetitiveMetrics(baselinePosts);

  // Calcular comparaciones
  const comparison = {
    followersGap: profile.followersCount - baseline.followersCount,
    engagementComparison: metrics.avgEngagement / (baselineMetrics.avgEngagement || 1),
    postFrequency: metrics.postsPerWeek,
    contentSimilarity: calculateContentSimilarity(posts, baselinePosts)
  };

  // Generar análisis SWOT
  const insights = generateSWOTAnalysis(profile, posts, metrics, comparison, comparisonType);

  // Generar recomendaciones
  const recommendations = generateCompetitiveRecommendations(
    profile, 
    posts, 
    metrics, 
    comparison, 
    comparisonType,
    analysisType
  );

  return {
    competitor: profile,
    comparison,
    insights,
    recommendations
  };
}

/**
 * Calcular métricas competitivas
 */
function calculateCompetitiveMetrics(posts: InstagramPost[]) {
  if (posts.length === 0) {
    return {
      avgEngagement: 0,
      avgLikes: 0,
      avgComments: 0,
      engagementRate: 0,
      postsPerWeek: 0,
      contentTypes: { photo: 0, video: 0, carousel: 0 },
      hashtagUsage: 0,
      topHashtags: []
    };
  }

  const totalEngagement = posts.reduce((sum, post) => sum + post.engagement, 0);
  const avgEngagement = Math.round(totalEngagement / posts.length);
  const avgLikes = Math.round(posts.reduce((sum, post) => sum + post.likesCount, 0) / posts.length);
  const avgComments = Math.round(posts.reduce((sum, post) => sum + post.commentsCount, 0) / posts.length);

  // Calcular frecuencia de posts
  const postsPerWeek = calculatePostFrequency(posts);

  // Analizar tipos de contenido
  const contentTypes = {
    photo: posts.filter(p => p.mediaType === 'photo').length,
    video: posts.filter(p => p.mediaType === 'video').length,
    carousel: posts.filter(p => p.mediaType === 'carousel').length
  };

  // Analizar uso de hashtags
  const totalHashtags = posts.reduce((sum, post) => sum + post.hashtags.length, 0);
  const hashtagUsage = Math.round(totalHashtags / posts.length);

  // Top hashtags
  const hashtagFreq: { [key: string]: number } = {};
  posts.forEach(post => {
    post.hashtags.forEach(tag => {
      hashtagFreq[tag] = (hashtagFreq[tag] || 0) + 1;
    });
  });

  const topHashtags = Object.entries(hashtagFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([tag, freq]) => ({ tag, frequency: freq }));

  return {
    avgEngagement,
    avgLikes,
    avgComments,
    engagementRate: 0, // Se calcularía con followers del perfil
    postsPerWeek,
    contentTypes,
    hashtagUsage,
    topHashtags
  };
}

/**
 * Calcular similitud de contenido entre dos perfiles
 */
function calculateContentSimilarity(posts1: InstagramPost[], posts2: InstagramPost[]): number {
  if (posts1.length === 0 || posts2.length === 0) return 0;

  // Extraer hashtags únicos de ambos perfiles
  const hashtags1 = new Set(posts1.flatMap(p => p.hashtags));
  const hashtags2 = new Set(posts2.flatMap(p => p.hashtags));

  // Calcular intersección de hashtags
  const commonHashtags = [...hashtags1].filter(tag => hashtags2.has(tag));
  const hashtagSimilarity = commonHashtags.length / Math.max(hashtags1.size, hashtags2.size);

  // Comparar distribución de tipos de contenido
  const types1 = { 
    photo: posts1.filter(p => p.mediaType === 'photo').length / posts1.length,
    video: posts1.filter(p => p.mediaType === 'video').length / posts1.length,
    carousel: posts1.filter(p => p.mediaType === 'carousel').length / posts1.length
  };

  const types2 = { 
    photo: posts2.filter(p => p.mediaType === 'photo').length / posts2.length,
    video: posts2.filter(p => p.mediaType === 'video').length / posts2.length,
    carousel: posts2.filter(p => p.mediaType === 'carousel').length / posts2.length
  };

  const contentTypeSimilarity = 1 - (
    Math.abs(types1.photo - types2.photo) +
    Math.abs(types1.video - types2.video) +
    Math.abs(types1.carousel - types2.carousel)
  ) / 2;

  // Promedio ponderado
  return Math.round((hashtagSimilarity * 0.6 + contentTypeSimilarity * 0.4) * 100) / 100;
}

/**
 * Generar análisis SWOT
 */
function generateSWOTAnalysis(
  profile: InstagramProfile,
  posts: InstagramPost[],
  metrics: any,
  comparison: any,
  comparisonType: string
) {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];
  const threats: string[] = [];

  // Fortalezas
  if (metrics.avgEngagement > 100) {
    strengths.push('Alto engagement de la audiencia');
  }
  if (metrics.postsPerWeek >= 3 && metrics.postsPerWeek <= 7) {
    strengths.push('Frecuencia de publicación consistente');
  }
  if (profile.followersCount > 10000) {
    strengths.push('Base sólida de seguidores');
  }
  if (metrics.contentTypes.video > metrics.contentTypes.photo * 0.3) {
    strengths.push('Buen uso de contenido en video');
  }

  // Debilidades
  if (metrics.avgEngagement < 30) {
    weaknesses.push('Engagement bajo comparado con el potencial');
  }
  if (metrics.postsPerWeek < 2) {
    weaknesses.push('Frecuencia de publicación inconsistente');
  }
  if (metrics.hashtagUsage < 5) {
    weaknesses.push('Subutilización de hashtags para alcance');
  }

  // Oportunidades
  if (comparison.contentSimilarity < 0.3 && comparisonType === 'competitor') {
    opportunities.push('Diferenciación clara del contenido competitivo');
  }
  if (metrics.contentTypes.video < posts.length * 0.4) {
    opportunities.push('Incrementar contenido en video para mayor alcance');
  }
  opportunities.push('Colaboraciones con influencers cerveceros');
  opportunities.push('Contenido behind-the-scenes del proceso productivo');

  // Amenazas
  if (comparison.engagementComparison < 0.7 && comparisonType === 'competitor') {
    threats.push('Competencia con mayor engagement');
  }
  if (comparison.followersGap < -5000 && comparisonType === 'competitor') {
    threats.push('Brecha significativa en número de seguidores');
  }
  threats.push('Saturación del mercado de cerveza artesanal en redes');

  return { strengths, weaknesses, opportunities, threats };
}

/**
 * Generar recomendaciones competitivas
 */
function generateCompetitiveRecommendations(
  profile: InstagramProfile,
  posts: InstagramPost[],
  metrics: any,
  comparison: any,
  comparisonType: string,
  analysisType: string
): string[] {
  const recommendations: string[] = [];

  // Recomendaciones basadas en engagement
  if (comparison.engagementComparison < 0.8 && comparisonType === 'competitor') {
    recommendations.push('Incrementar engagement mediante contenido más interactivo (polls, preguntas, behind-the-scenes)');
  }

  // Recomendaciones basadas en frecuencia
  if (metrics.postsPerWeek < 3) {
    recommendations.push('Aumentar frecuencia de publicación a 3-5 posts por semana para mantener visibilidad');
  }

  // Recomendaciones específicas para Zigurat
  if (comparisonType === 'self' || profile.username === CONFIG.ZIGURAT_HANDLE) {
    recommendations.push('Destacar la conexión única música-cerveza en el storytelling');
    recommendations.push('Mostrar proceso artesanal y premios ganados para diferenciación');
    recommendations.push('Crear contenido educativo sobre estilos de cerveza producidos');
  }

  // Recomendaciones basadas en tipos de contenido
  if (metrics.contentTypes.video < posts.length * 0.3) {
    recommendations.push('Incrementar contenido en video (reels, stories) para mayor alcance orgánico');
  }

  // Recomendaciones de hashtags
  if (metrics.hashtagUsage < 8) {
    recommendations.push('Optimizar uso de hashtags: usar 10-15 por post mezclando populares y nicho');
  }

  return recommendations.slice(0, 6); // Limitar a 6 recomendaciones principales
}

/**
 * Generar resumen competitivo
 */
function generateCompetitiveSummary(analyses: CompetitiveAnalysis[], ziguratAnalysis?: CompetitiveAnalysis) {
  // Crear matriz competitiva
  const competitiveMatrix = analyses.map(analysis => {
    const metrics = calculateCompetitiveMetrics([]); // Se recalcularía con datos reales
    return {
      username: analysis.competitor.username,
      followers: analysis.competitor.followersCount,
      avgEngagement: Math.round(analysis.comparison.engagementComparison * 100),
      postFrequency: analysis.comparison.postFrequency,
      contentScore: Math.round(analysis.comparison.contentSimilarity * 100),
      overallScore: calculateOverallScore(analysis)
    };
  });

  // Incluir Zigurat si está disponible
  if (ziguratAnalysis) {
    competitiveMatrix.unshift({
      username: ziguratAnalysis.competitor.username,
      followers: ziguratAnalysis.competitor.followersCount,
      avgEngagement: 100, // Baseline
      postFrequency: ziguratAnalysis.comparison.postFrequency,
      contentScore: 100, // Baseline
      overallScore: calculateOverallScore(ziguratAnalysis)
    });
  }

  // Ordenar por score general
  competitiveMatrix.sort((a, b) => b.overallScore - a.overallScore);

  // Generar insights clave
  const keyInsights: string[] = [];
  const topPerformer = competitiveMatrix[0];
  const ziguratPosition = competitiveMatrix.findIndex(brand => brand.username === CONFIG.ZIGURAT_HANDLE);

  if (ziguratPosition >= 0) {
    keyInsights.push(`Zigurat se posiciona #${ziguratPosition + 1} de ${competitiveMatrix.length} en el análisis competitivo`);
  }

  keyInsights.push(`Líder en engagement: @${topPerformer.username} con score ${topPerformer.overallScore}`);
  
  // Encontrar fortalezas comunes del mercado
  const avgEngagement = competitiveMatrix.reduce((sum, brand) => sum + brand.avgEngagement, 0) / competitiveMatrix.length;
  const avgFrequency = competitiveMatrix.reduce((sum, brand) => sum + brand.postFrequency, 0) / competitiveMatrix.length;
  
  keyInsights.push(`Engagement promedio del mercado: ${Math.round(avgEngagement)}%`);
  keyInsights.push(`Frecuencia promedio de publicación: ${Math.round(avgFrequency * 10) / 10} posts/semana`);

  // Generar posición de mercado
  let marketPosition = '';
  if (ziguratPosition >= 0) {
    if (ziguratPosition === 0) {
      marketPosition = 'Zigurat lidera el mercado en engagement e interacción con la audiencia';
    } else if (ziguratPosition === 1) {
      marketPosition = 'Zigurat se posiciona como strong challenger, muy cerca del líder';
    } else if (ziguratPosition <= competitiveMatrix.length / 2) {
      marketPosition = 'Zigurat mantiene una posición competitiva sólida en el mercado';
    } else {
      marketPosition = 'Zigurat tiene oportunidades significativas de mejora competitiva';
    }
  } else {
    marketPosition = 'Análisis de mercado completado sin baseline de Zigurat';
  }

  // Recomendaciones estratégicas generales
  const strategicRecommendations: string[] = [
    'Aumentar frecuencia de contenido en video para mejorar alcance orgánico',
    'Implementar estrategia de colaboraciones con otros cerveceros artesanales',
    'Desarrollar contenido educativo sobre procesos cerveceros para diferenciación',
    'Optimizar timing de publicaciones basado en análisis de engagement',
    'Crear campañas de hashtags específicas para aumentar visibilidad',
  ];

  return {
    marketPosition,
    keyInsights,
    strategicRecommendations,
    competitiveMatrix
  };
}

/**
 * Calcular score general de un análisis competitivo
 */
function calculateOverallScore(analysis: CompetitiveAnalysis): number {
  const { comparison, insights } = analysis;
  
  // Factores de scoring (0-100)
  const engagementScore = Math.min(comparison.engagementComparison * 100, 100);
  const frequencyScore = Math.min(comparison.postFrequency * 20, 100); // 5 posts/week = 100
  const contentScore = comparison.contentSimilarity * 100;
  
  // Bonus por fortalezas
  const strengthsBonus = insights.strengths.length * 5;
  
  // Penalización por debilidades
  const weaknessPenalty = insights.weaknesses.length * 3;
  
  const finalScore = Math.max(0, Math.min(100, 
    (engagementScore * 0.4 + frequencyScore * 0.3 + contentScore * 0.3) + strengthsBonus - weaknessPenalty
  ));
  
  return Math.round(finalScore);
}

/**
 * Calcular frecuencia de posts por semana
 */
function calculatePostFrequency(posts: InstagramPost[]): number {
  if (posts.length < 2) return 0;

  const sortedPosts = posts.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const latestPost = new Date(sortedPosts[0].timestamp);
  const oldestPost = new Date(sortedPosts[sortedPosts.length - 1].timestamp);
  
  const daysDiff = (latestPost.getTime() - oldestPost.getTime()) / (1000 * 60 * 60 * 24);
  const weeksDiff = daysDiff / 7;

  return Math.round((posts.length / weeksDiff) * 10) / 10; // Redondear a 1 decimal
}
