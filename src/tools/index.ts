/**
 * MCP Tools Registration
 * Registers all available tools with the MCP server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { InstagramAnalytics } from '../services/instagram-analytics.js';
import { analyzeProfileTool } from './analyze-profile.js';
import { compareProfilesTool } from './compare-profiles.js';
import { analyzeHashtagsTool } from './analyze-hashtags.js';
import { analyzeProspectsTool } from './analyze-prospects.js';
import { generateContentIdeasTool } from './generate-content-ideas.js';

/**
 * Register all MCP tools with the server
 */
export function registerTools(server: Server, analytics: InstagramAnalytics): void {
  // Profile analysis tool
  server.setRequestHandler('tools/call', async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'analyze_instagram_profile':
          return await analyzeProfileTool(analytics, args);
        
        case 'compare_instagram_profiles':
          return await compareProfilesTool(analytics, args);
        
        case 'analyze_hashtag_performance':
          return await analyzeHashtagsTool(analytics, args);
        
        case 'analyze_prospect_bars':
          return await analyzeProspectsTool(analytics, args);
        
        case 'generate_content_ideas':
          return await generateContentIdeasTool(analytics, args);
        
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      console.error(`Error executing tool ${name}:`, error);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            metadata: {
              processingTime: 0,
              source: 'zigurat-instagram-mcp',
              timestamp: new Date()
            }
          }, null, 2)
        }],
        isError: true
      };
    }
  });

  // List available tools
  server.setRequestHandler('tools/list', async () => {
    return {
      tools: [
        {
          name: 'analyze_instagram_profile',
          description: 'Analyze a complete Instagram profile including posts, engagement metrics, and insights',
          inputSchema: {
            type: 'object',
            properties: {
              username: {
                type: 'string',
                description: 'Instagram username (without @)'
              },
              maxPosts: {
                type: 'number',
                description: 'Maximum number of posts to analyze (default: 50)',
                default: 50
              },
              includeReels: {
                type: 'boolean',
                description: 'Include reels in analysis (default: true)',
                default: true
              }
            },
            required: ['username']
          }
        },
        {
          name: 'compare_instagram_profiles',
          description: 'Compare multiple Instagram profiles for competitive analysis',
          inputSchema: {
            type: 'object',
            properties: {
              usernames: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of Instagram usernames to compare'
              },
              maxPosts: {
                type: 'number',
                description: 'Maximum posts per profile to analyze (default: 20)',
                default: 20
              }
            },
            required: ['usernames']
          }
        },
        {
          name: 'analyze_hashtag_performance',
          description: 'Analyze hashtag performance and get optimization recommendations',
          inputSchema: {
            type: 'object',
            properties: {
              username: {
                type: 'string',
                description: 'Instagram username to analyze hashtags for'
              },
              timeframeDays: {
                type: 'number',
                description: 'Number of days to look back for analysis (default: 30)',
                default: 30
              }
            },
            required: ['username']
          }
        },
        {
          name: 'analyze_prospect_bars',
          description: 'Analyze bars/restaurants as potential clients for Zigurat',
          inputSchema: {
            type: 'object',
            properties: {
              usernames: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of bar/restaurant Instagram usernames'
              }
            },
            required: ['usernames']
          }
        },
        {
          name: 'generate_content_ideas',
          description: 'Generate content ideas based on performance analysis',
          inputSchema: {
            type: 'object',
            properties: {
              username: {
                type: 'string',
                description: 'Instagram username to base ideas on'
              },
              contentType: {
                type: 'string',
                enum: ['post', 'story', 'reel', 'all'],
                description: 'Type of content to generate ideas for',
                default: 'all'
              },
              quantity: {
                type: 'number',
                description: 'Number of ideas to generate (default: 5)',
                default: 5
              }
            },
            required: ['username']
          }
        }
      ]
    };
  });
}