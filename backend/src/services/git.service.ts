// Using dynamic import for simple-git to avoid type issues
import type { SimpleGit } from 'simple-git';
import { getConfigBasePath } from '../config.js';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Service for handling Git operations for configuration management
 */
export class GitService {
  private git!: SimpleGit;
  
  constructor() {
    this.initGit();
  }
  
  private async initGit() {
    // Dynamically import simple-git
    const { default: simpleGit } = await import('simple-git');
    
    this.git = simpleGit({
      baseDir: getConfigBasePath(),
      binary: 'git',
      maxConcurrentProcesses: 1,
    });
  }

  /**
   * Initialize Git repository if it doesn't exist
   */
  async ensureGitInitialized(): Promise<void> {
    const isGitInitialized = await this.git.checkIsRepo();
    
    if (!isGitInitialized) {
      await this.git.init();
      
      // Create a .gitignore file to exclude sensitive files
      const gitignorePath = path.join(getConfigBasePath(), ".gitignore");
      await fs.writeFile(gitignorePath, "*.env\n*.key\n*.pem\n");
      
      // Initial commit
      await this.git.add(".gitignore");
      await this.git.commit("Initial commit: Setup configuration repository");
    }
  }

  /**
   * Add and commit changes to the Git repository
   */
  async commitChanges(message: string, pathSpec: string | string[] = '.'): Promise<void> {
    await this.ensureGitInitialized();
    await this.git.add(pathSpec);
    await this.git.commit(message);
  }

  /**
   * Get commit history for a specific path
   */
  async getCommitHistory(apiSlug: string): Promise<Array<{
    hash: string;
    shortHash: string;
    message: string;
    author: string;
    date: string;
  }>> {
    const apiDir = path.join('apis', apiSlug);
    const log = await this.git.log({ file: apiDir });
    
    return log.all.map((commit: {
      hash: string;
      message: string;
      author_email: string;
      date: string;
    }) => ({
      hash: commit.hash,
      shortHash: commit.hash.substring(0, 7),
      message: commit.message,
      author: commit.author_email,
      date: commit.date,
    }));
  }

  /**
   * Get diff for a specific commit
   */
  async getDiff(apiSlug: string, commitHash: string): Promise<string> {
    const apiDir = path.join('apis', apiSlug);
    return await this.git.show([commitHash, '--', apiDir]);
  }
}

// Export singleton instance
export const gitService = new GitService();
