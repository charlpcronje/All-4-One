import { Hono } from 'hono';
import { Context } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createLogger } from '../../logging/index.js';
import { ImportValidatorService } from '../../services/import-validator.service.js';
import { ConfigFileService } from '../../services/config-fs.service.js';
import { GitService } from '../../services/git.service.js';

const logger = createLogger('routes:import');

// Import source schema for validation
const importSourceSchema = z.object({
  type: z.enum(['git', 'url', 'file']),
  url: z.string().url().optional(),
  repository: z.string().optional(),
  branch: z.string().optional(),
  filePath: z.string().optional(),
  content: z.string().optional()
});

/**
 * Create the import router for handling API imports
 */
export function createImportRouter(
  importValidatorService: ImportValidatorService, 
  configFileService: ConfigFileService, 
  gitService: GitService
) {
  const importRouter = new Hono();

  // Import an API from a source (git, url, file)
  importRouter.post('/', zValidator('json', importSourceSchema), async (c: Context) => {
    try {
      const input = c.req.valid('json');
      logger.info('Processing API import request', { source: input.type });
      
      // Extract domain from context to associate import with domain/namespace
      const domainMapping = c.get('domainMapping');
      if (!domainMapping) {
        return c.json({ 
          success: false, 
          error: 'Domain context is required for imports' 
        }, 400);
      }
      
      // Handle different import sources
      let configContent: string;
      
      switch (input.type) {
        case 'git':
          if (!input.repository) {
            return c.json({ success: false, error: 'Repository URL is required for git imports' }, 400);
          }
          
          // Clone repo and extract config
          const branch = input.branch || 'main';
          configContent = await gitService.extractConfigFromRepo(input.repository, branch);
          break;
          
        case 'url':
          if (!input.url) {
            return c.json({ success: false, error: 'URL is required for url imports' }, 400);
          }
          
          // Fetch config from URL
          configContent = await importValidatorService.fetchFromUrl(input.url);
          break;
          
        case 'file':
          if (!input.content) {
            return c.json({ success: false, error: 'File content is required for file imports' }, 400);
          }
          
          // Use provided content directly
          configContent = input.content;
          break;
          
        default:
          return c.json({ success: false, error: 'Invalid import source type' }, 400);
      }
      
      // Validate the config
      const validationResult = await importValidatorService.validateConfig(configContent);
      if (!validationResult.valid) {
        return c.json({ 
          success: false, 
          error: 'Invalid configuration format', 
          details: validationResult.errors 
        }, 400);
      }
      
      // Save the config to the namespace
      await configFileService.saveConfig(
        domainMapping.namespace, 
        validationResult.config
      );
      
      logger.info('API imported successfully', { 
        namespace: domainMapping.namespace, 
        source: input.type 
      });
      
      return c.json({ 
        success: true, 
        message: 'API imported successfully',
        namespace: domainMapping.namespace
      });
    } catch (error) {
      logger.error('Error processing import', { error });
      return c.json({ success: false, error: 'Failed to import API' }, 500);
    }
  });

  return importRouter;
}
