// Path: backend/src/controllers/api-import/schemas.ts

import { z } from "zod";

// This is the schema for the incoming request to our import endpoint
export const importPostmanSchema = z.object({
  collectionData: z.string().min(1, "Postman collection JSON is required."),
  name: z.string().min(1, "A name for the new API is required."),
  slug: z.string().min(1, "A slug for the new API is required.").regex(/^[a-z0-9-]+$/),
});

// This is our internal, standardized representation of a parsed collection,
// regardless of its original source (Postman, OpenAPI, etc.)
export const ParsedEndpointSchema = z.object({
    name: z.string(),
    method: z.string(),
    path: z.string(),
});

export type ParsedEndpoint = z.infer<typeof ParsedEndpointSchema>;

export const ParsedCollectionSchema = z.object({
    name: z.string(),
    description: z.string(),
    baseUrl: z.string(),
    endpoints: z.array(ParsedEndpointSchema),
});

export type ParsedCollection = z.infer<typeof ParsedCollectionSchema>;

// Schema for activating endpoints from a collection
export const activateEndpointsSchema = z.object({
  collectionId: z.number(),
  endpointIds: z.array(z.number()),
  userId: z.number(),
});

// Schema for sharing a collection
export const shareCollectionSchema = z.object({
  collectionId: z.number(),
  userIds: z.array(z.number()),
});