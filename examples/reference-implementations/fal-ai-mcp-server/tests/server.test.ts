/**
 * Test Suite for Fal AI MCP Server
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { IdempotencyCache } from '../src/services/cache.js';
import { createACPError, ACP_API_VERSION } from '../src/types/acp.js';
import {
  sanitizeSlugToToolName,
  formatToolDescription,
  getCategoryBreakdown,
} from '../src/types/fal.js';
import type { FalModel } from '../src/types/fal.js';

// Mock models for testing
const mockModels: FalModel[] = [
  {
    slug: 'fal-ai/flux-pro',
    name: 'FLUX.1 [pro]',
    category: 'Text-to-Image',
    description: 'State-of-the-art text-to-image model',
    pricing: {
      display: '$0.05 per image',
      value: 0.05,
      currency: 'USD',
      unit: 'image',
    },
    examples: {
      javascript: 'const result = await fal.subscribe(...)',
      python: 'result = fal.subscribe(...)',
    },
    url: 'https://fal.ai/models/fal-ai/flux-pro',
  },
  {
    slug: 'fal-ai/luma-dream-machine',
    name: 'Luma Dream Machine',
    category: 'Text-to-Video',
    description: 'Create high-quality videos from text',
    pricing: {
      display: '$0.10 per video',
      value: 0.10,
      currency: 'USD',
      unit: 'video',
    },
    examples: {
      javascript: 'const result = await fal.subscribe(...)',
      python: 'result = fal.subscribe(...)',
    },
    url: 'https://fal.ai/models/fal-ai/luma-dream-machine',
  },
];

describe('ACP Protocol Types', () => {
  test('should have correct API version', () => {
    expect(ACP_API_VERSION).toBe('2025-09-29');
  });

  test('should create ACP error with all fields', () => {
    const error = createACPError(
      'invalid_request',
      'test_error',
      'Test message',
      'test.field',
      'req-123'
    );

    expect(error.type).toBe('invalid_request');
    expect(error.code).toBe('test_error');
    expect(error.message).toBe('Test message');
    expect(error.param).toBe('test.field');
    expect(error.request_id).toBe('req-123');
  });

  test('should create ACP error without optional fields', () => {
    const error = createACPError(
      'processing_error',
      'test_error',
      'Test message'
    );

    expect(error.type).toBe('processing_error');
    expect(error.code).toBe('test_error');
    expect(error.message).toBe('Test message');
    expect(error.param).toBeUndefined();
    expect(error.request_id).toBeUndefined();
  });
});

describe('Fal Model Utilities', () => {
  test('should sanitize slug to tool name', () => {
    expect(sanitizeSlugToToolName('fal-ai/flux-pro')).toBe('fal_flux_pro');
    expect(sanitizeSlugToToolName('fal-ai/flux-pro/kontext')).toBe(
      'fal_flux_pro_kontext'
    );
    expect(sanitizeSlugToToolName('fal-ai/stable-diffusion-v3')).toBe(
      'fal_stable_diffusion_v3'
    );
  });

  test('should format tool description with category', () => {
    const description = formatToolDescription(mockModels[0]!);
    expect(description).toContain('[Text-to-Image]');
    expect(description).toContain('State-of-the-art text-to-image model');
  });

  test('should get category breakdown', () => {
    const breakdown = getCategoryBreakdown(mockModels);
    expect(breakdown['Text-to-Image']).toBe(1);
    expect(breakdown['Text-to-Video']).toBe(1);
  });
});

describe('Idempotency Cache', () => {
  let cache: IdempotencyCache;

  beforeEach(() => {
    cache = new IdempotencyCache(1); // 1 second TTL for testing
  });

  afterEach(() => {
    cache.destroy();
  });

  test('should store and retrieve cached values', () => {
    const key = 'test-key';
    const params = { prompt: 'test' };
    const response = { data: { result: 'success' } };

    cache.set(key, params, response);
    const retrieved = cache.get(key, params);

    expect(retrieved).toBeTruthy();
    expect(retrieved?.response).toEqual(response);
  });

  test('should return null for cache miss', () => {
    const result = cache.get('nonexistent-key', {});
    expect(result).toBeNull();
  });

  test('should throw error on parameter mismatch', () => {
    const key = 'test-key';
    const params1 = { prompt: 'test1' };
    const params2 = { prompt: 'test2' };
    const response = { data: { result: 'success' } };

    cache.set(key, params1, response);

    expect(() => cache.get(key, params2)).toThrow();
  });

  test('should expire entries after TTL', async () => {
    const key = 'test-key';
    const params = { prompt: 'test' };
    const response = { data: { result: 'success' } };

    cache.set(key, params, response);

    // Wait for expiration
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const result = cache.get(key, params);
    expect(result).toBeNull();
  });

  test('should delete entries', () => {
    const key = 'test-key';
    const params = { prompt: 'test' };
    const response = { data: { result: 'success' } };

    cache.set(key, params, response);
    expect(cache.has(key)).toBe(true);

    cache.delete(key);
    expect(cache.has(key)).toBe(false);
  });

  test('should clear all entries', () => {
    cache.set('key1', { a: 1 }, { data: 1 });
    cache.set('key2', { b: 2 }, { data: 2 });

    expect(cache.getStats().size).toBe(2);

    cache.clear();
    expect(cache.getStats().size).toBe(0);
  });

  test('should cleanup expired entries', async () => {
    const key = 'test-key';
    const params = { prompt: 'test' };
    const response = { data: { result: 'success' } };

    cache.set(key, params, response);
    expect(cache.getStats().size).toBe(1);

    // Wait for expiration
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const removed = cache.cleanup();
    expect(removed).toBe(1);
    expect(cache.getStats().size).toBe(0);
  });
});

describe('Cache Statistics', () => {
  let cache: IdempotencyCache;

  beforeEach(() => {
    cache = new IdempotencyCache(3600);
  });

  afterEach(() => {
    cache.destroy();
  });

  test('should provide cache statistics', () => {
    cache.set('key1', { a: 1 }, { data: 1 });
    cache.set('key2', { b: 2 }, { data: 2 });

    const stats = cache.getStats();
    expect(stats.size).toBe(2);
    expect(stats.oldestEntry).toBeTruthy();
    expect(stats.newestEntry).toBeTruthy();
  });

  test('should return null for empty cache stats', () => {
    const stats = cache.getStats();
    expect(stats.size).toBe(0);
    expect(stats.oldestEntry).toBeNull();
    expect(stats.newestEntry).toBeNull();
  });
});
