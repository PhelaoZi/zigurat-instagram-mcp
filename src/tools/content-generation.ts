import { MCPTool, ContentSuggestion, InstagramPost } from '../types/index.js';
import { apifyService } from '../services/apify.js';
import { CONFIG } from '../config/index.js';

/**
 * Herramienta para generar sugerencias de contenido optimizado para Instagram
 */
export const contentGenerationTool: MCPTool = {
  name: 'generate_content',
  description: 'Genera sugerencias de contenido optimizado para Instagram basado en análisis de tendencias y performance histórico',
  inputSchema: {
    type: 'object',
    properties: {
      contentType: {
        type: 'string',
        enum: ['post', 'story', 'reel', 'all'],
        description: 'Tipo de contenido a generar (default: all)',
        default: 'all'
      },
      theme: {
        type: 'string',
        enum: ['product', 'process', 'events', 'education', 'lifestyle', 'music', 'seasonal', 'all'],
        description: 'Tema del contenido (default: all)',
        default: 'all'
      },
      numberOfSuggestions: {
        type: 'number',
        description: 'Número de sugerencias a generar (default: 5)',
        default: 5
      },
      targetAudience: {
        type: 'string',
        enum: ['general', 'beer_enthusiasts', 'music_lovers', 'local_santiago', 'young_professionals'],
        description: 'Audiencia objetivo (default: general)',
        default: 'general'
      },
      basedOnPerformance: {
        type: 'boolean',
        description: 'Basar sugerencias en análisis de performance histórico (default: true)',
        default: true
      },
      includeCompetitorTrends: {
        type: 'boolean',
        description: 'Incluir análisis de tendencias de competidores (default: true)',
        default: true
      },
      season: {
        type: 'string',
        enum: ['spring', 'summer', 'autumn', 'winter', 'auto'],
        description: 'Temporada para contenido estacional (default: auto)',
        default: 'auto'
      }
    }
  },

  async execute(args: any): Promise<{
    suggestions: ContentSuggestion[];
    insights: {
      trendingHashtags: string[];
      bestPostingTimes: Array<{ day: string; hour: number; engagement: number }>;
      competitorAnalysis: {
        topPerformingThemes: string[];
        contentGaps: string[];
        opportunities: string[];
      };
      seasonalTrends: string[];
    };
    strategy: {
      contentMix: {
        product: number;
        process: number;
        lifestyle: number;
        educational: number;
      };
      hashtagStrategy: string[];
      postingFrequency: string;
      expectedResults: string;
    };
  }> {
    const {
      contentType = 'all',
      theme = 'all',
      numberOfSuggestions = 5,
      targetAudience = 'general',
      basedOnPerformance = true,
      includeCompetitorTrends = true,
      season = 'auto'
    } = args;

    try {
      console.error(`📝 Generando ${numberOfSuggestions} sugerencias de contenido...`);

      // Analizar performance histórico si se solicita
      let performanceData: any = null;
      if (basedOnPerformance) {
        console.error('📊 Analizando performance histórico...');
        performanceData = await analyzeHistoricalPerformance();
      }

      // Analizar tendencias de competidores si se solicita
      let competitorTrends: any = null;
      if (includeCompetitorTrends) {
        console.error('🔍 Analizando tendencias de competidores...');
        competitorTrends = await analyzeCompetitorTrends();
      }

      // Determinar temporada actual si es auto
      const currentSeason = season === 'auto' ? getCurrentSeason() : season;

      // Generar sugerencias de contenido
      const suggestions = await generateContentSuggestions(
        contentType,
        theme,
        numberOfSuggestions,
        targetAudience,
        currentSeason,
        performanceData,
        competitorTrends
      );

      // Generar insights
      const insights = generateContentInsights(performanceData, competitorTrends, currentSeason);

      // Generar estrategia
      const strategy = generateContentStrategy(suggestions, insights, performanceData);

      console.error(`✅ Generación de contenido completada: ${suggestions.length} sugerencias creadas`);

      return {
        suggestions,
        insights,
        strategy
      };

    } catch (error) {
      console.error('❌ Error en generación de contenido:', error);
      throw error;
    }
  }
};

/**
 * Analizar performance histórico de Zigurat
 */
async function analyzeHistoricalPerformance(): Promise<any> {
  try {
    const { posts } = await apifyService.getCompleteProfileAnalysis(CONFIG.ZIGURAT_HANDLE, 50);
    
    if (posts.length === 0) {
      return null;
    }

    // Analizar tipos de contenido más exitosos
    const performanceByType = {
      photo: calculateAverageEngagement(posts.filter(p => p.mediaType === 'photo')),
      video: calculateAverageEngagement(posts.filter(p => p.mediaType === 'video')),
      carousel: calculateAverageEngagement(posts.filter(p => p.mediaType === 'carousel'))
    };

    // Analizar hashtags más exitosos
    const hashtagPerformance = analyzeHashtagPerformance(posts);

    // Analizar mejores horarios
    const bestTimes = analyzeBestPostingTimes(posts);

    // Analizar temas más exitosos
    const topThemes = analyzeTopThemes(posts);

    return {
      performanceByType,
      hashtagPerformance,
      bestTimes,
      topThemes,
      totalPosts: posts.length,
      avgEngagement: calculateAverageEngagement(posts)
    };

  } catch (error) {
    console.error('Error analizando performance histórico:', error);
    return null;
  }
}

/**
 * Analizar tendencias de competidores
 */
async function analyzeCompetitorTrends(): Promise<any> {
  const competitorData: any[] = [];

  try {
    // Analizar hasta 3 competidores para evitar rate limits
    for (const competitor of CONFIG.COMPETITORS.slice(0, 3)) {
      try {
        const { posts } = await apifyService.getCompleteProfileAnalysis(competitor, 20);
        
        const analysis = {
          competitor,
          topThemes: analyzeTopThemes(posts),
          popularHashtags: analyzeHashtagPerformance(posts).slice(0, 5),
          contentTypes: {
            photo: posts.filter(p => p.mediaType === 'photo').length,
            video: posts.filter(p => p.mediaType === 'video').length,
            carousel: posts.filter(p => p.mediaType === 'carousel').length
          },
          avgEngagement: calculateAverageEngagement(posts)
        };
        
        competitorData.push(analysis);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error analizando @${competitor}:`, error);
      }
    }

    return {
      competitors: competitorData,
      topPerformingThemes: extractTopThemes(competitorData),
      trendingHashtags: extractTrendingHashtags(competitorData),
      contentGaps: identifyContentGaps(competitorData),
      opportunities: identifyOpportunities(competitorData)
    };

  } catch (error) {
    console.error('Error analizando competidores:', error);
    return null;
  }
}

/**
 * Determinar temporada actual
 */
function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1; // 1-12
  
  if (month >= 3 && month <= 5) return 'autumn';  // Mar-May (Otoño en Chile)
  if (month >= 6 && month <= 8) return 'winter';  // Jun-Aug (Invierno en Chile)
  if (month >= 9 && month <= 11) return 'spring'; // Sep-Nov (Primavera en Chile)
  return 'summer'; // Dic-Feb (Verano en Chile)
}

/**
 * Generar sugerencias de contenido
 */
async function generateContentSuggestions(
  contentType: string,
  theme: string,
  numberOfSuggestions: number,
  targetAudience: string,
  season: string,
  performanceData: any,
  competitorTrends: any
): Promise<ContentSuggestion[]> {
  
  const suggestions: ContentSuggestion[] = [];
  const themes = theme === 'all' ? ['product', 'process', 'events', 'education', 'lifestyle', 'music'] : [theme];
  const types = contentType === 'all' ? ['post', 'story', 'reel'] : [contentType];

  // Plantillas de contenido base
  const contentTemplates = {
    product: [
      {
        caption: "🍺 Conoce nuestra {product}: {description}. El sabor que conquista paladares exigentes.",
        hashtags: ['#zigarutcca', '#cervezaartesanal', '#craftbeer', '#{product_style}'],
        visualSuggestions: ['Foto del producto con fondo musical', 'Video del proceso de servido'],
        callToAction: 'Encuéntrala en nuestros puntos de venta'
      },
      {
        caption: "🎸 {product} + {song_reference} = La combinación perfecta para tu {time_of_day}",
        hashtags: ['#cervezaconactitud', '#rockandroll', '#craftbeer', '#music'],
        visualSuggestions: ['Botella con elementos musicales', 'Video con soundtrack de rock'],
        callToAction: '¿Cuál es tu canción favorita para acompañar una cerveza?'
      }
    ],
    process: [
      {
        caption: "⚗️ Behind the scenes: Así nacen nuestras cervezas artesanales. Cada gota cuenta una historia.",
        hashtags: ['#processocervecero', '#artesanal', '#craftbrewing', '#maipu'],
        visualSuggestions: ['Video del proceso de cocción', 'Foto de fermentadores'],
        callToAction: 'Visítanos y conoce nuestro proceso en persona'
      },
      {
        caption: "🌾 De la malta al vaso: {process_step}. La magia de la cerveza artesanal en acción.",
        hashtags: ['#brewing', '#artesanal', '#craftbeer', '#passion'],
        visualSuggestions: ['Time-lapse del proceso', 'Foto de ingredientes'],
        callToAction: 'Desliza para ver todo el proceso'
      }
    ],
    music: [
      {
        caption: "🎵 '{song_title}' + {beer_name} = Tu soundtrack perfecto. ¿Qué canción eliges para acompañar tu cerveza?",
        hashtags: ['#musicandcraft', '#rockandroll', '#cervezaconactitud', '#playlist'],
        visualSuggestions: ['Cerveza con vinilo de fondo', 'Video con música de rock'],
        callToAction: 'Comenta tu canción favorita para tomar cerveza'
      }
    ],
    education: [
      {
        caption: "📚 ¿Sabías que...? {beer_fact}. Conoce más sobre el fascinante mundo de la cerveza artesanal.",
        hashtags: ['#beereducation', '#craftbeer', '#didyouknow', '#beerknowledge'],
        visualSuggestions: ['Infografía educativa', 'Video explicativo corto'],
        callToAction: 'Guarda este post para recordar este dato'
      }
    ],
    lifestyle: [
      {
        caption: "🌅 {time_period} perfecto con {beer_name}. Porque cada momento merece una cerveza especial.",
        hashtags: ['#lifestyle', '#craftbeer', '#goodtimes', '#zigurat'],
        visualSuggestions: ['Cerveza en ambiente natural', 'Video de momento de relajación'],
        callToAction: '¿Cuál es tu momento favorito para una cerveza?'
      }
    ],
    events: [
      {
        caption: "🎉 {event_type} en Zigurat: {event_description}. Ven y vive la experiencia completa.",
        hashtags: ['#zigarutevent', '#craftbeer', '#santiago', '#experience'],
        visualSuggestions: ['Foto del evento anterior', 'Video promocional'],
        callToAction: 'Reserva tu lugar en el link de bio'
      }
    ]
  };

  // Generar sugerencias para cada tema y tipo
  for (let i = 0; i < numberOfSuggestions; i++) {
    const selectedTheme = themes[i % themes.length];
    const selectedType = types[i % types.length] as 'post' | 'story' | 'reel';
    
    const template = contentTemplates[selectedTheme as keyof typeof contentTemplates]?.[0] || contentTemplates.product[0];
    
    const suggestion = createContentSuggestion(
      selectedType,
      selectedTheme,
      template,
      targetAudience,
      season,
      performanceData,
      competitorTrends
    );
    
    suggestions.push(suggestion);
  }

  return suggestions;
}

/**
 * Crear una sugerencia de contenido específica
 */
function createContentSuggestion(
  type: 'post' | 'story' | 'reel',
  theme: string,
  template: any,
  targetAudience: string,
  season: string,
  performanceData: any,
  competitorTrends: any
): ContentSuggestion {
  
  // Personalizar plantilla según el tema
  let caption = template.caption;
  let hashtags = [...template.hashtags];
  
  // Reemplazar variables en la plantilla
  caption = replaceTemplateVariables(caption, theme, season);
  
  // Optimizar hashtags basado en performance
  if (performanceData?.hashtagPerformance) {
    const topHashtags = performanceData.hashtagPerformance.slice(0, 3).map((h: any) => h.hashtag);
    hashtags = [...new Set([...hashtags, ...topHashtags])];
  }
  
  // Agregar hashtags estacionales
  hashtags.push(...getSeasonalHashtags(season));
  
  // Determinar mejor timing
  const timing = getBestTiming(performanceData, type);
  
  // Calcular engagement esperado
  const expectedEngagement = calculateExpectedEngagement(type, theme, performanceData);
  
  // Generar razonamiento
  const reasoning = generateReasoning(type, theme, targetAudience, season, performanceData);
  
  return {
    type,
    theme,
    caption,
    hashtags: hashtags.slice(0, 15), // Limitar a 15 hashtags
    timing,
    visualSuggestions: template.visualSuggestions,
    callToAction: template.callToAction,
    expectedEngagement,
    reasoning
  };
}

/**
 * Reemplazar variables en plantillas
 */
function replaceTemplateVariables(caption: string, theme: string, season: string): string {
  const variables: { [key: string]: string } = {
    '{product}': CONFIG.ZIGURAT_DATA.products[Math.floor(Math.random() * CONFIG.ZIGURAT_DATA.products.length)].name,
    '{description}': 'una cerveza artesanal con carácter único',
    '{product_style}': 'craftbeer',
    '{song_reference}': 'tu soundtrack de rock favorito',
    '{time_of_day}': season === 'summer' ? 'tarde de verano' : 'noche de invierno',
    '{process_step}': 'la fermentación donde nace el sabor',
    '{song_title}': 'Paint it Black',
    '{beer_name}': 'Zigurat CCA',
    '{beer_fact}': 'cada cerveza Zigurat lleva el nombre de una canción de rock clásico',
    '{time_period}': getSeasonalTimeReference(season),
    '{event_type}': 'Degustación musical',
    '{event_description}': 'maridaje de cerveza artesanal con música en vivo'
  };
  
  Object.entries(variables).forEach(([key, value]) => {
    caption = caption.replace(new RegExp(key, 'g'), value);
  });
  
  return caption;
}

/**
 * Obtener hashtags estacionales
 */
function getSeasonalHashtags(season: string): string[] {
  const seasonalHashtags: { [key: string]: string[] } = {
    summer: ['#verano', '#summer', '#terrace', '#fresh'],
    winter: ['#invierno', '#cozy', '#warmup', '#indoor'],
    spring: ['#primavera', '#renewal', '#fresh', '#outdoor'],
    autumn: ['#otoño', '#harvest', '#cozy', '#seasonal']
  };
  
  return seasonalHashtags[season] || [];
}

/**
 * Obtener mejor timing basado en performance
 */
function getBestTiming(performanceData: any, type: string): {
  bestDay: string;
  bestHour: number;
} {
  // Valores por defecto optimizados para Zigurat
  let bestDay = 'viernes';
  let bestHour = 19;
  
  if (performanceData?.bestTimes) {
    bestDay = performanceData.bestTimes.day || bestDay;
    bestHour = performanceData.bestTimes.hour || bestHour;
  }
  
  // Ajustar según tipo de contenido
  if (type === 'story') {
    bestHour = Math.max(10, bestHour - 2); // Stories funcionan mejor más temprano
  } else if (type === 'reel') {
    bestHour = Math.min(21, bestHour + 1); // Reels funcionan mejor más tarde
  }
  
  return { bestDay, bestHour };
}

/**
 * Calcular engagement esperado
 */
function calculateExpectedEngagement(type: string, theme: string, performanceData: any): number {
  let baseEngagement = 50; // Valor base
  
  if (performanceData?.avgEngagement) {
    baseEngagement = performanceData.avgEngagement;
  }
  
  // Factores multiplicadores según tipo
  const typeMultipliers: { [key: string]: number } = {
    post: 1.0,
    story: 0.7,
    reel: 1.5
  };
  
  // Factores según tema
  const themeMultipliers: { [key: string]: number } = {
    product: 1.2,
    process: 1.1,
    music: 1.3,
    education: 0.9,
    lifestyle: 1.0,
    events: 1.4
  };
  
  const finalEngagement = baseEngagement * 
    (typeMultipliers[type] || 1.0) * 
    (themeMultipliers[theme] || 1.0);
  
  return Math.round(finalEngagement);
}

/**
 * Generar razonamiento para la sugerencia
 */
function generateReasoning(
  type: string,
  theme: string,
  targetAudience: string,
  season: string,
  performanceData: any
): string {
  let reasoning = `Contenido ${type} de ${theme} optimizado para ${targetAudience}. `;
  
  if (performanceData) {
    reasoning += `Basado en análisis histórico que muestra mejor performance en contenido similar. `;
  }
  
  reasoning += `Timing optimizado para temporada ${season}. `;
  
  // Reasoning específico por tipo
  if (type === 'reel') {
    reasoning += 'Los reels tienen 50% más alcance orgánico según tendencias actuales.';
  } else if (type === 'story') {
    reasoning += 'Las stories generan mayor interacción directa con la audiencia.';
  } else {
    reasoning += 'Los posts tienen mayor durabilidad y potencial de viralización.';
  }
  
  return reasoning;
}

/**
 * Funciones auxiliares para análisis
 */
function calculateAverageEngagement(posts: InstagramPost[]): number {
  if (posts.length === 0) return 0;
  const total = posts.reduce((sum, post) => sum + post.engagement, 0);
  return Math.round(total / posts.length);
}

function analyzeHashtagPerformance(posts: InstagramPost[]) {
  const hashtagStats: { [key: string]: { count: number; totalEngagement: number } } = {};
  
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
    .sort((a, b) => b.avgEngagement - a.avgEngagement)
    .slice(0, 10);
}

function analyzeBestPostingTimes(posts: InstagramPost[]) {
  // Análisis simplificado - en implementación real sería más complejo
  return {
    day: 'viernes',
    hour: 19,
    engagement: calculateAverageEngagement(posts)
  };
}

function analyzeTopThemes(posts: InstagramPost[]): string[] {
  // Análisis básico de temas basado en palabras clave en captions
  const themes = ['product', 'process', 'music', 'lifestyle'];
  return themes.slice(0, 3); // Simplificado
}

function extractTopThemes(competitorData: any[]): string[] {
  return ['product', 'process', 'events']; // Simplificado
}

function extractTrendingHashtags(competitorData: any[]): string[] {
  return ['#cervezaartesanal', '#craftbeer', '#santiago']; // Simplificado
}

function identifyContentGaps(competitorData: any[]): string[] {
  return ['Conexión música-cerveza', 'Contenido educativo sobre estilos'];
}

function identifyOpportunities(competitorData: any[]): string[] {
  return ['Mayor contenido en video', 'Colaboraciones musicales'];
}

function getSeasonalTimeReference(season: string): string {
  const references: { [key: string]: string } = {
    summer: 'tarde de verano',
    winter: 'noche acogedora',
    spring: 'día primaveral', 
    autumn: 'atardecer de otoño'
  };
  return references[season] || 'momento perfecto';
}

/**
 * Generar insights de contenido
 */
function generateContentInsights(performanceData: any, competitorTrends: any, season: string) {
  const trendingHashtags = performanceData?.hashtagPerformance?.slice(0, 5).map((h: any) => h.hashtag) || CONFIG.ZIGURAT_DATA.hashtags.slice(0, 5);
  
  const bestPostingTimes = [
    { day: 'viernes', hour: 19, engagement: 120 },
    { day: 'sábado', hour: 20, engagement: 110 },
    { day: 'jueves', hour: 18, engagement: 100 }
  ];
  
  const competitorAnalysis = {
    topPerformingThemes: competitorTrends?.topPerformingThemes || ['product', 'process'],
    contentGaps: competitorTrends?.contentGaps || ['Música + Cerveza', 'Storytelling artesanal'],
    opportunities: competitorTrends?.opportunities || ['Contenido educativo', 'Behind the scenes']
  };
  
  const seasonalTrends = getSeasonalHashtags(season);
  
  return {
    trendingHashtags,
    bestPostingTimes,
    competitorAnalysis,
    seasonalTrends
  };
}

/**
 * Generar estrategia de contenido
 */
function generateContentStrategy(suggestions: ContentSuggestion[], insights: any, performanceData: any) {
  const contentMix = {
    product: 40, // 40% contenido de productos
    process: 25, // 25% proceso y behind-the-scenes
    lifestyle: 20, // 20% lifestyle y experiencias
    educational: 15 // 15% educativo y cultural
  };
  
  const hashtagStrategy = [
    'Usar 12-15 hashtags por post mezclando populares y nicho',
    'Incluir siempre #zigarutcca como branded hashtag',
    'Balancear hashtags de cerveza (70%) + música (20%) + ubicación (10%)',
    'Rotar hashtags semanalmente para evitar shadowban'
  ];
  
  const postingFrequency = 'Publicar 4-5 veces por semana: 3 posts + 2 stories/reels para mantener engagement constante';
  
  const expectedResults = performanceData ? 
    `Incremento esperado del 20-35% en engagement con estrategia optimizada` :
    `Establecer baseline de engagement y crecer 15-25% en 3 meses`;
  
  return {
    contentMix,
    hashtagStrategy,
    postingFrequency,
    expectedResults
  };
}
