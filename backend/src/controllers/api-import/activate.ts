import { Context, Hono } from "hono";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "../../db/index.js";
import { activateEndpointsSchema } from "./schemas.js";
import { collections, endpoints, activeEndpoints } from "../../db/schema.js";

// Define types for database entities
type Endpoint = {
  id: number;
  apiId: number;
  path: string;
  method: string;
  description: string | null;
  config: string;
  configHash: string;
  version: string;
};

type Collection = {
  id: number;
  ownerId: number;
  name: string;
  slug: string;
};

export function createActivateRouter(): Hono {
  const router = new Hono();

  // Endpoint to activate specific endpoints from a collection
  router.post("/", async (c: Context) => {
    try {
      const body = await c.req.json();
      const { collectionId, endpointIds, userId } = activateEndpointsSchema.parse(body);
      
      // Check if collection exists
      const collectionResult = await db.select()
        .from(collections)
        .where(eq(collections.id, collectionId))
        .execute();
      
      if (collectionResult.length === 0) {
        return c.json({
          success: false,
          error: "Collection not found",
        }, 404);
      }
      
      // Find endpoints that match the provided IDs
      const existingEndpoints = await db.select()
        .from(endpoints)
        .where(inArray(endpoints.id, endpointIds))
        .execute() as Endpoint[];
      
      if (existingEndpoints.length === 0) {
        return c.json({
          success: false,
          error: "No valid endpoints found to activate",
        }, 400);
      }
      
      // These are all valid endpoints since we filtered by the IDs directly
      const validEndpoints = existingEndpoints;
      
      if (validEndpoints.length === 0) {
        return c.json({
          success: false,
          error: "No valid endpoints found to activate",
        }, 400);
      }
      
      // Create active endpoint records
      const activeEndpointInserts = validEndpoints.map(endpoint => ({
        collectionId,
        endpointId: endpoint.id,
        activatedBy: userId,
        isActive: true,
        activatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      
      const activationResults = await db.insert(activeEndpoints)
        .values(activeEndpointInserts as any)
        .returning();
      
      return c.json({
        success: true,
        data: {
          activatedEndpoints: activationResults.length,
          endpoints: validEndpoints
        }
      });
    } catch (error: any) {
      console.error("Activation error:", error);
      return c.json({
        success: false,
        error: error.message || "Failed to activate endpoints",
      }, 400);
    }
  });

  return router;
}
