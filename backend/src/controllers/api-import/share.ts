import { Context, Hono } from "hono";
import { db } from "../../db/index.js";
import { collectionShares } from "../../db/schema.js";
import { shareCollectionSchema } from "./schemas.js";

export function createShareRouter() {
  const router = new Hono();

  // Endpoint to share a collection with other users
  router.post("/", async (c: Context) => {
    try {
      const body = await c.req.json();
      const { collectionId, userIds } = shareCollectionSchema.parse(body);
      
      // Create share records for each user
      const shareInserts = userIds.map(userId => ({
        collectionId,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      
      const shareResults = await db.insert(collectionShares).values(shareInserts as any).returning();
      
      return c.json({
        success: true,
        data: {
          shares: shareResults.length
        }
      });
    } catch (error: any) {
      console.error("Share error:", error);
      return c.json({
        success: false,
        error: error.message || "Failed to share collection",
      }, 400);
    }
  });

  return router;
}
