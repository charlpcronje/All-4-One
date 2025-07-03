// Path: frontend/vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        // This plugin handles most Node.js polyfills for the browser
        nodePolyfills({
            // We want to polyfill 'crypto' and 'module'
            include: ['crypto', 'module', 'events'],
            // We don't need fs on the client, so we can exclude it.
            // 'fx.js' has IS_SERVER guards, but this prevents errors.
            exclude: ['fs'],
            globals: {
                Buffer: true,
                global: true,
                process: true,
            },
            protocolImports: true,
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            // Add alias for the core directory to ensure consistent imports
            '@core': path.resolve(__dirname, '../core'),
        },
    },
    // Define server-side globals as non-existent for client builds
    define: {
        'process.env.IS_SERVER': 'false',
        'global': 'window'
    },
    server: {
        port: 4444,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
        },
    },
});