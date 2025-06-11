/**
 * Analyze Instagram Profile Tool
 */

import { InstagramAnalytics } from '../services/instagram-analytics.js';
import { AnalysisRequest, MCPToolResult } from '../types/instagram.js';

export async function analyzeProfileTool(
  analytics: InstagramAnalytics,
  args: any
): Promise<{ content: { type: string; text: string }[] }> {
  const startTime = Date.now();
  
  try {
    const { username, maxPosts = 50, includeReels = true } = args as AnalysisRequest;
    
    if (!username) {
      throw new Error('Username is required');
    }

    console.error(`🔍 Analyzing Instagram profile: @${username}`);
    
    const result = await analytics.analyzeProfile(username, maxPosts);
    
    const response: MCPToolResult = {
      success: true,
      data: {
        profile: result.profile,
        posts: result.posts.slice(0, 10), // Limit posts in response for readability
        analytics: result.analytics,
        summary: {
          totalPosts: result.posts.length,
          avgEngagementRate: result.analytics.engagementRate.toFixed(2) + '%',
          topHashtags: result.analytics.topHashtags.slice(0, 5),
          bestPostingTimes: result.analytics.bestPostingTimes,
          insights: [
            `Average ${result.analytics.avgLikes.toFixed(0)} likes per post`,
            `Average ${result.analytics.avgComments.toFixed(0)} comments per post`,
            `Posts ${result.analytics.postingFrequency.toFixed(1)} times per week`,
            `${result.analytics.engagementRate > 3 ? 'High' : result.analytics.engagementRate > 1 ? 'Medium' : 'Low'} engagement rate`
          ]
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