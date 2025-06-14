import { MCPTool, ProspectionTarget, InstagramProfile, InstagramPost } from '../types/index.js';
import { apifyService } from '../services/apify.js';
import { CONFIG } from '../config/index.js';

/**
 * Herramienta para prospección de clientes potenciales usando análisis de Instagram
 */
export const prospectionTool: MCPTool = {
  name: 'prospect_clients',
  description: 'Identifica y evalúa bares, restaurantes y establecimientos potenciales para Zigurat CCA usando análisis de sus perfiles de Instagram',
  inputSchema: {
    type: 'object',
    properties: {
      targets: {
        type: 'array',
        items: { type: 'string' },
        description: 'Lista de usernames de Instagram a evaluar como prospectos (sin @)'
      },
      searchHashtags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Hashtags para buscar prospectos automáticamente (ej: cervezaartesanal, barsantiago)',
        default: ['cervezaartesanal', 'barsantiago', 'restosantiago', 'craftbeer']
      },
      location: {
        type: 'string',
        description: 'Ubicación geográfica de enfoque (default: Santiago, Chile)',
        default: 'Santiago, Chile'
      },
      autoSearch: {
        type: 'boolean',
        description: 'Buscar automáticamente prospectos usando hashtags (default: true)',
        default: true
      },
      maxProspects: {
        type: 'number',
        description: 'Número máximo de prospectos a evaluar (default: 20)',
        default: 20
      },
      scoringCriteria: {
        type: 'object',
        description: 'Criterios personalizados de scoring',
        properties: {
          industryWeight: { type: 'number', default: 0.4 },
          audienceWeight: { type: 'number', default: 0.3 },
          locationWeight: { type: 'number', default: 0.2 },
          contentWeight: { type: 'number', default: 0.1 }
        }
      }
    }
  },

  async execute(args: any): Promise<{
    prospects: ProspectionTarget[];
    searchResults?: {
      totalFound: number;
      hashtagsUsed: string[];
      autoDiscovered: string[];
    };
    summary: {
      highPriority: ProspectionTarget[];
      mediumPriority: ProspectionTarget[];
      lowPriority: ProspectionTarget[];
      averageScore: number;
      topRecommendations: string[];
    };
    actionPlan: {
      immediate: Array<{ prospect: string; action: string; timeline: string }>;
      shortTerm: Array<{ prospect: string; action: string; timeline: string }>;
      longTerm: Array<{ prospect: string; action: string; timeline: string }>;
    };
  }> {
    const {
      targets = [],
      searchHashtags = ['cervezaartesanal', 'barsantiago', 'restosantiago', 'craftbeer'],
      location = 'Santiago, Chile',
      autoSearch = true,
      maxProspects = 20,
      scoringCriteria = {
        industryWeight: 0.4,
        audienceWeight: 0.3,
        locationWeight: 0.2,
        contentWeight: 0.1
      }
    } = args;

    try {
      console.error(`🎯 Iniciando prospección de clientes en ${location}...`);

      let allTargets = [...targets];
      let searchResults: {
        totalFound: number;
        hashtagsUsed: string[];
        autoDiscovered: string[];
      } | undefined;

      // Búsqueda automática de prospectos si está habilitada
      if (autoSearch) {
        console.error('🔍 Buscando prospectos automáticamente...');
        const discoveredTargets = await searchProspects(searchHashtags, maxProspects);
        allTargets = [...new Set([...allTargets, ...discoveredTargets])]; // Eliminar duplicados
        
        searchResults = {
          totalFound: discoveredTargets.length,
          hashtagsUsed: searchHashtags,
          autoDiscovered: discoveredTargets
        };
      }

      // Limitar número de prospectos a evaluar
      const targetsToEvaluate = allTargets.slice(0, maxProspects);
      console.error(`📊 Evaluando ${targetsToEvaluate.length} prospectos...`);

      // Evaluar cada prospecto
      const prospects: ProspectionTarget[] = [];
      for (const target of targetsToEvaluate) {
        try {
          console.error(`🔍 Evaluando prospecto: @${target}...`);
          const prospect = await evaluateProspect(target, location, scoringCriteria);
          prospects.push(prospect);
          
          // Delay para respetar rate limits
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`⚠️ Error evaluando @${target}:`, error);
        }
      }

      // Ordenar por score
      prospects.sort((a, b) => b.score - a.score);

      // Generar resumen y plan de acción
      const summary = generateProspectionSummary(prospects);
      const actionPlan = generateActionPlan(prospects);

      console.error(`✅ Prospección completada: ${prospects.length} prospectos evaluados`);

      return {
        prospects,
        searchResults,
        summary,
        actionPlan
      };

    } catch (error) {
      console.error('❌ Error en prospección:', error);
      throw error;
    }
  }
};

/**
 * Buscar prospectos automáticamente usando hashtags
 */
async function searchProspects(hashtags: string[], maxResults: number): Promise<string[]> {
  const discoveredProfiles = new Set<string>();

  for (const hashtag of hashtags.slice(0, 3)) { // Limitar hashtags para evitar rate limits
    try {
      console.error(`🔍 Buscando con hashtag: #${hashtag}...`);
      
      const profiles = await apifyService.searchProfilesByHashtag(hashtag, Math.min(maxResults, 15));
      
      profiles.forEach(profile => {
        if (isRelevantForProspection(profile)) {
          discoveredProfiles.add(profile.username);
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`⚠️ Error buscando con #${hashtag}:`, error);
    }
  }

  return Array.from(discoveredProfiles).slice(0, maxResults);
}

/**
 * Verificar si un perfil es relevante para prospección
 */
function isRelevantForProspection(profile: InstagramProfile): boolean {
  const bio = profile.biography.toLowerCase();
  const name = profile.fullName.toLowerCase();
  
  // Palabras clave relevantes para bares/restaurantes
  const relevantKeywords = [
    'bar', 'resto', 'restaurant', 'pub', 'cerveza', 'beer', 'gastronomy', 'gastronomia',
    'cocina', 'kitchen', 'food', 'comida', 'drinks', 'tragos', 'cocktails', 'terrace',
    'terraza', 'bistro', 'cafe', 'brewery', 'cerveceria'
  ];
  
  // Verificar si contiene palabras clave relevantes
  const hasRelevantKeywords = relevantKeywords.some(keyword => 
    bio.includes(keyword) || name.includes(keyword)
  );
  
  // Filtrar perfiles personales obvios
  const personalIndicators = ['personal', 'blog', 'influencer', 'model', 'artist'];
  const isPersonal = personalIndicators.some(indicator => 
    bio.includes(indicator) || name.includes(indicator)
  );
  
  // Verificar que tenga un número razonable de seguidores (no muy bajo, no muy alto)
  const hasReasonableFollowers = profile.followersCount >= 100 && profile.followersCount <= 100000;
  
  return hasRelevantKeywords && !isPersonal && hasReasonableFollowers;
}

/**
 * Evaluar un prospecto individual
 */
async function evaluateProspect(
  username: string,
  location: string,
  scoringCriteria: any
): Promise<ProspectionTarget> {
  
  // Obtener datos del prospecto
  const { profile, posts } = await apifyService.getCompleteProfileAnalysis(username, 30);
  
  // Calcular compatibilidad
  const compatibility = calculateCompatibility(profile, posts, location);
  
  // Calcular score final
  const score = calculateFinalScore(compatibility, scoringCriteria);
  
  // Generar insights
  const insights = generateProspectInsights(profile, posts, compatibility);
  
  // Crear plan de acción
  const actionPlan = createActionPlan(profile, posts, score);
  
  return {
    username,
    profile,
    score,
    compatibility,
    insights,
    actionPlan
  };
}

/**
 * Calcular compatibilidad con Zigurat
 */
function calculateCompatibility(
  profile: InstagramProfile,
  posts: InstagramPost[],
  location: string
) {
  // 1. Compatibilidad de industria
  const industryMatch = calculateIndustryMatch(profile, posts);
  
  // 2. Compatibilidad de audiencia
  const audienceMatch = calculateAudienceMatch(profile, posts);
  
  // 3. Compatibilidad de ubicación
  const locationMatch = calculateLocationMatch(profile, location);
  
  // 4. Compatibilidad de estilo de contenido
  const contentStyle = calculateContentStyleMatch(profile, posts);
  
  return {
    industryMatch,
    audienceMatch,
    locationMatch,
    contentStyle
  };
}

/**
 * Calcular compatibilidad de industria
 */
function calculateIndustryMatch(profile: InstagramProfile, posts: InstagramPost[]): number {
  const bio = profile.biography.toLowerCase();
  const allText = posts.map(p => p.caption.toLowerCase()).join(' ');
  
  // Palabras clave de industria cervecera/gastronómica
  const beerKeywords = ['cerveza', 'beer', 'craft', 'artesanal', 'brewery', 'brewing', 'hop', 'malta'];
  const foodKeywords = ['comida', 'food', 'gastronomy', 'cocina', 'restaurant', 'resto', 'bar', 'pub'];
  const experienceKeywords = ['terraza', 'ambiente', 'music', 'live', 'evento', 'event'];
  
  let score = 0;
  
  // Puntuación por palabras clave encontradas
  beerKeywords.forEach(keyword => {
    if (bio.includes(keyword) || allText.includes(keyword)) score += 15;
  });
  
  foodKeywords.forEach(keyword => {
    if (bio.includes(keyword) || allText.includes(keyword)) score += 10;
  });
  
  experienceKeywords.forEach(keyword => {
    if (bio.includes(keyword) || allText.includes(keyword)) score += 5;
  });
  
  // Bonus por categoría de negocio
  if (profile.category && profile.category.toLowerCase().includes('restaurant')) score += 20;
  if (profile.category && profile.category.toLowerCase().includes('bar')) score += 25;
  
  return Math.min(100, score);
}

/**
 * Calcular compatibilidad de audiencia
 */
function calculateAudienceMatch(profile: InstagramProfile, posts: InstagramPost[]): number {
  let score = 0;
  
  // Rango de seguidores ideal para Zigurat (1K-50K)
  const followers = profile.followersCount;
  if (followers >= 1000 && followers <= 50000) {
    score += 40;
  } else if (followers >= 500 && followers <= 100000) {
    score += 25;
  } else {
    score += 10;
  }
  
  // Nivel de engagement (calculado aproximadamente)
  if (posts.length > 0) {
    const avgEngagement = posts.reduce((sum, post) => sum + post.engagement, 0) / posts.length;
    const engagementRate = (avgEngagement / followers) * 100;
    
    if (engagementRate >= 2) score += 30;
    else if (engagementRate >= 1) score += 20;
    else score += 10;
  }
  
  // Actividad reciente (posts en último mes)
  const recentPosts = posts.filter(post => {
    const postDate = new Date(post.timestamp);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return postDate > monthAgo;
  });
  
  if (recentPosts.length >= 8) score += 20;
  else if (recentPosts.length >= 4) score += 15;
  else score += 5;
  
  // Interacción con contenido de cerveza
  const beerPosts = posts.filter(post => 
    post.caption.toLowerCase().includes('cerveza') || 
    post.caption.toLowerCase().includes('beer') ||
    post.hashtags.some(tag => tag.includes('cerveza') || tag.includes('beer'))
  );
  
  if (beerPosts.length > 0) {
    score += Math.min(10, beerPosts.length * 2);
  }
  
  return Math.min(100, score);
}

/**
 * Calcular compatibilidad de ubicación
 */
function calculateLocationMatch(profile: InstagramProfile, targetLocation: string): number {
  const bio = profile.biography.toLowerCase();
  const locationKeywords = ['santiago', 'providencia', 'las condes', 'vitacura', 'ñuñoa', 'chile'];
  
  let score = 0;
  
  // Buscar indicadores de ubicación en bio
  locationKeywords.forEach(keyword => {
    if (bio.includes(keyword)) score += 25;
  });
  
  // Verificar dirección de negocio si está disponible
  if (profile.businessAddress && profile.businessAddress.toLowerCase().includes('santiago')) {
    score += 50;
  }
  
  // Si no encontramos ubicación específica, dar puntaje neutro
  if (score === 0) score = 30;
  
  return Math.min(100, score);
}

/**
 * Calcular compatibilidad de estilo de contenido
 */
function calculateContentStyleMatch(profile: InstagramProfile, posts: InstagramPost[]): number {
  let score = 0;
  
  // Analizar tipos de contenido
  const photoCount = posts.filter(p => p.mediaType === 'photo').length;
  const videoCount = posts.filter(p => p.mediaType === 'video').length;
  const carouselCount = posts.filter(p => p.mediaType === 'carousel').length;
  
  // Diversidad de contenido es positiva
  const contentTypes = [photoCount > 0, videoCount > 0, carouselCount > 0].filter(Boolean).length;
  score += contentTypes * 15;
  
  // Uso de hashtags (indicador de estrategia de marketing)
  const avgHashtags = posts.reduce((sum, post) => sum + post.hashtags.length, 0) / posts.length;
  if (avgHashtags >= 5) score += 25;
  else if (avgHashtags >= 3) score += 15;
  else score += 5;
  
  // Calidad de captions (longitud promedio)
  const avgCaptionLength = posts.reduce((sum, post) => sum + post.caption.length, 0) / posts.length;
  if (avgCaptionLength >= 100) score += 20;
  else if (avgCaptionLength >= 50) score += 15;
  else score += 10;
  
  // Contenido relacionado con experiencias y ambiente
  const experiencePosts = posts.filter(post => {
    const caption = post.caption.toLowerCase();
    return caption.includes('ambiente') || caption.includes('experiencia') || 
           caption.includes('música') || caption.includes('live') ||
           caption.includes('evento') || caption.includes('celebr');
  });
  
  if (experiencePosts.length > 0) {
    score += Math.min(20, experiencePosts.length * 3);
  }
  
  return Math.min(100, score);
}

/**
 * Calcular score final ponderado
 */
function calculateFinalScore(compatibility: any, scoringCriteria: any): number {
  const {
    industryWeight = 0.4,
    audienceWeight = 0.3,
    locationWeight = 0.2,
    contentWeight = 0.1
  } = scoringCriteria;
  
  const finalScore = 
    (compatibility.industryMatch * industryWeight) +
    (compatibility.audienceMatch * audienceWeight) +
    (compatibility.locationMatch * locationWeight) +
    (compatibility.contentStyle * contentWeight);
  
  return Math.round(finalScore);
}

/**
 * Generar insights del prospecto
 */
function generateProspectInsights(
  profile: InstagramProfile,
  posts: InstagramPost[],
  compatibility: any
): {
  strengths: string[];
  opportunities: string[];
  contactRecommendations: string[];
} {
  const strengths: string[] = [];
  const opportunities: string[] = [];
  const contactRecommendations: string[] = [];
  
  // Identificar fortalezas
  if (compatibility.industryMatch >= 70) {
    strengths.push('Fuerte afinidad con industria cervecera');
  }
  if (compatibility.audienceMatch >= 70) {
    strengths.push('Audiencia activa y comprometida');
  }
  if (compatibility.locationMatch >= 70) {
    strengths.push('Ubicación estratégica en Santiago');
  }
  if (profile.followersCount >= 5000) {
    strengths.push('Base sólida de seguidores locales');
  }
  
  // Identificar oportunidades
  if (posts.some(p => p.caption.toLowerCase().includes('cerveza'))) {
    opportunities.push('Ya promueve contenido cervecero');
  }
  if (profile.businessEmail || profile.businessPhone) {
    opportunities.push('Información de contacto comercial disponible');
  }
  if (posts.filter(p => p.hashtags.some(tag => tag.includes('cerveza'))).length > 0) {
    opportunities.push('Usa hashtags relacionados con cerveza');
  }
  
  // Generar recomendaciones de contacto
  if (profile.businessEmail) {
    contactRecommendations.push(`Contacto directo via email: ${profile.businessEmail}`);
  }
  if (profile.businessPhone) {
    contactRecommendations.push(`Contacto directo via teléfono: ${profile.businessPhone}`);
  }
  
  contactRecommendations.push('Interactuar con sus posts sobre cerveza antes del contacto');
  contactRecommendations.push('Proponer degustación de productos Zigurat');
  
  if (posts.some(p => p.caption.toLowerCase().includes('música') || p.caption.toLowerCase().includes('live'))) {
    contactRecommendations.push('Destacar conexión música-cerveza de Zigurat');
  }
  
  return {
    strengths,
    opportunities,
    contactRecommendations
  };
}

/**
 * Crear plan de acción específico
 */
function createActionPlan(
  profile: InstagramProfile,
  posts: InstagramPost[],
  score: number
): {
  priority: 'alta' | 'media' | 'baja';
  nextSteps: string[];
  timeline: string;
} {
  let priority: 'alta' | 'media' | 'baja';
  const nextSteps: string[] = [];
  let timeline: string;
  
  // Determinar prioridad basada en score
  if (score >= 75) {
    priority = 'alta';
    timeline = '1-2 semanas';
    nextSteps.push('Contacto inmediato via DM o email');
    nextSteps.push('Proponer reunión para presentar productos');
    nextSteps.push('Ofrecer degustación gratuita');
  } else if (score >= 50) {
    priority = 'media';
    timeline = '1-2 meses';
    nextSteps.push('Seguir en redes sociales');
    nextSteps.push('Interactuar con contenido relacionado con cerveza');
    nextSteps.push('Contactar en momento estratégico (eventos, promociones)');
  } else {
    priority = 'baja';
    timeline = '3-6 meses';
    nextSteps.push('Monitorear actividad y evolución del perfil');
    nextSteps.push('Reevaluar compatibilidad trimestralmente');
  }
  
  // Agregar pasos específicos basados en el perfil
  if (profile.businessEmail) {
    nextSteps.push('Enviar propuesta comercial por email');
  }
  
  if (posts.some(p => p.caption.toLowerCase().includes('evento'))) {
    nextSteps.push('Proponer participación en eventos especiales');
  }
  
  return {
    priority,
    nextSteps,
    timeline
  };
}

/**
 * Generar resumen de prospección
 */
function generateProspectionSummary(prospects: ProspectionTarget[]) {
  const highPriority = prospects.filter(p => p.actionPlan.priority === 'alta');
  const mediumPriority = prospects.filter(p => p.actionPlan.priority === 'media');
  const lowPriority = prospects.filter(p => p.actionPlan.priority === 'baja');
  
  const averageScore = prospects.reduce((sum, p) => sum + p.score, 0) / prospects.length;
  
  const topRecommendations = [
    `${highPriority.length} prospectos de alta prioridad identificados`,
    'Enfocar esfuerzos comerciales en top 5 prospectos',
    'Implementar estrategia de engagement antes del contacto directo',
    'Destacar diferenciación Zigurat: conexión música-cerveza',
    'Aprovechar información de contacto comercial disponible'
  ];
  
  return {
    highPriority,
    mediumPriority,
    lowPriority,
    averageScore: Math.round(averageScore),
    topRecommendations
  };
}

/**
 * Generar plan de acción general
 */
function generateActionPlan(prospects: ProspectionTarget[]) {
  const highPriority = prospects.filter(p => p.actionPlan.priority === 'alta');
  const mediumPriority = prospects.filter(p => p.actionPlan.priority === 'media');
  const lowPriority = prospects.filter(p => p.actionPlan.priority === 'baja');
  
  const immediate = highPriority.slice(0, 3).map(p => ({
    prospect: p.username,
    action: 'Contacto directo y propuesta de degustación',
    timeline: '1-2 semanas'
  }));
  
  const shortTerm = [
    ...highPriority.slice(3).map(p => ({
      prospect: p.username,
      action: 'Contacto comercial estructurado',
      timeline: '2-4 semanas'
    })),
    ...mediumPriority.slice(0, 5).map(p => ({
      prospect: p.username,
      action: 'Engagement y seguimiento en redes',
      timeline: '1-2 meses'
    }))
  ];
  
  const longTerm = lowPriority.slice(0, 5).map(p => ({
    prospect: p.username,
    action: 'Monitoreo y reevaluación periódica',
    timeline: '3-6 meses'
  }));
  
  return {
    immediate,
    shortTerm,
    longTerm
  };
}
