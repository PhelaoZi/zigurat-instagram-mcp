/**
 * Instagram Analytics Service
 * Core business logic for Instagram data analysis
 */

import { ApifyService } from './apify-service.js';
import { 
  InstagramProfile, 
  InstagramPost, 
  AnalyticsMetrics, 
  ComparisonResult,
  HashtagAnalysis,
  ProspectAnalysis
} from '../types/instagram.js';
import { CONFIG } from '../config/config.js';

export class InstagramAnalytics {
  constructor(private apifyService: ApifyService) {}

  /**
   * Analyze a complete Instagram profile
   */
  async analyzeProfile(username: string, maxPosts: number = CONFIG.DEFAULT_MAX_POSTS): Promise<{
    profile: InstagramProfile;
    posts: InstagramPost[];
    analytics: AnalyticsMetrics;
  }> {
    const { profile, posts } = await this.apifyService.extractProfile(username, maxPosts);
    
    if (posts.length < CONFIG.MIN_POSTS_FOR_ANALYSIS) {
      throw new Error(`Insufficient posts for analysis. Found ${posts.length}, minimum required: ${CONFIG.MIN_POSTS_FOR_ANALYSIS}`);
    }

    const analytics = this.calculateAnalytics(profile, posts);
    
    return { profile, posts, analytics };
  }

  /**
   * Compare multiple Instagram profiles
   */
  async compareProfiles(usernames: string[], maxPosts: number = 20): Promise<ComparisonResult> {
    const profileAnalyses = await Promise.all(
      usernames.map(username => this.analyzeProfile(username, maxPosts))
    );

    const comparison: Record<string, any> = {};
    let bestEngagement = 0;
    let leader = '';

    for (const analysis of profileAnalyses) {
      const { profile, analytics } = analysis;
      
      comparison[profile.username] = {
        engagementRate: analytics.engagementRate,
        avgLikes: analytics.avgLikes,
        avgComments: analytics.avgComments,
        postingFrequency: analytics.postingFrequency,
        topHashtags: analytics.topHashtags.slice(0, 5),
        followersCount: profile.followersCount,
        postsCount: profile.postsCount
      };

      if (analytics.engagementRate > bestEngagement) {
        bestEngagement = analytics.engagementRate;
        leader = profile.username;
      }
    }

    const insights = this.generateComparisonInsights(comparison, leader);

    return { comparison, insights };
  }

  /**
   * Analyze hashtag performance for a profile
   */
  async analyzeHashtagPerformance(username: string, timeframeDays: number = 30): Promise<HashtagAnalysis> {
    const { posts } = await this.apifyService.extractProfile(username, 100);
    
    // Filter posts by timeframe
    const cutoffDate = new Date(Date.now() - (timeframeDays * 24 * 60 * 60 * 1000));
    const recentPosts = posts.filter(post => post.timestamp > cutoffDate);

    // Analyze hashtag performance
    const hashtagStats: Record<string, { occurrences: number; totalEngagement: number; posts: InstagramPost[] }> = {};

    for (const post of recentPosts) {
      const engagement = post.likesCount + post.commentsCount;
      
      for (const hashtag of post.hashtags) {
        if (!hashtagStats[hashtag]) {
          hashtagStats[hashtag] = { occurrences: 0, totalEngagement: 0, posts: [] };
        }
        
        hashtagStats[hashtag].occurrences++;
        hashtagStats[hashtag].totalEngagement += engagement;
        hashtagStats[hashtag].posts.push(post);
      }
    }

    const hashtagAnalysis: Record<string, any> = {};
    
    for (const [hashtag, stats] of Object.entries(hashtagStats)) {
      if (stats.occurrences >= 2) { // Minimum 2 occurrences
        hashtagAnalysis[hashtag] = {
          occurrences: stats.occurrences,
          avgEngagement: stats.totalEngagement / stats.occurrences,
          avgLikes: stats.posts.reduce((sum, post) => sum + post.likesCount, 0) / stats.posts.length,
          avgComments: stats.posts.reduce((sum, post) => sum + post.commentsCount, 0) / stats.posts.length,
          trend: this.calculateHashtagTrend(stats.posts)
        };
      }
    }

    const recommendations = this.generateHashtagRecommendations(hashtagAnalysis);

    return { hashtagAnalysis, recommendations };
  }

  /**
   * Analyze bars/restaurants as potential clients
   */
  async analyzeProspects(usernames: string[]): Promise<ProspectAnalysis> {
    const prospects: Record<string, any> = {};
    
    for (const username of usernames) {
      try {
        const { profile, posts } = await this.apifyService.extractProfile(username, 30);
        const analysis = this.scoreProspect(profile, posts);
        
        prospects[username] = {
          score: analysis.score,
          profile,
          analysis: analysis.details,
          recommendation: this.getRecommendationLevel(analysis.score),
          reasoning: analysis.reasoning
        };
      } catch (error) {
        console.error(`Failed to analyze prospect ${username}:`, error);
        prospects[username] = {
          score: 0,
          error: 'Failed to analyze',
          recommendation: 'skip'
        };
      }
    }

    const summary = this.generateProspectSummary(prospects);
    
    return { prospects, summary };
  }

  /**
   * Calculate analytics metrics from posts
   */
  private calculateAnalytics(profile: InstagramProfile, posts: InstagramPost[]): AnalyticsMetrics {
    const totalLikes = posts.reduce((sum, post) => sum + post.likesCount, 0);
    const totalComments = posts.reduce((sum, post) => sum + post.commentsCount, 0);
    const totalEngagement = totalLikes + totalComments;
    
    const avgLikes = totalLikes / posts.length;
    const avgComments = totalComments / posts.length;
    const engagementRate = profile.followersCount > 0 ? (totalEngagement / (posts.length * profile.followersCount)) * 100 : 0;
    
    // Calculate posting frequency (posts per week)
    const oldestPost = posts[posts.length - 1];
    const newestPost = posts[0];
    const daysDiff = Math.max(1, (newestPost.timestamp.getTime() - oldestPost.timestamp.getTime()) / (1000 * 60 * 60 * 24));
    const postingFrequency = (posts.length / daysDiff) * 7;
    
    // Find best posting times
    const bestPostingTimes = this.findBestPostingTimes(posts);
    
    // Get top hashtags
    const topHashtags = this.getTopHashtags(posts);
    
    return {
      engagementRate,
      avgLikes,
      avgComments,
      postingFrequency,
      bestPostingTimes,
      topHashtags,
      growthRate: 0, // Would need historical data
      audienceInsights: {
        primaryDemographic: 'Unknown', // Would need audience data
        engagementPatterns: this.analyzeEngagementPatterns(posts)
      }
    };
  }

  /**
   * Find optimal posting times based on engagement
   */
  private findBestPostingTimes(posts: InstagramPost[]): string[] {
    const timeSlots: Record<string, { count: number; totalEngagement: number }> = {};
    
    for (const post of posts) {
      const hour = post.timestamp.getHours();
      const timeSlot = `${hour}:00`;
      const engagement = post.likesCount + post.commentsCount;
      
      if (!timeSlots[timeSlot]) {
        timeSlots[timeSlot] = { count: 0, totalEngagement: 0 };
      }
      
      timeSlots[timeSlot].count++;
      timeSlots[timeSlot].totalEngagement += engagement;
    }
    
    return Object.entries(timeSlots)
      .map(([time, stats]) => ({ time, avgEngagement: stats.totalEngagement / stats.count }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 3)
      .map(slot => slot.time);
  }

  /**
   * Get top performing hashtags
   */
  private getTopHashtags(posts: InstagramPost[]): string[] {
    const hashtagCounts: Record<string, number> = {};
    
    for (const post of posts) {
      for (const hashtag of post.hashtags) {
        hashtagCounts[hashtag] = (hashtagCounts[hashtag] || 0) + 1;
      }
    }
    
    return Object.entries(hashtagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([hashtag]) => hashtag);
  }

  /**
   * Analyze engagement patterns
   */
  private analyzeEngagementPatterns(posts: InstagramPost[]): string[] {
    const patterns: string[] = [];
    
    // Analyze by day of week
    const dayEngagement: Record<number, number[]> = {};
    for (const post of posts) {
      const day = post.timestamp.getDay();
      const engagement = post.likesCount + post.commentsCount;
      
      if (!dayEngagement[day]) dayEngagement[day] = [];
      dayEngagement[day].push(engagement);
    }
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const avgByDay = Object.entries(dayEngagement).map(([day, engagements]) => ({
      day: dayNames[parseInt(day)],
      avg: engagements.reduce((a, b) => a + b, 0) / engagements.length
    }));
    
    const bestDay = avgByDay.sort((a, b) => b.avg - a.avg)[0];
    patterns.push(`Best day: ${bestDay.day}`);
    
    return patterns;
  }

  /**
   * Calculate hashtag trend
   */
  private calculateHashtagTrend(posts: InstagramPost[]): 'up' | 'down' | 'stable' {
    if (posts.length < 4) return 'stable';
    
    const sortedPosts = posts.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const midpoint = Math.floor(posts.length / 2);
    
    const firstHalf = sortedPosts.slice(0, midpoint);
    const secondHalf = sortedPosts.slice(midpoint);
    
    const firstAvg = firstHalf.reduce((sum, post) => sum + post.likesCount + post.commentsCount, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, post) => sum + post.likesCount + post.commentsCount, 0) / secondHalf.length;
    
    const change = (secondAvg - firstAvg) / firstAvg;
    
    if (change > 0.1) return 'up';
    if (change < -0.1) return 'down';
    return 'stable';
  }

  /**
   * Generate hashtag recommendations
   */
  private generateHashtagRecommendations(hashtagAnalysis: Record<string, any>): {
    topPerforming: string[];
    underperforming: string[];
    suggested: string[];
  } {
    const entries = Object.entries(hashtagAnalysis);
    entries.sort(([,a], [,b]) => b.avgEngagement - a.avgEngagement);
    
    const topPerforming = entries.slice(0, 5).map(([hashtag]) => hashtag);
    const underperforming = entries.slice(-3).map(([hashtag]) => hashtag);
    
    // Generate suggested hashtags based on industry
    const suggested = [
      '#cervezaartesanal',
      '#craftbeer',
      '#cervezachilena',
      '#cerveceriaartesanal',
      '#beer'
    ].filter(tag => !hashtagAnalysis[tag]);
    
    return { topPerforming, underperforming, suggested };
  }

  /**
   * Score a prospect based on various factors
   */
  private scoreProspect(profile: InstagramProfile, posts: InstagramPost[]): {
    score: number;
    details: any;
    reasoning: string;
  } {
    let score = 0;
    const details: any = {};
    const reasons: string[] = [];
    
    // Craft beer mentions
    const craftBeerKeywords = ['cerveza artesanal', 'craft beer', 'artesanal', 'cervecería'];
    const craftBeerMentions = posts.filter(post => 
      craftBeerKeywords.some(keyword => 
        post.caption.toLowerCase().includes(keyword)
      )
    ).length;
    
    const craftBeerScore = Math.min((craftBeerMentions / posts.length) * CONFIG.PROSPECT_SCORING.CRAFT_BEER_MENTIONS, CONFIG.PROSPECT_SCORING.CRAFT_BEER_MENTIONS);
    score += craftBeerScore;
    details.craftBeerMentions = craftBeerMentions;
    
    if (craftBeerMentions > 0) {
      reasons.push(`Mentions craft beer in ${craftBeerMentions} posts`);
    }
    
    // Engagement quality
    const avgEngagement = posts.reduce((sum, post) => sum + post.likesCount + post.commentsCount, 0) / posts.length;
    const engagementScore = Math.min((avgEngagement / 100) * CONFIG.PROSPECT_SCORING.ENGAGEMENT_QUALITY, CONFIG.PROSPECT_SCORING.ENGAGEMENT_QUALITY);
    score += engagementScore;
    details.avgEngagement = avgEngagement;
    
    // Activity level
    const activityScore = Math.min((posts.length / 30) * CONFIG.PROSPECT_SCORING.ACTIVITY_LEVEL, CONFIG.PROSPECT_SCORING.ACTIVITY_LEVEL);
    score += activityScore;
    details.activityLevel = posts.length;
    
    // Check for competitor mentions
    const competitorMentions = posts.filter(post => 
      CONFIG.COMPETITORS.some(competitor => 
        post.caption.toLowerCase().includes(competitor.replace('_', '')) ||
        post.mentions.includes(competitor)
      )
    );
    
    details.competitorMentions = competitorMentions.map(post => post.caption.substring(0, 100));
    
    if (competitorMentions.length === 0) {
      score += CONFIG.PROSPECT_SCORING.COMPETITOR_ABSENCE;
      reasons.push('No competitor mentions detected');
    }
    
    // Audience size consideration
    if (profile.followersCount > 1000 && profile.followersCount < 50000) {
      score += CONFIG.PROSPECT_SCORING.AUDIENCE_COMPATIBILITY;
      reasons.push(`Good audience size: ${profile.followersCount} followers`);
    }
    
    details.score = Math.round(score);
    
    return {
      score: Math.round(score),
      details,
      reasoning: reasons.join('; ')
    };
  }

  /**
   * Get recommendation level based on score
   */
  private getRecommendationLevel(score: number): 'high' | 'medium' | 'low' | 'skip' {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    if (score >= 40) return 'low';
    return 'skip';
  }

  /**
   * Generate comparison insights
   */
  private generateComparisonInsights(comparison: Record<string, any>, leader: string): {
    leader: string;
    opportunities: string[];
    recommendations: string[];
  } {
    const opportunities: string[] = [];
    const recommendations: string[] = [];
    
    // Analyze what the leader is doing differently
    const leaderData = comparison[leader];
    
    for (const [username, data] of Object.entries(comparison)) {
      if (username === leader) continue;
      
      if (data.engagementRate < leaderData.engagementRate * 0.8) {
        opportunities.push(`${username} has ${((1 - data.engagementRate / leaderData.engagementRate) * 100).toFixed(1)}% lower engagement rate`);
      }
      
      if (data.postingFrequency < leaderData.postingFrequency * 0.8) {
        recommendations.push(`${username} should increase posting frequency to match ${leader}`);
      }
    }
    
    return { leader, opportunities, recommendations };
  }

  /**
   * Generate prospect analysis summary
   */
  private generateProspectSummary(prospects: Record<string, any>): {
    totalAnalyzed: number;
    highPriority: number;
    mediumPriority: number;
    recommended: string[];
  } {
    const analyzed = Object.keys(prospects).length;
    let highPriority = 0;
    let mediumPriority = 0;
    const recommended: string[] = [];
    
    for (const [username, data] of Object.entries(prospects)) {
      if (data.recommendation === 'high') {
        highPriority++;
        recommended.push(username);
      } else if (data.recommendation === 'medium') {
        mediumPriority++;
        recommended.push(username);
      }
    }
    
    return {
      totalAnalyzed: analyzed,
      highPriority,
      mediumPriority,
      recommended: recommended.slice(0, 5) // Top 5
    };
  }
}