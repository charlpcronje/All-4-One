import { db } from '../db/index.ts';
import * as schema from '../db/schema.ts';
import { createLogger } from '../logging/index.ts';
import { sendWebhook } from '../webhooks/index.ts';
import { eq, and, gt } from 'drizzle-orm';
import { env } from '../env.ts';
import process from 'node:process';

// Create logger for API client
const logger = createLogger('api:client');

// Type definitions
export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retries?: number;
  useCache?: boolean;
  cacheTtl?: number; // in seconds
  tags?: string[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  status: number;
  data: T;
  headers: Record<string, string>;
  cached?: boolean;
  retryCount?: number;
}

export interface ApiError {
  message: string;
  status?: number;
  response?: unknown;
  retryable: boolean;
}

/**
 * Make an API request with caching, retries, and error handling
 */
export async function apiRequest<T = unknown>(
  apiId: number,
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const startTime = Date.now();
  let retryCount = 0;
  let cachedResponse = null;
  const requestId = crypto.randomUUID();
  
  // Set default options
  const requestOptions: Required<ApiRequestOptions> = {
    method: options.method || 'GET',
    headers: options.headers || {},
    body: options.body,
    timeout: options.timeout || 30000, // 30 seconds default
    retries: options.retries ?? 3,
    useCache: options.useCache ?? true,
    cacheTtl: options.cacheTtl || 300, // 5 minutes default
    tags: options.tags || []
  };
  
  try {
    // Get API details
    const api = await db.query.apis.findFirst({
      where: eq(schema.apis.id, apiId)
    });
    
    if (!api) {
      throw new Error(`API with ID ${apiId} not found`);
    }
    
    const url = new URL(endpoint, api.baseUrl).toString();
    logger.debug(`Initiating ${requestOptions.method} request to ${url}`, {
      apiId,
      requestId,
      method: requestOptions.method
    });
    
    // Try to get from cache for GET requests if caching is enabled
    if (requestOptions.useCache && requestOptions.method === 'GET') {
      cachedResponse = await getCachedResponse(url, requestOptions);
      
      if (cachedResponse) {
        logger.debug(`Cache hit for ${url}`, { requestId });
        
        // Send webhook for cache hit
        await sendWebhook('cache.hit', 'api.client', {
          apiId,
          url,
          requestId,
          ttl: cachedResponse.ttl
        }).catch(err => {
          logger.error('Failed to send cache.hit webhook', { error: err });
        });
        
        return {
          success: true,
          status: cachedResponse.status,
          data: cachedResponse.data as T,
          headers: cachedResponse.headers,
          cached: true
        };
      } else {
        logger.debug(`Cache miss for ${url}`, { requestId });
        
        // Send webhook for cache miss
        await sendWebhook('cache.miss', 'api.client', {
          apiId,
          url,
          requestId
        }).catch(err => {
          logger.error('Failed to send cache.miss webhook', { error: err });
        });
      }
    }
    
    // Add authorization header if API has auth configured
    if (api.authType && api.authToken) {
      if (api.authType === 'bearer') {
        requestOptions.headers['Authorization'] = `Bearer ${api.authToken}`;
      } else if (api.authType === 'apikey') {
        const headerName = api.authHeader || 'X-API-Key';
        requestOptions.headers[headerName] = api.authToken;
      }
    }
    
    // Add common headers
    requestOptions.headers['User-Agent'] = `DCR/${env.APP_VERSION || '1.0.0'}`;
    requestOptions.headers['X-Request-ID'] = requestId;
    
    // Convert body to JSON string if it's an object
    let bodyContent: string | undefined;
    if (requestOptions.body && typeof requestOptions.body === 'object') {
      bodyContent = JSON.stringify(requestOptions.body);
      // Set content-type if not already set
      if (!requestOptions.headers['Content-Type']) {
        requestOptions.headers['Content-Type'] = 'application/json';
      }
    }
    
    // Execute request with retry logic
    return await executeWithRetry<T>(
      url,
      {
        method: requestOptions.method,
        headers: requestOptions.headers,
        body: bodyContent,
        signal: AbortSignal.timeout(requestOptions.timeout)
      },
      requestOptions,
      apiId,
      requestId,
      () => { retryCount++; }
    );
  } catch (error) {
    const elapsed = Date.now() - startTime;
    const apiError = normalizeError(error);
    
    logger.error(`API request failed after ${elapsed}ms`, {
      error: apiError.message,
      status: apiError.status,
      retryCount,
      requestId
    });
    
    // Send error webhook
    await sendWebhook('error', 'api.client', {
      requestId,
      apiId,
      error: apiError.message,
      status: apiError.status,
      retryCount,
      elapsed
    }).catch(err => {
      logger.error('Failed to send error webhook', { error: err });
    });
    
    // Return error response
    return {
      success: false,
      status: apiError.status || 500,
      data: { error: apiError.message } as unknown as T,
      headers: {},
      retryCount
    };
  }
}

/**
 * Execute a fetch request with retry logic
 */
async function executeWithRetry<T>(
  url: string,
  fetchOptions: RequestInit,
  requestOptions: Required<ApiRequestOptions>,
  apiId: number,
  requestId: string,
  onRetry: () => void
): Promise<ApiResponse<T>> {
  let lastError: ApiError | null = null;
  const startTime = Date.now();
  
  // Try initial request plus retries
  for (let attempt = 0; attempt <= requestOptions.retries; attempt++) {
    try {
      // If not the first attempt, we're retrying
      if (attempt > 0) {
        onRetry();
        
        const backoffMs = calculateBackoff(attempt);
        logger.info(`Retrying request to ${url} (attempt ${attempt}/${requestOptions.retries}) after ${backoffMs}ms backoff`, {
          requestId,
          attempt
        });
        
        // Wait for backoff period
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        
        // Send webhook for retry
        await sendWebhook('retry', 'api.client', {
          apiId,
          url,
          requestId,
          attempt,
          previousError: lastError?.message
        }).catch(err => {
          logger.error('Failed to send retry webhook', { error: err });
        });
      }
      
      // Make the request
      const response = await fetch(url, fetchOptions);
      const responseHeaders: Record<string, string> = {};
      
      // Convert headers to object
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      
      // Get response data
      let responseData: T;
      const contentType = response.headers.get('Content-Type') || '';
      
      if (contentType.includes('application/json')) {
        responseData = await response.json() as T;
      } else {
        // For non-JSON responses, create a simple object with the text
        const text = await response.text();
        responseData = { content: text } as unknown as T;
      }
      
      const success = response.ok;
      const elapsed = Date.now() - startTime;
      
      // Log response
      if (success) {
        logger.info(`API request to ${url} completed successfully in ${elapsed}ms`, {
          status: response.status,
          requestId,
          retryCount: attempt
        });
      } else {
        logger.warn(`API request to ${url} failed with status ${response.status} in ${elapsed}ms`, {
          status: response.status,
          requestId,
          retryCount: attempt
        });
      }
      
      // Cache successful GET responses if caching is enabled
      if (success && requestOptions.useCache && fetchOptions.method === 'GET') {
        await cacheResponse(
          url, 
          response.status, 
          responseData, 
          responseHeaders, 
          requestOptions.cacheTtl,
          requestOptions.tags
        ).catch(err => {
          logger.error('Failed to cache response', { error: err });
        });
      }
      
      // Send webhook for API response
      await sendWebhook('api.response', 'api.client', {
        apiId,
        url,
        requestId,
        status: response.status,
        success,
        elapsed,
        retryCount: attempt
      }).catch(err => {
        logger.error('Failed to send api.response webhook', { error: err });
      });
      
      // Return response
      return {
        success,
        status: response.status,
        data: responseData,
        headers: responseHeaders,
        retryCount: attempt > 0 ? attempt : undefined
      };
    } catch (error) {
      lastError = normalizeError(error);
      
      // If this is the last attempt or error is not retryable, throw it
      if (attempt === requestOptions.retries || !lastError.retryable) {
        throw error;
      }
    }
  }
  
  // This should never be reached due to the throw in the loop
  throw lastError || new Error('Unknown error occurred');
}

/**
 * Calculate exponential backoff with jitter
 */
function calculateBackoff(attempt: number): number {
  const baseBackoff = 1000; // 1 second
  const maxBackoff = 30000; // 30 seconds
  
  // Exponential backoff: 2^attempt * baseBackoff
  const exponentialBackoff = Math.min(
    maxBackoff,
    Math.pow(2, attempt) * baseBackoff
  );
  
  // Add jitter (0-20% random variation)
  const jitter = exponentialBackoff * 0.2 * Math.random();
  return exponentialBackoff + jitter;
}

/**
 * Normalize various error types to a standard format
 */
function normalizeError(error: unknown): ApiError {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      message: `Network error: ${error.message}`,
      retryable: true
    };
  }
  
  if (error instanceof DOMException && error.name === 'AbortError') {
    return {
      message: 'Request timed out',
      retryable: true
    };
  }
  
  if (error instanceof Error) {
    return {
      message: error.message,
      retryable: true // Default to retryable
    };
  }
  
  return {
    message: String(error),
    retryable: true
  };
}

/**
 * Get cached response if available and not expired
 */
async function getCachedResponse(
  url: string,
  options: Required<ApiRequestOptions>
): Promise<{
  data: unknown;
  status: number;
  headers: Record<string, string>;
  ttl: number;
} | null> {
  try {
    // Create cache key from URL and relevant headers
    const key = createCacheKey(url, options);
    
    // Check if cache entry exists and is not expired
    const cacheEntry = await db.query.cache.findFirst({
      where: and(
        eq(schema.cache.key, key),
        gt(schema.cache.expiresAt, new Date())
      )
    });
    
    if (!cacheEntry) {
      return null;
    }
    
    // Calculate TTL in seconds
    const ttl = Math.floor(
      (cacheEntry.expiresAt.getTime() - Date.now()) / 1000
    );
    
    // Parse data from cache
    return {
      data: JSON.parse(cacheEntry.value),
      status: cacheEntry.status,
      headers: JSON.parse(cacheEntry.headers || '{}'),
      ttl
    };
  } catch (error) {
    logger.error('Error retrieving from cache', { error, url });
    return null;
  }
}

/**
 * Cache response data
 */
async function cacheResponse(
  url: string,
  status: number,
  data: unknown,
  headers: Record<string, string>,
  ttlSeconds: number,
  tags: string[]
): Promise<void> {
  try {
    // Create cache key
    const key = createCacheKey(url, { headers });
    
    // Calculate expiration
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    
    // Serialize data and headers
    const value = JSON.stringify(data);
    const serializedHeaders = JSON.stringify(headers);
    
    // Upsert cache entry
    await db.insert(schema.cache)
      .values({
        key,
        value,
        status,
        headers: serializedHeaders,
        tags: tags.join(','),
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt
      })
      .onConflictDoUpdate({
        target: schema.cache.key,
        set: {
          value,
          status,
          headers: serializedHeaders,
          tags: tags.join(','),
          updatedAt: new Date(),
          expiresAt
        }
      });
  } catch (error) {
    logger.error('Error caching response', { error, url });
    // Non-critical error, don't throw
  }
}

/**
 * Create a cache key from URL and headers
 */
function createCacheKey(url: string, options: { headers?: Record<string, string> }): string {
  // Include only cache-relevant headers
  const relevantHeaders: Record<string, string> = {};
  const cacheRelevantHeaders = [
    'accept',
    'accept-language',
    'cache-control',
    'x-api-version'
  ];
  
  if (options.headers) {
    for (const header of cacheRelevantHeaders) {
      if (options.headers[header]) {
        relevantHeaders[header] = options.headers[header];
      }
    }
  }
  
  // Create a hash of the URL and relevant headers
  const dataToHash = JSON.stringify({
    url,
    headers: relevantHeaders
  });
  
  // Convert to a SHA-256 hash
  const encoder = new TextEncoder();
  const data = encoder.encode(dataToHash);
  const hashBuffer = crypto.subtle.digestSync('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Manually invalidate cache entries by tags or URLs
 */
export async function invalidateCache(options: {
  tags?: string[];
  urls?: string[];
}): Promise<number> {
  try {
    const { tags, urls } = options;
    
    if (!tags?.length && !urls?.length) {
      throw new Error('Must provide either tags or urls to invalidate');
    }
    
    let invalidated = 0;
    
    // Invalidate by tags
    if (tags?.length) {
      for (const tag of tags) {
        const likeTag = `%${tag}%`;
        
        const result = await db.delete(schema.cache)
          .where(db.sql`${schema.cache.tags} LIKE ${likeTag}`)
          .returning();
        
        invalidated += result.length;
      }
    }
    
    // Invalidate by URLs
    if (urls?.length) {
      for (const url of urls) {
        const key = createCacheKey(url, {});
        
        const result = await db.delete(schema.cache)
          .where(eq(schema.cache.key, key))
          .returning();
        
        invalidated += result.length;
      }
    }
    
    logger.info(`Invalidated ${invalidated} cache entries`, { 
      tagsCount: tags?.length || 0,
      urlsCount: urls?.length || 0
    });
    
    return invalidated;
  } catch (error) {
    logger.error('Error invalidating cache', { error });
    throw error;
  }
}

/**
 * Schedule a retry for a failed API request
 */
export async function scheduleRetry(
  apiId: number,
  endpoint: string,
  options: ApiRequestOptions,
  error: string,
  retryAfter: Date = new Date(Date.now() + 300000) // Default: retry after 5 minutes
): Promise<void> {
  try {
    await db.insert(schema.retrySchedule)
      .values({
        apiId,
        endpoint,
        options: JSON.stringify(options),
        error,
        retryAfter,
        retryCount: 0,
        maxRetries: 5,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    
    logger.info(`Scheduled retry for API ${apiId} endpoint ${endpoint}`, {
      retryAfter: retryAfter.toISOString()
    });
  } catch (error) {
    logger.error('Failed to schedule retry', { error, apiId, endpoint });
  }
}
