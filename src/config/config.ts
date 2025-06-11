/**
 * Configuration constants for Zigurat Instagram MCP Server
 */

export const CONFIG = {
  SERVER_NAME: 'zigurat-instagram-mcp',
  VERSION: '1.0.0',
  
  // Apify configuration
  APIFY_BASE_URL: 'https://api.apify.com/v2',
  APIFY_REQUEST_TIMEOUT: 300000, // 5 minutes
  APIFY_MAX_RETRIES: 3,
  
  // Instagram analysis defaults
  DEFAULT_MAX_POSTS: 50,
  DEFAULT_ANALYSIS_FREQUENCY_HOURS: 24,
  MAX_POSTS_PER_REQUEST: 100,
  
  // Cache configuration
  CACHE_DURATION_MINUTES: 60,
  CACHE_MAX_SIZE_MB: 100,
  
  // Rate limiting
  RATE_LIMIT_REQUESTS_PER_MINUTE: 30,
  RATE_LIMIT_REQUESTS_PER_HOUR: 500,
  
  // Data retention
  DATA_RETENTION_DAYS: 90,
  
  // Zigurat specific
  ZIGURAT_HANDLE: process.env.ZIGURAT_INSTAGRAM_HANDLE || 'zigurat_cca',
  COMPETITORS: (process.env.COMPETITORS_HANDLES || 'kunstmann_chile,tropera_brewing,ccu_artesanal').split(','),
  
  // Analysis thresholds
  MIN_ENGAGEMENT_RATE: 1.0, // 1%
  HIGH_ENGAGEMENT_RATE: 5.0, // 5%
  MIN_POSTS_FOR_ANALYSIS: 5,
  
  // Prospect scoring weights
  PROSPECT_SCORING: {
    CRAFT_BEER_MENTIONS: 25,
    ENGAGEMENT_QUALITY: 20,
    AUDIENCE_COMPATIBILITY: 20,
    COMPETITOR_ABSENCE: 15,
    ACTIVITY_LEVEL: 10,
    LOCATION_RELEVANCE: 10
  }
} as const;

export type ConfigType = typeof CONFIG;