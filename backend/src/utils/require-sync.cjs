// This file is CommonJS, so we can use require() without issue.
const { createRequire } = require('module');

// We use createRequire from the context of this file's URL.
const require = createRequire(import.meta.url);

// Export a function that performs the synchronous require.
// This is the bridge between the CJS and ESM worlds.
module.exports.requireSync = (id) => {
    try {
        // The core of the synchronous operation.
        return require(id);
    } catch (error) {
        console.error(`Synchronous require failed for module: ${id}`, error);
        throw error; // Re-throw the error to be handled by the caller.
    }
};