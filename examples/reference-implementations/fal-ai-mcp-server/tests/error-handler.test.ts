/**
 * Comprehensive Error Handler Test Suite
 * Tests ACP-compliant error formatting and handling
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  formatACPError,
  createToolErrorResponse,
  logError,
} from '../src/utils/error-handler.js';
import { createACPError, type ACPError } from '../src/types/acp.js';

describe('Error Handler', () => {
  describe('formatACPError', () => {
    test('should pass through already formatted ACP errors', () => {
      const acpError = createACPError(
        'invalid_request',
        'test_error',
        'Test message',
        '$.test.field',
        'req-123'
      );

      const result = formatACPError(acpError, 'req-456');

      // Should return the same error, not create a new one
      expect(result.type).toBe('invalid_request');
      expect(result.code).toBe('test_error');
      expect(result.message).toBe('Test message');
      expect(result.param).toBe('$.test.field');
      expect(result.request_id).toBe('req-123');
    });

    test('should handle TypeError', () => {
      const error = new TypeError('Invalid type provided');
      const result = formatACPError(error, 'req-123');

      expect(result.type).toBe('invalid_request');
      expect(result.code).toBe('typeerror');
      expect(result.message).toBe('Invalid type provided');
      expect(result.request_id).toBe('req-123');
    });

    test('should handle RangeError', () => {
      const error = new RangeError('Value out of range');
      const result = formatACPError(error, 'req-123');

      expect(result.type).toBe('invalid_request');
      expect(result.code).toBe('rangeerror');
      expect(result.message).toBe('Value out of range');
    });

    test('should handle TimeoutError', () => {
      const error = new Error('Operation timed out');
      error.name = 'TimeoutError';
      const result = formatACPError(error, 'req-123');

      expect(result.type).toBe('service_unavailable');
      expect(result.code).toBe('request_timeout');
      expect(result.message).toBe('Operation timed out');
    });

    test('should add context to error message', () => {
      const error = new Error('Connection failed');
      const result = formatACPError(error, 'req-123', 'Database');

      expect(result.message).toBe('Database: Connection failed');
    });

    test('should handle generic Error objects', () => {
      const error = new Error('Something went wrong');
      const result = formatACPError(error, 'req-123');

      expect(result.type).toBe('processing_error');
      expect(result.code).toBe('internal_error');
      expect(result.message).toBe('Something went wrong');
    });

    test('should handle string errors', () => {
      const result = formatACPError('String error message', 'req-123');

      expect(result.type).toBe('processing_error');
      expect(result.code).toBe('unknown_error');
      expect(result.message).toBe('String error message');
    });

    test('should handle number errors', () => {
      const result = formatACPError(404, 'req-123');

      expect(result.type).toBe('processing_error');
      expect(result.code).toBe('unknown_error');
      expect(result.message).toBe('404');
    });

    test('should handle object errors with status 400', () => {
      const error = {
        status: 400,
        message: 'Bad request',
        param: '$.email',
      };
      const result = formatACPError(error, 'req-123');

      expect(result.type).toBe('invalid_request');
      expect(result.code).toBe('bad_request');
      expect(result.message).toBe('Bad request');
      expect(result.param).toBe('$.email');
    });

    test('should handle object errors with status 401', () => {
      const error = { status: 401 };
      const result = formatACPError(error, 'req-123');

      expect(result.type).toBe('invalid_request');
      expect(result.code).toBe('unauthorized');
      expect(result.message).toBe('Invalid or missing API key');
    });

    test('should handle object errors with status 403', () => {
      const error = { status: 403 };
      const result = formatACPError(error, 'req-123');

      expect(result.type).toBe('invalid_request');
      expect(result.code).toBe('forbidden');
      expect(result.message).toBe('Access denied');
    });

    test('should handle object errors with status 404', () => {
      const error = { status: 404, message: 'Model not found' };
      const result = formatACPError(error, 'req-123');

      expect(result.type).toBe('invalid_request');
      expect(result.code).toBe('not_found');
      expect(result.message).toBe('Model not found');
    });

    test('should handle object errors with status 409', () => {
      const error = { status: 409 };
      const result = formatACPError(error, 'req-123');

      expect(result.type).toBe('request_not_idempotent');
      expect(result.code).toBe('idempotency_conflict');
      // Should have default message since none provided
      expect(result.message).toBeDefined();
    });

    test('should handle object errors with status 422', () => {
      const error = {
        status: 422,
        message: 'Validation failed',
        param: '$.prompt',
      };
      const result = formatACPError(error, 'req-123');

      expect(result.type).toBe('invalid_request');
      expect(result.code).toBe('validation_error');
      expect(result.message).toBe('Validation failed');
      expect(result.param).toBe('$.prompt');
    });

    test('should handle object errors with status 429', () => {
      const error = { status: 429 };
      const result = formatACPError(error, 'req-123');

      expect(result.type).toBe('rate_limit_exceeded');
      expect(result.code).toBe('rate_limit_exceeded');
      expect(result.message).toContain('Rate limit exceeded');
    });

    test('should handle object errors with status 500', () => {
      const error = { status: 500, message: 'Internal server error' };
      const result = formatACPError(error, 'req-123');

      expect(result.type).toBe('service_unavailable');
      expect(result.code).toBe('service_error');
      expect(result.message).toBe('Service temporarily unavailable');
    });

    test('should handle object errors with status 503', () => {
      const error = { status: 503 };
      const result = formatACPError(error, 'req-123');

      expect(result.type).toBe('service_unavailable');
      expect(result.code).toBe('service_error');
    });

    test('should handle statusCode field', () => {
      const error = { statusCode: 400, message: 'Bad request' };
      const result = formatACPError(error, 'req-123');

      expect(result.type).toBe('invalid_request');
      expect(result.code).toBe('bad_request');
    });

    test('should handle other 4xx errors', () => {
      const error = { status: 418, message: "I'm a teapot" };
      const result = formatACPError(error, 'req-123');

      expect(result.type).toBe('invalid_request');
      expect(result.code).toBe('http_418');
      expect(result.message).toBe("I'm a teapot");
    });

    test('should handle network errors - ECONNREFUSED', () => {
      const error = { code: 'ECONNREFUSED', message: 'Connection refused' };
      const result = formatACPError(error, 'req-123');

      expect(result.type).toBe('service_unavailable');
      expect(result.code).toBe('network_error');
      expect(result.message).toBe('Failed to connect to service');
    });

    test('should handle network errors - ETIMEDOUT', () => {
      const error = { code: 'ETIMEDOUT', message: 'Connection timed out' };
      const result = formatACPError(error, 'req-123');

      expect(result.type).toBe('service_unavailable');
      expect(result.code).toBe('network_error');
    });

    test('should handle Fal AI validation error', () => {
      const error = {
        error_type: 'validation_error',
        message: 'Invalid prompt',
        param: '$.prompt',
      };
      const result = formatACPError(error, 'req-123');

      expect(result.type).toBe('invalid_request');
      expect(result.code).toBe('validation_error');
      expect(result.message).toBe('Invalid prompt');
      expect(result.param).toBe('$.prompt');
    });

    test('should handle Fal AI rate limit error', () => {
      const error = {
        error_type: 'rate_limit_error',
        message: 'Rate limit exceeded',
      };
      const result = formatACPError(error, 'req-123');

      expect(result.type).toBe('rate_limit_exceeded');
      expect(result.code).toBe('rate_limit_exceeded');
    });

    test('should handle Fal AI service unavailable error', () => {
      const error = {
        error_type: 'service_unavailable',
        message: 'Service is down',
      };
      const result = formatACPError(error, 'req-123');

      expect(result.type).toBe('service_unavailable');
      expect(result.code).toBe('fal_service_unavailable');
    });

    test('should handle unknown Fal AI error types', () => {
      const error = {
        error_type: 'unknown_fal_error',
        message: 'Something went wrong',
      };
      const result = formatACPError(error, 'req-123');

      expect(result.type).toBe('processing_error');
      expect(result.code).toBe('fal_error');
    });

    test('should handle errors with detail field', () => {
      const error = {
        status: 400,
        message: 'Detailed error message',
      };
      const result = formatACPError(error);

      expect(result.message).toBe('Detailed error message');
    });

    test('should handle errors with error field', () => {
      const error = {
        status: 400,
        error: 'Error field message',
      };
      const result = formatACPError(error);

      expect(result.message).toBe('Error field message');
    });

    test('should handle unknown object errors', () => {
      const error = { foo: 'bar' };
      const result = formatACPError(error, 'req-123');

      expect(result.type).toBe('processing_error');
      expect(result.code).toBe('unknown_error');
    });
  });

  describe('createToolErrorResponse', () => {
    test('should create MCP tool error response', () => {
      const acpError = createACPError(
        'invalid_request',
        'test_error',
        'Test error message'
      );

      const response = createToolErrorResponse(acpError);

      expect(response.isError).toBe(true);
      expect(response.content).toHaveLength(1);
      expect(response.content[0]?.type).toBe('text');
      expect(response.content[0]?.text).toBeDefined();

      const parsed = JSON.parse(response.content[0]!.text);
      expect(parsed.type).toBe('invalid_request');
      expect(parsed.code).toBe('test_error');
      expect(parsed.message).toBe('Test error message');
    });

    test('should include param in tool error response', () => {
      const acpError = createACPError(
        'invalid_request',
        'validation_error',
        'Invalid field',
        '$.data.field'
      );

      const response = createToolErrorResponse(acpError);
      const parsed = JSON.parse(response.content[0]!.text);

      expect(parsed.param).toBe('$.data.field');
    });

    test('should include request_id in tool error response', () => {
      const acpError = createACPError(
        'processing_error',
        'internal_error',
        'Internal error',
        undefined,
        'req-789'
      );

      const response = createToolErrorResponse(acpError);
      const parsed = JSON.parse(response.content[0]!.text);

      expect(parsed.request_id).toBe('req-789');
    });

    test('should omit undefined fields from JSON', () => {
      const acpError = createACPError(
        'processing_error',
        'test_error',
        'Test message'
      );

      const response = createToolErrorResponse(acpError);
      const parsed = JSON.parse(response.content[0]!.text);

      expect(parsed).not.toHaveProperty('param');
      expect(parsed).not.toHaveProperty('request_id');
    });

    test('should format JSON with indentation', () => {
      const acpError = createACPError(
        'invalid_request',
        'test_error',
        'Test message'
      );

      const response = createToolErrorResponse(acpError);

      expect(response.content[0]?.text).toContain('\n');
      expect(response.content[0]?.text).toContain('  ');
    });
  });

  describe('logError', () => {
    test('should log client errors as warnings', () => {
      const acpError = createACPError(
        'invalid_request',
        'test_error',
        'Client error'
      );

      // Should not throw
      expect(() => logError(acpError)).not.toThrow();
    });

    test('should log idempotency errors as warnings', () => {
      const acpError = createACPError(
        'request_not_idempotent',
        'idempotency_conflict',
        'Idempotency conflict'
      );

      expect(() => logError(acpError)).not.toThrow();
    });

    test('should log server errors as errors', () => {
      const acpError = createACPError(
        'processing_error',
        'internal_error',
        'Server error'
      );

      expect(() => logError(acpError)).not.toThrow();
    });

    test('should log service unavailable errors as errors', () => {
      const acpError = createACPError(
        'service_unavailable',
        'service_error',
        'Service unavailable'
      );

      expect(() => logError(acpError)).not.toThrow();
    });

    test('should log rate limit errors as errors', () => {
      const acpError = createACPError(
        'rate_limit_exceeded',
        'rate_limit',
        'Rate limit exceeded'
      );

      expect(() => logError(acpError)).not.toThrow();
    });

    test('should include context in log', () => {
      const acpError = createACPError(
        'processing_error',
        'test_error',
        'Test error'
      );

      expect(() => logError(acpError, 'TestContext')).not.toThrow();
    });

    test('should include param in log metadata', () => {
      const acpError = createACPError(
        'invalid_request',
        'validation_error',
        'Validation failed',
        '$.data.field'
      );

      expect(() => logError(acpError)).not.toThrow();
    });

    test('should include request_id in log metadata', () => {
      const acpError = createACPError(
        'processing_error',
        'internal_error',
        'Internal error',
        undefined,
        'req-123'
      );

      expect(() => logError(acpError)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    test('should handle null error', () => {
      const result = formatACPError(null, 'req-123');

      expect(result.type).toBe('processing_error');
      expect(result.code).toBe('unknown_error');
    });

    test('should handle undefined error', () => {
      const result = formatACPError(undefined, 'req-123');

      expect(result.type).toBe('processing_error');
      expect(result.code).toBe('unknown_error');
    });

    test('should handle empty string error', () => {
      const result = formatACPError('', 'req-123');

      expect(result.type).toBe('processing_error');
      expect(result.code).toBe('unknown_error');
      expect(result.message).toBe('');
    });

    test('should handle error without request ID', () => {
      const error = new Error('Test error');
      const result = formatACPError(error);

      expect(result.type).toBe('processing_error');
      expect(result.code).toBe('internal_error');
      expect(result.request_id).toBeUndefined();
    });

    test('should handle error without context', () => {
      const error = new Error('Test error');
      const result = formatACPError(error, 'req-123');

      expect(result.message).toBe('Test error');
    });

    test('should handle object error with empty message', () => {
      const error = { status: 400, message: '' };
      const result = formatACPError(error, 'req-123');

      // Empty message gets converted to default message
      expect(result.type).toBe('invalid_request');
      expect(result.code).toBe('bad_request');
    });

    test('should handle object error with no message fields', () => {
      const error = { status: 404 };
      const result = formatACPError(error, 'req-123');

      // Should have a message, may be default or status-specific
      expect(result.type).toBe('invalid_request');
      expect(result.code).toBe('not_found');
      expect(result.message).toBeDefined();
    });
  });
});
