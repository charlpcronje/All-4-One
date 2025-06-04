import { Context, Hono } from "hono";
import { db } from "../../db/index.js";
import { apis, collections, endpoints, activeEndpoints } from "../../db/schema.js";
import { ImportValidatorService } from "../../services/import-validator.service.js";
import { ConfigFileService } from "../../services/config-file.service.js";
import { GitService } from "../../services/git.service.js";
import { extendedImportSchema, apiInsertSchema } from "./schemas.js";

export function createImportRouter(
  importValidatorService: ImportValidatorService,
  configFileService: ConfigFileService,
  gitService: GitService
) {
  const router = new Hono();

  // Endpoint to import a validated Postman collection
  router.post("/", async (c: Context) => {
    try {
      const body = await c.req.json();
      const validatedBody = extendedImportSchema.parse(body);
      
      const { 
        collectionData, 
        name, 
        description, 
        version, 
        basePath, 
        tags = [], 
        selectedEndpoints = [],
        userId = 1 
      } = validatedBody;
      
      // Step 1: Validate the collection
      const { validatedCollection, endpointSelections } = 
        await importValidatorService.validatePostmanCollection(collectionData);
      
      // Step 2: Generate a slug for the API
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      // Step 3: Initialize Git repository if needed
      await gitService.ensureGitInitialized();
      
      // Step 4: Filter selected endpoints
      const filteredEndpoints = importValidatorService.filterSelectedEndpoints(
        validatedCollection,
        selectedEndpoints,
        endpointSelections
      ).endpoints;
      
      // Step 5: Insert API record
      // Prepare the API config as JSON
      const apiConfig = JSON.stringify({
        name,
        description: description || validatedCollection.description || '',
        basePath: basePath || validatedCollection.baseUrl || '',
        version,
        type: "http"
      });
      
      // Calculate config hash
      const apiConfigHash = await configFileService.calculateHash(apiConfig);
      
      // Create API insert object with correct schema and properties
      const apiInsert = {
        name,
        slug,
        description: description || validatedCollection.description || '',
        basePath: basePath || validatedCollection.baseUrl || '',
        version,
        tags: tags || [],
        active: true,
        type: "http", // Default to HTTP API type
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        config: apiConfig,
        configHash: apiConfigHash
      };
      
      const apiResult = await db.insert(apis).values(apiInsert as any).returning();
      const apiId = apiResult[0].id;
      
      // Step 6: Save collection data to DB
      const collectionInsert = {
        apiId,
        userId,
        name,
        description: description || validatedCollection.description || '',
        rawData: collectionData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: JSON.stringify({
          endpointCount: validatedCollection.endpoints.length || 0,
          selectedCount: selectedEndpoints.length,
          version
        })
      };
      
      const collectionRecord = await db.insert(collections).values(collectionInsert as any).returning();
      const collectionId = collectionRecord[0].id;
      
      // Step 7: Insert endpoints
      const endpointInserts = [];
      
      // Define the filtered endpoints type
      const typedFilteredEndpoints = filteredEndpoints as any[];
      
      for (const endpoint of typedFilteredEndpoints) {
        // Create endpoint config
        const endpointConfig = JSON.stringify({
          headers: endpoint.headers || {},
          body: endpoint.body || {}
        });
        
        // Calculate config hash
        const configHash = await configFileService.calculateHash(endpointConfig);
        
        // Create endpoint insert object
        endpointInserts.push({
          apiId,
          method: endpoint.method,
          path: endpoint.path,
          description: endpoint.description || '',
          requestSchema: JSON.stringify(endpoint.params || {}),
          responseSchema: JSON.stringify({}),
          config: endpointConfig,
          configHash,
          active: true,
          version,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      const endpointResults = await db.insert(endpoints).values(endpointInserts as any).returning();
      
      // Step 8: Insert active endpoints
      const activeEndpointInserts = endpointResults.map(endpoint => ({
        endpointId: endpoint.id,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      
      await db.insert(activeEndpoints).values(activeEndpointInserts as any);
      
      // Step 9: Save API and endpoint configs to filesystem
      await configFileService.saveApiConfig(
        slug,
        JSON.parse(apiConfig)
      );
      
      for (const endpoint of endpointResults) {
        // For each endpoint, save its config to filesystem
        await configFileService.saveEndpointConfig(
          slug,
          version,
          { 
            method: endpoint.method, 
            path: endpoint.path 
          },
          JSON.parse(endpoint.config)
        );
      }
      
      // Step 10: Commit changes to Git
      await gitService.commitChanges(`Imported API ${name} with ${endpointResults.length} endpoints`);
      
      return c.json({
        success: true,
        data: {
          api: apiResult[0],
          collection: collectionRecord[0],
          endpoints: endpointResults.length,
          activeEndpoints: activeEndpointInserts.length
        },
      });
    } catch (error: any) {
      console.error("Import error:", error);
      return c.json({
        success: false,
        error: error.message || "Failed to import Postman collection",
      }, 400);
    }
  });

  return router;
}
