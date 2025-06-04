import { Context, Hono } from "hono";
import { ImportValidatorService } from "../../services/import-validator.service.js";
import { importPostmanSchema } from "./schemas.js";

export function createValidateRouter(importValidatorService: ImportValidatorService) {
  const router = new Hono();

  // Endpoint to validate Postman collection
  router.post("/", async (c: Context) => {
    try {
      const body = await c.req.json();
      const { collectionData } = importPostmanSchema.parse(body);
      
      // Use the import validator service to validate the collection
      const { validatedCollection, endpointSelections } = 
        await importValidatorService.validatePostmanCollection(collectionData);
      
      // Return collection overview and endpoint selections
      const overview = importValidatorService.getCollectionOverview(validatedCollection);
      
      return c.json({
        success: true,
        data: {
          ...overview,
          endpointSelections
        },
      });
    } catch (error: any) {
      console.error("Validation error:", error);
      return c.json({
        success: false,
        error: error.message || "Failed to validate Postman collection",
      }, 400);
    }
  });

  return router;
}
