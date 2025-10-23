#!/usr/bin/env node

/**
 * Fal AI MCP Server
 * Production-ready Model Context Protocol server for Fal AI
 * Provides access to 794+ AI models with full ACP compliance
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

import { FalClientService } from './services/fal-client.js';
import { registerAllFalTools } from './tools/generator.js';
import { registerResources, getResourceStats } from './resources/model-catalog.js';
import { createLogger } from './utils/logger.js';
import { FalModel } from './types/fal.js';
import { ACP_API_VERSION } from './types/acp.js';

// Load environment variables
config();

const logger = createLogger('Main');

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Main server class
 */
class FalAIMCPServer {
  private server: Server;
  private client: FalClientService;
  private models: FalModel[];
  private readonly version = '1.0.0';

  constructor() {
    // Validate environment
    const apiKey = process.env['FAL_KEY'];
    if (!apiKey) {
      logger.error('FAL_KEY environment variable is required');
      throw new Error('FAL_KEY environment variable is required');
    }

    // Load models data
    this.models = this.loadModels();
    logger.info('Loaded models', {
      count: this.models.length,
      categories: new Set(this.models.map((m) => m.category)).size,
    });

    // Initialize Fal client
    this.client = new FalClientService(apiKey);

    // Initialize MCP server
    this.server = new Server(
      {
        name: 'fal-ai-mcp',
        version: this.version,
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    // Setup handlers
    this.setupHandlers();

    logger.info('Fal AI MCP Server initialized', {
      version: this.version,
      acpVersion: ACP_API_VERSION,
      models: this.models.length,
    });
  }

  /**
   * Load models from data file
   */
  private loadModels(): FalModel[] {
    try {
      const dataPath = join(__dirname, '../data/fal_models.json');
      const data = readFileSync(dataPath, 'utf-8');
      const models = JSON.parse(data) as FalModel[];

      if (!Array.isArray(models) || models.length === 0) {
        throw new Error('Invalid or empty models data');
      }

      return models;
    } catch (error) {
      logger.error('Failed to load models data', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Failed to load models data');
    }
  }

  /**
   * Setup MCP server handlers
   */
  private setupHandlers(): void {
    // Register tools
    registerAllFalTools(this.server, this.client, this.models);

    // Register resources
    registerResources(this.server, this.client, this.models);

    // Server info handler
    this.server.setRequestHandler(
      {
        method: 'initialize',
      } as any,
      async (request: any) => {
        logger.info('Client connected', {
          clientInfo: request.params?.clientInfo,
        });

        const stats = getResourceStats(this.models);

        return {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
            resources: {},
          },
          serverInfo: {
            name: 'fal-ai-mcp',
            version: this.version,
            metadata: {
              acpVersion: ACP_API_VERSION,
              totalModels: stats.totalModels,
              categories: stats.categories,
              resources: stats.resources,
            },
          },
        };
      }
    );

    // Ping handler
    this.server.setRequestHandler(
      {
        method: 'ping',
      } as any,
      async () => {
        return {};
      }
    );

    logger.debug('Server handlers configured');
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();

    // Setup cleanup handlers
    this.setupCleanup();

    logger.info('Starting MCP server on stdio transport');

    await this.server.connect(transport);

    logger.info('MCP server started successfully', {
      transport: 'stdio',
      models: this.models.length,
    });
  }

  /**
   * Setup cleanup handlers for graceful shutdown
   */
  private setupCleanup(): void {
    const cleanup = async () => {
      logger.info('Shutting down server...');

      try {
        // Cleanup client resources
        this.client.destroy();

        // Close server
        await this.server.close();

        logger.info('Server shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        process.exit(1);
      }
    };

    // Handle various shutdown signals
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('SIGQUIT', cleanup);

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', {
        error: error.message,
        stack: error.stack,
      });
      cleanup();
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', {
        reason: String(reason),
        promise: String(promise),
      });
    });
  }
}

/**
 * Main entry point
 */
async function main() {
  try {
    const server = new FalAIMCPServer();
    await server.start();
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { FalAIMCPServer };
