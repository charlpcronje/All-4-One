import * as z from 'zod';

import { ParsedEndpoint, ParsedCollection } from '../controllers/api-import/schemas.ts';

export const PostmanHeaderSchema = z.object({
  key: z.string(),
  value: z.string(),
  disabled: z.boolean().optional(),
  description: z.string().optional(),
});

export const PostmanQueryParamSchema = z.object({
  key: z.string(),
  value: z.string(),
  disabled: z.boolean().optional(),
  description: z.string().optional(),
});

export const PostmanVariableSchema = z.object({
  key: z.string(),
  value: z.string(),
  description: z.string().optional(),
});

export const PostmanUrlSchema = z.object({
  raw: z.string(),
  protocol: z.string().optional(),
  host: z.array(z.string()).optional(),
  path: z.array(z.string()).optional(),
  query: z.array(PostmanQueryParamSchema).optional(),
  variable: z.array(PostmanVariableSchema).optional(),
});

export const PostmanRequestSchema = z.object({
  method: z.string(),
  url: PostmanUrlSchema,
  header: z.array(PostmanHeaderSchema).optional(),
  body: z.any().optional(),
  description: z.string().optional(),
});

export const PostmanResponseSchema = z.object({
  name: z.string(),
  code: z.number(),
  status: z.string(),
  _postman_previewlanguage: z.string().optional(),
  header: z.array(PostmanHeaderSchema).optional(),
  body: z.any().optional(),
});

export const PostmanItemSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  request: PostmanRequestSchema.optional(),
  response: z.array(PostmanResponseSchema).optional(),
  item: z.array(z.lazy(() => PostmanItemSchema)).optional(), // For nested folders
});

export const PostmanCollectionSchema = z.object({
  info: z.object({
    name: z.string(),
    description: z.string().optional(),
    schema: z.string(), // Should be "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  }),
  item: z.array(PostmanItemSchema),
});

export type PostmanCollection = z.infer<typeof PostmanCollectionSchema>;
export type PostmanItem = z.infer<typeof PostmanItemSchema>;
export type PostmanRequest = z.infer<typeof PostmanRequestSchema>;
export type PostmanUrl = z.infer<typeof PostmanUrlSchema>;
export type PostmanHeader = z.infer<typeof PostmanHeaderSchema>;
export type PostmanQueryParam = z.infer<typeof PostmanQueryParamSchema>;
export type PostmanVariable = z.infer<typeof PostmanVariableSchema>;
export type PostmanResponse = z.infer<typeof PostmanResponseSchema>;

/**
 * Parse a Postman collection v2.1 JSON string into our internal format
 */
export async function parsePostmanCollection(collectionData: string): Promise<ParsedCollection> {
  try {
    // Parse the JSON string
    const collection: PostmanCollection = JSON.parse(collectionData);
    
    // Validate schema version
    if (!collection.info?.schema?.includes('v2.1.0')) {
      throw new Error('Only Postman Collection v2.1.0 format is supported');
    }
    
    const parsedCollection: ParsedCollection = {
      name: collection.info.name,
      description: collection.info.description,
      endpoints: [],
    };
    
    // Process all items recursively
    processItems(collection.item, parsedCollection.endpoints);
    
    return parsedCollection;
  } catch (error: any) {
    if (error.message === 'Unexpected end of JSON input' || error.message.includes('JSON')) {
      throw new Error('Invalid JSON format in Postman collection');
    }
    throw error;
  }
}

/**
 * Recursively process Postman items (which can be nested folders)
 */
function processItems(items: PostmanItem[], endpoints: ParsedEndpoint[], parentPath: string = '') {
  for (const item of items) {
    if (item.request) {
      // This is an endpoint
      const endpoint = processEndpoint(item, parentPath);
      endpoints.push(endpoint);
    }
    
    if (item.item && item.item.length > 0) {
      // This is a folder, recurse
      const newParentPath = parentPath ? `${parentPath}/${item.name}` : item.name;
      processItems(item.item, endpoints, newParentPath);
    }
  }
}

/**
 * Process a single Postman endpoint
 */
function processEndpoint(item: z.infer<typeof PostmanItemSchema>, folderPath: string): ParsedEndpoint {
  if (!item.request) {
    return {
      method: 'GET',
      path: '',
      url: '',
      valid: false,
      validationMessage: 'Missing request definition',
    };
  }
  
  const request = item.request;
  const method = request.method?.toUpperCase() || 'GET';
  
  // Process URL
  let path = '';
  let url = '';
  const headers: Record<string, string> = {};
  const queryParams: Record<string, string> = {};
  
  try {
    // Extract path from URL
    if (request.url) {
      url = request.url.raw || '';
      
      // Extract path segments
      if (request.url.path && request.url.path.length > 0) {
        path = '/' + request.url.path.join('/');
      }
      
      // Process query parameters
      if (request.url.query && request.url.query.length > 0) {
        for (const param of request.url.query) {
          if (!param.disabled) {
            queryParams[param.key] = param.value;
          }
        }
      }
    }
    
    // Process headers
    if (request.header && request.header.length > 0) {
      for (const header of request.header) {
        if (!header.disabled) {
          headers[header.key] = header.value;
        }
      }
    }
    
    // Validate the endpoint
    let valid = true;
    let validationMessage = '';
    
    if (!method) {
      valid = false;
      validationMessage = 'Missing HTTP method';
    } else if (!path) {
      valid = false;
      validationMessage = 'Missing path';
    }
    
    return {
      method,
      path,
      url,
      description: item.description || request.description,
      headers,
      queryParams,
      body: request.body,
      valid,
      validationMessage,
    };
  } catch (error: any) {
    return {
      method,
      path: path || '',
      url: url || '',
      valid: false,
      validationMessage: `Error parsing endpoint: ${error.message}`,
    };
  }
}
