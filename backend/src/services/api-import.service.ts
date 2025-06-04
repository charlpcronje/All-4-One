import * as z from 'zod';

// Define types for Postman Collection v2.1
interface PostmanCollection {
  info: {
    name: string;
    description?: string;
    schema: string; // Should be "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  };
  item: PostmanItem[];
}

interface PostmanItem {
  name: string;
  description?: string;
  request?: PostmanRequest;
  response?: PostmanResponse[];
  item?: PostmanItem[]; // For nested folders
}

interface PostmanRequest {
  method: string;
  url: PostmanUrl;
  header?: PostmanHeader[];
  body?: any;
  description?: string;
}

interface PostmanUrl {
  raw: string;
  protocol?: string;
  host?: string[];
  path?: string[];
  query?: PostmanQueryParam[];
  variable?: PostmanVariable[];
}

interface PostmanHeader {
  key: string;
  value: string;
  disabled?: boolean;
  description?: string;
}

interface PostmanQueryParam {
  key: string;
  value: string;
  disabled?: boolean;
  description?: string;
}

interface PostmanVariable {
  key: string;
  value: string;
  description?: string;
}

interface PostmanResponse {
  name: string;
  code: number;
  status: string;
  _postman_previewlanguage?: string;
  header?: PostmanHeader[];
  body?: any;
}

// Define our parsed format
export interface ParsedEndpoint {
  method: string;
  path: string;
  url: string;
  description?: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  body?: any;
  valid: boolean;
  validationMessage?: string;
}

export interface ParsedCollection {
  name: string;
  description?: string;
  baseUrl?: string;
  endpoints: ParsedEndpoint[];
}

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
function processEndpoint(item: PostmanItem, folderPath: string): ParsedEndpoint {
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
