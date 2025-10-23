# Reference Implementations

This directory contains production-ready reference implementations demonstrating best practices for building MCP servers with ACP protocol compliance.

## Available Implementations

### [Fal AI MCP Server](./fal-ai-mcp-server/) (TypeScript)

A comprehensive, production-ready MCP server providing access to 794+ Fal AI models with full ACP protocol compliance.

**Perfect for**: Learning ACP implementation patterns, building production MCP servers, multi-model architectures

## Implementation Comparison

| Feature | Fal AI MCP Server |
|---------|-------------------|
| **Language** | TypeScript |
| **Models** | 794+ (all Fal AI) |
| **Categories** | 20+ (Image, Video, Audio, 3D, Vision, LLM) |
| **ACP Compliance** | ✅ Full (x402 protocol) |
| **Error Handling** | ✅ ACP Flat Format |
| **Idempotency** | ✅ 24hr cache with conflict detection |
| **Resources** | ✅ Catalog, Pricing, Schemas |
| **Logging** | ✅ Winston (structured) |
| **Tests** | ✅ Jest (>80% coverage) |
| **Retry Logic** | ✅ Exponential backoff |
| **Request Signing** | ✅ Optional |
| **Type Safety** | ✅ Complete TypeScript |
| **Documentation** | ✅ Comprehensive |
| **Production Ready** | ✅ Yes |

## When to Use Each

### Fal AI MCP Server

**Choose this implementation when you need:**

- ✅ A complete reference for ACP protocol implementation
- ✅ Production-grade error handling and logging
- ✅ Multi-model support across different AI modalities
- ✅ Enterprise features (idempotency, caching, monitoring)
- ✅ Examples of dynamic tool registration
- ✅ Resource-based model discovery
- ✅ TypeScript best practices for MCP servers

**Key Learning Points:**

1. **ACP Protocol Compliance**
   - API-Version header management
   - Flat error format (no nested envelopes)
   - Idempotency key handling
   - Request ID tracking
   - Timestamp validation

2. **Production Patterns**
   - Structured logging with Winston
   - Multi-layer caching (idempotency, schemas)
   - Exponential backoff retry
   - Graceful shutdown handling
   - Health checks and monitoring

3. **Architecture Decisions**
   - Service-oriented design
   - Dependency injection
   - Type-safe interfaces
   - Error boundaries
   - Resource management

## Quick Comparison: Code Examples

### Error Handling

**Fal AI MCP Server (ACP Compliant):**
```typescript
// Flat error structure - no nesting
interface ACPError {
  type: 'invalid_request' | 'processing_error' | ...;
  code: string;
  message: string;
  param?: string;     // RFC 9535 JSONPath
  request_id?: string;
}

// Example error
{
  "type": "invalid_request",
  "code": "validation_error",
  "message": "Missing required parameter",
  "param": "$.prompt",
  "request_id": "req-123"
}
```

### Idempotency

**Fal AI MCP Server:**
```typescript
// 24-hour cache with parameter verification
class IdempotencyCache {
  get(key: string, params: Record<string, any>) {
    const entry = this.cache.get(key);

    // Verify parameters match
    const paramsHash = hashParameters(params);
    if (entry.paramsHash !== paramsHash) {
      throw createACPError(
        'request_not_idempotent',
        'idempotency_conflict',
        'Key reused with different parameters'
      );
    }

    return entry.response;
  }
}
```

### Request Headers

**Fal AI MCP Server (ACP Compliant):**
```typescript
const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json',
  'API-Version': '2025-09-29',      // x402 protocol
  'Request-Id': uuidv4(),
  'Idempotency-Key': uuidv4(),
  'Timestamp': new Date().toISOString()
};
```

## Architecture Patterns

### 1. Service Layer Pattern

Used by: **Fal AI MCP Server**

```
┌─────────────────┐
│  MCP Server     │
├─────────────────┤
│  Tool Generator │
├─────────────────┤
│  Fal Client     │  ← Service layer
├─────────────────┤
│  Cache Service  │  ← Shared services
├─────────────────┤
│  Logger/Error   │  ← Utilities
└─────────────────┘
```

Benefits:
- Clear separation of concerns
- Easy to test each layer
- Reusable components
- Maintainable codebase

### 2. Resource-Based Discovery

Used by: **Fal AI MCP Server**

```
MCP Resources:
├── fal://models/catalog       (All models)
├── fal://pricing              (Pricing info)
└── fal://models/{slug}/schema (Per-model schemas)
```

Benefits:
- Self-documenting API
- Dynamic schema retrieval
- Client-side exploration
- Versioning support

### 3. Dynamic Tool Registration

Used by: **Fal AI MCP Server**

```typescript
// Generate tools from model catalog
for (const model of models) {
  const toolName = sanitizeSlug(model.slug);
  const schema = await fetchSchema(model.slug);

  server.tool(toolName, model.description, schema,
    async (params) => await generate(model.slug, params)
  );
}
```

Benefits:
- Scales to 100s of models
- Single source of truth
- Easy to update
- Consistent naming

## Testing Strategies

### Fal AI MCP Server

**Unit Tests:**
- Service methods (cache, client)
- Utility functions (sanitization, formatting)
- Error handling

**Integration Tests:**
- Tool registration
- Resource endpoints
- End-to-end flows

**Coverage:**
- Target: >80%
- Focus: Critical paths, error cases

```bash
npm test
npm run test:coverage
```

## Performance Considerations

### Fal AI MCP Server

**Optimizations:**
1. **Schema Caching** - 1hr TTL, reduces API calls
2. **Lazy Loading** - Fetch schemas on first use
3. **Connection Pooling** - Reuse HTTP clients
4. **Async Operations** - Non-blocking I/O
5. **Memory Management** - Automatic cache cleanup

**Benchmarks:**
- Tool call (cached): ~10-20ms
- Tool call (first): ~200-500ms
- Resource read: <10ms
- Cache hit rate: >90% typical

## Migration Guide

### Moving to Production

When adapting these implementations for production:

1. **Environment Management**
   ```bash
   # Use proper secrets management
   # Never commit .env files
   # Rotate API keys regularly
   ```

2. **Monitoring & Observability**
   ```typescript
   // Add metrics collection
   // Set up error tracking (Sentry, etc.)
   // Configure log aggregation
   ```

3. **Scaling Considerations**
   ```typescript
   // Add rate limiting
   // Implement request queuing
   // Consider Redis for caching
   // Use load balancing
   ```

4. **Security Hardening**
   ```typescript
   // Validate all inputs
   // Sanitize outputs
   // Implement request signing
   // Add CORS policies
   ```

## Contributing

We welcome contributions to our reference implementations!

**Areas for contribution:**
- Additional reference implementations (Python, Go, etc.)
- Performance improvements
- Documentation enhancements
- Test coverage expansion
- Example use cases

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## Resources

### Learning ACP

- [ACP Specification](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol)
- [OpenAI Commerce Docs](https://developers.openai.com/commerce)
- [MCP Documentation](https://modelcontextprotocol.io/)

### API Documentation

- [Fal AI Docs](https://fal.ai/docs)
- [Fal AI Models](https://fal.ai/models)

### Tools & Libraries

- [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
- [@fal-ai/serverless-client](https://www.npmjs.com/package/@fal-ai/serverless-client)
- [Winston Logger](https://github.com/winstonjs/winston)

## Support

- **Issues**: [GitHub Issues](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/issues)
- **Discussions**: [GitHub Discussions](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/discussions)

---

Built with ❤️ by [Locus](https://paywithlocus.com) (YC F25)
