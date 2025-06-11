/**
 * Analyze Hashtag Performance Tool
 */

import { InstagramAnalytics } from '../services/instagram-analytics.js';
import { MCPToolResult } from '../types/instagram.js';

export async function analyzeHashtagsTool(
  analytics: InstagramAnalytics,
  args: any
): Promise<{ content: { type: string; text: string }[] }> {
  const startTime = Date.now();
  
  try {
    const { username, timeframeDays = 30 } = args;
    
    if (!username) {
      throw new Error('Username is required');
    }

    console.error(`🏷️ Analyzing hashtag performance for @${username}`);
    
    const result = await analytics.analyzeHashtagPerformance(username, timeframeDays);
    
    // Generate insights
    const insights = [];
    const hashtagEntries = Object.entries(result.hashtagAnalysis);
    
    if (hashtagEntries.length > 0) {
      const bestHashtag = hashtagEntries.reduce((best, [tag, data]) => 
        data.avgEngagement > best.engagement ? { tag, engagement: data.avgEngagement } : best,
        { tag: '', engagement: 0 }
      );
      
      insights.push(`🥇 Best performing hashtag: ${bestHashtag.tag} (${bestHashtag.engagement.toFixed(0)} avg engagement)`);
      
      const trendingUp = hashtagEntries.filter(([, data]) => data.trend === 'up').map(([tag]) => tag);
      if (trendingUp.length > 0) {
        insights.push(`📈 Trending up: ${trendingUp.slice(0, 3).join(', ')}`);
      }
      
      const trendingDown = hashtagEntries.filter(([, data]) => data.trend === 'down').map(([tag]) => tag);
      if (trendingDown.length > 0) {
        insights.push(`📉 Consider replacing: ${trendingDown.slice(0, 3).join(', ')}`);
      }
    }
    
    const response: MCPToolResult = {
      success: true,
      data: {
        hashtagAnalysis: result.hashtagAnalysis,
        recommendations: result.recommendations,
        insights,
        summary: {
          totalHashtagsAnalyzed: hashtagEntries.length,
          timeframeDays,
          topPerforming: result.recommendations.topPerforming,
          suggested: result.recommendations.suggested
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
}