import fs from 'node:fs/promises';
import path from 'node:path';
import { getConfigBasePath, getApiConfigPath } from '../config.js'; // Added getApiConfigPath
import { ensureDirectoryExists } from '../utils/fs-utils.js';
import crypto from 'node:crypto';

/**
 * Service for handling configuration file operations
 */
export class ConfigFileService {
  constructor() {
    // Ensure the base API config directory exists upon instantiation
    getApiConfigPath();
  }

  /**
   * Calculate SHA-256 hash for content
   */
  calculateHash(content: string): string {
    return crypto.createHash("sha256").update(content).digest("hex");
  }
  
  /**
   * Ensure API directory structure exists
   */
  async ensureApiDirectoryStructure(apiSlug: string, version: string = 'v1'): Promise<{
    apiDir: string;
    versionDir: string;
  }> {
    const apiDir = path.join(getConfigBasePath(), "apis", apiSlug);
    const versionDir = path.join(apiDir, version);
    
    await ensureDirectoryExists(versionDir);
    
    return { apiDir, versionDir };
  }
  
  /**
   * Save API configuration file
   */
  async saveApiConfig(
    apiSlug: string, 
    config: any // Expecting ApiConfig type structure
  ): Promise<{ filePath: string; configHash: string }> {
    // Ensure base API directory exists
    const apiDir = path.join(getConfigBasePath(), "apis", apiSlug);
    await ensureDirectoryExists(apiDir);

    // Initialize versioning fields if not present
    if (!config.availableVersions || config.availableVersions.length === 0) {
      config.availableVersions = ['v1'];
    }
    if (!config.currentVersion) {
      config.currentVersion = config.availableVersions[0] || 'v1';
    }

    // Ensure the current version directory structure exists
    await this.ensureApiDirectoryStructure(apiSlug, config.currentVersion);
    
    const filePath = path.join(apiDir, "api.json");
    const configStr = JSON.stringify(config, null, 2);
    const configHash = this.calculateHash(configStr);
    
    await fs.writeFile(filePath, configStr);
    
    return { filePath, configHash };
  }
  
  /**
   * Save endpoint configuration file
   */
  async saveEndpointConfig(
    apiSlug: string, 
    version: string,
    endpoint: { method: string; path: string },
    config: any
  ): Promise<{ filePath: string; configHash: string }> {
    const versionDir = path.join(getConfigBasePath(), "apis", apiSlug, version);
    await ensureDirectoryExists(versionDir);
    
    const endpointFileName = `${endpoint.method.toLowerCase()}-${endpoint.path.replace(/[^a-zA-Z0-9]/g, "-")}.json`;
    const filePath = path.join(versionDir, endpointFileName);
    const configStr = JSON.stringify(config, null, 2);
    const configHash = this.calculateHash(configStr);
    
    await fs.writeFile(filePath, configStr);
    
    return { filePath, configHash };
  }
  
  /**
   * Read API configuration file
   */
  async readApiConfig(apiSlug: string): Promise<{ config: any; configHash: string }> {
    const configPath = path.join(getConfigBasePath(), "apis", apiSlug, "api.json");
    try {
      const configStr = await fs.readFile(configPath, "utf-8");
      return {
        config: JSON.parse(configStr),
        configHash: this.calculateHash(configStr)
      };
    } catch (error) {
      throw new Error(`Failed to read API config: ${(error as Error).message}`);
    }
  }
  
  /**
   * Read endpoint configuration file
   */
  async readEndpointConfig(
    apiSlug: string,
    version: string,
    endpoint: { method: string; path: string }
  ): Promise<{ config: any; configHash: string }> {
    const endpointFileName = `${endpoint.method.toLowerCase()}-${endpoint.path.replace(/[^a-zA-Z0-9]/g, "-")}.json`;
    const configPath = path.join(getConfigBasePath(), "apis", apiSlug, version, endpointFileName);
    
    try {
      const configStr = await fs.readFile(configPath, "utf-8");
      return {
        config: JSON.parse(configStr),
        configHash: this.calculateHash(configStr)
      };
    } catch (error) {
      throw new Error(`Failed to read endpoint config: ${(error as Error).message}`);
    }
  }
}

// Export singleton instance
export const configFileService = new ConfigFileService();
