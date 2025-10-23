/**
 * Idempotency Cache Service
 * Implements 24-hour cache with conflict detection per ACP spec
 */

import crypto from 'crypto';
import { IdempotencyEntry, createACPError } from '../types/acp.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('IdempotencyCache');

export class IdempotencyCache {
  private cache: Map<string, IdempotencyEntry>;
  private readonly ttl: number; // Time-to-live in milliseconds
  private cleanupInterval: NodeJS.Timeout | null;

  constructor(ttlSeconds: number = 86400) {
    // Default: 24 hours
    this.cache = new Map();
    this.ttl = ttlSeconds * 1000;
    this.cleanupInterval = null;

    // Start automatic cleanup every hour
    this.startCleanup();

    logger.info('Idempotency cache initialized', {
      ttlSeconds,
      cleanupIntervalMs: 3600000,
    });
  }

  /**
   * Get cached response for idempotency key
   * Throws error if key exists with different parameters (409 Conflict)
   */
  get(key: string, parameters: Record<string, any>): IdempotencyEntry | null {
    const entry = this.cache.get(key);

    if (!entry) {
      logger.debug('Cache miss', { key });
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      logger.debug('Cache entry expired', { key });
      this.cache.delete(key);
      return null;
    }

    // Verify parameters match (conflict detection)
    const paramsHash = this.hashParameters(parameters);
    if (entry.paramsHash !== paramsHash) {
      logger.warn('Idempotency conflict detected', {
        key,
        expectedHash: entry.paramsHash,
        actualHash: paramsHash,
      });

      throw createACPError(
        'request_not_idempotent',
        'idempotency_conflict',
        'Idempotency key reused with different parameters',
        undefined,
        undefined
      );
    }

    logger.debug('Cache hit', { key });
    return entry;
  }

  /**
   * Set cached response for idempotency key
   */
  set(key: string, parameters: Record<string, any>, response: any): void {
    const paramsHash = this.hashParameters(parameters);
    const expiresAt = Date.now() + this.ttl;

    const entry: IdempotencyEntry = {
      key,
      paramsHash,
      response,
      expiresAt,
    };

    this.cache.set(key, entry);

    logger.debug('Cache entry created', {
      key,
      expiresAt: new Date(expiresAt).toISOString(),
      size: this.cache.size,
    });
  }

  /**
   * Check if key exists (without parameter verification)
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete entry by key
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.debug('Cache entry deleted', { key });
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    logger.info('Cache cleared', { entriesRemoved: size });
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      logger.debug('Cache cleanup completed', {
        entriesRemoved: removed,
        remainingEntries: this.cache.size,
      });
    }

    return removed;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    oldestEntry: string | null;
    newestEntry: string | null;
  } {
    let oldestTime = Infinity;
    let newestTime = 0;
    let oldestKey: string | null = null;
    let newestKey: string | null = null;

    for (const [key, entry] of this.cache.entries()) {
      const age = entry.expiresAt - this.ttl;
      if (age < oldestTime) {
        oldestTime = age;
        oldestKey = key;
      }
      if (age > newestTime) {
        newestTime = age;
        newestKey = key;
      }
    }

    return {
      size: this.cache.size,
      oldestEntry: oldestKey ? new Date(oldestTime).toISOString() : null,
      newestEntry: newestKey ? new Date(newestTime).toISOString() : null,
    };
  }

  /**
   * Hash parameters for comparison
   */
  private hashParameters(parameters: Record<string, any>): string {
    // Sort keys for consistent hashing
    const sorted = Object.keys(parameters)
      .sort()
      .reduce((acc, key) => {
        acc[key] = parameters[key];
        return acc;
      }, {} as Record<string, any>);

    const json = JSON.stringify(sorted);
    return crypto.createHash('sha256').update(json).digest('hex');
  }

  /**
   * Start automatic cleanup interval
   */
  private startCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Run cleanup every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 3600000);

    // Prevent interval from keeping process alive
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Stop automatic cleanup
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.debug('Cleanup interval stopped');
    }
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    this.stopCleanup();
    this.clear();
    logger.info('Cache destroyed');
  }
}
