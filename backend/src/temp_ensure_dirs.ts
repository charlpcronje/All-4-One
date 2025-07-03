import { getConfigBasePath, getApiConfigPath } from './config.js'; // .js is correct for NodeNext module resolution

async function ensureDirs() {
  try {
    const baseConfigPath = getConfigBasePath(); // Should create c:/xampp/htdocs/dcr/config
    console.log(`Base config path ensured: ${baseConfigPath}`);
    const apiPath = getApiConfigPath(); // Should create c:/xampp/htdocs/dcr/config/apis
    console.log(`API config path ensured: ${apiPath}`);
  } catch (error) {
    console.error('Failed to ensure config paths:', error);
    process.exit(1);
  }
}

ensureDirs();
