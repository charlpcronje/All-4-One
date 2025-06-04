/**
 * Filesystem utility functions
 */
import { access } from 'fs/promises';

/**
 * Check if a file or directory exists
 * @param path Path to check
 * @returns True if exists, false if not
 */
export async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
