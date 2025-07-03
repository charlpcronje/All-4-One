import { WebhookEvent } from './index.js';
import { webhooks } from '../db/schema.js'; // Assuming schema is exported from here

// Define the type for the 'phase' column from the schema explicitly
// This helps ensure our mapping is to valid schema values.
// You might need to adjust the import path for `schema` based on your project structure.
type WebhookPhase = typeof webhooks.$inferInsert['phase'];

/**
 * Maps WebhookEvent types to the 'phase' enum values expected by the webhooks table schema.
 * @param event The WebhookEvent to map.
 * @returns The corresponding WebhookPhase, or undefined if no direct mapping exists.
 */
export function mapWebhookEventToPhase(event: WebhookEvent): WebhookPhase | undefined {
  switch (event) {
    case 'api.request':
      return 'request';
    case 'api.response':
      return 'afterRequest';
    // TODO: Define mappings for other WebhookEvent types if they should trigger webhooks
    // For example, 'cache.hit', 'cache.miss', 'error', 'retry', 'system'
    // currently do not have a direct mapping to the 'phase' enum in schema.webhooks.
    // If these events should be stored, the 'phase' enum might need expansion,
    // or a different mechanism/table should be used.
    default:
      // Log a warning or throw an error for unmapped events if strict handling is desired
      console.warn(`No phase mapping found for WebhookEvent: ${event}`);
      return undefined; // Or throw an error
  }
}
