/**
 * Generate Content Ideas Tool
 */

import { InstagramAnalytics } from '../services/instagram-analytics.js';
import { ContentRequest, MCPToolResult, ContentIdea } from '../types/instagram.js';

export async function generateContentIdeasTool(
  analytics: InstagramAnalytics,
  args: any
): Promise<{ content: { type: string; text: string }[] }> {
  const startTime = Date.now();
  
  try {
    const { username, contentType = 'all', quantity = 5 } = args as ContentRequest;
    
    if (!username) {
      throw new Error('Username is required');
    }

    console.error(`💡 Generating ${quantity} content ideas for @${username}`);
    
    // First analyze the profile to understand what works
    const { posts, analytics: profileAnalytics } = await analytics.analyzeProfile(username, 50);
    
    // Get top performing posts
    const topPosts = posts
      .sort((a, b) => (b.likesCount + b.commentsCount) - (a.likesCount + a.commentsCount))
      .slice(0, 10);
    
    // Generate ideas based on analysis
    const ideas: ContentIdea[] = [];
    
    // Beer product showcase ideas
    if (contentType === 'post' || contentType === 'all') {
      ideas.push({
        type: 'post',
        title: 'Nueva Cerveza Spotlight',
        description: 'Foto profesional de nueva cerveza con historia de la canción que inspiró su nombre. Incluir proceso de elaboración en carousel.',
        suggestedHashtags: ['#nuevacerveza', '#zigurat', '#cervezaartesanal', '#craftbeer', '#rock'],
        estimatedEngagement: this.estimateEngagement(profileAnalytics, 'product'),
        bestTimingToPost: profileAnalytics.bestPostingTimes[0] || '19:00',
        reasoning: 'Posts de productos funcionan bien según análisis histórico'
      });
      
      ideas.push({
        type: 'post',
        title: 'Behind the Scenes - Brewing Process',
        description: 'Video corto del proceso de elaboración con Rodrigo o Christian explicando técnicas especiales.',
        suggestedHashtags: ['#behindthescenes', '#brewing', '#craftbeer', '#zigurat', '#proceso'],
        estimatedEngagement: this.estimateEngagement(profileAnalytics, 'process'),
        bestTimingToPost: profileAnalytics.bestPostingTimes[1] || '20:00',
        reasoning: 'Contenido educativo genera alta interacción'
      });
    }
    
    if (contentType === 'reel' || contentType === 'all') {
      ideas.push({
        type: 'reel',
        title: 'Cata Express con Sommelier',
        description: 'Reel de 30 segundos con Rodrigo haciendo cata rápida de cerveza Zigurat, explicando notas de sabor.',
        suggestedHashtags: ['#cata', '#sommelier', '#zigurat', '#craftbeer', '#sabor'],
        estimatedEngagement: this.estimateEngagement(profileAnalytics, 'educational') * 1.5, // Reels get more engagement
        bestTimingToPost: '18:30',
        reasoning: 'Reels educativos tienen alto engagement, especialmente en horario peak'
      });
      
      ideas.push({
        type: 'reel',
        title: 'Rock & Beer Pairing',
        description: 'Reel mostrando maridaje de cervezas Zigurat con canciones que las inspiraron. Transiciones musicales.',
        suggestedHashtags: ['#rockandroll', '#beer', '#zigurat', '#music', '#pairing'],
        estimatedEngagement: this.estimateEngagement(profileAnalytics, 'creative') * 1.8,
        bestTimingToPost: '21:00',
        reasoning: 'Concepto único de Zigurat (música + cerveza) genera contenido viral'
      });
    }
    
    if (contentType === 'story' || contentType === 'all') {
      ideas.push({
        type: 'story',
        title: 'Day in the Life - Cervecero',
        description: 'Stories del día típico en Zigurat: desde llegada temprano hasta llenado de barriles.',
        suggestedHashtags: ['#dayinthelife', '#cervecero', '#zigurat'],
        estimatedEngagement: profileAnalytics.avgLikes * 0.3, // Stories have different metrics
        bestTimingToPost: '10:00',
        reasoning: 'Contenido auténtico funciona bien en Stories, especialmente mañanas'
      });
    }
    
    // Add more ideas based on top hashtags and seasonal content
    if (ideas.length < quantity) {
      ideas.push({
        type: 'post',
        title: 'Customer Spotlight - Bar Partnership',
        description: 'Foto de cerveza Zigurat en bar cliente con testimonial del dueño. Tag al bar para colaboración.',
        suggestedHashtags: ['#clientespotlight', '#partnership', '#zigurat', ...profileAnalytics.topHashtags.slice(0, 2)],
        estimatedEngagement: this.estimateEngagement(profileAnalytics, 'collaboration'),
        bestTimingToPost: profileAnalytics.bestPostingTimes[0] || '19:00',
        reasoning: 'User-generated content y partnerships aumentan reach orgánico'
      });
    }
    
    // Limit to requested quantity
    const finalIdeas = ideas.slice(0, quantity);
    
    // Analyze content gaps
    const contentGaps = this.identifyContentGaps(topPosts);
    const opportunities = this.identifyOpportunities(profileAnalytics);
    
    const response: MCPToolResult = {
      success: true,
      data: {
        ideas: finalIdeas,
        insights: {
          contentGaps,
          opportunities
        },
        summary: {
          totalIdeasGenerated: finalIdeas.length,
          averageEstimatedEngagement: finalIdeas.reduce((sum, idea) => sum + idea.estimatedEngagement, 0) / finalIdeas.length,
          recommendedPostingTimes: [...new Set(finalIdeas.map(idea => idea.bestTimingToPost))],
          keyThemes: this.extractKeyThemes(finalIdeas)
        }
      },
      metadata: {
        processingTime: Date.now() - startTime,
        source: 'zigurat-instagram-mcp',
        timestamp: new Date()
      }
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(response, null, 2)
      }]
    };
  } catch (error) {
    const response: MCPToolResult = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      metadata: {
        processingTime: Date.now() - startTime,
        source: 'zigurat-instagram-mcp',
        timestamp: new Date()
      }
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(response, null, 2)
      }]
    };
  }
  
  private estimateEngagement(analytics: any, contentType: string): number {
    const baseEngagement = analytics.avgLikes + analytics.avgComments;
    
    const multipliers = {
      'product': 1.2,
      'process': 1.1,
      'educational': 1.3,
      'creative': 1.5,
      'collaboration': 1.0
    };
    
    return Math.round(baseEngagement * (multipliers[contentType as keyof typeof multipliers] || 1.0));
  }
  
  private identifyContentGaps(posts: any[]): string[] {
    const gaps = [];
    
    // Check for content variety
    const hasProductContent = posts.some(p => p.caption.toLowerCase().includes('cerveza'));
    const hasProcessContent = posts.some(p => p.caption.toLowerCase().includes('elabora'));
    const hasEventContent = posts.some(p => p.caption.toLowerCase().includes('evento'));
    
    if (!hasProductContent) gaps.push('Más contenido de productos/cervezas');
    if (!hasProcessContent) gaps.push('Behind the scenes del proceso');
    if (!hasEventContent) gaps.push('Cobertura de eventos y activaciones');
    
    return gaps;
  }
  
  private identifyOpportunities(analytics: any): string[] {
    const opportunities = [];
    
    if (analytics.engagementRate < 2) {
      opportunities.push('Mejorar engagement rate con contenido más interactivo');
    }
    
    if (analytics.postingFrequency < 3) {
      opportunities.push('Aumentar frecuencia de posting a 3-4 veces por semana');
    }
    
    opportunities.push('Aprovechar horarios peak identificados');
    opportunities.push('Crear contenido viral usando concepto música + cerveza');
    
    return opportunities;
  }
  
  private extractKeyThemes(ideas: ContentIdea[]): string[] {
    const themes = new Set<string>();
    
    ideas.forEach(idea => {
      if (idea.title.includes('Nueva Cerveza') || idea.title.includes('Product')) themes.add('Productos');
      if (idea.title.includes('Behind') || idea.title.includes('Process')) themes.add('Proceso');
      if (idea.title.includes('Rock') || idea.title.includes('Music')) themes.add('Música');
      if (idea.title.includes('Customer') || idea.title.includes('Bar')) themes.add('Colaboraciones');
      if (idea.title.includes('Cata') || idea.title.includes('Sommelier')) themes.add('Educación');
    });
    
    return Array.from(themes);
  }
}