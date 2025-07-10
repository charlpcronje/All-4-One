// This file is meant to be imported by projects that already have zod installed
// @ts-ignore - Zod is provided by the parent project
import { z } from 'zod';

// Schema for individual components that can be added to a step
export const CachingComponentSchema = z.object({
  enabled: z.boolean().default(false),
  ttl: z.number().positive().default(300).describe("Time-to-live in seconds"),
  key: z.string().describe("Cache key, can use context variables like $.request.body.id"),
});

export const RetryComponentSchema = z.object({
  enabled: z.boolean().default(false),
  count: z.number().int().min(1).max(10).default(3),
  strategy: z.enum(['fixed', 'exponential', 'linear']).default('exponential'),
  delay: z.number().int().positive().default(1000).describe("Initial delay in milliseconds"),
});

export const LoggingComponentSchema = z.object({
  enabled: z.boolean().default(false),
  level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  logBefore: z.boolean().default(true).describe("Log before executing the step"),
  logAfter: z.boolean().default(true).describe("Log after executing the step"),
});


export const StepConnectionSchema = z.object({
    onSuccess: z.string().nullable().default(null),
    onFailure: z.string().nullable().default(null),
});

export const BaseStepSchema = z.object({
    id: z.string(), // The unique ID of this node instance in the graph
    type: z.string(), // The registered executor ID, e.g., 'core:http_request'
    label: z.string(),
    config: z.record(z.any()).default({}).describe("Configuration for the primary action of the step"),
    connections: StepConnectionSchema,
    position: z.object({ x: z.number(), y: z.number() }).optional(),
    components: z.object({
      caching: CachingComponentSchema.optional(),
      retry: RetryComponentSchema.optional(),
      logging: LoggingComponentSchema.optional(),
    }).optional().describe("Additional functionalities attached to the step"),
});

export const ProcessDefinitionSchema = z.object({
    id: z.string(),
    name: z.string(),
    startNode: z.string(),
    nodes: z.record(BaseStepSchema),
});

export type ProcessDefinition = z.infer<typeof ProcessDefinitionSchema>;
export type ProcessStep = z.infer<typeof BaseStepSchema>;
export type CachingComponent = z.infer<typeof CachingComponentSchema>;
export type RetryComponent = z.infer<typeof RetryComponentSchema>;
export type LoggingComponent = z.infer<typeof LoggingComponentSchema>;