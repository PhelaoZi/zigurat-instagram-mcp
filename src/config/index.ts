export const CONFIG = {
  // Instagram handles
  ZIGURAT_HANDLE: process.env.ZIGURAT_INSTAGRAM_HANDLE || 'zigurat_cca',
  COMPETITORS: (process.env.COMPETITORS_HANDLES || 'kunstmann_chile,tropera_brewing,ccu_artesanal')
    .split(',')
    .map(handle => handle.trim()),

  // Configuración de análisis
  MAX_POSTS_PER_ANALYSIS: parseInt(process.env.MAX_POSTS_PER_ANALYSIS || '50'),
  ANALYSIS_FREQUENCY_HOURS: parseInt(process.env.ANALYSIS_FREQUENCY_HOURS || '24'),

  // Configuración Apify
  APIFY_API_TOKEN: process.env.APIFY_API_TOKEN,
  APIFY_ACTOR_IDS: {
    INSTAGRAM_SCRAPER: 'shu8hvrXbJbY3Eb9W', // Actor público de Apify para Instagram
    INSTAGRAM_PROFILE: 'dSCLg0C3YEZ83HzYX', // Actor para perfiles de Instagram
  },

  // Configuración de reportes
  REPORTS_OUTPUT_PATH: process.env.REPORTS_OUTPUT_PATH || './data/reports',
  DATA_RETENTION_DAYS: parseInt(process.env.DATA_RETENTION_DAYS || '90'),

  // Rate limiting
  REQUEST_DELAY_MS: 2000, // 2 segundos entre requests
  MAX_REQUESTS_PER_HOUR: 100,

  // Cache
  CACHE_TTL_HOURS: 1, // 1 hora de cache para datos de Instagram
  
  // MCP
  MCP_SERVER_NAME: process.env.MCP_SERVER_NAME || 'zigurat-instagram',
  MCP_SERVER_VERSION: process.env.MCP_SERVER_VERSION || '1.0.0',

  // Zigurat specific data
  ZIGURAT_DATA: {
    products: [
      { name: 'Try', style: 'Cream Ale', description: 'Cerveza clásica disponible todo el año' },
      { name: 'Alive', style: 'Scotch Ale', description: 'Cerveza clásica disponible todo el año' },
      { name: 'Rusty Cage', style: 'Imperial Saison', description: 'Edición limitada envejecida en barricas' },
      { name: 'Paint it Black', style: 'Russian Imperial Stout', description: 'Con frambuesa y vainilla' },
      { name: 'In My Darkest Hours', style: 'Black IPA', description: 'Edición limitada por temporadas' },
      { name: 'Mincay', style: 'Grape Ale', description: 'Colaboración con Bodega Ergo' },
      { name: 'Fruto del Gose', style: 'Gose', description: 'Con sal de mar, piña y jengibre' },
    ],
    hashtags: [
      '#cervezaartesanal',
      '#cervezaartesanalchilena',
      '#zigarutcca',
      '#cerveza',
      '#rock',
      '#maipú',
      '#santiago',
      '#craftbeer',
      '#beer',
      '#cervecería',
    ],
    target_locations: [
      'Santiago', 'Providencia', 'Las Condes', 'Vitacura', 'Ñuñoa', 
      'La Reina', 'Maipú', 'San Miguel', 'Macul'
    ],
    target_demographics: {
      age_range: '25-45',
      interests: ['cerveza artesanal', 'rock', 'música', 'gastronomía'],
      lifestyle: 'urbano, profesional, amante de experiencias únicas'
    }
  }
};

// Validar configuración crítica
export function validateConfig() {
  const errors: string[] = [];

  if (!CONFIG.APIFY_API_TOKEN) {
    errors.push('APIFY_API_TOKEN es requerido');
  }

  if (!CONFIG.ZIGURAT_HANDLE) {
    errors.push('ZIGURAT_INSTAGRAM_HANDLE es requerido');
  }

  if (CONFIG.COMPETITORS.length === 0) {
    errors.push('Al menos un competidor debe estar configurado');
  }

  if (errors.length > 0) {
    throw new Error(`Errores de configuración:\n${errors.join('\n')}`);
  }

  return true;
}
