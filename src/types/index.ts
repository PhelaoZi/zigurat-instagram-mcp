// Tipos de datos para Instagram
export interface InstagramPost {
  id: string;
  shortcode: string;
  timestamp: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  engagement: number;
  hashtags: string[];
  mentions: string[];
  mediaType: 'photo' | 'video' | 'carousel';
  url: string;
}

export interface InstagramProfile {
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
  businessEmail?: string;
  businessPhone?: string;
  businessAddress?: string;
}

export interface InstagramAnalysis {
  profile: InstagramProfile;
  posts: InstagramPost[];
  metrics: {
    avgEngagement: number;
    avgLikes: number;
    avgComments: number;
    engagementRate: number;
    topPerformingPost: InstagramPost;
    bestTimeToPost: {
      hour: number;
      dayOfWeek: string;
    };
    topHashtags: Array<{
      hashtag: string;
      frequency: number;
      avgEngagement: number;
    }>;
  };
  insights: {
    contentStrategy: string;
    audienceInsights: string;
    competitiveAdvantages: string[];
    recommendedActions: string[];
  };
}

// Tipos para análisis competitivo
export interface CompetitiveAnalysis {
  competitor: InstagramProfile;
  comparison: {
    followersGap: number;
    engagementComparison: number;
    postFrequency: number;
    contentSimilarity: number;
  };
  insights: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  recommendations: string[];
}

// Tipos para análisis de hashtags
export interface HashtagAnalysis {
  hashtag: string;
  popularity: number;
  difficulty: number;
  relevance: number;
  posts: InstagramPost[];
  metrics: {
    avgEngagement: number;
    totalPosts: number;
    recentTrend: 'growing' | 'stable' | 'declining';
  };
  recommendations: {
    shouldUse: boolean;
    reasons: string[];
    bestTimeToUse: string;
  };
}

// Tipos para prospección
export interface ProspectionTarget {
  username: string;
  profile: InstagramProfile;
  score: number;
  compatibility: {
    industryMatch: number;
    audienceMatch: number;
    locationMatch: number;
    contentStyle: number;
  };
  insights: {
    strengths: string[];
    opportunities: string[];
    contactRecommendations: string[];
  };
  actionPlan: {
    priority: 'alta' | 'media' | 'baja';
    nextSteps: string[];
    timeline: string;
  };
}

// Tipos para generación de contenido
export interface ContentSuggestion {
  type: 'post' | 'story' | 'reel';
  theme: string;
  caption: string;
  hashtags: string[];
  timing: {
    bestDay: string;
    bestHour: number;
  };
  visualSuggestions: string[];
  callToAction: string;
  expectedEngagement: number;
  reasoning: string;
}

// Tipos para herramientas MCP
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  execute: (args: any) => Promise<any>;
}

// Tipos para respuestas de Apify
export interface ApifyInstagramProfileResponse {
  username: string;
  fullName: string;
  biography: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  verified: boolean;
  private: boolean;
  profilePicUrl: string;
  externalUrl?: string;
  businessCategoryName?: string;
  businessEmail?: string;
  businessPhoneNumber?: string;
  businessContactMethod?: string;
  posts?: ApifyInstagramPost[];
}

export interface ApifyInstagramPost {
  id: string;
  shortCode: string;
  timestamp: string;
  caption?: string;
  likesCount: number;
  commentsCount: number;
  displayUrl: string;
  isVideo: boolean;
  videoViewCount?: number;
  hashtags?: string[];
  mentions?: string[];
}

// Tipos para configuración
export interface ZiguratConfig {
  products: Array<{
    name: string;
    style: string;
    description: string;
  }>;
  hashtags: string[];
  target_locations: string[];
  target_demographics: {
    age_range: string;
    interests: string[];
    lifestyle: string;
  };
}

// Tipos para cache
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Tipos para errores
export interface MCPError {
  code: string;
  message: string;
  details?: any;
}

// Tipos para métricas de análisis
export interface AnalysisMetrics {
  engagement: {
    rate: number;
    trend: 'up' | 'down' | 'stable';
    comparison: number; // vs competitors
  };
  content: {
    frequency: number; // posts per week
    bestTypes: string[];
    optimalTiming: {
      days: string[];
      hours: number[];
    };
  };
  audience: {
    growth: number;
    demographics: {
      ageGroups: Record<string, number>;
      locations: Record<string, number>;
      interests: Record<string, number>;
    };
  };
  hashtags: {
    performance: Record<string, number>;
    trending: string[];
    recommendations: string[];
  };
}
