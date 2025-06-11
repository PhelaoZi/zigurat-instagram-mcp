/**
 * Apify Service for Instagram data extraction
 */

import { ApifyApi } from 'apify-client';
import { CONFIG } from '../config/config.js';
import { InstagramProfile, InstagramPost, ApifyResponse } from '../types/instagram.js';

export class ApifyService {
  private client: ApifyApi;
  private rateLimitTracker: Map<string, number[]> = new Map();

  constructor(apiToken: string) {
    this.client = new ApifyApi({
      token: apiToken,
      baseUrl: CONFIG.APIFY_BASE_URL,
      timeout: CONFIG.APIFY_REQUEST_TIMEOUT
    });
  }

  /**
   * Extract Instagram profile data
   */
  async extractProfile(username: string, maxPosts: number = CONFIG.DEFAULT_MAX_POSTS): Promise<{ profile: InstagramProfile; posts: InstagramPost[] }> {
    await this.checkRateLimit();

    try {
      const run = await this.client.actor('apify/instagram-profile-scraper').call({
        usernames: [username],
        resultsLimit: maxPosts,
        includeReels: true,
        includeStories: false // Only public highlights
      });

      const { items } = await this.client.dataset(run.defaultDatasetId).listItems();
      
      if (!items || items.length === 0) {
        throw new Error(`No data found for Instagram user: ${username}`);
      }

      const data = items[0] as ApifyResponse;
      return this.transformApifyResponse(data);
    } catch (error) {
      console.error(`Error extracting profile ${username}:`, error);
      throw error;
    }
  }

  /**
   * Extract specific posts from username
   */
  async extractPosts(username: string, maxPosts: number = CONFIG.DEFAULT_MAX_POSTS): Promise<InstagramPost[]> {
    await this.checkRateLimit();

    try {
      const run = await this.client.actor('apify/instagram-post-scraper').call({
        usernames: [username],
        resultsLimit: maxPosts
      });

      const { items } = await this.client.dataset(run.defaultDatasetId).listItems();
      return items.map(item => this.transformPost(item));
    } catch (error) {
      console.error(`Error extracting posts for ${username}:`, error);
      throw error;
    }
  }

  /**
   * Extract hashtag data
   */
  async extractHashtagPosts(hashtag: string, maxPosts: number = 50): Promise<InstagramPost[]> {
    await this.checkRateLimit();

    try {
      const run = await this.client.actor('apify/instagram-hashtag-scraper').call({
        hashtags: [hashtag],
        resultsLimit: maxPosts
      });

      const { items } = await this.client.dataset(run.defaultDatasetId).listItems();
      return items.map(item => this.transformPost(item));
    } catch (error) {
      console.error(`Error extracting hashtag ${hashtag}:`, error);
      throw error;
    }
  }

  /**
   * Transform Apify response to our format
   */
  private transformApifyResponse(data: ApifyResponse): { profile: InstagramProfile; posts: InstagramPost[] } {
    const profile: InstagramProfile = {
      username: data.username,
      fullName: data.fullName || '',
      biography: data.biography || '',
      followersCount: data.followersCount || 0,
      followingCount: data.followingCount || 0,
      postsCount: data.postsCount || 0,
      isVerified: data.isVerified || false,
      isPrivate: data.isPrivate || false,
      profilePicUrl: data.profilePicUrl || '',
      externalUrl: data.externalUrl,
      category: data.category
    };

    const posts: InstagramPost[] = (data.posts || []).map(post => this.transformPost(post));

    return { profile, posts };
  }

  /**
   * Transform post data from Apify format
   */
  private transformPost(postData: any): InstagramPost {
    return {
      id: postData.id,
      shortcode: postData.shortcode,
      timestamp: new Date(postData.timestamp),
      caption: postData.caption || '',
      likesCount: postData.likesCount || 0,
      commentsCount: postData.commentsCount || 0,
      mediaType: postData.mediaType || 'image',
      mediaUrl: postData.mediaUrl || '',
      hashtags: this.extractHashtags(postData.caption || ''),
      mentions: this.extractMentions(postData.caption || ''),
      location: postData.location ? {
        name: postData.location.name,
        coordinates: postData.location.coordinates
      } : undefined,
      engagement: {
        rate: this.calculateEngagementRate(postData.likesCount, postData.commentsCount, postData.viewsCount),
        quality: this.classifyEngagementQuality(postData.likesCount, postData.commentsCount)
      }
    };
  }

  /**
   * Extract hashtags from caption
   */
  private extractHashtags(caption: string): string[] {
    const hashtagRegex = /#([a-zA-Z0-9_\u00c0-\u017e]+)/g;
    const matches = caption.match(hashtagRegex);
    return matches ? matches.map(tag => tag.toLowerCase()) : [];
  }

  /**
   * Extract mentions from caption
   */
  private extractMentions(caption: string): string[] {
    const mentionRegex = /@([a-zA-Z0-9_.]+)/g;
    const matches = caption.match(mentionRegex);
    return matches ? matches.map(mention => mention.substring(1)) : [];
  }

  /**
   * Calculate engagement rate
   */
  private calculateEngagementRate(likes: number, comments: number, views?: number): number {
    const totalEngagement = likes + comments;
    const base = views || likes; // Use views if available, otherwise likes as proxy
    return base > 0 ? (totalEngagement / base) * 100 : 0;
  }

  /**
   * Classify engagement quality
   */
  private classifyEngagementQuality(likes: number, comments: number): 'high' | 'medium' | 'low' {
    const commentRatio = likes > 0 ? (comments / likes) * 100 : 0;
    
    if (commentRatio > 5) return 'high';
    if (commentRatio > 2) return 'medium';
    return 'low';
  }

  /**
   * Rate limiting check
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const windowStart = now - (60 * 1000); // 1 minute window
    
    let requests = this.rateLimitTracker.get('requests') || [];
    requests = requests.filter(time => time > windowStart);
    
    if (requests.length >= CONFIG.RATE_LIMIT_REQUESTS_PER_MINUTE) {
      const waitTime = requests[0] - windowStart + 1000;
      console.log(`Rate limit reached. Waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    requests.push(now);
    this.rateLimitTracker.set('requests', requests);
  }
}