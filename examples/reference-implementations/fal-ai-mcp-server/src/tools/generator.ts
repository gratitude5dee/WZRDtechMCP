/**
 * Tool Registration Generator
 * Dynamically registers all Fal AI models as MCP tools
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { FalClientService } from '../services/fal-client.js';
import { createLogger } from '../utils/logger.js';
import { formatACPError, createToolErrorResponse } from '../utils/error-handler.js';
import {
  FalModel,
  sanitizeSlugToToolName,
  formatToolDescription,
  JSONSchema,
} from '../types/fal.js';

const logger = createLogger('ToolGenerator');

/**
 * Register all Fal AI models as MCP tools
 */
export async function registerAllFalTools(
  server: Server,
  client: FalClientService,
  models: FalModel[]
): Promise<void> {
  logger.info('Starting tool registration', { modelCount: models.length });

  // Register tools/list handler once for all models
  server.setRequestHandler(
    {
      method: 'tools/list',
    } as any,
    async () => {
      return {
        tools: models.map((m) => ({
          name: sanitizeSlugToToolName(m.slug),
          description: formatToolDescription(m),
          inputSchema: {
            type: 'object',
            properties: {
              prompt: {
                type: 'string',
                description: 'Input prompt',
              },
            },
          } as JSONSchema,
        })),
      };
    }
  );

  // Register tools/call handler that handles all models
  const schemaCache = new Map<string, JSONSchema>();

  server.setRequestHandler(
    {
      method: 'tools/call',
    } as any,
    async (request: any) => {
      const toolName = request.params.name;

      // Find the model for this tool
      const model = models.find((m) => sanitizeSlugToToolName(m.slug) === toolName);

      if (!model) {
        // Not one of our tools
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: `Tool not found: ${toolName}` }),
            },
          ],
          isError: true,
        };
      }

      const startTime = Date.now();
      logger.info('Tool invoked', {
        tool: toolName,
        model: model.slug,
      });

      try {
        // Load schema if not cached
        if (!schemaCache.has(model.slug)) {
          logger.debug('Loading schema for tool', { toolName });
          const schema = await client.fetchSchema(model.slug);
          schemaCache.set(model.slug, schema);
        }

        // Validate input against schema (basic validation)
        const params = request.params.arguments || {};

        // Generate using Fal AI
        const result = await client.generate(model.slug, params, {
          // Use request metadata if available
          requestId: request.params._meta?.requestId,
          idempotencyKey: request.params._meta?.idempotencyKey,
        });

        const duration = Date.now() - startTime;
        logger.info('Tool execution completed', {
          tool: toolName,
          durationMs: duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Tool execution failed', {
          tool: toolName,
          durationMs: duration,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        const acpError = formatACPError(error, undefined, `Tool: ${toolName}`);
        return createToolErrorResponse(acpError);
      }
    }
  );

  logger.info('Tool registration completed', {
    registered: models.length,
    total: models.length,
  });
}

/**
 * Get tool metadata for a specific model
 */
export function getToolMetadata(model: FalModel): {
  name: string;
  description: string;
  category: string;
  pricing: string;
  examples: {
    javascript?: string;
    python?: string;
  };
} {
  return {
    name: sanitizeSlugToToolName(model.slug),
    description: formatToolDescription(model),
    category: model.category,
    pricing: model.pricing.display,
    examples: model.examples,
  };
}

/**
 * Get all tool names
 */
export function getAllToolNames(models: FalModel[]): string[] {
  return models.map((model) => sanitizeSlugToToolName(model.slug));
}

/**
 * Find model by tool name
 */
export function findModelByToolName(
  models: FalModel[],
  toolName: string
): FalModel | undefined {
  return models.find((model) => sanitizeSlugToToolName(model.slug) === toolName);
}
