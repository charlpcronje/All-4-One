import { z } from 'zod';
import { parsedCollectionSchema } from '../schemas/api.schema.js';
import { parsePostmanCollection } from './api-import.service.js';
import type { ParsedCollection, ParsedEndpoint } from './api-import.service.js';

/**
 * Service for validating and preparing API imports with endpoint selection support
 */
export class ImportValidatorService {
  /**
   * Validate a Postman collection and prepare it for import
   * Returns the validated collection with endpoint selection metadata
   */
  async validatePostmanCollection(collectionData: string): Promise<{
    validatedCollection: z.infer<typeof parsedCollectionSchema>;
    endpointSelections: Array<{
      id: string;
      method: string;
      path: string;
      description: string | undefined;
      selected: boolean;
    }>;
  }> {
    try {
      // Parse the collection
      const parsedCollection = await parsePostmanCollection(collectionData);
      
      // Validate with Zod schema
      const validatedCollection = parsedCollectionSchema.parse(parsedCollection);
      
      // Generate selection metadata for each endpoint
      const endpointSelections = validatedCollection.endpoints.map((endpoint, index) => ({
        id: `endpoint-${index}`,
        method: endpoint.method,
        path: endpoint.path || '',
        description: endpoint.description || undefined,
        selected: true, // Default to selected
      }));
      
      return {
        validatedCollection,
        endpointSelections,
      };
    } catch (error: any) {
      throw new Error(`Collection validation failed: ${error.message}`);
    }
  }
  
  /**
   * Filter endpoints based on user selection
   */
  filterSelectedEndpoints(
    collection: z.infer<typeof parsedCollectionSchema>,
    selectedEndpointIds: string[],
    endpointSelections: Array<{ id: string; method: string; path: string; selected: boolean }>
  ): z.infer<typeof parsedCollectionSchema> {
    // Map selection IDs to a lookup table
    const selectedMap = new Map<string, boolean>();
    selectedEndpointIds.forEach(id => selectedMap.set(id, true));
    
    // Get the indices of selected endpoints
    const selectedIndices = endpointSelections
      .filter(endpoint => selectedMap.has(endpoint.id))
      .map(endpoint => {
        // Find the index of this endpoint in the original collection
        return endpointSelections.findIndex(e => e.id === endpoint.id);
      })
      .filter(index => index !== -1);
    
    // Filter the endpoints array
    const selectedEndpoints = selectedIndices.map(index => collection.endpoints[index]);
    
    // Return a new collection with only the selected endpoints
    return {
      ...collection,
      endpoints: selectedEndpoints
    };
  }
  
  /**
   * Get collection overview with endpoint count
   */
  getCollectionOverview(collection: z.infer<typeof parsedCollectionSchema>): {
    name: string;
    description: string | undefined;
    endpointCount: number;
    endpoints: Array<{
      method: string;
      path: string;
      description: string | undefined;
    }>;
  } {
    return {
      name: collection.name,
      description: collection.description,
      endpointCount: collection.endpoints.length,
      endpoints: collection.endpoints.map(endpoint => ({
        method: endpoint.method,
        path: endpoint.path,
        description: endpoint.description || undefined,
      }))
    };
  }

  /**
   * Share collection with other users (stub for now)
   */
  async shareCollection(
    collectionId: string, 
    userId: string, 
    targetUserIds: string[]
  ): Promise<boolean> {
    // This would connect to a user/permissions service in a full implementation
    console.log(`Sharing collection ${collectionId} from user ${userId} with users: ${targetUserIds.join(', ')}`);
    return true;
  }
}

// Export singleton instance
export const importValidatorService = new ImportValidatorService();

// Define import schema for frontend
export const importPostmanSchema = z.object({
  collectionData: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  version: z.string().default("v1"),
  basePath: z.string().optional(),
  tags: z.array(z.string()).optional(),
  selectedEndpoints: z.array(z.string()).optional(), // IDs of endpoints to import
});
