/**
 * @file $fxjs
 * @description Complete FX Framework Implementation - Corrected & Comprehensive
 * 
 * Features:
 * - Single proxy pattern for root node
 * - Centralized logic in FXCore methods
 * - Original property names (__nodes, __proto, __effects)
 * - $effect system implementation
 * - Complete API plugin with headers/methods
 * - Value-first traversal with type-switched behavior
 * - Universal plugin system
 */

// Environment Detection
const IS_SERVER = typeof window === 'undefined';
const IS_CLIENT = !IS_SERVER;
const IS_DEV = IS_CLIENT ? (location.hostname === 'localhost' || location.hostname === '127.0.0.1') : (process.env.NODE_ENV === 'development');

// UUID Generation
const randomUUID = (typeof crypto !== 'undefined' && crypto.randomUUID)
  ? () => crypto.randomUUID()
  : () => Math.random().toString(36).slice(2) + Date.now();

// Server-side require helper
let requireSync;
if (IS_SERVER) {
    try {
        const { createRequire } = require('module');
        requireSync = createRequire(import.meta.url);
    } catch (e) {
        requireSync = () => { throw new Error('requireSync not available.'); };
    }
}

/**
 * @class SyncModuleLoader
 * @description Synchronous module loader using SharedArrayBuffer
 */
class SyncModuleLoader {
    constructor() {
        this.worker = null;
        this.sharedBuffer = null;
        this.lock = null;
        this.moduleCache = new Map();
        this.initWorker();
    }

    initWorker() {
        if (!IS_CLIENT) return;
        
        try {
            if (typeof SharedArrayBuffer === 'undefined') {
                console.warn('FX: SharedArrayBuffer not available. Add headers: Cross-Origin-Opener-Policy: same-origin, Cross-Origin-Embedder-Policy: require-corp');
                return;
            }

            this.sharedBuffer = new SharedArrayBuffer(1024 * 1024);
            this.lock = new Int32Array(this.sharedBuffer, 0, 1);
            this.dataLength = new Int32Array(this.sharedBuffer, 4, 1);
            this.dataView = new Uint8Array(this.sharedBuffer, 8);

            const workerCode = `
                let moduleCache = new Map();
                self.onmessage = (e) => {
                    const { url, id, sharedBuffer } = e.data;
                    const lock = new Int32Array(sharedBuffer, 0, 1);
                    const dataLength = new Int32Array(sharedBuffer, 4, 1);
                    const dataView = new Uint8Array(sharedBuffer, 8);
                    
                    try {
                        if (moduleCache.has(url)) {
                            const cached = moduleCache.get(url);
                            const encoded = new TextEncoder().encode(cached);
                            if (encoded.length < dataView.length) {
                                dataView.set(encoded);
                                dataLength[0] = encoded.length;
                                Atomics.store(lock, 0, id);
                                Atomics.notify(lock, 0);
                                return;
                            }
                        }
                        
                        const xhr = new XMLHttpRequest();
                        xhr.open('GET', url, false);
                        xhr.send();
                        
                        if (xhr.status >= 200 && xhr.status < 300) {
                            const moduleCode = xhr.responseText;
                            moduleCache.set(url, moduleCode);
                            
                            const encoded = new TextEncoder().encode(moduleCode);
                            if (encoded.length < dataView.length) {
                                dataView.set(encoded);
                                dataLength[0] = encoded.length;
                                Atomics.store(lock, 0, id);
                            } else {
                                Atomics.store(lock, 0, -id);
                            }
                        } else {
                            Atomics.store(lock, 0, -id);
                        }
                    } catch (err) {
                        Atomics.store(lock, 0, -id);
                    }
                    Atomics.notify(lock, 0);
                };
            `;

            const blob = new Blob([workerCode], { type: 'application/javascript' });
            this.worker = new Worker(URL.createObjectURL(blob));
        } catch (e) {
            console.warn('FX: Failed to initialize sync module loader:', e.message);
        }
    }

    loadSync(url) {
        if (!this.worker || !this.sharedBuffer) {
            throw new Error('Sync module loader not available');
        }

        if (this.moduleCache.has(url)) {
            return this.moduleCache.get(url);
        }

        const id = Date.now() + Math.random();
        this.worker.postMessage({ url, id, sharedBuffer: this.sharedBuffer });

        const result = Atomics.wait(this.lock, 0, 0, 10000);
        
        if (result === 'timed-out') {
            throw new Error(`Module loading timed out: ${url}`);
        }

        const signal = Atomics.load(this.lock, 0);
        if (signal === -id) {
            throw new Error(`Failed to load module: ${url}`);
        }

        const dataLength = this.dataLength[0];
        const data = new Uint8Array(dataLength);
        data.set(this.dataView.subarray(0, dataLength));
        const moduleCode = new TextDecoder().decode(data);
        
        Atomics.store(this.lock, 0, 0);
        this.moduleCache.set(url, moduleCode);
        
        return moduleCode;
    }

    evaluateModule(code, url) {
        try {
            const module = { exports: {} };
            const exports = module.exports;
            
            const moduleFunction = new Function('module', 'exports', 'require', code);
            
            const requireFn = (path) => {
                if (path.startsWith('./') || path.startsWith('../')) {
                    const resolvedUrl = new URL(path, url).href;
                    const depCode = this.loadSync(resolvedUrl);
                    return this.evaluateModule(depCode, resolvedUrl);
                }
                throw new Error(`Cannot resolve module: ${path}`);
            };
            
            moduleFunction.call(exports, module, exports, requireFn);
            return module.exports.default || module.exports;
        } catch (error) {
            console.error('FX: Failed to evaluate module:', error);
            throw error;
        }
    }
}

/**
 * @class PluginManager
 * @description Manages plugin lifecycle and access
 */
class PluginManager {
    constructor(fx) {
        this.fx = fx;
        this.plugins = new Map();
        this.pluginConfigs = new Map();
        this.loadedPlugins = new Map();
        this.globalRegistry = new Map();
        this.prefixRegistry = new Map();
    }

    register(name, path, config = {}) {
        try {
            let PluginClass;
            if (IS_CLIENT && this.fx.moduleLoader) {
                const moduleCode = this.fx.moduleLoader.loadSync(path);
                const moduleExport = this.fx.moduleLoader.evaluateModule(moduleCode, path);
                PluginClass = moduleExport.default || moduleExport;
            } else if (IS_SERVER) {
                const module = requireSync(path);
                PluginClass = module.default || module;
            } else {
                throw new Error('Module loader not available');
            }

            if (typeof PluginClass !== 'function') {
                throw new Error(`Plugin ${name} must export a class or constructor function`);
            }

            const pluginInstance = new PluginClass(this.fx, config.options || {});
            pluginInstance.name = pluginInstance.name || name;

            this.plugins.set(name, PluginClass);
            this.pluginConfigs.set(name, config);
            this.loadedPlugins.set(name, pluginInstance);

            if (config.global) {
                this.registerGlobal(config.global, pluginInstance);
            }

            if (config.prefix) {
                this.registerPrefix(config.prefix, pluginInstance);
            } else if (!config.global) {
                this.registerPrefix(name, pluginInstance);
            }

            console.log(`FX: Plugin ${name} registered successfully`);
            return pluginInstance;

        } catch (error) {
            console.error(`FX: Failed to register plugin ${name}:`, error);
            throw error;
        }
    }

    registerGlobal(globalName, pluginInstance) {
        if (typeof globalThis !== 'undefined') {
            globalThis[globalName] = pluginInstance;
            this.globalRegistry.set(globalName, pluginInstance);
        }
    }

    registerPrefix(prefix, pluginInstance) {
        this.prefixRegistry.set(prefix, pluginInstance);
    }

    getPlugin(name) {
        return this.loadedPlugins.get(name) || null;
    }

    getByPrefix(prefix) {
        return this.prefixRegistry.get(prefix) || null;
    }
}

// Global registries
const classRegistry = new Map();

/**
 * @function guessType
 * @description Guess the type of a value
 * @param {*} val - Value to analyze
 * @returns {string} Type string
 */
function guessType(val) {
    if (typeof val === 'string') return 'str';
    if (typeof val === 'number') return 'num';
    if (typeof val === 'boolean') return 'bool';
    if (typeof val === 'function') return 'function';
    if (val !== null && typeof val === 'object') {
        if (val.constructor === Object) return 'json';
        return val.constructor.name;
    }
    return 'text';
}

/**
 * @class FXCore
 * @description Core FX implementation with centralized logic
 */
class FXCore {
    static #instance = null;

    constructor() {
        if (FXCore.#instance) {
            throw new Error("FX is a singleton. Use FXCore.getInstance() instead.");
        }

        // Initialize core properties
        this.moduleLoader = IS_CLIENT ? new SyncModuleLoader() : null;
        this.pluginManager = new PluginManager(this);
        this.debug = IS_DEV;

        // Initialize root node with all required properties
        this.root = {
            __id: randomUUID(),
            __parent_id: null,
            __nodes: {},
            __value: {},
            __type: null,
            __proto: [],
            __effects: [],
            __watchers: new Set(),
            __instances: new Map()
        };

        console.log('FX: Framework initialized');

        // Return single proxy for entire system
        return new Proxy(this, {
            get: (target, prop, receiver) => this.handleGet(target, prop, receiver),
            set: (target, prop, value) => this.handleSet(target, prop, value),
            apply: (target, thisArg, args) => this.$$(args[0], args[1])
        });
    }

    static getInstance() {
        if (!FXCore.#instance) {
            FXCore.#instance = new FXCore();
        }
        return FXCore.#instance;
    }

    /**
     * @method handleGet
     * @description Central get handler - implements value-first traversal
     * @param {Object} target - Target object
     * @param {string} prop - Property name
     * @param {Object} receiver - Proxy receiver
     * @returns {*} Property value
     */
    handleGet(target, prop, receiver) {
        // Core FX methods and properties
        if (prop in target) {
            return target[prop];
        }

        // Check for plugin prefix access
        const plugin = this.pluginManager.getByPrefix(prop);
        if (plugin) {
            return plugin;
        }
        
        // Auto-create global proxy for direct top-level paths
        if (prop.indexOf('.') === -1 && typeof globalThis !== 'undefined') {
            // Check if we should create global access for this path
            this.createGlobalAccessForPath(prop);
        }

        // Delegate to root node resolution
        return this.resolvePath(prop, this.root);
    }
    
    /**
     * @method createGlobalAccessForPath
     * @description Creates a global variable for direct node access with $$ prefix
     * @param {string} path - Path to create global access for
     */
    createGlobalAccessForPath(path) {
        // Skip if path contains dots (it's not a top-level path)
        if (path.indexOf('.') !== -1) return;
        
        // Skip if it already exists on globalThis
        if ('$$' + path in globalThis) return;
        
        // Create global access for this path
        try {
            Object.defineProperty(globalThis, '$$' + path, {
                get: () => {
                    return this.$$(path);
                },
                set: (value) => {
                    this.$$(path, value);
                    return value;
                },
                configurable: true
            });
        } catch (e) {
            // Some property names can't be defined, silently ignore
            console.warn(`FX: Couldn't create global access for ${path}: ${e.message}`);
        }
    }

    /**
     * @method handleSet
     * @description Central set handler
     * @param {Object} target - Target object
     * @param {string} prop - Property name
     * @param {*} value - Value to set
     * @returns {boolean} Success status
     */
    handleSet(target, prop, value) {
        if (prop in target) {
            target[prop] = value;
            return true;
        }

        // Create/update path on root
        this.setPath(prop, value, this.root);
        return true;
    }

    /**
     * @method $$
     * @description Main accessor function with sync plugin loading
     * @param {string} path - Path to access/set
     * @param {*} value - Value to set (optional)
     * @returns {*} Node or value
     */
    $$(path, value) {
        if (!path) return this.createNodeProxy(this.root);

        // Handle plugin loading syntax: prefix@path
        if (path.includes('@')) {
            const [prefix, pluginPath] = path.split('@');
            return {
                plugin: (config = {}) => {
                    config.prefix = config.prefix || prefix;
                    return this.pluginManager.register(prefix, pluginPath, config);
                }
            };
        }

        // Handle set operation
        if (value !== undefined) {
            if (Array.isArray(value)) {
                // Function call syntax
                const node = this.resolvePath(path, this.root);
                const fn = this.val(node);
                return typeof fn === 'function' ? fn(...value) : undefined;
            }
            this.setPath(path, value, this.root);
            return this;
        }

        // Handle get operation
        const node = this.resolvePath(path, this.root);
        return node ? this.createNodeProxy(node) : undefined;
    }

    /**
     * @method resolvePath
     * @description CORRECTED: Resolve a path following value-first traversal logic
     * @param {string} path - Path to resolve
     * @param {Object} startNode - Starting node
     * @returns {*} Resolved value OR node (for further traversal)
     */
    resolvePath(path, startNode) {
        if (!path) return startNode;

        const keys = path.split('.');
        let current = startNode;

        for (const key of keys) {
            if (!key) continue;

            // 1. Check for built-in methods
            if (this.isBuiltinMethod(key)) {
                return this.getBuiltinMethod(key, current);
            }

            // 2. Check active behavior (class instance methods/properties)
            if (current.__type && current.__instances.has(current.__type)) {
                const instance = current.__instances.get(current.__type);
                if (key in instance) {
                    const value = instance[key];
                    return typeof value === 'function' ? value.bind(instance) : value;
                }
            }

            // 3. Check JSON value - BUT CONTINUE TRAVERSAL
            if (current.__type === 'json' && current.__value.json && key in current.__value.json) {
                // For JSON values, we should check if there's a sub-node for further traversal
                // If this is the last key, return the JSON property value
                // If not the last key, look for sub-node
                const isLastKey = keys.indexOf(key) === keys.length - 1;
                
                if (isLastKey) {
                    return current.__value.json[key];
                } else if (current.__nodes && current.__nodes[key]) {
                    current = current.__nodes[key];
                    continue;
                } else {
                    // No sub-node for further traversal
                    return current.__value.json[key];
                }
            }

            // 4. Check sub-nodes
            if (current.__nodes && current.__nodes[key]) {
                current = current.__nodes[key];
                continue;
            }

            // 5. Path not found
            return undefined;
        }

        // Return the final node (caller will extract value if needed)
        return current;
    }

    /**
     * @method setPath
     * @description Set a value at a path, creating nodes as needed
     * @param {string} path - Path to set
     * @param {*} value - Value to set
     * @param {Object} startNode - Starting node
     */
    setPath(path, value, startNode) {
        const keys = path.split('.');
        let current = startNode;

        // Navigate/create path except for last key
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!key) continue;

            if (!current.__nodes[key]) {
                current.__nodes[key] = this.createNode(current.__id);
            }
            current = current.__nodes[key];
        }

        // Set value on final node
        const finalKey = keys[keys.length - 1];
        if (!current.__nodes[finalKey]) {
            current.__nodes[finalKey] = this.createNode(current.__id);
        }

        this.set(current.__nodes[finalKey], value);
    }

    /**
     * @method createNode
     * @description Create a new FX node
     * @param {string} parentId - Parent node ID
     * @returns {Object} New node
     */
    createNode(parentId = null) {
        return {
            __id: randomUUID(),
            __parent_id: parentId,
            __nodes: {},
            __value: {},
            __type: null,
            __proto: [],
            __effects: [],
            __watchers: new Set(),
            __instances: new Map()
        };
    }

    /**
     * @method set
     * @description CORRECTED: Set a value on a node with proper type handling
     * @param {Object} node - Target node
     * @param {*} value - Value to set
     */
    set(node, value) {
        const oldValue = this.val(node);
        
        // Trigger before effects
        this.triggerEffects(node, 'before.set', 'value', value);

        // CORRECTED: Determine type and handle accordingly
        if (value !== null && typeof value === 'object' && value.constructor !== Object) {
            // Class instance
            const className = value.constructor.name;
            node.__type = className;
            if (!node.__proto.includes(className)) {
                node.__proto.push(className);
            }
            node.__instances.set(className, value);
            // IMPORTANT: Don't store in __value for instances
        } 
        else if (typeof value === 'object' && value !== null) {
            // Plain object - expand into sub-nodes AND store in __value
            node.__type = 'json';
            node.__value.json = { ...value };
            
            // Create sub-nodes for each property
            for (const [key, val] of Object.entries(value)) {
                if (!node.__nodes[key]) {
                    node.__nodes[key] = this.createNode(node.__id);
                }
                this.set(node.__nodes[key], val);
            }
        } 
        else {
            // Primitive value
            const type = guessType(value);
            node.__type = type;
            node.__value[type] = value;
            
            // Auto-convert to other types
            if (type === 'num') {
                node.__value.str = String(value);
                node.__value.bool = Boolean(value);
            } else if (type === 'str') {
                const num = parseFloat(value);
                if (!isNaN(num)) node.__value.num = num;
                node.__value.bool = Boolean(value);
            } else if (type === 'bool') {
                node.__value.str = String(value);
                node.__value.num = value ? 1 : 0;
            }
        }

        // Notify watchers
        node.__watchers.forEach(callback => {
            try {
                callback(this.val(node), oldValue, node);
            } catch (error) {
                console.error('FX: Error in watcher:', error);
            }
        });

        // Trigger after effects
        this.triggerEffects(node, 'after.set', 'value', value);
    }

    /**
     * @method val
     * @description CORRECTED: Get the value of a node - returns the ACTUAL stored value
     * @param {Object} node - Target node
     * @param {*} defaultValue - Default value if none set
     * @returns {*} The actual stored value (instance, object, primitive)
     */
    val(node, defaultValue) {
        if (!node.__type) return defaultValue;

        // Trigger before effects
        this.triggerEffects(node, 'before.get', 'value', undefined);

        let result;
        
        // For class instances, return the actual instance
        if (node.__instances.has(node.__type)) {
            result = node.__instances.get(node.__type);
        } 
        // For all other types, return the stored value
        else {
            result = node.__value[node.__type];
        }

        const finalResult = result !== undefined ? result : defaultValue;
        
        // Trigger after effects
        this.triggerEffects(node, 'after.get', 'value', finalResult);
        
        return finalResult;
    }

    /**
     * @method createNodeProxy
     * @description Create a proxy for a node - THIS IS THE KEY METHOD
     * @param {Object} node - Node to proxy
     * @returns {Proxy} Node proxy that handles get/set operations
     */
    createNodeProxy(node) {
        return new Proxy(node, {
            get: (target, key) => {
                // Built-in methods
                if (key === 'val') {
                    return (value) => {
                        if (arguments.length === 0) {
                            return this.val(target);
                        } else {
                            this.set(target, value);
                            return this.createNodeProxy(target);
                        }
                    };
                }

                if (key === 'set') {
                    return (value) => {
                        this.set(target, value);
                        return this.createNodeProxy(target);
                    };
                }
                
                if (key === 'node') {
                    return () => {
                        // Return the raw node
                        return target;
                    };
                }
                
                if (key === 'proxy') {
                    return () => {
                        // Return a fresh proxy for this node
                        return this.createNodeProxy(target);
                    };
                }

                if (key === 'type') {
                    return (newType) => {
                        if (arguments.length === 0) {
                            return target.__type;
                        } else {
                            target.__type = newType;
                            return this.createNodeProxy(target);
                        }
                    };
                }

                if (key === 'watch') {
                    return (callback) => {
                        target.__watchers.add(callback);
                        return () => target.__watchers.delete(callback);
                    };
                }

                if (key === 'inherit') {
                    return (protoName) => {
                        if (!target.__proto.includes(protoName)) {
                            target.__proto.push(protoName);
                        }
                        return this.createNodeProxy(target);
                    };
                }

                // Internal properties
                if (typeof key === 'string' && key.startsWith('__')) {
                    return target[key];
                }

                // CORRECTED: Use resolvePath for property access
                const resolved = this.resolvePath(key, target);
                
                // If resolved is a node, return its VALUE not a proxy
                if (resolved && resolved.__id) {
                    return this.val(resolved);
                }
                
                return resolved;
            },

            set: (target, key, value) => {
                if (typeof key === 'string' && key.startsWith('__')) {
                    target[key] = value;
                    return true;
                }

                this.setPath(key, value, target);
                return true;
            }
        });
    }

    /**
     * @method isBuiltinMethod
     * @description Check if a key is a built-in method
     * @param {string} key - Key to check
     * @returns {boolean} Is built-in method
     */
    isBuiltinMethod(key) {
        return ['val', 'set', 'type', 'watch', 'inherit'].includes(key);
    }

    /**
     * @method getBuiltinMethod
     * @description Get a built-in method bound to a node
     * @param {string} method - Method name
     * @param {Object} node - Target node
     * @returns {Function} Bound method
     */
    getBuiltinMethod(method, node) {
        switch (method) {
            case 'val':
                return (value) => arguments.length === 0 ? this.val(node) : this.set(node, value);
            case 'set':
                return (value) => this.set(node, value);
            case 'type':
                return (newType) => arguments.length === 0 ? node.__type : (node.__type = newType);
            case 'watch':
                return (callback) => {
                    node.__watchers.add(callback);
                    return () => node.__watchers.delete(callback);
                };
            case 'inherit':
                return (protoName) => {
                    if (!node.__proto.includes(protoName)) {
                        node.__proto.push(protoName);
                    }
                    return this.createNodeProxy(node);
                };
            default:
                return undefined;
        }
    }

    /**
     * @method triggerEffects
     * @description Trigger effects on a node
     * @param {Object} node - Target node
     * @param {string} event - Event type
     * @param {string} key - Property key
     * @param {*} value - Property value
     */
    triggerEffects(node, event, key, value) {
        // Execute effects on current node
        for (const effect of node.__effects) {
            try {
                effect(event, node, key, value);
            } catch (error) {
                console.error(`FX: Effect error on ${event}:`, error);
            }
        }

        // Execute effects from prototype chain
        for (const protoName of node.__proto) {
            if (node.__instances.has(protoName)) {
                const instance = node.__instances.get(protoName);
                if (instance.__effects) {
                    for (const effect of instance.__effects) {
                        try {
                            effect(event, node, key, value);
                        } catch (error) {
                            console.error(`FX: Proto effect error on ${event}:`, error);
                        }
                    }
                }
            }
        }
    }

    /**
     * @method $
     * @description DOM selector (requires DOM plugin)
     * @param {string} selector - CSS selector
     * @returns {*} DOM element(s) or null
     */
    $(selector) {
        const domPlugin = this.pluginManager.getByPrefix('dom');
        if (domPlugin && domPlugin.$) {
            return domPlugin.$(selector);
        }
        
        console.warn('FX: DOM plugin not loaded. Use $$("dom@/plugins/fx-dom.js").plugin() to enable DOM features');
        return null;
    }

    /**
     * @method #
     * @description Query FX nodes with CSS-like selectors
     * @param {string} selector - FX node selector
     * @returns {Array} Matching nodes
     */
    '#'(selector) {
        const results = [];
        this.queryNodes(this.root, selector, results);
        return results.map(node => this.createNodeProxy(node));
    }

    /**
     * @method queryNodes
     * @description Recursively query nodes
     * @param {Object} node - Starting node
     * @param {string} selector - Selector string
     * @param {Array} results - Results array
     */
    queryNodes(node, selector, results) {
        // Simple implementation - can be enhanced
        if (selector === '*') {
            results.push(node);
        } else if (selector.startsWith('[__type="') && selector.endsWith('"]')) {
            const type = selector.slice(9, -2);
            if (node.__type === type) {
                results.push(node);
            }
        }

        // Recurse through child nodes
        for (const child of Object.values(node.__nodes)) {
            this.queryNodes(child, selector, results);
        }
    }

    /**
     * @method register
     * @description Register a class for use in the system
     * @param {Function} classObj - Class to register
     * @param {string} name - Name to register under
     * @returns {FXCore} This instance for chaining
     */
    register(classObj, name) {
        classRegistry.set(name || classObj.name, classObj);
        console.log(`FX: Class ${name || classObj.name} registered`);
        return this;
    }
}

/**
 * @function $effect
 * @description Add an effect to a node
 * @param {Object} node - Target node
 * @param {Function} effectFunction - Effect function
 * @returns {Object} The node
 */
function $effect(node, effectFunction) {
    if (node.__effects) {
        node.__effects.push(effectFunction);
    }
    return node;
}

// Create and export the FX instance
const fx = FXCore.getInstance();

/**
 * @function $val
 * @description Global helper to access or set a value at a path
 * @param {string} path - Path to access
 * @param {*} value - Optional value to set
 * @param {*} defaultValue - Default value if none exists
 * @returns {*} Value at path
 */
function $val(path, value = undefined, defaultValue = undefined) {
    if (value === undefined) {
        return $$?.(path)?.val(defaultValue);
    }
    return $$?.(path)?.val(value);
}

/**
 * @function $set
 * @description Global helper to set a value at a path
 * @param {string} path - Base path
 * @param {string} key - Property to set
 * @param {*} value - Value to set
 * @returns {*} Updated node
 */
function $set(path, key, value) {
    return $$?.(path)?.set(key, value);
}

/**
 * @function $get
 * @description Global helper to get a value at a path
 * @param {string} path - Base path
 * @param {string} key - Property to get
 * @param {*} defaultValue - Default value if none exists
 * @returns {*} Value at path.key
 */
function $get(path, key, defaultValue = undefined) {
    return $$?.(path)?.get?.(key, defaultValue) ?? defaultValue;
}

/**
 * @function $type
 * @description Global helper to check node type
 * @param {string} path - Path to node
 * @param {string} interface - Type/interface to check
 * @param {object} defaultValue - Default value if no match
 * @returns {*} Instance matching interface or default
 */
function $type(path, interface_, defaultValue) {
    return $$?.(path)?.type?.(interface_) ?? defaultValue;
}

/**
 * @function $has
 * @description Global helper to check if a node has a property
 * @param {string} path - Path to check
 * @returns {boolean} True if exists
 */
function $has(path) {
    return !!$$(path);
}

/**
 * @function $if
 * @description Global helper for conditional execution on a node
 * @param {string} path - Path to check
 * @param {Function} callback - Callback to execute if path exists
 */
function $if(path, callback) {
    const node = $$(path);
    if (node) {
        callback(node);
    }
}

/**
 * @function $root
 * @description Global helper to create direct node proxy access
 * @param {string} path - Path to the node
 * @returns {Object} The node proxy that can be assigned to a global variable
 */
function $root(path) {
    return $$(path);
}

/**
 * @function createGlobalNodeAccess
 * @description Creates a global variable proxy for direct node access without dot notation using $$ prefix
 * @param {string} name - Name of the node to expose globally
 */
function createGlobalNodeAccess(name) {
    if (typeof globalThis !== 'undefined') {
        Object.defineProperty(globalThis, '$$' + name, {
            get: function() {
                return $$(name);
            },
            set: function(value) {
                $$(name, value);
                return value;
            },
            configurable: true
        });
    }
}

/**
 * @function enhancedDOMSelector
 * @description Enhanced DOM selector with shortcuts for common selectors
 * @param {string} selector - CSS selector or shortcut
 * @returns {Element|NodeList} DOM element(s)
 */
function enhancedDOMSelector(selector) {
    // If it's a function reference directly, pass through to original $ function
    if (typeof selector === 'function' || typeof selector === 'object') {
        return fx.$(selector);
    }
    
    // Handle shortcuts
    if (typeof selector === 'string') {
        // Handle common element shortcuts (like $body instead of $("body"))
        if (/^[a-z]+$/i.test(selector)) {
            return document.querySelector(selector);
        }
        
        // Handle ID shortcuts ($#elementId instead of $("#elementId"))
        if (selector.startsWith('#')) {
            return document.getElementById(selector.substring(1));
        }
        
        // Handle class shortcuts ($.className instead of $(".className"))
        if (selector.startsWith('.')) {
            return document.getElementsByClassName(selector.substring(1));
        }
    }
    
    // Fall back to original $ function
    return fx.$(selector);
}

// Global exports correction
if (typeof globalThis !== 'undefined') {
    const fx = FXCore.getInstance();
    
    // Core FX functions
    globalThis.$$ = fx.createNodeProxy(fx.root);  // $$ points to ROOT NODE PROXY
    globalThis['#'] = fx['#'];
    globalThis.$effect = $effect;
    
    // Enhanced $ function with shortcuts
    globalThis.$ = enhancedDOMSelector;
    
    // Add global helper methods
    globalThis.$val = $val;
    globalThis.$set = $set;
    globalThis.$get = $get;
    globalThis.$type = $type;
    globalThis.$has = $has;
    globalThis.$if = $if;
    globalThis.$root = $root;
    
    // Add the global node access creator
    globalThis.createGlobalNodeAccess = createGlobalNodeAccess;
}

export { fx, FXCore, $effect, $val, $set, $get, $type, $has, $if, $root, createGlobalNodeAccess, enhancedDOMSelector };
export default fx;

