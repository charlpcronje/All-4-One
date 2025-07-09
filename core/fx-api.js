/**
 * @file fx-api.js
 * @description Complete FX API Plugin with Headers, Methods, and Sync Interface
 * 
 * Features:
 * - All HTTP methods (GET, POST, PUT, PATCH, DELETE, etc.)
 * - Custom headers support
 * - Request/response interceptors
 * - Automatic retries and caching
 * - Synchronous interface for developers
 * - Background request processing
 */

/**
 * @class FXAPIPlugin
 * @description Complete API plugin with full HTTP method support
 */
class FXAPIPlugin {
    constructor(fx, options = {}) {
        this.fx = fx;
        this.options = {
            baseURL: '',
            timeout: 5000,
            retries: 0,
            headers: {},
            interceptors: {
                request: [],
                response: []
            },
            cache: {
                enabled: false,
                ttl: 300000 // 5 minutes
            },
            ...options
        };
        
        this.name = 'api';
        this.version = '1.0.0';
        this.description = 'Complete HTTP API client with sync interface';
        
        this.requestCache = new Map();
        this.pendingRequests = new Map();
        
        console.log('FX[API]: API plugin initialized');
    }

    /**
     * @method request
     * @description Main request method - SYNCHRONOUS interface
     * @param {Object} config - Request configuration
     * @returns {*} Response data (immediately available via placeholder)
     */
    request(config) {
        const requestConfig = this.buildRequestConfig(config);
        const cacheKey = this.getCacheKey(requestConfig);
        
        // Check cache first
        if (this.options.cache.enabled && this.requestCache.has(cacheKey)) {
            const cached = this.requestCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.options.cache.ttl) {
                console.log('FX[API]: Cache hit for', requestConfig.url);
                return cached.data;
            }
        }

        // Check for pending identical request
        if (this.pendingRequests.has(cacheKey)) {
            console.log('FX[API]: Reusing pending request for', requestConfig.url);
            return this.pendingRequests.get(cacheKey);
        }

        // Create response placeholder
        const placeholder = this.createResponsePlaceholder();
        
        // Store pending request
        this.pendingRequests.set(cacheKey, placeholder);
        
        // Execute request in background
        this.executeRequestAsync(requestConfig, placeholder, cacheKey);
        
        console.log('FX[API]: Request initiated for', requestConfig.url);
        return placeholder;
    }

    /**
     * @method buildRequestConfig
     * @description Build complete request configuration
     * @param {Object} config - Input configuration
     * @returns {Object} Complete request config
     */
    buildRequestConfig(config) {
        const fullConfig = {
            method: 'GET',
            url: config.url || config,
            headers: {
                'Content-Type': 'application/json',
                ...this.options.headers,
                ...config.headers
            },
            timeout: this.options.timeout,
            retries: this.options.retries,
            ...config
        };

        // Build full URL
        if (this.options.baseURL && !fullConfig.url.startsWith('http')) {
            fullConfig.url = this.options.baseURL.replace(/\/$/, '') + '/' + fullConfig.url.replace(/^\//, '');
        }

        return fullConfig;
    }

    /**
     * @method createResponsePlaceholder
     * @description Create a placeholder that can be populated when request completes
     * @returns {Proxy} Response placeholder
     */
    createResponsePlaceholder() {
        const placeholder = {
            _isPlaceholder: true,
            _loading: true,
            _loaded: false,
            _error: null,
            _data: null,
            _status: null,
            _headers: {},
            _watchers: []
        };

        return new Proxy(placeholder, {
            get(target, key) {
                // Internal properties
                if (key.startsWith('_')) {
                    return target[key];
                }

                // Special methods
                if (key === 'then') {
                    // Make it thenable for compatibility
                    return (onResolve, onReject) => {
                        if (target._loaded) {
                            return target._error ? onReject(target._error) : onResolve(target._data);
                        }
                        target._watchers.push({ onResolve, onReject });
                    };
                }

                if (key === 'catch') {
                    return (onReject) => {
                        if (target._loaded && target._error) {
                            return onReject(target._error);
                        }
                        target._watchers.push({ onReject });
                    };
                }

                if (key === 'watch') {
                    return (callback) => {
                        if (target._loaded) {
                            callback(target._data, target._error);
                        } else {
                            target._watchers.push({ callback });
                        }
                    };
                }

                if (key === 'status') {
                    return target._status;
                }

                if (key === 'headers') {
                    return target._headers;
                }

                if (key === 'loading') {
                    return target._loading;
                }

                if (key === 'error') {
                    return target._error;
                }

                // Access data properties
                if (target._loaded && target._data && typeof target._data === 'object') {
                    return target._data[key];
                }

                return undefined;
            },

            set(target, key, value) {
                if (key.startsWith('_')) {
                    target[key] = value;
                    return true;
                }

                console.warn('FX[API]: Cannot modify response data');
                return false;
            }
        });
    }

    /**
     * @method executeRequestAsync
     * @description Execute HTTP request asynchronously
     * @param {Object} config - Request configuration
     * @param {Object} placeholder - Response placeholder
     * @param {string} cacheKey - Cache key
     */
    async executeRequestAsync(config, placeholder, cacheKey) {
        try {
            // Apply request interceptors
            for (const interceptor of this.options.interceptors.request) {
                config = await interceptor(config);
            }

            let response;
            let attempts = 0;
            const maxAttempts = config.retries + 1;

            while (attempts < maxAttempts) {
                try {
                    response = await this.performRequest(config);
                    break;
                } catch (error) {
                    attempts++;
                    if (attempts >= maxAttempts) {
                        throw error;
                    }
                    console.log(`FX[API]: Retry ${attempts}/${config.retries} for ${config.url}`);
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
                }
            }

            // Apply response interceptors
            for (const interceptor of this.options.interceptors.response) {
                response = await interceptor(response);
            }

            // Parse response data
            let data = response.data;
            if (typeof data === 'string') {
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    // Keep as string if not valid JSON
                }
            }

            // Populate placeholder
            this.populatePlaceholder(placeholder, {
                data,
                status: response.status,
                headers: response.headers,
                error: null
            });

            // Cache if enabled
            if (this.options.cache.enabled && config.method === 'GET') {
                this.requestCache.set(cacheKey, {
                    data: placeholder,
                    timestamp: Date.now()
                });
            }

            console.log('FX[API]: Request completed successfully', config.url);

        } catch (error) {
            console.error('FX[API]: Request failed', config.url, error);
            
            this.populatePlaceholder(placeholder, {
                data: null,
                status: error.status || 0,
                headers: {},
                error: error
            });
        } finally {
            this.pendingRequests.delete(cacheKey);
        }
    }

    /**
     * @method performRequest
     * @description Perform the actual HTTP request
     * @param {Object} config - Request configuration
     * @returns {Promise<Object>} Response object
     */
    async performRequest(config) {
        if (typeof window !== 'undefined') {
            // Browser environment - use fetch
            const fetchOptions = {
                method: config.method,
                headers: config.headers,
                signal: AbortSignal.timeout(config.timeout)
            };

            if (config.data && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
                fetchOptions.body = typeof config.data === 'string' 
                    ? config.data 
                    : JSON.stringify(config.data);
            }

            const response = await fetch(config.url, fetchOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.text();
            
            return {
                data,
                status: response.status,
                headers: Object.fromEntries(response.headers.entries())
            };
        } else {
            // Node.js environment - use native http/https
            return this.performNodeRequest(config);
        }
    }

    /**
     * @method performNodeRequest
     * @description Perform HTTP request in Node.js environment
     * @param {Object} config - Request configuration
     * @returns {Promise<Object>} Response object
     */
    async performNodeRequest(config) {
        return new Promise((resolve, reject) => {
            const https = require('https');
            const http = require('http');
            const url = require('url');
            
            const parsedUrl = new URL(config.url);
            const isHttps = parsedUrl.protocol === 'https:';
            const client = isHttps ? https : http;
            
            const options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || (isHttps ? 443 : 80),
                path: parsedUrl.pathname + parsedUrl.search,
                method: config.method,
                headers: config.headers,
                timeout: config.timeout
            };

            const req = client.request(options, (res) => {
                let data = '';
                
                res.on('data', chunk => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    resolve({
                        data,
                        status: res.statusCode,
                        headers: res.headers
                    });
                });
            });

            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            if (config.data && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
                const body = typeof config.data === 'string' 
                    ? config.data 
                    : JSON.stringify(config.data);
                req.write(body);
            }

            req.end();
        });
    }

    /**
     * @method populatePlaceholder
     * @description Populate response placeholder with actual data
     * @param {Object} placeholder - Response placeholder
     * @param {Object} responseData - Response data
     */
    populatePlaceholder(placeholder, responseData) {
        placeholder._loading = false;
        placeholder._loaded = true;
        placeholder._data = responseData.data;
        placeholder._status = responseData.status;
        placeholder._headers = responseData.headers;
        placeholder._error = responseData.error;

        // Notify watchers
        placeholder._watchers.forEach(watcher => {
            try {
                if (watcher.callback) {
                    watcher.callback(responseData.data, responseData.error);
                } else if (responseData.error && watcher.onReject) {
                    watcher.onReject(responseData.error);
                } else if (!responseData.error && watcher.onResolve) {
                    watcher.onResolve(responseData.data);
                }
            } catch (error) {
                console.error('FX[API]: Error in response watcher:', error);
            }
        });
    }

    /**
     * @method getCacheKey
     * @description Generate cache key for request
     * @param {Object} config - Request configuration
     * @returns {string} Cache key
     */
    getCacheKey(config) {
        return `${config.method}:${config.url}:${JSON.stringify(config.data || {})}`;
    }

    // HTTP Method Helpers - all return immediately with placeholders

    /**
     * @method get
     * @description GET request
     * @param {string} url - Request URL
     * @param {Object} config - Additional configuration
     * @returns {*} Response placeholder
     */
    get(url, config = {}) {
        return this.request({ ...config, method: 'GET', url });
    }

    /**
     * @method post
     * @description POST request
     * @param {string} url - Request URL
     * @param {*} data - Request data
     * @param {Object} config - Additional configuration
     * @returns {*} Response placeholder
     */
    post(url, data, config = {}) {
        return this.request({ ...config, method: 'POST', url, data });
    }

    /**
     * @method put
     * @description PUT request
     * @param {string} url - Request URL
     * @param {*} data - Request data
     * @param {Object} config - Additional configuration
     * @returns {*} Response placeholder
     */
    put(url, data, config = {}) {
        return this.request({ ...config, method: 'PUT', url, data });
    }

    /**
     * @method patch
     * @description PATCH request
     * @param {string} url - Request URL
     * @param {*} data - Request data
     * @param {Object} config - Additional configuration
     * @returns {*} Response placeholder
     */
    patch(url, data, config = {}) {
        return this.request({ ...config, method: 'PATCH', url, data });
    }

    /**
     * @method delete
     * @description DELETE request
     * @param {string} url - Request URL
     * @param {Object} config - Additional configuration
     * @returns {*} Response placeholder
     */
    delete(url, config = {}) {
        return this.request({ ...config, method: 'DELETE', url });
    }

    /**
     * @method head
     * @description HEAD request
     * @param {string} url - Request URL
     * @param {Object} config - Additional configuration
     * @returns {*} Response placeholder
     */
    head(url, config = {}) {
        return this.request({ ...config, method: 'HEAD', url });
    }

    /**
     * @method options
     * @description OPTIONS request
     * @param {string} url - Request URL
     * @param {Object} config - Additional configuration
     * @returns {*} Response placeholder
     */
    options(url, config = {}) {
        return this.request({ ...config, method: 'OPTIONS', url });
    }

    // Configuration methods

    /**
     * @method setHeader
     * @description Set default header
     * @param {string} name - Header name
     * @param {string} value - Header value
     * @returns {FXAPIPlugin} This instance for chaining
     */
    setHeader(name, value) {
        this.options.headers[name] = value;
        return this;
    }

    /**
     * @method setHeaders
     * @description Set multiple default headers
     * @param {Object} headers - Headers object
     * @returns {FXAPIPlugin} This instance for chaining
     */
    setHeaders(headers) {
        Object.assign(this.options.headers, headers);
        return this;
    }

    /**
     * @method setBaseURL
     * @description Set base URL for all requests
     * @param {string} baseURL - Base URL
     * @returns {FXAPIPlugin} This instance for chaining
     */
    setBaseURL(baseURL) {
        this.options.baseURL = baseURL;
        return this;
    }

    /**
     * @method setTimeout
     * @description Set request timeout
     * @param {number} timeout - Timeout in milliseconds
     * @returns {FXAPIPlugin} This instance for chaining
     */
    setTimeout(timeout) {
        this.options.timeout = timeout;
        return this;
    }

    /**
     * @method setRetries
     * @description Set retry count for failed requests
     * @param {number} retries - Number of retries
     * @returns {FXAPIPlugin} This instance for chaining
     */
    setRetries(retries) {
        this.options.retries = retries;
        return this;
    }

    /**
     * @method addRequestInterceptor
     * @description Add request interceptor
     * @param {Function} interceptor - Interceptor function
     * @returns {FXAPIPlugin} This instance for chaining
     */
    addRequestInterceptor(interceptor) {
        this.options.interceptors.request.push(interceptor);
        return this;
    }

    /**
     * @method addResponseInterceptor
     * @description Add response interceptor
     * @param {Function} interceptor - Interceptor function
     * @returns {FXAPIPlugin} This instance for chaining
     */
    addResponseInterceptor(interceptor) {
        this.options.interceptors.response.push(interceptor);
        return this;
    }

    /**
     * @method enableCache
     * @description Enable response caching
     * @param {number} ttl - Time to live in milliseconds
     * @returns {FXAPIPlugin} This instance for chaining
     */
    enableCache(ttl = 300000) {
        this.options.cache.enabled = true;
        this.options.cache.ttl = ttl;
        return this;
    }

    /**
     * @method disableCache
     * @description Disable response caching
     * @returns {FXAPIPlugin} This instance for chaining
     */
    disableCache() {
        this.options.cache.enabled = false;
        return this;
    }

    /**
     * @method clearCache
     * @description Clear request cache
     * @returns {FXAPIPlugin} This instance for chaining
     */
    clearCache() {
        this.requestCache.clear();
        return this;
    }

    // Statistics and debugging

    /**
     * @method getStats
     * @description Get API usage statistics
     * @returns {Object} Statistics object
     */
    getStats() {
        return {
            cacheSize: this.requestCache.size,
            pendingRequests: this.pendingRequests.size,
            cacheEnabled: this.options.cache.enabled,
            cacheTTL: this.options.cache.ttl,
            baseURL: this.options.baseURL,
            defaultHeaders: Object.keys(this.options.headers).length,
            interceptors: {
                request: this.options.interceptors.request.length,
                response: this.options.interceptors.response.length
            }
        };
    }
}

// Export as function that creates instance
export default function(fx, options) {
    return new FXAPIPlugin(fx, options);
}

