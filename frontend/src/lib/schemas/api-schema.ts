import { z } from "zod";

// Basic schema for API endpoint headers
export const headerSchema = z.object({
  name: z.string().min(1, "Header name is required"),
  value: z.string(),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
});

// Schema for a single endpoint parameter
export const parameterSchema = z.object({
  name: z.string().min(1, "Parameter name is required"),
  type: z.enum(["string", "number", "boolean", "object", "array"]),
  description: z.string().optional(),
  required: z.boolean().default(false),
  default: z.any().optional(),
});

// Schema for endpoint request body
export const requestBodySchema = z.object({
  contentType: z.string().default("application/json"),
  schema: z.record(z.any()).optional(),
  example: z.string().optional(),
});

// Schema for a single lifecycle hook
export const lifecycleHookSchema = z.object({
  phase: z.enum(["beforeRequest", "request", "afterRequest"]),
  pluginId: z.string().min(1, "Plugin ID is required"),
  enabled: z.boolean().default(true),
  config: z.record(z.any()).optional(),
});

// Schema for a response template
export const responseTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  status: z.number().int().positive(),
  headers: z.array(headerSchema).optional(),
  body: z.string().optional(),
});

// Schema for a single API endpoint
export const endpointSchema = z.object({
  id: z.string().uuid().optional(),
  path: z.string().min(1, "Endpoint path is required"),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"]),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
  authentication: z.object({
    required: z.boolean().default(false),
    type: z.enum(["none", "basic", "bearer", "apiKey", "oauth2"]).default("none"),
    config: z.record(z.any()).optional(),
  }),
  headers: z.array(headerSchema).default([]),
  parameters: z.array(parameterSchema).default([]),
  requestBody: requestBodySchema.optional(),
  targetUrl: z.string().url("Must be a valid URL"),
  caching: z.object({
    enabled: z.boolean().default(false),
    ttlSeconds: z.number().int().positive().optional(),
    strategy: z.enum(["memory", "redis"]).default("memory"),
    keyPattern: z.string().optional(),
  }),
  rateLimiting: z.object({
    enabled: z.boolean().default(false),
    requestsPerMinute: z.number().int().positive().optional(),
    burstLimit: z.number().int().positive().optional(),
  }),
  lifecycleHooks: z.array(lifecycleHookSchema).default([]),
  responseTemplates: z.array(responseTemplateSchema).default([]),
  mockResponse: z.object({
    enabled: z.boolean().default(false),
    status: z.number().int().positive().default(200),
    delay: z.number().int().nonnegative().default(0),
    headers: z.array(headerSchema).default([]),
    body: z.string().optional(),
  }),
  errorHandling: z.object({
    retryCount: z.number().int().nonnegative().default(0),
    retryDelay: z.number().int().nonnegative().default(1000),
    timeoutMs: z.number().int().positive().default(30000),
    fallbackResponse: z.object({
      status: z.number().int().positive().default(503),
      body: z.string().optional(),
    }).optional(),
  }),
});

// Schema for the entire API configuration
export const apiConfigSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "API name is required"),
  description: z.string().optional(),
  version: z.string().default("1.0.0"),
  basePath: z.string().startsWith("/").default("/"),
  globalHeaders: z.array(headerSchema).default([]),
  globalAuthentication: z.object({
    required: z.boolean().default(false),
    type: z.enum(["none", "basic", "bearer", "apiKey", "oauth2"]).default("none"),
    config: z.record(z.any()).optional(),
  }),
  endpoints: z.array(endpointSchema).min(1, "At least one endpoint is required"),
  tags: z.array(z.string()).default([]),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  documentation: z.object({
    enabled: z.boolean().default(true),
    title: z.string().optional(),
    description: z.string().optional(),
    contactEmail: z.string().email().optional(),
    license: z.string().optional(),
  }),
});

// Helper type for TypeScript
export type ApiConfig = z.infer<typeof apiConfigSchema>;
export type Endpoint = z.infer<typeof endpointSchema>;
export type LifecycleHook = z.infer<typeof lifecycleHookSchema>;
