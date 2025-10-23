/**
 * MCP Resources
 * Provides model catalog, schemas, and pricing information
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { FalClientService } from '../services/fal-client.js';
import { createLogger } from '../utils/logger.js';
import { FalModel, getCategoryBreakdown } from '../types/fal.js';

const logger = createLogger('Resources');

/**
 * Register all MCP resources
 */
export function registerResources(
  server: Server,
  client: FalClientService,
  models: FalModel[]
): void {
  logger.info('Registering MCP resources', { modelCount: models.length });

  // Register resources/list handler
  server.setRequestHandler(
    {
      method: 'resources/list',
    } as any,
    async () => {
      return {
        resources: [
          {
            uri: 'fal://models/catalog',
            name: 'Fal AI Model Catalog',
            description: `Complete catalog of all ${models.length} Fal AI models`,
            mimeType: 'application/json',
          },
          {
            uri: 'fal://pricing',
            name: 'Pricing Information',
            description: 'Pricing details for all Fal AI models',
            mimeType: 'application/json',
          },
          ...models.map((model) => ({
            uri: `fal://models/${encodeURIComponent(model.slug)}/schema`,
            name: `${model.name} Schema`,
            description: `OpenAPI schema for ${model.name}`,
            mimeType: 'application/json',
          })),
        ],
      };
    }
  );

  // Register consolidated resources/read handler
  server.setRequestHandler(
    {
      method: 'resources/read',
    } as any,
    async (request: any) => {
      const uri = request.params.uri;

      // Handle catalog resource
      if (uri === 'fal://models/catalog') {
        const categories = getCategoryBreakdown(models);

        return {
          contents: [
            {
              uri: 'fal://models/catalog',
              mimeType: 'application/json',
              text: JSON.stringify(
                {
                  total: models.length,
                  categories,
                  models: models.map((m) => ({
                    slug: m.slug,
                    name: m.name,
                    category: m.category,
                    description: m.description,
                    url: m.url,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // Handle pricing resource
      if (uri === 'fal://pricing') {
        const pricingData = models.map((model) => ({
          slug: model.slug,
          name: model.name,
          category: model.category,
          pricing: model.pricing,
        }));

        // Group by category
        const byCategory: Record<string, any[]> = {};
        for (const item of pricingData) {
          if (!byCategory[item.category]) {
            byCategory[item.category] = [];
          }
          byCategory[item.category]!.push(item);
        }

        return {
          contents: [
            {
              uri: 'fal://pricing',
              mimeType: 'application/json',
              text: JSON.stringify(
                {
                  total_models: models.length,
                  by_category: byCategory,
                  all_models: pricingData,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // Handle schema resources
      const schemaMatch = uri.match(/^fal:\/\/models\/([^/]+)\/schema$/);
      if (schemaMatch) {
        const encodedSlug = schemaMatch[1];
        const slug = encodedSlug ? decodeURIComponent(encodedSlug) : '';

        const model = models.find((m) => m.slug === slug);
        if (!model) {
          throw new Error(`Model not found: ${slug}`);
        }

        try {
          const schema = await client.fetchSchema(slug);

          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(
                  {
                    model: {
                      slug: model.slug,
                      name: model.name,
                      category: model.category,
                      description: model.description,
                    },
                    schema,
                    examples: model.examples,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          logger.error('Failed to fetch schema', {
            model: slug,
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          throw new Error(`Failed to fetch schema for ${slug}`);
        }
      }

      // Unknown resource
      throw new Error(`Unknown resource: ${uri}`);
    }
  );

  logger.info('Resources registered successfully');
}

/**
 * Get resource statistics
 */
export function getResourceStats(models: FalModel[]): {
  totalModels: number;
  categories: number;
  resources: number;
} {
  const categories = getCategoryBreakdown(models);

  return {
    totalModels: models.length,
    categories: Object.keys(categories).length,
    resources: 2 + models.length, // catalog + pricing + schemas
  };
}
