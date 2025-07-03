// Path: backend/src/api/client.ts
// COMPLETE AND CORRECTED FILE

import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { createLogger } from '../logging/index.js';
import { sendWebhook } from '../webhooks/index.js';
import { eq, and, gt, or, sql } from 'drizzle-orm';
import { env } from '../env.js';
import crypto from 'node:crypto';

const logger = createLogger('api:client');

import { z } from 'zod';

// --- Type Definitions ---
export const ApiRequestOptionsSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).optional(),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.unknown().optional(),
  timeout: z.number().optional(),
  retries: z.number().optional(),
  useCache: z.boolean().optional(),
  cacheTtl: z.number().optional(), // in seconds
  tags: z.array(z.string()).optional(),
});

export type ApiRequestOptions = z.infer<typeof ApiRequestOptionsSchema>;

export const ApiResponseSchema = z.object({
  success: z.boolean(),
  status: z.number(),
  data: z.unknown(), // T is unknown here, will be inferred at usage
  headers: z.record(z.string(), z.string()),
  cached: z.boolean().optional(),
  retryCount: z.number().optional(),
});

export type ApiResponse<T = unknown> = z.infer<typeof ApiResponseSchema> & { data: T };

export const ApiErrorSchema = z.object({
  message: z.string(),
  status: z.number().optional(),
  response: z.unknown().optional(),
  retryable: z.boolean(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

/**
 * Make an API request with caching, retries, and error handling.
 */
export async function apiRequest<T = unknown>(
  apiId: number,
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const startTime = Date.now();
  let retryCount = 0;
  const requestId = crypto.randomUUID();
  
  const requestOptions: Required<ApiRequestOptions> = {
    method: options.method || 'GET',
    headers: options.headers || {},
    body: options.body,
    timeout: options.timeout || 30000,
    retries: options.retries ?? 3,
    useCache: options.useCache ?? true,
    cacheTtl: options.cacheTtl || 300,
    tags: options.tags || [],
  };
  
  try {
    const api = await db.query.apis.findFirst({
      where: eq(schema.apis.id, apiId)
    });
    if (!api) throw new Error(`API with ID ${apiId} not found`);

    const config = JSON.parse(api.config || '{}');
    const baseUrl = config.baseUrl || api.baseUrl;

    if (!baseUrl) {
      throw new Error(`API with ID ${apiId} does not have a configured base URL.`);
    }
    const url = new URL(endpoint, baseUrl).toString();

    logger.debug(`Initiating ${requestOptions.method} request to ${url}`, { apiId, requestId });
    
    if (requestOptions.useCache && requestOptions.method === 'GET') {
      const cachedResponse = await getCachedResponse(url, requestOptions);
      if (cachedResponse) {
        logger.debug(`Cache hit for ${url}`, { requestId });
        await sendWebhook('cache.hit', 'api.client', { apiId, url, requestId, ttl: cachedResponse.ttl });
        return {
          success: true,
          status: cachedResponse.status,
          data: cachedResponse.data as T,
          headers: cachedResponse.headers,
          cached: true,
        };
      } else {
        logger.debug(`Cache miss for ${url}`, { requestId });
        await sendWebhook('cache.miss', 'api.client', { apiId, url, requestId });
      }
    }
    
    if (config.authType && config.authToken) {
      if (config.authType === 'bearer') {
        requestOptions.headers['Authorization'] = `Bearer ${config.authToken}`;
      } else if (config.authType === 'apikey') {
        const headerName = config.authHeader || 'X-API-Key';
        requestOptions.headers[headerName] = config.authToken;
      }
    }
    
    requestOptions.headers['User-Agent'] = `DCR/${env.APP_VERSION || '1.0.0'}`;
    requestOptions.headers['X-Request-ID'] = requestId;
    
    let bodyContent: string | undefined;
    if (requestOptions.body && typeof requestOptions.body === 'object') {
      bodyContent = JSON.stringify(requestOptions.body);
      if (!requestOptions.headers['Content-Type']) {
        requestOptions.headers['Content-Type'] = 'application/json';
      }
    } else if (requestOptions.body) {
      bodyContent = String(requestOptions.body);
    }
    
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
    const apiError = normalizeError(error);
    logger.error(`API request failed`, { error: apiError.message, status: apiError.status, retryCount, requestId });
    await sendWebhook('error', 'api.client', { requestId, apiId, error: apiError.message, status: apiError.status, retryCount });
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
 * Execute a fetch request with retry logic.
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
  
  for (let attempt = 0; attempt <= requestOptions.retries; attempt++) {
    try {
      if (attempt > 0) {
        onRetry();
        const backoffMs = calculateBackoff(attempt);
        logger.info(`Retrying request to ${url} (attempt ${attempt}/${requestOptions.retries}) after ${backoffMs}ms backoff`, { requestId, attempt });
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        await sendWebhook('retry', 'api.client', { apiId, url, requestId, attempt, previousError: lastError?.message });
      }
      
      const response = await fetch(url, fetchOptions);
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => { responseHeaders[key] = value; });
      
      let responseData: any;
      const contentType = response.headers.get('Content-Type') || '';
      
      if (contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }
      
      const success = response.ok;
      const elapsed = Date.now() - startTime;
      
      if (success) {
        logger.info(`API request to ${url} completed successfully in ${elapsed}ms`, { status: response.status, requestId, retryCount: attempt });
      } else {
        logger.warn(`API request to ${url} failed with status ${response.status} in ${elapsed}ms`, { status: response.status, requestId, retryCount: attempt });
      }
      
      if (success && requestOptions.useCache && fetchOptions.method === 'GET') {
        await cacheResponse(url, response.status, responseData, responseHeaders, requestOptions.cacheTtl, requestOptions.tags);
      }
      
      await sendWebhook('api.response', 'api.client', { apiId, url, requestId, status: response.status, success, elapsed, retryCount: attempt });
      
      return {
        success,
        status: response.status,
        data: responseData as T,
        headers: responseHeaders,
        retryCount: attempt > 0 ? attempt : undefined,
      };
    } catch (error) {
      lastError = normalizeError(error);
      if (attempt === requestOptions.retries || !lastError.retryable) {
        throw error;
      }
    }
  }
  
  throw lastError || new Error('Unknown error occurred');
}

/**
 * Calculate exponential backoff with jitter.
 */
function calculateBackoff(attempt: number): number {
  const baseBackoff = 1000;
  const maxBackoff = 30000;
  const exponentialBackoff = Math.min(maxBackoff, Math.pow(2, attempt) * baseBackoff);
  const jitter = exponentialBackoff * 0.2 * Math.random();
  return exponentialBackoff + jitter;
}

/**
 * Normalize various error types to a standard format.
 */
function normalizeError(error: unknown): ApiError {
  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return { message: 'Request timed out', retryable: true };
    }
    if (error.message.includes('fetch')) {
      return { message: `Network error: ${error.message}`, retryable: true };
    }
    return { message: error.message, retryable: true };
  }
  return { message: String(error), retryable: true };
}


/**
 * Get cached response if available and not expired.
 */
async function getCachedResponse(
  url: string,
  options: Required<ApiRequestOptions>
): Promise<{ data: unknown; status: number; headers: Record<string, string>; ttl: number; } | null> {
  try {
    const key = createCacheKey(url, options);
    
    const cacheEntry = await db.query.cache.findFirst({
      where: and(
        eq(schema.cache.key, key),
        gt(schema.cache.expiresAt, Date.now())
      )
    });
    
    if (!cacheEntry) return null;
    
    const ttl = Math.floor((cacheEntry.expiresAt - Date.now()) / 1000);
    const cachedObject = JSON.parse(cacheEntry.valueJson);

    return {
      data: cachedObject.data,
      status: cachedObject.status,
      headers: cachedObject.headers,
      ttl
    };
  } catch (error) {
    logger.error('Error retrieving from cache', { error, url });
    return null;
  }
}

/**
 * Cache response data.
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
    const key = createCacheKey(url, { headers });
    const expiresAt = Date.now() + ttlSeconds * 1000;

    const valueToStore = JSON.stringify({ status, headers, data });
    
    await db.insert(schema.cache)
      .values({
        key,
        valueJson: valueToStore,
        expiresAt,
        tags: tags.join(','),
      })
      .onConflictDoUpdate({
        target: schema.cache.key,
        set: {
          valueJson: valueToStore,
          expiresAt,
          tags: tags.join(','),
        }
      });
  } catch (error) {
    logger.error('Error caching response', { error, url });
  }
}

/**
 * Create a cache key from URL and headers.
 */
function createCacheKey(url: string, options: { headers?: Record<string, string> }): string {
  const relevantHeaders: Record<string, string> = {};
  const cacheRelevantHeaders = ['accept', 'accept-language', 'cache-control', 'x-api-version'];
  
  if (options.headers) {
    for (const header of cacheRelevantHeaders) {
      if (options.headers[header]) {
        relevantHeaders[header] = options.headers[header];
      }
    }
  }
  
  const dataToHash = JSON.stringify({ url, headers: relevantHeaders });
  return crypto.createHash('sha256').update(dataToHash).digest('hex');
}

/**
 * Manually invalidate cache entries by tags or URLs.
 */
export async function invalidateCache(options: { tags?: string[]; urls?: string[]; }): Promise<number> {
  try {
    const { tags, urls } = options;
    if (!tags?.length && !urls?.length) throw new Error('Must provide either tags or urls to invalidate');
    
    let invalidated = 0;
    
    if (tags?.length) {
      const likeClauses = tags.map(tag => sql`${schema.cache.tags} LIKE ${'%' + tag + '%'}`);
      const whereClause = or(...likeClauses);
      if (whereClause) {
          const result = await db.delete(schema.cache).where(whereClause).returning();
          invalidated += result.length;
      }
    }
    
    if (urls?.length) {
      const keysToDelete = urls.map(url => createCacheKey(url, {}));
      if (keysToDelete.length > 0) {
          const result = await db.delete(schema.cache).where(sql`${schema.cache.key} IN ${keysToDelete}`).returning();
          invalidated += result.length;
      }
    }
    
    logger.info(`Invalidated ${invalidated} cache entries`, { tags, urls });
    return invalidated;
  } catch (error) {
    logger.error('Error invalidating cache', { error });
    throw error;
  }
}

/**
 * Schedule a retry for a failed API request.
 */
export async function scheduleRetry(
  endpointId: number,
  options: z.infer<typeof ApiRequestOptionsSchema>,
  error: string,
  retryAfter: Date = new Date(Date.now() + 300000)
): Promise<void> {
  try {
    // Note: Storing full options/error might require larger text fields or a different strategy.
    await db.insert(schema.retrySchedule).values({
      endpointId,
      requestId: crypto.randomUUID(),
      nextTry: retryAfter.getTime(),
      status: 'pending',
      attempts: 0,
      // Storing these would require adding `options` and `error` columns to the schema.
      // For now, this is a simplified version.
    });
    
    logger.info(`Scheduled retry for endpoint ${endpointId}`, { retryAfter });
  } catch (error) {
    logger.error('Failed to schedule retry', { error, endpointId });
  }
}