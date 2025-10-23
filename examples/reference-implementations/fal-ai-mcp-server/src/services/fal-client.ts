/**
 * Fal AI Client Service
 * Handles all Fal AI API interactions with ACP protocol compliance
 */

import * as fal from '@fal-ai/serverless-client';
import crypto from 'crypto';
import { createLogger } from '../utils/logger.js';
import { ACPRequestOptions } from '../types/acp.js';
import { FalResponse, JSONSchema } from '../types/fal.js';
import { IdempotencyCache } from './cache.js';
import { formatACPError } from '../utils/error-handler.js';

const logger = createLogger('FalClientService');

export class FalClientService {
  private apiKey: string;
  private cache: IdempotencyCache;
  private schemaCache: Map<string, { schema: JSONSchema; timestamp: number }>;
  private readonly SCHEMA_CACHE_TTL: number;
  private readonly MAX_RETRIES: number;
  private readonly INITIAL_RETRY_DELAY: number;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.cache = new IdempotencyCache(
      parseInt(process.env['CACHE_TTL_SECONDS'] || '86400', 10)
    );
    this.schemaCache = new Map();
    this.SCHEMA_CACHE_TTL = parseInt(
      process.env['SCHEMA_CACHE_TTL_SECONDS'] || '3600',
      10
    ) * 1000; // 1 hour default
    this.MAX_RETRIES = parseInt(process.env['MAX_RETRIES'] || '4', 10);
    this.INITIAL_RETRY_DELAY = parseInt(
      process.env['INITIAL_RETRY_DELAY_MS'] || '2000',
      10
    );

    // Configure fal client
    fal.config({
      credentials: apiKey,
    });

    logger.info('Fal AI Client initialized', {
      cacheTTL: process.env['CACHE_TTL_SECONDS'] || '86400',
      schemaCacheTTL: this.SCHEMA_CACHE_TTL / 1000,
      maxRetries: this.MAX_RETRIES,
    });
  }

  /**
   * Generate content using a Fal model
   */
  async generate(
    modelSlug: string,
    parameters: Record<string, any>,
    options: ACPRequestOptions = {}
  ): Promise<FalResponse> {
    const requestId = options.requestId || this.generateUUID();
    const idempotencyKey = options.idempotencyKey || this.generateUUID();

    logger.info('Generation request', {
      model: modelSlug,
      requestId,
      idempotencyKey,
      hasCustomIdempotencyKey: !!options.idempotencyKey,
    });

    // Check idempotency cache
    if (options.idempotencyKey) {
      try {
        const cached = this.cache.get(options.idempotencyKey, parameters);
        if (cached) {
          logger.info('Returning cached result', {
            requestId,
            idempotencyKey: options.idempotencyKey,
          });
          return {
            ...cached.response,
            metadata: {
              ...cached.response.metadata,
              cached: true,
              request_id: requestId,
            },
          };
        }
      } catch (error) {
        // Re-throw idempotency conflicts
        if (error && typeof error === 'object' && 'type' in error) {
          throw error;
        }
        logger.warn('Cache check failed', { error, requestId });
      }
    }

    try {
      logger.debug('Sending request to Fal AI', {
        model: modelSlug,
        paramCount: Object.keys(parameters).length,
      });

      // Call Fal AI with retry logic
      const result = await this.callWithRetry(
        async () => {
          const response = await fal.subscribe(modelSlug, {
            input: parameters,
            logs: true,
          });
          return response;
        },
        this.MAX_RETRIES,
        this.INITIAL_RETRY_DELAY
      );

      const response: FalResponse = {
        data: result,
        request_id: requestId,
        metadata: {
          model: modelSlug,
          timestamp: new Date().toISOString(),
          idempotency_key: idempotencyKey,
          cached: false,
        },
      };

      // Cache the response if idempotency key was provided
      if (options.idempotencyKey) {
        try {
          this.cache.set(options.idempotencyKey, parameters, response);
          logger.debug('Cached response', {
            idempotencyKey: options.idempotencyKey,
          });
        } catch (error) {
          logger.warn('Failed to cache response', { error, requestId });
        }
      }

      logger.info('Generation completed successfully', {
        requestId,
        model: modelSlug,
      });

      return response;
    } catch (error) {
      logger.error('Generation failed', {
        requestId,
        model: modelSlug,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw formatACPError(error, requestId, 'Generation failed');
    }
  }

  /**
   * Fetch OpenAPI schema for a model
   */
  async fetchSchema(modelSlug: string): Promise<JSONSchema> {
    logger.debug('Fetching schema', { model: modelSlug });

    // Check cache
    const cached = this.schemaCache.get(modelSlug);
    if (cached && Date.now() - cached.timestamp < this.SCHEMA_CACHE_TTL) {
      logger.debug('Returning cached schema', { model: modelSlug });
      return cached.schema;
    }

    try {
      // Attempt to fetch schema from Fal AI API
      const schema = await this.fetchSchemaFromAPI(modelSlug);

      // Cache the schema
      this.schemaCache.set(modelSlug, {
        schema,
        timestamp: Date.now(),
      });

      logger.debug('Schema fetched and cached', { model: modelSlug });

      return schema;
    } catch (error) {
      logger.warn('Schema fetch failed, using fallback', {
        model: modelSlug,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Return a basic schema as fallback
      return this.getFallbackSchema(modelSlug);
    }
  }

  /**
   * Fetch schema from Fal AI API
   */
  private async fetchSchemaFromAPI(modelSlug: string): Promise<JSONSchema> {
    // Try to get schema from Fal AI's OpenAPI endpoint
    try {
      const response = await fetch(
        `https://fal.run/${encodeURIComponent(modelSlug)}/openapi.json`,
        {
          headers: {
            Authorization: `Key ${this.apiKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const openApiSpec = await response.json();
      return this.extractInputSchemaFromOpenAPI(openApiSpec);
    } catch (error) {
      logger.debug('OpenAPI fetch failed, trying alternative method', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Fallback: use basic schema
      throw error;
    }
  }

  /**
   * Extract input schema from OpenAPI specification
   */
  private extractInputSchemaFromOpenAPI(openApiSpec: any): JSONSchema {
    try {
      const paths = openApiSpec.paths || {};
      const pathKeys = Object.keys(paths);

      if (pathKeys.length === 0) {
        throw new Error('No paths found in OpenAPI spec');
      }

      const firstPathKey = pathKeys[0];
      if (!firstPathKey) {
        throw new Error('No path key found');
      }

      const firstPath = paths[firstPathKey];
      const post = firstPath.post || firstPath.put;

      if (!post) {
        throw new Error('No POST/PUT operation found');
      }

      const requestBody =
        post.requestBody?.content?.['application/json']?.schema;

      if (!requestBody) {
        throw new Error('No request body schema found');
      }

      // Extract input property if it exists
      const inputSchema = requestBody.properties?.input || requestBody;

      return inputSchema as JSONSchema;
    } catch (error) {
      logger.debug('Failed to extract schema from OpenAPI', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Get fallback schema for a model
   */
  private getFallbackSchema(modelSlug: string): JSONSchema {
    // Provide basic schemas based on model type
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Input prompt for generation',
        },
      },
    };

    // Add image_url for image-to-* models
    if (modelSlug.includes('image-to-') || modelSlug.includes('img2')) {
      schema.properties!['image_url'] = {
        type: 'string',
        description: 'URL of the input image',
        format: 'uri',
      };
    }

    // Add audio_url for audio-to-* models
    if (modelSlug.includes('audio-to-') || modelSlug.includes('speech')) {
      schema.properties!['audio_url'] = {
        type: 'string',
        description: 'URL of the input audio',
        format: 'uri',
      };
    }

    // Add video_url for video-to-* models
    if (modelSlug.includes('video-to-')) {
      schema.properties!['video_url'] = {
        type: 'string',
        description: 'URL of the input video',
        format: 'uri',
      };
    }

    return schema;
  }

  /**
   * Call function with exponential backoff retry
   */
  private async callWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number,
    initialDelay: number
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        // Don't retry on client errors (4xx)
        if (this.isClientError(error)) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === maxRetries) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = initialDelay * Math.pow(2, attempt);
        logger.warn(
          `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`,
          {
            error: lastError.message,
          }
        );

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Check if error is a client error (4xx)
   */
  private isClientError(error: any): boolean {
    const status = error?.status || error?.statusCode;
    return status >= 400 && status < 500;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Generate UUID v4
   */
  private generateUUID(): string {
    return crypto.randomUUID();
  }

  /**
   * Clean up expired cache entries
   */
  cleanup(): void {
    this.cache.cleanup();

    // Clean schema cache
    const now = Date.now();
    for (const [slug, cached] of this.schemaCache.entries()) {
      if (now - cached.timestamp > this.SCHEMA_CACHE_TTL) {
        this.schemaCache.delete(slug);
      }
    }

    logger.debug('Cache cleanup completed');
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    cacheSize: number;
    schemaCacheSize: number;
  } {
    return {
      cacheSize: this.cache.getStats().size,
      schemaCacheSize: this.schemaCache.size,
    };
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    this.cache.destroy();
    this.schemaCache.clear();
    logger.info('Fal client service destroyed');
  }
}
