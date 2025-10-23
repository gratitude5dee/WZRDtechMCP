/**
 * Agentic Commerce Protocol (ACP) Type Definitions
 * Based on x402 protocol versioning: 2025-09-29
 */

export const ACP_API_VERSION = '2025-09-29';

/**
 * Required headers for all ACP-compliant requests
 */
export interface ACPHeaders {
  /** Bearer token for authentication */
  'Authorization': string;
  /** Content type - always application/json */
  'Content-Type': 'application/json';
  /** API version following x402 protocol */
  'API-Version': typeof ACP_API_VERSION;
  /** Optional: Accept language preference */
  'Accept-Language'?: string;
  /** Optional: User agent identifier */
  'User-Agent'?: string;
  /** Optional: Idempotency key for safe retries */
  'Idempotency-Key'?: string;
  /** Optional: Unique request identifier for tracing */
  'Request-Id'?: string;
  /** Optional: Request signature for integrity verification */
  'Signature'?: string;
  /** Optional: RFC 3339 timestamp */
  'Timestamp'?: string;
}

/**
 * ACP-compliant error types
 */
export type ACPErrorType =
  | 'invalid_request'
  | 'request_not_idempotent'
  | 'processing_error'
  | 'service_unavailable'
  | 'rate_limit_exceeded';

/**
 * Flat error response structure (no nested envelope)
 */
export interface ACPError {
  /** Error type category */
  type: ACPErrorType;
  /** Specific error code */
  code: string;
  /** Human-readable error description */
  message: string;
  /** Optional: RFC 9535 JSONPath for field-specific errors */
  param?: string;
  /** Optional: Request ID for tracing */
  request_id?: string;
}

/**
 * Standard ACP response structure
 */
export interface ACPResponse<T = any> {
  /** Response data */
  data?: T;
  /** Response metadata */
  metadata?: {
    request_id?: string;
    idempotency_key?: string;
    timestamp?: string;
    [key: string]: any;
  };
}

/**
 * Idempotency cache entry
 */
export interface IdempotencyEntry {
  /** The idempotent key */
  key: string;
  /** Request parameters hash */
  paramsHash: string;
  /** Cached response */
  response: any;
  /** Expiration timestamp */
  expiresAt: number;
}

/**
 * Request options for ACP-compliant calls
 */
export interface ACPRequestOptions {
  /** Idempotency key for safe retries */
  idempotencyKey?: string;
  /** Request ID for tracing */
  requestId?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
}

/**
 * Helper to create ACP headers
 */
export function createACPHeaders(
  apiKey: string,
  options: Partial<ACPHeaders> = {}
): ACPHeaders {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'API-Version': ACP_API_VERSION,
    'User-Agent': options['User-Agent'] || 'FalAI-MCP/1.0',
    ...options,
  };
}

/**
 * Helper to create ACP error
 */
export function createACPError(
  type: ACPErrorType,
  code: string,
  message: string,
  param?: string,
  requestId?: string
): ACPError {
  const error: ACPError = {
    type,
    code,
    message,
  };

  if (param) error.param = param;
  if (requestId) error.request_id = requestId;

  return error;
}

/**
 * HTTP status codes for different error types
 */
export const ACP_ERROR_STATUS_CODES: Record<ACPErrorType, number> = {
  invalid_request: 400,
  request_not_idempotent: 409,
  processing_error: 500,
  service_unavailable: 503,
  rate_limit_exceeded: 429,
};
