import { ApifyClient } from 'apify-client';
import { CONFIG } from '../config/index.js';
import { 
  ApifyInstagramProfileResponse, 
  ApifyInstagramPost, 
  InstagramProfile, 
  InstagramPost 
} from '../types/index.js';

export class ApifyService {
  private client: ApifyClient;
  private requestCount = 0;
  private lastRequestTime = 0;

  constructor() {
    if (!CONFIG.APIFY_API_TOKEN) {
      throw new Error('APIFY_API_TOKEN no está configurado');
    }
    
    this.client = new ApifyClient({
      token: CONFIG.APIFY_API_TOKEN,
    });
  }

  /**
   * Rate limiting para respetar límites de API
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < CONFIG.REQUEST_DELAY_MS) {
      const delay = CONFIG.REQUEST_DELAY_MS - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  /**
   * Convertir respuesta de Apify a formato interno
   */
  private convertApifyProfile(apifyProfile: ApifyInstagramProfileResponse): InstagramProfile {
    return {
      username: apifyProfile.username,
      fullName: apifyProfile.fullName || '',
      biography: apifyProfile.biography || '',
      followersCount: apifyProfile.followersCount || 0,
      followingCount: apifyProfile.followingCount || 0,
      postsCount: apifyProfile.postsCount || 0,
      isVerified: apifyProfile.verified || false,
      isPrivate: apifyProfile.private || false,
      profilePicUrl: apifyProfile.profilePicUrl || '',
      externalUrl: apifyProfile.externalUrl,
      category: apifyProfile.businessCategoryName,
      businessEmail: apifyProfile.businessEmail,
      businessPhone: apifyProfile.businessPhoneNumber,
    };
  }

  /**
   * Convertir post de Apify a formato interno
   */
  private convertApifyPost(apifyPost: ApifyInstagramPost): InstagramPost {
    const likesCount = apifyPost.likesCount || 0;
    const commentsCount = apifyPost.commentsCount || 0;
    const engagement = likesCount + commentsCount;

    return {
      id: apifyPost.id,
      shortcode: apifyPost.shortCode,
      timestamp: apifyPost.timestamp,
      caption: apifyPost.caption || '',
      likesCount,
      commentsCount,
      engagement,
      hashtags: apifyPost.hashtags || [],
      mentions: apifyPost.mentions || [],
      mediaType: apifyPost.isVideo ? 'video' : 'photo',
      url: apifyPost.displayUrl,
    };
  }

  /**
   * Extraer hashtags de un texto
   */
  private extractHashtags(text: string): string[] {
    const hashtagRegex = /#[a-zA-Z0-9_\u00c0-\u017f]+/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.toLowerCase()) : [];
  }

  /**
   * Extraer menciones de un texto
   */
  private extractMentions(text: string): string[] {
    const mentionRegex = /@[a-zA-Z0-9_.]+/g;
    const matches = text.match(mentionRegex);
    return matches ? matches.map(mention => mention.substring(1)) : [];
  }

  /**
   * Obtener perfil de Instagram
   */
  async getInstagramProfile(username: string): Promise<InstagramProfile> {
    await this.rateLimit();

    try {
      console.error(`📊 Obteniendo perfil de @${username}...`);
      
      const run = await this.client.actor(CONFIG.APIFY_ACTOR_IDS.INSTAGRAM_PROFILE).call({
        usernames: [username],
        resultsType: 'profiles',
        resultsLimit: 1,
      });

      const { items } = await this.client.dataset(run.defaultDatasetId).listItems();
      
      if (!items || items.length === 0) {
        throw new Error(`Perfil @${username} no encontrado`);
      }

      const apifyProfile = items[0] as ApifyInstagramProfileResponse;
      return this.convertApifyProfile(apifyProfile);
      
    } catch (error) {
      console.error(`❌ Error obteniendo perfil @${username}:`, error);
      throw new Error(`Error obteniendo perfil @${username}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Obtener posts de un perfil de Instagram
   */
  async getInstagramPosts(username: string, limit: number = 50): Promise<InstagramPost[]> {
    await this.rateLimit();

    try {
      console.error(`📱 Obteniendo ${limit} posts de @${username}...`);
      
      const run = await this.client.actor(CONFIG.APIFY_ACTOR_IDS.INSTAGRAM_SCRAPER).call({
        usernames: [username],
        resultsType: 'posts',
        resultsLimit: limit,
        addParentData: false,
      });

      const { items } = await this.client.dataset(run.defaultDatasetId).listItems();
      
      if (!items || items.length === 0) {
        console.error(`⚠️ No se encontraron posts para @${username}`);
        return [];
      }

      return items.map((item: any) => {
        const apifyPost = item as ApifyInstagramPost;
        const convertedPost = this.convertApifyPost(apifyPost);
        
        // Extraer hashtags y menciones del caption si no vienen en la respuesta
        if (convertedPost.caption) {
          if (convertedPost.hashtags.length === 0) {
            convertedPost.hashtags = this.extractHashtags(convertedPost.caption);
          }
          if (convertedPost.mentions.length === 0) {
            convertedPost.mentions = this.extractMentions(convertedPost.caption);
          }
        }
        
        return convertedPost;
      });
      
    } catch (error) {
      console.error(`❌ Error obteniendo posts de @${username}:`, error);
      throw new Error(`Error obteniendo posts de @${username}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Obtener análisis completo de perfil (perfil + posts)
   */
  async getCompleteProfileAnalysis(username: string, postsLimit: number = 50): Promise<{
    profile: InstagramProfile;
    posts: InstagramPost[];
  }> {
    console.error(`🔍 Iniciando análisis completo de @${username}...`);
    
    const [profile, posts] = await Promise.all([
      this.getInstagramProfile(username),
      this.getInstagramPosts(username, postsLimit)
    ]);

    console.error(`✅ Análisis completo de @${username}: ${posts.length} posts obtenidos`);
    
    return { profile, posts };
  }

  /**
   * Buscar perfiles por hashtag
   */
  async searchProfilesByHashtag(hashtag: string, limit: number = 20): Promise<InstagramProfile[]> {
    await this.rateLimit();

    try {
      console.error(`🔍 Buscando perfiles con hashtag ${hashtag}...`);
      
      const run = await this.client.actor(CONFIG.APIFY_ACTOR_IDS.INSTAGRAM_SCRAPER).call({
        hashtags: [hashtag.replace('#', '')],
        resultsType: 'posts',
        resultsLimit: limit * 2, // Obtenemos más posts para filtrar perfiles únicos
        addParentData: true,
      });

      const { items } = await this.client.dataset(run.defaultDatasetId).listItems();
      
      if (!items || items.length === 0) {
        return [];
      }

      // Extraer perfiles únicos de los posts
      const uniqueProfiles = new Map<string, InstagramProfile>();
      
      items.forEach((item: any) => {
        if (item.ownerUsername && !uniqueProfiles.has(item.ownerUsername)) {
          const profile: InstagramProfile = {
            username: item.ownerUsername,
            fullName: item.ownerFullName || '',
            biography: '',
            followersCount: 0,
            followingCount: 0,
            postsCount: 0,
            isVerified: item.ownerIsVerified || false,
            isPrivate: false,
            profilePicUrl: item.ownerProfilePicUrl || '',
          };
          uniqueProfiles.set(item.ownerUsername, profile);
        }
      });

      const profiles = Array.from(uniqueProfiles.values()).slice(0, limit);
      console.error(`✅ Encontrados ${profiles.length} perfiles únicos con hashtag ${hashtag}`);
      
      return profiles;
      
    } catch (error) {
      console.error(`❌ Error buscando perfiles con hashtag ${hashtag}:`, error);
      throw new Error(`Error buscando perfiles: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Obtener estadísticas de uso de la API
   */
  getApiStats(): {
    requestCount: number;
    lastRequestTime: number;
    rateLimitStatus: 'ok' | 'near_limit' | 'exceeded';
  } {
    const hourlyLimit = CONFIG.MAX_REQUESTS_PER_HOUR;
    const rateLimitStatus = 
      this.requestCount >= hourlyLimit ? 'exceeded' :
      this.requestCount >= hourlyLimit * 0.8 ? 'near_limit' : 'ok';

    return {
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime,
      rateLimitStatus,
    };
  }

  /**
   * Resetear contador de requests (llamar cada hora)
   */
  resetRequestCount(): void {
    this.requestCount = 0;
    console.error('🔄 Contador de requests de Apify reseteado');
  }
}

// Instancia singleton del servicio
export const apifyService = new ApifyService();
