import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Ensures that a directory exists, creating it and any parent directories if needed
 */
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch (error) {
    // Directory doesn't exist, create it recursively
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Checks if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Creates a backup of a file before modifying it
 */
export async function createFileBackup(filePath: string): Promise<string> {
  if (!(await fileExists(filePath))) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  const timestamp = new Date().toISOString().replace(/[:\.]/g, '-');
  const backupPath = `${filePath}.${timestamp}.bak`;
  
  await fs.copyFile(filePath, backupPath);
  return backupPath;
}

/**
 * Safely writes content to a file, creating a backup if the file exists
 */
export async function safeWriteFile(filePath: string, content: string): Promise<void> {
  // Ensure the directory exists
  const dirPath = path.dirname(filePath);
  await ensureDirectoryExists(dirPath);
  
  // Create backup if file exists
  if (await fileExists(filePath)) {
    await createFileBackup(filePath);
  }
  
  // Write the file
  await fs.writeFile(filePath, content, 'utf8');
}

/**
 * Deletes a file if it exists
 */
export async function deleteFileIfExists(filePath: string): Promise<boolean> {
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Reads a directory and returns all files with specific extension
 */
export async function findFilesByExtension(dirPath: string, extension: string): Promise<string[]> {
  const files = await fs.readdir(dirPath, { withFileTypes: true });
  
  const result: string[] = [];
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file.name);
    
    if (file.isDirectory()) {
      // Recursively search subdirectories
      const subResults = await findFilesByExtension(fullPath, extension);
      result.push(...subResults);
    } else if (file.isFile() && file.name.endsWith(extension)) {
      result.push(fullPath);
    }
  }
  
  return result;
}

/**
 * Gets the size of a file in bytes
 */
export async function getFileSize(filePath: string): Promise<number> {
  const stats = await fs.stat(filePath);
  return stats.size;
}

/**
 * Gets the last modified time of a file
 */
export async function getFileModifiedTime(filePath: string): Promise<Date> {
  const stats = await fs.stat(filePath);
  return stats.mtime;
}
