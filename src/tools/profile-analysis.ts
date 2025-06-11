import { MCPTool, InstagramAnalysis, InstagramPost } from '../types/index.js';
import { apifyService } from '../services/apify.js';
import { CONFIG } from '../config/index.js';

/**
 * Analizar el rendimiento de un perfil de Instagram
 */
export const profileAnalysisTool: MCPTool = {
  name: 'analyze_instagram_profile',
  description: 'Analiza el rendimiento de un perfil de Instagram incluyendo engagement, mejores horarios, hashtags más efectivos y insights estratégicos',
  inputSchema: {
    type: 'object',
    properties: {
      username: {
        type: 'string',
        description: 'Username de Instagram a analizar (sin @)'
      },
      postsLimit: {
        type: 'number',
        description: 'Número máximo de posts a analizar (default: 50)',
        default: 50
      },
      includeCompetitiveContext: {
        type: 'boolean',
        description: 'Incluir contexto competitivo comparando con Zigurat (default: false)',
        default: false
      }
    },
    required: ['username']
  },

  async execute(args: any): Promise<InstagramAnalysis> {
    const { username, postsLimit = 50, includeCompetitiveContext = false } = args;

    try {
      console.error(`🔍 Iniciando análisis de perfil @${username}...`);

      // Obtener datos del perfil y posts
      const { profile, posts } = await apifyService.getCompleteProfileAnalysis(username, postsLimit);

      if (posts.length === 0) {
        throw new Error(`No se encontraron posts para el perfil @${username}`);
      }

      // Calcular métricas básicas
      const metrics = calculateMetrics(posts);
      
      // Generar insights
      const insights = generateInsights(profile, posts, metrics, includeCompetitiveContext);

      const analysis: InstagramAnalysis = {
        profile,
        posts,
        metrics,
        insights
      };

      console.error(`✅ Análisis completado para @${username}: ${posts.length} posts analizados`);
      return analysis;

    } catch (error) {
      console.error(`❌ Error en análisis de @${username}:`, error);
      throw error;
    }
  }
};

/**
 * Calcular métricas de rendimiento
 */
function calculateMetrics(posts: InstagramPost[]) {
  if (posts.length === 0) {
    throw new Error('No hay posts para analizar');
  }

  // Métricas básicas
  const totalLikes = posts.reduce((sum, post) => sum + post.likesCount, 0);
  const totalComments = posts.reduce((sum, post) => sum + post.commentsCount, 0);
  const totalEngagement = posts.reduce((sum, post) => sum + post.engagement, 0);

  const avgLikes = Math.round(totalLikes / posts.length);
  const avgComments = Math.round(totalComments / posts.length);
  const avgEngagement = Math.round(totalEngagement / posts.length);

  // Post con mejor rendimiento
  const topPerformingPost = posts.reduce((best, current) => 
    current.engagement > best.engagement ? current : best
  );

  // Análisis de timing
  const bestTimeToPost = calculateBestTimeToPost(posts);

  // Análisis de hashtags
  const topHashtags = calculateTopHashtags(posts);

  // Calcular engagement rate (necesitaríamos followers count del perfil)
  const engagementRate = 0; // Se calcularía con followers del perfil

  return {
    avgEngagement,
    avgLikes,
    avgComments,
    engagementRate,
    topPerformingPost,
    bestTimeToPost,
    topHashtags
  };
}

/**
 * Calcular mejor horario para postear
 */
function calculateBestTimeToPost(posts: InstagramPost[]) {
  const timePerformance: { [key: string]: { count: number; totalEngagement: number } } = {};

  posts.forEach(post => {
    const date = new Date(post.timestamp);
    const hour = date.getHours();
    const dayOfWeek = date.toLocaleDateString('es-ES', { weekday: 'long' });
    const key = `${dayOfWeek}-${hour}`;

    if (!timePerformance[key]) {
      timePerformance[key] = { count: 0, totalEngagement: 0 };
    }

    timePerformance[key].count++;
    timePerformance[key].totalEngagement += post.engagement;
  });

  // Encontrar el mejor horario basado en engagement promedio
  let bestTime = { hour: 19, dayOfWeek: 'martes' }; // Default
  let bestAvgEngagement = 0;

  Object.entries(timePerformance).forEach(([key, data]) => {
    const avgEngagement = data.totalEngagement / data.count;
    if (avgEngagement > bestAvgEngagement && data.count >= 2) { // Mínimo 2 posts para ser significativo
      bestAvgEngagement = avgEngagement;
      const [dayOfWeek, hour] = key.split('-');
      bestTime = { hour: parseInt(hour), dayOfWeek };
    }
  });

  return bestTime;
}

/**
 * Calcular hashtags más efectivos
 */
function calculateTopHashtags(posts: InstagramPost[]) {
  const hashtagPerformance: { [hashtag: string]: { count: number; totalEngagement: number } } = {};

  posts.forEach(post => {
    post.hashtags.forEach(hashtag => {
      if (!hashtagPerformance[hashtag]) {
        hashtagPerformance[hashtag] = { count: 0, totalEngagement: 0 };
      }
      hashtagPerformance[hashtag].count++;
      hashtagPerformance[hashtag].totalEngagement += post.engagement;
    });
  });

  // Convertir a array y ordenar por engagement promedio
  const topHashtags = Object.entries(hashtagPerformance)
    .map(([hashtag, data]) => ({
      hashtag,
      frequency: data.count,
      avgEngagement: Math.round(data.totalEngagement / data.count)
    }))
    .filter(item => item.frequency >= 2) // Mínimo 2 usos
    .sort((a, b) => b.avgEngagement - a.avgEngagement)
    .slice(0, 10); // Top 10

  return topHashtags;
}

/**
 * Generar insights estratégicos
 */
function generateInsights(
  profile: any, 
  posts: InstagramPost[], 
  metrics: any, 
  includeCompetitiveContext: boolean
) {
  const insights = {
    contentStrategy: generateContentStrategyInsight(posts),
    audienceInsights: generateAudienceInsights(profile, posts, metrics),
    competitiveAdvantages: generateCompetitiveAdvantages(profile, posts, metrics),
    recommendedActions: generateRecommendedActions(profile, posts, metrics, includeCompetitiveContext)
  };

  return insights;
}

/**
 * Insight sobre estrategia de contenido
 */
function generateContentStrategyInsight(posts: InstagramPost[]): string {
  const videoCount = posts.filter(p => p.mediaType === 'video').length;
  const photoCount = posts.filter(p => p.mediaType === 'photo').length;
  const carouselCount = posts.filter(p => p.mediaType === 'carousel').length;

  const videoPercentage = Math.round((videoCount / posts.length) * 100);
  const photoPercentage = Math.round((photoCount / posts.length) * 100);
  const carouselPercentage = Math.round((carouselCount / posts.length) * 100);

  let strategy = `Distribución de contenido: ${photoPercentage}% fotos, ${videoPercentage}% videos, ${carouselPercentage}% carruseles. `;

  if (videoPercentage > 40) {
    strategy += "Estrategia centrada en video content, ideal para engagement alto. ";
  } else if (photoPercentage > 60) {
    strategy += "Estrategia tradicional basada en fotos, oportunidad de experimentar más con videos. ";
  }

  // Analizar frecuencia de posts
  const avgPostsPerWeek = calculatePostFrequency(posts);
  strategy += `Frecuencia de publicación: ${avgPostsPerWeek} posts por semana. `;

  if (avgPostsPerWeek < 3) {
    strategy += "Frecuencia baja, considerar aumentar para mejor alcance. ";
  } else if (avgPostsPerWeek > 10) {
    strategy += "Frecuencia muy alta, revisar si la calidad se mantiene. ";
  }

  return strategy;
}

/**
 * Insights sobre audiencia
 */
function generateAudienceInsights(profile: any, posts: InstagramPost[], metrics: any): string {
  const avgEngagement = metrics.avgEngagement;
  const bestTime = metrics.bestTimeToPost;
  
  let insights = `Mejor momento para publicar: ${bestTime.dayOfWeek}s a las ${bestTime.hour}:00. `;
  
  if (avgEngagement > 100) {
    insights += "Audiencia altamente comprometida con engagement superior al promedio. ";
  } else if (avgEngagement < 20) {
    insights += "Oportunidad de mejorar engagement, revisar estrategia de contenido. ";
  }

  // Analizar hashtags más efectivos
  const topHashtag = metrics.topHashtags[0];
  if (topHashtag) {
    insights += `Hashtag más efectivo: ${topHashtag.hashtag} (${topHashtag.avgEngagement} engagement promedio). `;
  }

  return insights;
}

/**
 * Ventajas competitivas identificadas
 */
function generateCompetitiveAdvantages(profile: any, posts: InstagramPost[], metrics: any): string[] {
  const advantages: string[] = [];

  // Analizar consistencia
  const postFrequency = calculatePostFrequency(posts);
  if (postFrequency >= 3 && postFrequency <= 7) {
    advantages.push("Frecuencia de publicación consistente y sostenible");
  }

  // Analizar engagement
  if (metrics.avgEngagement > 50) {
    advantages.push("Alto nivel de engagement de la audiencia");
  }

  // Analizar diversidad de contenido
  const contentTypes = [...new Set(posts.map(p => p.mediaType))];
  if (contentTypes.length >= 2) {
    advantages.push("Diversidad en tipos de contenido (fotos, videos, carruseles)");
  }

  // Analizar uso de hashtags
  const avgHashtagsPerPost = posts.reduce((sum, post) => sum + post.hashtags.length, 0) / posts.length;
  if (avgHashtagsPerPost >= 5 && avgHashtagsPerPost <= 15) {
    advantages.push("Uso estratégico y balanceado de hashtags");
  }

  return advantages;
}

/**
 * Acciones recomendadas
 */
function generateRecommendedActions(
  profile: any, 
  posts: InstagramPost[], 
  metrics: any, 
  includeCompetitiveContext: boolean
): string[] {
  const actions: string[] = [];

  // Recomendaciones basadas en timing
  const bestTime = metrics.bestTimeToPost;
  actions.push(`Optimizar horario de publicación: posts los ${bestTime.dayOfWeek}s a las ${bestTime.hour}:00`);

  // Recomendaciones basadas en hashtags
  if (metrics.topHashtags.length > 0) {
    const topHashtag = metrics.topHashtags[0];
    actions.push(`Incrementar uso del hashtag más efectivo: ${topHashtag.hashtag}`);
  }

  // Recomendaciones basadas en tipos de contenido
  const videoCount = posts.filter(p => p.mediaType === 'video').length;
  const videoPercentage = (videoCount / posts.length) * 100;
  
  if (videoPercentage < 30) {
    actions.push("Aumentar contenido en video para mayor engagement");
  }

  // Recomendaciones específicas para Zigurat si es relevante
  if (includeCompetitiveContext) {
    actions.push("Implementar storytelling relacionado con el proceso cervecero");
    actions.push("Destacar la conexión música-cerveza en el contenido");
    actions.push("Mostrar más behind-the-scenes del proceso artesanal");
  }

  return actions;
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
