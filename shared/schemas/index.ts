import { z } from 'zod';

// Base user schema
export const userSchema = z.object({
  id: z.number().optional(),
  email: z.string().email(),
  passwordHash: z.string().optional(), // Only used backend-side
  role: z.enum(['admin', 'user']).default('user'),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

// Permission schema
export const permissionSchema = z.object({
  id: z.number().optional(),
  userId: z.number(),
  apiName: z.string(),
  endpointPath: z.string(),
  verb: z.string(),
  allowed: z.boolean().default(true)
});

// API schema
export const apiSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  baseUrl: z.string().optional(),
  type: z.enum(['http', 'websocket', 'rpc']).default('http'),
  configJson: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

// Endpoint schema
export const endpointSchema = z.object({
  id: z.number().optional(),
  apiId: z.number(),
  path: z.string(),
  method: z.string(),
  configJson: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

// Log schema
export const logSchema = z.object({
  id: z.number().optional(),
  timestamp: z.string().optional(),
  endpointId: z.number().optional(),
  phase: z.enum([
    'beforeRequest', 
    'request', 
    'afterRequest',
    'beforeExecute',
    'execute',
    'afterExecute'
  ]),
  success: z.boolean(),
  message: z.string(),
  metadataJson: z.string().optional()
});

// Webhook schema
export const webhookSchema = z.object({
  id: z.number().optional(),
  endpointId: z.number(),
  phase: z.enum([
    'beforeRequest', 
    'request', 
    'afterRequest',
    'beforeExecute',
    'execute',
    'afterExecute'
  ]),
  statusCode: z.number().optional(),
  url: z.string()
});

// Cache schema
export const cacheSchema = z.object({
  key: z.string(),
  valueJson: z.string(),
  expiresAt: z.number()
});

// Retry schedule schema
export const retryScheduleSchema = z.object({
  id: z.number().optional(),
  requestId: z.string(),
  endpointId: z.number().optional(),
  nextTry: z.number(),
  attempts: z.number().default(0),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).default('pending')
});

// Export all types
export type User = z.infer<typeof userSchema>;
export type Permission = z.infer<typeof permissionSchema>;
export type Api = z.infer<typeof apiSchema>;
export type Endpoint = z.infer<typeof endpointSchema>;
export type Log = z.infer<typeof logSchema>;
export type Webhook = z.infer<typeof webhookSchema>;
export type Cache = z.infer<typeof cacheSchema>;
export type RetrySchedule = z.infer<typeof retryScheduleSchema>;
