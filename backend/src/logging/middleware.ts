/**
 * Hono middleware for request logging
 */
import { Context, MiddlewareHandler } from 'hono';
import { Logger, createLogger } from './core.js';
import { LogPhase } from './types.js';

// Logger for the middleware
const middlewareLogger = createLogger('middleware');

/**
 * Configuration options for the logger middleware
 */
export interface LoggerMiddlewareOptions {
  logRequest?: boolean;
  logResponse?: boolean;
  logHeaders?: boolean;
  logBody?: boolean;
  excludePaths?: string[];
}

/**
 * Create a Hono middleware for automatic request/response logging
 * @param options - Configuration options
 * @returns Hono middleware handler
 */
export function loggerMiddleware(
  options: LoggerMiddlewareOptions = {}
): MiddlewareHandler {
  const {
    logRequest = true,
    logResponse = true,
    logHeaders = false,
    logBody = false,
    excludePaths = []
  } = options;

  return async function loggingMiddleware(c: Context, next: () => Promise<void>) {
    const path = c.req.path;
    const method = c.req.method;

    // Skip excluded paths
    if (excludePaths.some(p => path.startsWith(p))) {
      return next();
    }

    const start = Date.now();
    const requestId = c.req.header('x-request-id') || crypto.randomUUID();

    // Add request ID to context for other middleware
    c.set('requestId', requestId);

    // Log request
    if (logRequest) {
      const metadata: Record<string, unknown> = {
        requestId,
        method,
        path,
        query: c.req.query(),
      };

      if (logHeaders) {
        const headers: Record<string, string> = {};
        c.req.raw.headers.forEach((value, key) => {
          headers[key] = value;
        });
        metadata.headers = headers;
      }

      if (logBody && ['POST', 'PUT', 'PATCH'].includes(method)) {
        try {
          const contentType = c.req.header('content-type');
          if (contentType && contentType.includes('application/json')) {
            const body = await c.req.json().catch(() => ({}));
            metadata.body = body;
          }
        } catch (e) {
          // Skip body logging if it fails
        }
      }

      middlewareLogger.info(`${method} ${path}`, metadata, c);
    }

    try {
      // Process request
      await next();

      // Log response
      if (logResponse) {
        const duration = Date.now() - start;
        const status = c.res.status || 200;

        const metadata: Record<string, unknown> = {
          requestId,
          method,
          path,
          status,
          duration: `${duration}ms`,
        };

        if (status >= 500) {
          middlewareLogger.error(
            `${method} ${path} - ${status} in ${duration}ms`,
            metadata,
            c
          );
        } else if (status >= 400) {
          middlewareLogger.warn(
            `${method} ${path} - ${status} in ${duration}ms`,
            metadata,
            c
          );
        } else {
          middlewareLogger.info(
            `${method} ${path} - ${status} in ${duration}ms`,
            metadata,
            c
          );
        }
      }
    } catch (error) {
      // Log errors
      const duration = Date.now() - start;
      middlewareLogger.error(
        `${method} ${path} - Error after ${duration}ms`,
        {
          requestId,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        c
      );
      throw error;
    }
  };
}
