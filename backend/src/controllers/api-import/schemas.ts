import { z } from "zod";

// Base schema for importing Postman collections
export const importPostmanSchema = z.object({
  collectionData: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  version: z.string().default("v1"),
  basePath: z.string().optional(),
  tags: z.array(z.string()).optional(),
  selectedEndpoints: z.array(z.string()).optional(),
});

// Extended schema for import with selective endpoints
export const extendedImportSchema = importPostmanSchema.extend({
  selectedEndpoints: z.array(z.string()).default([]),
  userId: z.number().default(1) // Default to user ID 1 if not provided
});

// Define schema for collection sharing
export const shareCollectionSchema = z.object({
  collectionId: z.number(),
  userIds: z.array(z.number())
});

// Define schema for selective endpoint activation
export const activateEndpointsSchema = z.object({
  collectionId: z.number(),
  endpointIds: z.array(z.number()),
  userId: z.number().default(1) // Default to user ID 1 if not provided
});

// Schema for DB inserts - typed according to database requirements
export const apiInsertSchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  basePath: z.string().nullable(),
  version: z.string(),
  tags: z.array(z.string()),
  active: z.boolean().default(true),
  type: z.enum(["http", "websocket", "rpc"]).default("http"),
  config: z.string(),
  configHash: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const endpointInsertSchema = z.object({
  apiId: z.number(),
  method: z.string(),
  path: z.string(),
  description: z.string().nullable(),
  requestSchema: z.string().default("{}"),
  responseSchema: z.string().default("{}"),
  config: z.string(),
  configHash: z.string(),
  active: z.boolean().default(true),
  version: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const collectionInsertSchema = z.object({
  apiId: z.number(),
  userId: z.number(),
  name: z.string(),
  description: z.string(),
  rawData: z.string(),
  metadata: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});
