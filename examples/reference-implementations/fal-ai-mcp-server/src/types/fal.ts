/**
 * Fal AI Type Definitions
 */

/**
 * Model category types
 */
export type FalModelCategory =
  | 'Image-to-Image'
  | 'Image-to-Video'
  | 'Text-to-Image'
  | 'Text-to-Video'
  | 'Video-to-Video'
  | 'Text-to-Audio'
  | 'Vision'
  | 'Image-to-3D'
  | 'Text-to-Speech'
  | 'Training'
  | 'Audio-to-Audio'
  | 'Speech-to-Text'
  | 'Audio-to-Video'
  | 'Video-to-Audio'
  | 'LLM'
  | 'JSON'
  | 'Speech-to-Speech'
  | '3D-to-3D'
  | 'Text-to-3D'
  | 'Image-to-JSON'
  | 'general';

/**
 * Pricing information for a model
 */
export interface FalPricing {
  /** Display-friendly pricing string */
  display: string;
  /** Numeric value */
  value: number;
  /** Currency code */
  currency: string;
  /** Pricing unit */
  unit: string;
}

/**
 * Code examples for a model
 */
export interface FalExamples {
  /** JavaScript/TypeScript example */
  javascript?: string;
  /** Python example */
  python?: string;
}

/**
 * Complete model metadata
 */
export interface FalModel {
  /** Model slug/identifier (e.g., "fal-ai/flux-pro/kontext") */
  slug: string;
  /** Human-readable name */
  name: string;
  /** Model category */
  category: FalModelCategory;
  /** Model description */
  description: string;
  /** Pricing information */
  pricing: FalPricing;
  /** Code examples */
  examples: FalExamples;
  /** Model URL */
  url: string;
}

/**
 * Fal API response structure
 */
export interface FalResponse<T = any> {
  /** Response data */
  data?: T;
  /** Request ID */
  request_id?: string;
  /** Response metadata */
  metadata?: {
    model?: string;
    timestamp?: string;
    idempotency_key?: string;
    cached?: boolean;
    [key: string]: any;
  };
  /** Any additional properties */
  [key: string]: any;
}

/**
 * Fal queue status
 */
export interface FalQueueStatus {
  /** Queue status */
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  /** Queue logs */
  logs?: Array<{ timestamp: string; message: string }>;
  /** Queue metrics */
  metrics?: Record<string, any>;
}

/**
 * JSON Schema definition
 */
export interface JSONSchema {
  type?: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  enum?: any[];
  description?: string;
  default?: any;
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  additionalProperties?: boolean | JSONSchema;
  [key: string]: any;
}

/**
 * MCP tool definition
 */
export interface FalToolDefinition {
  /** Tool name (sanitized slug) */
  name: string;
  /** Tool description */
  description: string;
  /** Input schema */
  inputSchema: JSONSchema;
}

/**
 * Model catalog breakdown
 */
export interface ModelCatalogBreakdown {
  /** Total number of models */
  total: number;
  /** Breakdown by category */
  categories: Record<string, number>;
  /** All model slugs */
  models: FalModel[];
}

/**
 * Utility type for sanitized tool names
 */
export type SanitizedToolName = `fal_${string}`;

/**
 * Helper to sanitize model slug to tool name
 */
export function sanitizeSlugToToolName(slug: string): SanitizedToolName {
  // Convert fal-ai/flux-pro/kontext -> fal_flux_pro_kontext
  return `fal_${slug.replace(/^fal-ai\//, '').replace(/[\/\-\.]/g, '_')}` as SanitizedToolName;
}

/**
 * Helper to format tool description with category
 */
export function formatToolDescription(model: FalModel): string {
  const categoryTag = model.category !== 'general' ? `[${model.category}]` : '';
  return `${categoryTag} ${model.description}`.trim();
}

/**
 * Helper to get category breakdown
 */
export function getCategoryBreakdown(models: FalModel[]): Record<string, number> {
  const breakdown: Record<string, number> = {};

  for (const model of models) {
    const category = model.category;
    breakdown[category] = (breakdown[category] || 0) + 1;
  }

  return breakdown;
}
