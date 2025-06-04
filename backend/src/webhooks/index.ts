import { db } from '../db/index.ts';
import * as schema from '../db/schema.ts';
import { withReadQuery } from '../db/transactions.ts';
import { createLogger } from '../logging/index.ts';
import { eq, and } from 'drizzle-orm';
import process from 'node:process';

// Logger for webhook operations
const logger = createLogger('webhook');

// Types
export type WebhookEvent = 'api.request' | 'api.response' | 'cache.hit' | 'cache.miss' | 'error' | 'retry' | 'system';

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  source: string;
  data: Record<string, unknown>;
}

export interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  response?: unknown;
  error?: string;
}

/**
 * Send a webhook notification to registered subscribers
 * @param event - Type of event
 * @param source - Source of the event
 * @param data - Event data
 * @returns Promise resolving to an array of delivery results
 */
export async function sendWebhook(
  event: WebhookEvent, 
  source: string, 
  data: Record<string, unknown>
): Promise<WebhookDeliveryResult[]> {
  try {
    // Create webhook payload
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      source,
      data
    };

    // Find webhook subscribers for this event
    const subscribers = await withReadQuery(null, 'webhooks', async () => {
      return await db
        .select()
        .from(schema.webhooks)
        .where(
          and(
            eq(schema.webhooks.event, event),
            eq(schema.webhooks.active, true)
          )
        );
    });

    if (!subscribers || subscribers.length === 0) {
      logger.debug(`No active subscribers for event ${event}`);
      return [];
    }

    logger.info(`Sending ${event} webhook to ${subscribers.length} subscribers`, { source });

    // Send webhook to all subscribers in parallel
    const results = await Promise.all(
      subscribers.map(async (subscriber) => {
        try {
          return await deliverWebhook(subscriber.url, payload, subscriber.secret);
        } catch (error) {
          logger.error(`Failed to deliver webhook to ${subscriber.url}`, { error });
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      })
    );

    // Record delivery attempts
    await recordDeliveryAttempts(event, subscribers, results);
    
    return results;
  } catch (error) {
    logger.error(`Error in webhook processing`, { error, event });
    return [{
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }];
  }
}

/**
 * Register a new webhook subscription
 * @param url - Webhook URL to call
 * @param event - Event to subscribe to
 * @param secret - Optional secret for webhook signing
 * @returns Created webhook subscription
 */
export async function registerWebhook(
  url: string, 
  event: WebhookEvent, 
  secret?: string
): Promise<typeof schema.webhooks.$inferSelect> {
  try {
    logger.info(`Registering webhook for ${event} events to ${url}`);
    
    const [webhook] = await db.insert(schema.webhooks)
      .values({
        url,
        event,
        secret: secret || null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return webhook;
  } catch (error) {
    logger.error(`Failed to register webhook`, { url, event, error });
    throw error;
  }
}

/**
 * Deliver a webhook payload to a subscriber
 * @param url - Webhook URL
 * @param payload - Webhook payload
 * @param secret - Optional secret for signing the payload
 * @returns Webhook delivery result
 */
async function deliverWebhook(
  url: string, 
  payload: WebhookPayload,
  secret?: string | null
): Promise<WebhookDeliveryResult> {
  const startTime = Date.now();
  
  try {
    // Create headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'User-Agent': 'DCR-Webhook/1.0',
      'X-DCR-Event': payload.event,
      'X-DCR-Delivery': crypto.randomUUID()
    };
    
    // If secret is provided, sign the payload
    if (secret) {
      const signature = await signPayload(payload, secret);
      headers['X-DCR-Signature'] = signature;
    }
    
    // Send the webhook
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      // Reasonable timeout for webhook delivery
      signal: AbortSignal.timeout(5000)
    });
    
    // Process response
    const responseData = await response.text();
    const elapsed = Date.now() - startTime;
    
    if (response.ok) {
      logger.debug(`Webhook delivered to ${url} in ${elapsed}ms`, {
        statusCode: response.status
      });
      
      return {
        success: true,
        statusCode: response.status,
        response: responseData
      };
    } else {
      logger.warn(`Webhook to ${url} failed with status ${response.status}`, {
        statusCode: response.status,
        response: responseData
      });
      
      return {
        success: false,
        statusCode: response.status,
        response: responseData,
        error: `HTTP error ${response.status}`
      };
    }
  } catch (error) {
    const elapsed = Date.now() - startTime;
    logger.error(`Webhook delivery to ${url} failed after ${elapsed}ms`, { error });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Sign webhook payload with a secret
 * @param payload - Webhook payload
 * @param secret - Secret key
 * @returns Signature string
 */
async function signPayload(payload: WebhookPayload, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload));
  const keyData = encoder.encode(secret);
  
  // Create a key from the secret
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // Sign the payload
  const signature = await crypto.subtle.sign('HMAC', key, data);
  
  // Convert to hex string
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Record webhook delivery attempts in the database
 */
async function recordDeliveryAttempts(
  event: WebhookEvent,
  subscribers: typeof schema.webhooks.$inferSelect[],
  results: WebhookDeliveryResult[]
): Promise<void> {
  try {
    // Skip if no logs to record
    if (subscribers.length === 0) return;
    
    // Bulk insert delivery logs
    await db.insert(schema.webhookLogs).values(
      subscribers.map((subscriber, index) => ({
        webhookId: subscriber.id,
        event,
        success: results[index].success,
        statusCode: results[index].statusCode || null,
        responseData: results[index].response 
          ? JSON.stringify(results[index].response).substring(0, 1000)
          : null,
        errorMessage: results[index].error || null,
        timestamp: new Date()
      }))
    );
  } catch (error) {
    logger.error(`Failed to record webhook delivery attempts`, { error });
    // Non-critical error, don't throw
  }
}
