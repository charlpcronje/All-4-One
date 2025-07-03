import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { z } from 'zod';

// --- START: Refined Logging Schemas ---
// Base for Local Archive Specific Configuration (not optional at root)
const BaseLocalArchivalDetailsSchema = z.object({
  archivePath: z.string().optional() // Path itself can be optional
});

// Define log driver config schema (assuming it might be needed by LoggingConfigSchema if not already present)
// If LogDriverConfigSchema and LogTypeConfigSchema are defined elsewhere and imported, this might not be needed here.
// For now, adding simplified stubs if they are not meant to be part of this file's direct scope but are dependencies of LoggingConfigSchema.
const LogDriverConfigSchema = z.object({
  connectionString: z.string().optional(),
  basePath: z.string().optional(),
  // ... other LogDriverConfigSchema fields if necessary
}).passthrough(); // Using passthrough to be flexible if full schema is elsewhere

const LogTypeConfigSchema = z.object({
  driver: z.string(),
  level: z.enum(['debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  // ... other LogTypeConfigSchema fields if necessary
}).passthrough(); // Using passthrough

// Strict logging schema with defaults, not optional at its root.
export const StrictLoggingConfigSchema = z.object({
  defaultDriver: z.string().default('sqlite'),
  logTypes: z.record(z.string(), LogTypeConfigSchema).optional(),
  drivers: z.record(z.string(), LogDriverConfigSchema).optional(),
  archival: z.object({
    driver: z.string().default('local_archive'), // API name or 'local_archive'
    liveLogDays: z.number().int().positive().default(7),
    zipOption: z.enum(['zipPerLog', 'zipAllTogether', 'none']).default('none'),
    local: BaseLocalArchivalDetailsSchema.optional() // The 'local' object itself is optional within archival
  }).default({}) // Archival object itself defaults to an empty object, which then gets its field defaults
});
// --- END: Refined Logging Schemas ---

// Type for lifecycle hooks
const LifecycleSchema = z.object({
  beforeRequest: z.array(z.string()).optional(),
  request: z.array(z.string()).optional(),
  afterRequest: z.array(z.string()).optional(),
});

// DB lifecycle hooks
const DbLifecycleSchema = z.object({
  beforeExecute: z.array(z.string()).optional(),
  execute: z.array(z.string()).optional(),
  afterExecute: z.array(z.string()).optional(),
});

// Config schema with Zod
export const ConfigSchema = z.object({
  logging: StrictLoggingConfigSchema.default({}), // Orchestrator ensures a full default logging config
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  defaultRetries: z.number().int().positive().default(3),
  defaultCacheTtl: z.number().int().positive().default(300),
  lifecycle: LifecycleSchema.default({}),
  db: z.object({
    lifecycle: DbLifecycleSchema.default({}),
  }).default({}),
  webhooks: z.object({
    defaultTimeoutMs: z.number().int().positive().default(5000),
    retryCount: z.number().int().nonnegative().default(3),
  }).default({}),
  security: z.object({
    jwtSecret: z.string().default('CHANGE_THIS_IN_PRODUCTION'),
    jwtExpiresIn: z.string().default('1d'),
    apiKeys: z.object({
      enabled: z.boolean().default(true),
      headerName: z.string().default('X-API-Key'),
    }).default({}),
  }).default({}),
});

// API config schema
export const ApiConfigSchema = z.object({
  logging: StrictLoggingConfigSchema.deepPartial().optional(), // API can partially override or omit
  name: z.string().optional(),
  baseUrl: z.string().optional(),
  auth: z.object({
    type: z.enum(['none', 'basic', 'bearer', 'oauth2']).default('none'),
    tokenUrl: z.string().optional(),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
  }).default({}),
  headers: z.record(z.string()).default({}),
  lifecycle: LifecycleSchema.default({}),
});

// Endpoint config schema
export const EndpointConfigSchema = z.object({
  logging: StrictLoggingConfigSchema.deepPartial().optional(), // Endpoint can partially override or omit
  method: z.string().default('GET'),
  path: z.string(),
  authOverride: z.enum(['none', 'basic', 'bearer', 'oauth2']).optional(),
  cacheTtl: z.number().int().nonnegative().optional(),
  lifecycle: LifecycleSchema.default({}),
  webhooks: z.object({
    onSuccess: z.string().url().optional(),
    onError: z.string().url().optional(),
  }).default({}),
  retry: z.object({
    count: z.number().int().nonnegative().default(3),
    backoff: z.enum(['linear', 'exponential', 'fixed']).default('exponential'),
    initialDelay: z.number().int().positive().default(1000),
  }).default({}),
});

// Export config types
export type Config = z.infer<typeof ConfigSchema>;
export type ApiConfig = z.infer<typeof ApiConfigSchema>;
export type EndpointConfig = z.infer<typeof EndpointConfigSchema>;

// Deep merge utility for configs
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Record<string, unknown>
): T {
  const output: Record<string, any> = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = output[key]; // Use output[key] as it might have been set by a previous iteration

      if (sourceValue === undefined || sourceValue === null) {
        continue;
      }

      if (
        typeof sourceValue === 'object' && !Array.isArray(sourceValue) &&
        targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)
      ) {
        // Both sourceValue and targetValue are non-array objects, so recurse
        output[key] = deepMerge(targetValue as Record<string, unknown>, sourceValue as Record<string, unknown>);
      } else {
        // Otherwise, assign directly (overwrite or add)
        output[key] = sourceValue;
      }
    }
  }
  return output as T;
}

// Load JSON config from file
function loadJsonConfig(filePath: string): Record<string, unknown> {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.warn(`Failed to load config from ${filePath}:`, error);
  }
  return {};
}

// Load orchestrator config
function loadOrchestratorConfig(): Config {
  const configPath = path.resolve(process.cwd(), 'config', 'orchestrator.json');
  const rawConfig = loadJsonConfig(configPath);
  
  try {
    return ConfigSchema.parse(rawConfig);
  } catch (error) {
    console.error('Invalid orchestrator config:', error);
      // Return a default Config; ConfigSchema's .default({}) for logging will apply
    return ConfigSchema.parse({});
  }
}

// Load API config
export function loadApiConfig(apiName: string): ApiConfig {
  const configPath = path.resolve(process.cwd(), 'apis', apiName, 'config.json');
  const rawConfig = loadJsonConfig(configPath);

  try {
    return ApiConfigSchema.parse(rawConfig);
  } catch (error) {
    console.error(`Invalid API config for ${apiName}:`, error);
      // Return a default ApiConfig; logging will be undefined due to .optional()
    return ApiConfigSchema.parse({});
  }
}

// Load endpoint config
export function loadEndpointConfig(apiName: string, endpointName: string): EndpointConfig {
  const configPath = path.resolve(process.cwd(), 'apis', apiName, 'endpoints', `${endpointName}.json`);
  const rawConfig = loadJsonConfig(configPath);

  try {
    return EndpointConfigSchema.parse(rawConfig);
  } catch (error) {
    console.error(`Invalid endpoint config for ${apiName}/${endpointName}:`, error);
      // Return a default EndpointConfig; logging will be undefined. Path is required by schema if not made optional.
    // Assuming EndpointConfigSchema's path is not optional and needs a default if the object is empty.
    // If EndpointConfigSchema itself has defaults or path is made optional, this could be just parse({}).
    // For now, keeping path default as it was, logging will be handled by its schema.
    return EndpointConfigSchema.parse({ path: '/' });
  }
}

// Merge configs: orchestrator > API > endpoint
export function mergeConfigs(
  baseConfig: Config = loadOrchestratorConfig(),
  apiConfig: Partial<ApiConfig> = {},
  endpointConfig: Partial<EndpointConfig> = {}
): Record<string, unknown> {
  // First merge API config over orchestrator
  const baseWithApi = deepMerge({ ...baseConfig }, apiConfig);
  
  // Then merge endpoint config
  return deepMerge(baseWithApi, endpointConfig);
}

// Export orchestrator config
export const config = loadOrchestratorConfig();
