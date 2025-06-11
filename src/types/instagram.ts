/**
 * TypeScript type definitions for Instagram data structures
 */

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
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
}

export interface InstagramPost {
  id: string;
  shortcode: string;
  timestamp: Date;
  caption: string;
  likesCount: number;
  commentsCount: number;
  mediaType: 'image' | 'video' | 'carousel';
  mediaUrl: string;
  hashtags: string[];
  mentions: string[];
  location?: {
    name: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  engagement: {
    rate: number;
    quality: 'high' | 'medium' | 'low';
  };
}

export interface AnalyticsMetrics {
  engagementRate: number;
  avgLikes: number;
  avgComments: number;
  avgViews?: number;
  growthRate: number;
  postingFrequency: number;
  bestPostingTimes: string[];
  topHashtags: string[];
  audienceInsights: {
    primaryDemographic: string;
    engagementPatterns: string[];
  };
}

export interface ComparisonResult {
  comparison: Record<string, {
    engagementRate: number;
    avgLikes: number;
    avgComments: number;
    postingFrequency: number;
    topHashtags: string[];
    followersCount: number;
    postsCount: number;
  }>;
  insights: {
    leader: string;
    opportunities: string[];
    recommendations: string[];
  };
}

export interface HashtagAnalysis {
  hashtagAnalysis: Record<string, {
    occurrences: number;
    avgEngagement: number;
    avgLikes: number;
    avgComments: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  recommendations: {
    topPerforming: string[];
    underperforming: string[];
    suggested: string[];
  };
}

export interface ProspectAnalysis {
  prospects: Record<string, {
    score: number;
    profile?: InstagramProfile;
    analysis: {
      craftBeerMentions: number;
      competitorMentions: string[];
      audienceCompatibility?: number;
      engagementQuality: number;
      activityLevel: number;
    };
    recommendation: 'high' | 'medium' | 'low' | 'skip';
    reasoning: string;
    error?: string;
  }>;
  summary: {
    totalAnalyzed: number;
    highPriority: number;
    mediumPriority: number;
    recommended: string[];
  };
}

export interface ContentIdea {
  type: 'post' | 'story' | 'reel';
  title: string;
  description: string;
  suggestedHashtags: string[];
  estimatedEngagement: number;
  bestTimingToPost: string;
  reasoning: string;
}

export interface ContentIdeaResult {
  ideas: ContentIdea[];
  insights: {
    contentGaps: string[];
    opportunities: string[];
  };
}

// Apify response types
export interface ApifyResponse {
  username: string;
  fullName?: string;
  biography?: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  isVerified?: boolean;
  isPrivate?: boolean;
  profilePicUrl?: string;
  externalUrl?: string;
  category?: string;
  posts?: any[];
}

// MCP Tool result types
export interface MCPToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    processingTime: number;
    source: string;
    timestamp: Date;
  };
}

// Analysis request parameters
export interface AnalysisRequest {
  username: string;
  maxPosts?: number;
  includeStories?: boolean;
  includeReels?: boolean;
  timeframe?: '7d' | '30d' | '90d';
}

export interface ComparisonRequest {
  usernames: string[];
  maxPosts?: number;
  metrics?: string[];
}

export interface ProspectRequest {
  usernames: string[];
  criteria?: {
    craftBeerFocus?: boolean;
    minEngagement?: number;
    audienceSize?: 'small' | 'medium' | 'large';
  };
}

export interface ContentRequest {
  username: string;
  contentType?: 'post' | 'story' | 'reel' | 'all';
  basedOn?: 'top_performing' | 'trending' | 'competitor_analysis';
  quantity?: number;
}