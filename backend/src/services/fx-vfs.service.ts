// Path: backend/src/services/fx-vfs.service.ts

import { Volume } from 'memfs';
import { fx, createNode, classRegistry } from '@/core/fx.js';
import path from 'path';
import { randomUUID } from 'crypto';

// Export a single, application-wide instance of the in-memory volume.
export const vfs = new Volume();

// Create a promise-based API for our in-memory volume.
const fs = vfs.promises;

/**
 * Service to manage the interaction between fx nodes and the in-memory Virtual File System (VFS).
 */
export class FxVfsService {
  private rootPath: string;

  constructor(rootPath: string = '/fx') {
    this.rootPath = rootPath;
    // Synchronously ensure the root directory exists on startup.
    if (!vfs.existsSync(this.rootPath)) {
      vfs.mkdirSync(this.rootPath, { recursive: true });
    }
  }

  /**
   * Materializes a JSON object definition into the VFS as a directory/file tree.
   * This is the VFS-aware version of `expand()`.
   * @param targetPath The absolute VFS path where the node should be created.
   * @param definition The JSON object to materialize.
   */
  async materialize(targetPath: string, definition: any): Promise<void> {
    // Ensure parent directory exists before creating the target.
    const parentDir = path.dirname(targetPath);
    if (!vfs.existsSync(parentDir)) {
      await fs.mkdir(parentDir, { recursive: true });
    }
    
    // Create the node's own directory.
    if (!vfs.existsSync(targetPath)) {
        await fs.mkdir(targetPath, { recursive: true });
    }

    const meta = {
      id: definition.__id || randomUUID(),
      type: definition.__type || 'json',
      state: definition.__state || 'idle',
      proto: definition.__proto || null,
    };

    await fs.writeFile(path.join(targetPath, '__meta.json'), JSON.stringify(meta, null, 2));

    if (definition.__value !== undefined && definition.__value !== null) {
      const valueContent = typeof definition.__value === 'object' 
        ? JSON.stringify(definition.__value) 
        : String(definition.__value);
      await fs.writeFile(path.join(targetPath, '__value'), valueContent);
    }

    if (definition.__nodes) {
      for (const [key, childDefinition] of Object.entries(definition.__nodes)) {
        const childPath = path.join(targetPath, key);
        await this.materialize(childPath, childDefinition);
      }
    }
  }

  /**
   * Hydrates an fx node by reading its definition from a VFS path.
   * This is the VFS-aware version of `wrap()`'s inverse operation.
   * @param sourcePath The absolute VFS path to read from.
   * @returns A hydrated, fully functional fx node.
   */
  async hydrate(sourcePath: string): Promise<any> {
    const node = createNode();
    
    // Read metadata
    const metaPath = path.join(sourcePath, '__meta.json');
    const metaContent = await fs.readFile(metaPath, 'utf-8') as string;
    const meta = JSON.parse(metaContent);
    
    // Populate the node from metadata
    node.__id = meta.id;
    node.type(meta.type);
    node.__state = meta.state;
    node.__proto = meta.proto;

    // Read and set the node's primary value
    const valuePath = path.join(sourcePath, '__value');
    if (vfs.existsSync(valuePath)) {
        const valueContent = await fs.readFile(valuePath, 'utf-8') as string;
        let value;
        // The `set` method in fx.js will handle parsing if it's JSON,
        // but it's more robust to parse it here based on type.
        if (meta.type === 'json') {
            value = JSON.parse(valueContent);
        } else if (meta.type === 'num') {
            value = parseFloat(valueContent);
        } else if (meta.type === 'bool') {
            value = valueContent === 'true';
        } else {
            value = valueContent;
        }

        // If it's a registered class, instantiate it
        if (meta.proto && classRegistry.has(meta.proto)) {
            const RegisteredClass = classRegistry.get(meta.proto);
            const instance = new RegisteredClass();
            Object.assign(instance, value); // Populate instance with data
            node.set(instance);
        } else {
            node.set(value);
        }
    }

    // Recursively hydrate sub-nodes from sub-directories
    const children = await fs.readdir(sourcePath) as string[];
    for (const childName of children) {
        if (!childName.startsWith('__')) {
            const childPath = path.join(sourcePath, childName);
            const stats = await fs.stat(childPath);
            if (stats.isDirectory()) {
                // Attach the hydrated child node to the parent
                node.__nodes[childName] = await this.hydrate(childPath);
            }
        }
    }

    return node;
  }
}