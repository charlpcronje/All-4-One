import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { z } from 'zod';

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
  const output = { ...target };

  for (const key in source) {
    if (source[key] === undefined || source[key] === null) {
      continue;
    }

    if (
      typeof source[key] === 'object' && 
      !Array.isArray(source[key]) &&
      target[key] && 
      typeof target[key] === 'object'
    ) {
      output[key] = deepMerge(target[key], source[key]);
    } else {
      output[key] = source[key];
    }
  }

  return output;
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
