import fs from 'fs';
import path from 'path';
import { ensureDirectoryExists } from './utils/fs-utils.js';
import { z } from 'zod';

// Define log driver config schema
const LogDriverConfigSchema = z.object({
  connectionString: z.string().optional(),
  basePath: z.string().optional(),
  maxSizeMB: z.number().positive().optional(),
  maxFiles: z.number().positive().optional(),
  options: z.record(z.string(), z.any()).optional()
});

// Define log type config schema
const LogTypeConfigSchema = z.object({
  driver: z.string(),
  level: z.enum(['debug', 'info', 'warn', 'error', 'fatal']).default('info')
});

// Define logging config schema
const LoggingConfigSchema = z.object({
  defaultDriver: z.string().default('sqlite'),
  logTypes: z.record(z.string(), LogTypeConfigSchema).optional(),
  drivers: z.record(z.string(), LogDriverConfigSchema).optional(),
  archival: z.object({
    driver: z.enum(['s3', 'ftp', 'archive']).default('archive'),
    interval: z.number().int().positive().default(7),
    zipOption: z.enum(['zipPerLog', 'zipAllTogether', 'none']).default('none')
  }).optional()
});

// Define config schema with Zod
const ConfigSchema = z.object({
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  defaultRetries: z.number().int().positive().default(3),
  defaultCacheTtl: z.number().int().positive().default(300),
  lifecycle: z.object({
    beforeRequest: z.array(z.string()).default(['auth', 'cache', 'log']),
    request: z.array(z.string()).default(['fetch']),
    afterRequest: z.array(z.string()).default(['log', 'webhook'])
  }),
  logging: LoggingConfigSchema.optional(),
  configDir: z.object({
    basePath: z.string().default('./config'),
    apiPath: z.string().default('apis'),
    gitEnabled: z.boolean().default(true),
    enableAutoCommit: z.boolean().default(true),
    syncWithDb: z.boolean().default(true)
  }).optional()
});

// Default config
const defaultConfig = {
  logLevel: 'debug',
  defaultRetries: 3,
  defaultCacheTtl: 300,
  lifecycle: {
    beforeRequest: ['auth', 'cache', 'log'],
    request: ['fetch'],
    afterRequest: ['log', 'webhook']
  },
  configDir: {
    basePath: './config',
    apiPath: 'apis',
    gitEnabled: true,
    enableAutoCommit: true,
    syncWithDb: true
  },
  logging: {
    defaultDriver: 'sqlite',
    logTypes: {
      application: { driver: 'sqlite', level: 'info' },
      security: { driver: 'sqlite', level: 'warn' },
      request_lifecycle: { driver: 'sqlite', level: 'debug' },
      database_query: { driver: 'sqlite', level: 'debug' },
      external_api_call: { driver: 'sqlite', level: 'debug' }
    },
    drivers: {
      sqlite: {
        // Uses main DATABASE_URL by default
      },
      file: {
        basePath: './logs/',
        maxSizeMB: 10,
        maxFiles: 7
      }
    },
    archival: {
      driver: 'archive',
      interval: 7,
      zipOption: 'none'
    }
  }
};

// Function to merge configs
export function mergeConfigs(base: any, override: any): any {
  const result = { ...base };

  for (const key in override) {
    if (override[key] === null || override[key] === undefined) {
      continue;
    }
    
    if (typeof override[key] === 'object' && !Array.isArray(override[key])) {
      result[key] = mergeConfigs(base[key] || {}, override[key]);
    } else {
      result[key] = override[key];
    }
  }

  return result;
}

// Load orchestrator config
function loadOrchestratorConfig() {
  try {
    const configPath = path.resolve(process.cwd(), 'config', 'orchestrator.json');
    if (fs.existsSync(configPath)) {
      const fileContent = fs.readFileSync(configPath, 'utf-8');
      const parsedConfig = JSON.parse(fileContent);
      return ConfigSchema.parse(parsedConfig);
    }
  } catch (error) {
    console.warn('Failed to load orchestrator config:', error);
  }
  
  return defaultConfig;
}

export const config = loadOrchestratorConfig();

// Get absolute path to the config base directory
export function getConfigBasePath(): string {
  const basePath = path.resolve(process.cwd(), config.configDir?.basePath || './config');
  ensureDirectoryExists(basePath).catch((err: Error) => console.error('Failed to create config directory:', err));
  return basePath;
}

// Get absolute path to the API configs directory
export function getApiConfigPath(): string {
  const apiPath = path.join(getConfigBasePath(), config.configDir?.apiPath || 'apis');
  ensureDirectoryExists(apiPath).catch((err: Error) => console.error('Failed to create API config directory:', err));
  return apiPath;
}

// Config directory path for convenience
export const configDir = {
  base: getConfigBasePath(),
  apis: getApiConfigPath()
};
