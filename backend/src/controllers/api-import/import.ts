// Path: backend/src/controllers/api-import/import.ts
// CORRECTED VERSION
import { z } from "zod";
import { Hono, Context } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { withTransaction } from '@/db/transactions.js';
import { createLogger } from '@/logging/index.js';
import { importPostmanSchema } from './schemas.js';
import * as schema from '@/db/schema.js';
import { ImportParserService } from '@/services/import-parser.service.js';
import crypto from 'node:crypto';
const logger = createLogger('controller:api-import');

const calculateHash = (content: any): string => {
   const stringified = JSON.stringify(content, Object.keys(content).sort());
   return crypto.createHash("sha256").update(stringified).digest("hex");
};

/**
 * Creates a router for handling the final import of a parsed collection.
 */
export function createImportRouter() {
  const importRouter = new Hono();
  const parserService = new ImportParserService();

  importRouter.post('/', zValidator('json', importPostmanSchema), async (c: Context) => {
    try {
      const { collectionData, name, slug } = c.req.valid('json');

      const parsedCollection = await parserService.parsePostmanCollection(collectionData);
      const processDefinition = parserService.createProcessDefinition(parsedCollection);

      const [newApi] = await withTransaction(c, 'import postman collection', async (tx) => {
        const configString = JSON.stringify({
            importedFrom: 'postman',
            baseUrl: parsedCollection.baseUrl,
        });

        const [apiRecord] = await tx.insert(schema.apis).values({
          name: name,
          slug: slug,
          description: parsedCollection.description,
          type: 'http',
          config: configString,
          configHash: calculateHash(configString),
        }).returning();

        await tx.insert(schema.endpoints).values({
            apiId: apiRecord.id,
            path: '/',
            method: 'POST',
            description: `Main process for ${name}`,
            version: 'v1',
            config: JSON.stringify(processDefinition),
            configHash: calculateHash(processDefinition),
        }).returning();

        return [apiRecord];
      });

      if (!newApi) {
          throw new Error("API creation failed after transaction.");
      }

      logger.info('Successfully imported Postman collection as new API', { apiId: newApi.id, name: newApi.name });
      return c.json({ success: true, data: newApi });

    } catch (error: any) {
      logger.error('Failed to import Postman collection', { error: error.message });
      return c.json({ success: false, error: 'Import failed: ' + error.message }, 500);
    }
  });

  return importRouter;
}