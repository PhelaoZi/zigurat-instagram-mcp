/**
 * Compare Instagram Profiles Tool
 */

import { InstagramAnalytics } from '../services/instagram-analytics.js';
import { ComparisonRequest, MCPToolResult } from '../types/instagram.js';

export async function compareProfilesTool(
  analytics: InstagramAnalytics,
  args: any
): Promise<{ content: { type: string; text: string }[] }> {
  const startTime = Date.now();
  
  try {
    const { usernames, maxPosts = 20 } = args as ComparisonRequest;
    
    if (!usernames || !Array.isArray(usernames) || usernames.length < 2) {
      throw new Error('At least 2 usernames are required for comparison');
    }

    console.error(`📊 Comparing Instagram profiles: ${usernames.join(', ')}`);
    
    const result = await analytics.compareProfiles(usernames, maxPosts);
    
    // Generate comparison insights
    const insights = [];
    const entries = Object.entries(result.comparison);
    
    // Find best performer in each category
    const bestEngagement = entries.reduce((best, [username, data]) => 
      data.engagementRate > best.rate ? { username, rate: data.engagementRate } : best,
      { username: '', rate: 0 }
    );
    
    const mostActive = entries.reduce((best, [username, data]) => 
      data.postingFrequency > best.frequency ? { username, frequency: data.postingFrequency } : best,
      { username: '', frequency: 0 }
    );
    
    insights.push(`🏆 Best engagement: @${bestEngagement.username} (${bestEngagement.rate.toFixed(2)}%)`);
    insights.push(`📈 Most active: @${mostActive.username} (${mostActive.frequency.toFixed(1)} posts/week)`);
    
    // Add specific recommendations
    for (const [username, data] of entries) {
      if (username !== result.insights.leader) {
        const gap = ((result.comparison[result.insights.leader].engagementRate - data.engagementRate) / result.comparison[result.insights.leader].engagementRate * 100).toFixed(1);
        insights.push(`💡 @${username} could improve engagement by ${gap}% to match leader`);
      }
    }
    
    const response: MCPToolResult = {
      success: true,
      data: {
        comparison: result.comparison,
        insights: result.insights,
        analysis: {
          leader: result.insights.leader,
          totalProfilesAnalyzed: usernames.length,
          keyInsights: insights,
          recommendations: result.insights.recommendations
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