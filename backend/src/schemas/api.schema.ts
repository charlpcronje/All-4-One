import { z } from 'zod';

// Base schema for API data
export const apiSchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  type: z.string(),
  baseUrl: z.string().nullable(),
  config: z.string(), // JSON string
  configHash: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Schema for inserting API data
export const apiInsertSchema = apiSchema;

// Type for API data
export type ApiData = z.infer<typeof apiSchema>;

// Base schema for endpoint data
export const endpointSchema = z.object({
  apiId: z.number(),
  path: z.string(),
  method: z.string(),
  description: z.string().nullable(),
  version: z.string(),
  config: z.string(), // JSON string
  configHash: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Schema for inserting endpoint data
export const endpointInsertSchema = endpointSchema;

// Type for endpoint data
export type EndpointData = z.infer<typeof endpointSchema>;

// Parsed collection schema
export const parsedCollectionSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
  baseUrl: z.string().nullable().optional(),
  endpoints: z.array(
    z.object({
      path: z.string(),
      method: z.string(),
      description: z.string().nullable().optional(),
      headers: z.record(z.string()).optional(),
      params: z.record(z.string()).optional(),
      body: z.any().optional()
    })
  )
});

export type ParsedCollection = z.infer<typeof parsedCollectionSchema>;
