/**
 * Type declarations for ConfigFileService
 */
export class ConfigFileService {
  /**
   * Calculates a hash for the given content
   */
  calculateHash(content: string): Promise<string>;
  
  /**
   * Saves API configuration to the filesystem
   */
  saveApiConfig(apiSlug: string, config: any): Promise<void>;
  
  /**
   * Saves endpoint configuration to the filesystem
   */
  saveEndpointConfig(
    apiSlug: string, 
    version: string, 
    endpoint: { method: string; path: string }, 
    config: any
  ): Promise<void>;
}
