/**
 * Error Handler Utility
 * Converts errors to ACP-compliant flat error format
 */

import { ACPError, createACPError } from '../types/acp.js';
import { createLogger } from './logger.js';

const logger = createLogger('ErrorHandler');

/**
 * Format error to ACP-compliant structure
 */
export function formatACPError(
  error: unknown,
  requestId?: string,
  context?: string
): ACPError {
  logger.debug('Formatting error', {
    errorType: error instanceof Error ? error.constructor.name : typeof error,
    context,
    requestId,
  });

  // Handle ACPError (already formatted)
  if (isACPError(error)) {
    return error;
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return handleStandardError(error, requestId, context);
  }

  // Handle object-like errors
  if (typeof error === 'object' && error !== null) {
    return handleObjectError(error, requestId, context);
  }

  // Handle primitive errors (string, number, etc.)
  return createACPError(
    'processing_error',
    'unknown_error',
    String(error),
    undefined,
    requestId
  );
}

/**
 * Check if error is already an ACPError
 */
function isACPError(error: unknown): error is ACPError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'code' in error &&
    'message' in error
  );
}

/**
 * Handle standard JavaScript Error objects
 */
function handleStandardError(
  error: Error,
  requestId?: string,
  context?: string
): ACPError {
  const message = context ? `${context}: ${error.message}` : error.message;

  // Check for specific error types
  if (error.name === 'TypeError' || error.name === 'RangeError') {
    return createACPError(
      'invalid_request',
      error.name.toLowerCase(),
      message,
      undefined,
      requestId
    );
  }

  if (error.name === 'TimeoutError') {
    return createACPError(
      'service_unavailable',
      'request_timeout',
      message,
      undefined,
      requestId
    );
  }

  // Default to processing error
  return createACPError(
    'processing_error',
    'internal_error',
    message,
    undefined,
    requestId
  );
}

/**
 * Handle object-like errors (from API calls, etc.)
 */
function handleObjectError(
  error: any,
  requestId?: string,
  context?: string
): ACPError {
  const status = error.status || error.statusCode;
  const message = error.message || error.error || 'Unknown error occurred';
  const contextMessage = context ? `${context}: ${message}` : message;

  // HTTP status code based error handling
  if (status) {
    return handleHTTPError(status, contextMessage, error, requestId);
  }

  // Fal AI specific errors
  if (error.error_type) {
    return handleFalError(error, requestId);
  }

  // Network errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    return createACPError(
      'service_unavailable',
      'network_error',
      'Failed to connect to service',
      undefined,
      requestId
    );
  }

  // Default processing error
  return createACPError(
    'processing_error',
    'unknown_error',
    contextMessage,
    undefined,
    requestId
  );
}

/**
 * Handle HTTP status code errors
 */
function handleHTTPError(
  status: number,
  message: string,
  error: any,
  requestId?: string
): ACPError {
  // 400 - Bad Request
  if (status === 400) {
    return createACPError(
      'invalid_request',
      'bad_request',
      message,
      error.param,
      requestId
    );
  }

  // 401 - Unauthorized
  if (status === 401) {
    return createACPError(
      'invalid_request',
      'unauthorized',
      'Invalid or missing API key',
      undefined,
      requestId
    );
  }

  // 403 - Forbidden
  if (status === 403) {
    return createACPError(
      'invalid_request',
      'forbidden',
      'Access denied',
      undefined,
      requestId
    );
  }

  // 404 - Not Found
  if (status === 404) {
    return createACPError(
      'invalid_request',
      'not_found',
      message || 'Resource not found',
      undefined,
      requestId
    );
  }

  // 409 - Conflict (Idempotency)
  if (status === 409) {
    return createACPError(
      'request_not_idempotent',
      'idempotency_conflict',
      message || 'Idempotency key reused with different parameters',
      undefined,
      requestId
    );
  }

  // 422 - Unprocessable Entity
  if (status === 422) {
    return createACPError(
      'invalid_request',
      'validation_error',
      message,
      error.param,
      requestId
    );
  }

  // 429 - Rate Limit
  if (status === 429) {
    return createACPError(
      'rate_limit_exceeded',
      'rate_limit_exceeded',
      'Rate limit exceeded. Please try again later.',
      undefined,
      requestId
    );
  }

  // 500+ - Server Errors
  if (status >= 500) {
    return createACPError(
      'service_unavailable',
      'service_error',
      'Service temporarily unavailable',
      undefined,
      requestId
    );
  }

  // Other client errors (4xx)
  if (status >= 400 && status < 500) {
    return createACPError(
      'invalid_request',
      `http_${status}`,
      message,
      undefined,
      requestId
    );
  }

  // Fallback
  return createACPError(
    'processing_error',
    'http_error',
    message,
    undefined,
    requestId
  );
}

/**
 * Handle Fal AI specific errors
 */
function handleFalError(error: any, requestId?: string): ACPError {
  const errorType = error.error_type;
  const message = error.message || error.detail || 'Fal AI error occurred';

  switch (errorType) {
    case 'validation_error':
      return createACPError(
        'invalid_request',
        'validation_error',
        message,
        error.param,
        requestId
      );

    case 'rate_limit_error':
      return createACPError(
        'rate_limit_exceeded',
        'rate_limit_exceeded',
        message,
        undefined,
        requestId
      );

    case 'service_unavailable':
      return createACPError(
        'service_unavailable',
        'fal_service_unavailable',
        message,
        undefined,
        requestId
      );

    default:
      return createACPError(
        'processing_error',
        'fal_error',
        message,
        undefined,
        requestId
      );
  }
}

/**
 * Create MCP tool error response
 */
export function createToolErrorResponse(error: ACPError): {
  content: Array<{ type: string; text: string }>;
  isError: boolean;
} {
  const errorMessage = {
    type: error.type,
    code: error.code,
    message: error.message,
    ...(error.param && { param: error.param }),
    ...(error.request_id && { request_id: error.request_id }),
  };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(errorMessage, null, 2),
      },
    ],
    isError: true,
  };
}

/**
 * Log error with appropriate level
 */
export function logError(error: ACPError, context?: string): void {
  const logMeta = {
    type: error.type,
    code: error.code,
    ...(error.param && { param: error.param }),
    ...(error.request_id && { request_id: error.request_id }),
    ...(context && { context }),
  };

  // Log client errors as warnings, server errors as errors
  if (error.type === 'invalid_request' || error.type === 'request_not_idempotent') {
    logger.warn(error.message, logMeta);
  } else {
    logger.error(error.message, logMeta);
  }
}
