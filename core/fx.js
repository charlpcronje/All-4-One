/**
 * @file fx.js
 * @description Complete FX Framework - Dynamic, Composable, Isomorphic Runtime
 * 
 * Features:
 * - Dynamic Node Creation with Proxy-based access
 * - Effects System for reactive behaviors
 * - Isomorphic Module Loading (Client/Server)
 * - Serialization/Deserialization (wrap/expand)
 * - ExecutionContext for async management
 * - Resource Factory pattern
 * - Manifest-based configuration
 * - DOM Integration
 * - CSS-like querying
 */

// Node.js-only imports removed for browser compatibility.
// Use browser crypto for UUIDs if available, otherwise fallback.
const randomUUID = (typeof crypto !== 'undefined' && crypto.randomUUID)
  ? () => crypto.randomUUID()
  : () => Math.random().toString(36).slice(2) + Date.now();

// createRequire is only available on the server. Guard with IS_SERVER below.

// Environment Detection
const IS_SERVER = typeof window === 'undefined';
const IS_CLIENT = !IS_SERVER;

// Server-side require helper
let requireSync;
if (typeof window === 'undefined') {
    try {
        // Only import/createRequire if in Node.js
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { createRequire } = require('module');
        requireSync = createRequire(import.meta.url);
    } catch (e) {
        console.warn('FX-WARN: Server-side module loading may be limited.');
        requireSync = () => { throw new Error('requireSync not available.'); };
    }
}

// Client-side module loader with SharedArrayBuffer
class ClientModuleLoader {
    constructor() {
        this.worker = null;
        this.sharedBuffer = null;
        this.lock = null;
        this.initWorker();
    }

    initWorker() {
        if (!IS_CLIENT) return;
        
        try {
            // Check for SharedArrayBuffer support
            if (typeof SharedArrayBuffer === 'undefined') {
                console.warn('FX-WARN: SharedArrayBuffer not available. Module loading will be async.');
                return;
            }

            this.sharedBuffer = new SharedArrayBuffer(1024 * 64); // 64KB
            this.lock = new Int32Array(this.sharedBuffer, 0, 1);

            const workerCode = `
                self.onmessage = (e) => {
                    const { url, id, sharedBuffer } = e.data;
                    const lock = new Int32Array(sharedBuffer, 0, 1);
                    const dataView = new Uint8Array(sharedBuffer, 4);
                    
                    try {
                        const xhr = new XMLHttpRequest();
                        xhr.open('GET', url, false);
                        xhr.send();
                        
                        if (xhr.status >= 200 && xhr.status < 300) {
                            const responseText = xhr.responseText;
                            const encoded = new TextEncoder().encode(responseText);
                            
                            if (encoded.length < dataView.length) {
                                dataView.set(encoded);
                                new Int32Array(sharedBuffer, 4, 1)[0] = encoded.length;
                                Atomics.store(lock, 0, id);
                            } else {
                                Atomics.store(lock, 0, -id); // Signal error - too large
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
            console.warn('FX-WARN: Failed to initialize module loader worker.');
        }
    }

    load(url) {
        if (!this.worker || !this.sharedBuffer) {
            throw new Error('Module loader not available. Use async import instead.');
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

        const dataLength = new Int32Array(this.sharedBuffer, 4, 1)[0];
        const data = new Uint8Array(this.sharedBuffer, 8, dataLength);
        const moduleCode = new TextDecoder().decode(data);
        
        Atomics.store(this.lock, 0, 0);
        return moduleCode;
    }
}

// ExecutionContext for async management
class ExecutionContext {
    constructor() {
        this.taskQueue = [];
        this.isExecuting = false;
        this.sequences = new Map();
        this.cache = new Map();
        this.maxWaitTime = 5000;
    }

    async waitForAll(timeout = this.maxWaitTime) {
        const startTime = Date.now();
        while (this.taskQueue.length > 0 || this.isExecuting) {
            if (Date.now() - startTime > timeout) {
                throw new Error(`ExecutionContext.waitForAll timed out after ${timeout}ms`);
            }
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }

    enqueue(task) {
        this.taskQueue.push(task);
        this.executeNext();
    }

    async executeNext() {
        if (this.taskQueue.length === 0 || this.isExecuting) return;
        
        this.isExecuting = true;
        const task = this.taskQueue.shift();
        
        try {
            await task();
        } catch (error) {
            console.error('Task execution error:', error);
        } finally {
            this.isExecuting = false;
            this.executeNext();
        }
    }

    await(promiseOrValue) {
        return Promise.resolve(promiseOrValue).catch(error => {
            console.error('Error in ExecutionContext.await:', error);
            throw error;
        });
    }

    async runAsync(fn, config = {}) {
        const { sq = 0, cache, retry = 0, cb, sqcb } = config;

        if (!this.sequences.has(sq)) {
            this.sequences.set(sq, Promise.resolve());
        }

        const sequence = this.sequences.get(sq).then(async () => {
            const cacheKey = JSON.stringify({ fn: fn.toString(), config });
            
            if (cache && cache !== 1 && this.cache.has(cacheKey)) {
                const { value, timestamp } = this.cache.get(cacheKey);
                if (cache === 0 || Date.now() - timestamp < cache) {
                    return value;
                }
            }

            let result;
            for (let attempt = 0; attempt <= retry; attempt++) {
                try {
                    result = await fn();
                    break;
                } catch (error) {
                    if (attempt === retry) throw error;
                }
            }

            if (cache && cache !== 1) {
                this.cache.set(cacheKey, { value: result, timestamp: Date.now() });
            }

            if (cb) cb(result);
            if (sqcb !== undefined) {
                this.sequences.get(sqcb)?.then(() => {
                    this.runAsync(() => {}, { sq: sqcb });
                });
            }

            return result;
        });

        this.sequences.set(sq, sequence);
        return sequence;
    }
}

// Global registries
const classRegistry = new Map();
const nodeRegistry = new WeakMap();
const pathRegistry = new WeakMap();

// Utility functions
function guessType(val) {
    if (typeof val === 'string') return 'str';
    if (typeof val === 'number') return 'num';
    if (typeof val === 'boolean') return 'bool';
    if (typeof val === 'function') return 'function';
    if (val !== null && typeof val === 'object' && val.constructor === Object) return 'json';
    return 'text';
}

function getNodePath(node) {
    return pathRegistry.get(node) || '';
}

function setNodePath(node, path) {
    pathRegistry.set(node, path);
}

// FXNode creation
function createNode(parentId = null, path = '') {
    const node = {
        // Core properties
        __id: randomUUID(),
        __parent_id: parentId,
        __effects: [],
        __value: {},
        __nodes: {},
        __type: null,
        __proto: null,
        __watchers: new Set(),
        __processes: new Map(),
        __state: 'idle',

        // Core methods
        set(val) {
            const oldValue = this.val();
            let newType = this.__type;

            fx.triggerEffects(this, 'before.set', 'value', val);

            if (typeof val === 'object' && val !== null && val.constructor !== Object) {
                newType = val.constructor.name;
                this.__proto = newType;
                this.__value[newType] = val;
            } else if (typeof val === 'object' && val !== null) {
                newType = 'json';
                for (const [k, v] of Object.entries(val)) {
                    this[k].set(v);
                }
            } else {
                newType = newType || guessType(val);
                this.__value[newType] = val;
            }

            if (!this.__type) {
                this.__type = newType;
            }

            this.notify(oldValue, this.val());
            fx.triggerEffects(this, 'after.set', 'value', val);
            return this;
        },

        val(def) {
            fx.triggerEffects(this, 'before.get', 'value', undefined);
            
            if (!this.__type) {
                fx.triggerEffects(this, 'after.get', 'value', def);
                return def;
            }

            if (this.__type === 'html' && this.__value.dom) {
                const el = this.__value.dom;
                let value;
                if (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) {
                    value = el.value;
                } else if (['IMG', 'VIDEO', 'AUDIO', 'SOURCE'].includes(el.tagName)) {
                    value = el.src;
                } else {
                    value = el.innerHTML;
                }
                fx.triggerEffects(this, 'after.get', 'value', value);
                return value;
            }

            const value = this.__value[this.__type];
            const result = value !== undefined ? value : def;
            fx.triggerEffects(this, 'after.get', 'value', result);
            return result;
        },

        type(newType) {
            if (newType === undefined) return this.__type;
            this.__type = newType;
            return this;
        },

        inherit(protoNode) {
            this.__proto = (typeof protoNode === 'string') ? fx.$$(protoNode) : protoNode;
            return this;
        },

        // Reactivity
        watch(callback) {
            this.__watchers.add(callback);
            return () => this.__watchers.delete(callback);
        },

        notify(oldValue, newValue) {
            if (oldValue !== newValue) {
                this.__watchers.forEach(cb => {
                    try {
                        cb(newValue, oldValue, this);
                    } catch (error) {
                        console.error('Error in watcher:', error);
                    }
                });
            }
        },

        // Process management
        flow(name, processFn) {
            this.__processes.set(name, processFn);
            return this;
        },

        async execute(name, ...args) {
            const processFn = this.__processes.get(name);
            if (typeof processFn !== 'function') {
                throw new Error(`Process '${name}' not found.`);
            }
            return await processFn.call(this, ...args);
        },

        select(selector) {
            return fx.queryEngine(this, selector);
        },

        // Serialization
        wrap() {
            const output = { 
                __type: this.__type, 
                __state: this.__state,
                __id: this.__id,
                __parent_id: this.__parent_id
            };
            
            if (typeof this.__proto === 'string' && classRegistry.has(this.__proto)) {
                output.__proto = this.__proto;
                output.__type = 'json';
                const instance = this.val();
                const data = {};
                for (const key in instance) {
                    if (Object.prototype.hasOwnProperty.call(instance, key) && typeof instance[key] !== 'function') {
                        data[key] = instance[key];
                    }
                }
                output.__value = JSON.stringify(data);
            } else if (this.__type === 'html' && this.__value.dom && IS_CLIENT) {
                const el = this.__value.dom;
                output.__value = {
                    tagName: el.tagName,
                    attributes: Array.from(el.attributes).reduce((acc, attr) => ({ ...acc, [attr.name]: attr.value }), {}),
                    innerHTML: el.innerHTML
                };
            } else if (this.__type) {
                output.__value = this.val();
            }

            if (Object.keys(this.__nodes).length > 0) {
                output.__nodes = {};
                for (const [key, childNode] of Object.entries(this.__nodes)) {
                    output.__nodes[key] = childNode.wrap();
                }
            }
            
            return output;
        },

        expand(data) {
            this.__type = data.__type;
            this.__state = data.__state || 'idle';
            this.__proto = data.__proto || null;
            this.__id = data.__id || this.__id;
            this.__parent_id = data.__parent_id || this.__parent_id;

            if (data.__proto && classRegistry.has(data.__proto)) {
                const RegisteredClass = classRegistry.get(data.__proto);
                const instance = new RegisteredClass();
                const jsonData = (typeof data.__value === 'string') ? JSON.parse(data.__value) : data.__value;
                Object.assign(instance, jsonData);
                this.set(instance);
            } else if (data.__type === 'html' && IS_CLIENT) {
                const { tagName, attributes, innerHTML } = data.__value;
                const el = document.createElement(tagName);
                for (const [key, value] of Object.entries(attributes)) {
                    el.setAttribute(key, value);
                }
                el.innerHTML = innerHTML;
                this.__value.dom = el;
                this.set({
                    tag: el.tagName.toLowerCase(),
                    id: el.id,
                    class: el.className,
                    text: el.innerText
                });
            } else if (data.__value !== undefined) {
                this.set(data.__value);
            }

            if (data.__nodes) {
                for (const [key, childData] of Object.entries(data.__nodes)) {
                    this[key].expand(childData);
                }
            }
            
            return this;
        }
    };

    setNodePath(node, path);
    return new Proxy(node, nodeHandler);
}

// Node proxy handler
const nodeHandler = {
    get(target, key) {
        if (typeof key === 'symbol' || key === 'then') return undefined;
        if (key in target) return target[key];

        // Trigger effects for property access
        fx.triggerEffects(target, 'before.get', key, undefined);

        const value = target.val();
        if (typeof value === 'object' && value !== null && key in value) {
            const prop = value[key];
            const result = typeof prop === 'function' ? prop.bind(value) : prop;
            fx.triggerEffects(target, 'after.get', key, result);
            return result;
        }

        // Check prototype chain
        let proto = target.__proto;
        if (proto && typeof proto !== 'string') {
            while (proto) {
                if (proto.__nodes && key in proto.__nodes) {
                    const result = proto.__nodes[key];
                    fx.triggerEffects(target, 'after.get', key, result);
                    return result;
                }
                proto = proto.__proto;
            }
        }

        // Create new node if it doesn't exist
        if (!(key in target.__nodes)) {
            const currentPath = getNodePath(target);
            const newPath = currentPath ? `${currentPath}.${key}` : key;
            target.__nodes[key] = createNode(target.__id, newPath);
        }

        const result = target.__nodes[key];
        fx.triggerEffects(target, 'after.get', key, result);
        return result;
    },

    set(target, key, val) {
        if (key in target || typeof key === 'symbol') {
            target[key] = val;
        } else {
            fx.triggerEffects(target, 'before.set', key, val);
            const currentPath = getNodePath(target);
            const newPath = currentPath ? `${currentPath}.${key}` : key;
            target.__nodes[key] = createNode(target.__id, newPath).set(val);
            fx.triggerEffects(target, 'after.set', key, val);
        }
        return true;
    }
};

// Resource factory
function createResourceFactory() {
    return async function resourceFactory(type) {
        // const resourceMap = {
        //     'api': () => import('./fx/APIResource.js'),
        //     'css': () => import('./fx/CSSResource.js'),
        //     'html': () => import('./fx/HTMLResource.js'),
        //     'module': () => import('./fx/ModuleResource.js'),
        //     'json': () => import('./fx/DataResource.js'),
        //     'raw': () => import('./fx/RawResource.js')
        // };

        if (resourceMap[type]) {
            const module = await resourceMap[type]();
            return module.default;
        }
        
        console.error(`Unknown resource type: ${type}`);
        return null;
    };
}

// Query engine for CSS-like selectors
function queryEngine(startNode, selector) {
    const parts = selector.split(/\s+/);
    let currentNodes = [startNode];

    for (const part of parts) {
        const nextNodes = new Set();
        const attrMatch = part.match(/\[\s*([_a-zA-Z0-9]+)\s*(=|!=)\s*"([^"]+)"\s*\]/);
        const nameMatch = part.match(/^([a-zA-Z0-9*_-]+)/);

        for (const node of currentNodes) {
            const children = Object.values(node.__nodes);
            for (const child of children) {
                let matches = true;
                
                if (nameMatch && nameMatch[1] !== '*') {
                    const childPath = getNodePath(child);
                    if (!childPath.endsWith(nameMatch[1])) {
                        matches = false;
                    }
                }
                
                if (attrMatch) {
                    const [_, attr, op, value] = attrMatch;
                    const nodeValue = (typeof child[attr] === 'function') ? child[attr]() : child[attr];
                    if (op === '=' && String(nodeValue) !== value) matches = false;
                    if (op === '!=' && String(nodeValue) === value) matches = false;
                }
                
                if (matches) {
                    nextNodes.add(child);
                }
            }
        }
        currentNodes = Array.from(nextNodes);
    }
    return currentNodes;
}

// Main FX class
class FX {
    static #instance = null;

    constructor() {
        if (FX.#instance) {
            throw new Error("FX is a singleton. Use FX.getInstance() instead.");
        }

        this.root = createNode('root', '');
        this.context = new ExecutionContext();
        this.resourceFactory = createResourceFactory();
        this.moduleLoader = IS_CLIENT ? new ClientModuleLoader() : null;
        this.manifestObj = {};
        this.resources = {};
        this.debug = false;

        return new Proxy(this, {
            get: (target, prop, receiver) => this.handleGet(target, prop, receiver),
            apply: (target, thisArg, args) => this.$$(args[0], args[1])
        });
    }

    static getInstance() {
        if (!FX.#instance) {
            FX.#instance = new FX();
        }
        return FX.#instance;
    }

    handleGet(target, prop, receiver) {
        // Core FX methods and properties
        if (prop in target) {
            return Reflect.get(target, prop, receiver);
        }

        // Delegate to root node for dynamic properties
        return target.root[prop];
    }

    // Effects system
    triggerEffects(node, event, key, value) {
        // Execute effects on current node
        for (const effect of node.__effects) {
            try {
                effect(event, node, key, value);
            } catch (error) {
                console.error(`Effect error on ${event}:`, error);
            }
        }

        // Execute effects from prototype chain
        if (node.__proto && typeof node.__proto !== 'string') {
            this.triggerEffects(node.__proto, event, key, value);
        }
    }

    // Main accessor function
    $$(path, value) {
        if (!path) return this.root;

        let logicalPath = path;
        let manifestPath = null;
        
        if (path.includes('@')) {
            [logicalPath, manifestPath] = path.split('@');
        }

        const keys = logicalPath.split('.');
        let current = this.root;
        
        for (const key of keys) {
            if (!key) continue;
            current = current[key];
        }

        // Handle manifest-based loading
        if (manifestPath && current.__type === null) {
            this.handleManifestLoading(current, manifestPath);
        }

        if (value !== undefined) {
            if (Array.isArray(value)) {
                const fn = current.val();
                return typeof fn === 'function' ? fn(...value) : undefined;
            }
            current.set(value);
        }

        return current;
    }

    handleManifestLoading(node, manifestPath) {
        const manifestNode = this.$$(`__modules.${manifestPath}`).val();
        if (manifestNode) {
            const { location, export: exportKey, type: className } = manifestNode;
            
            let moduleInstance;
            if (IS_SERVER) {
                try {
                    const module = requireSync(location);
                    const ExportedThing = module[exportKey];
                    moduleInstance = new ExportedThing();
                } catch (error) {
                    console.error('Server-side module loading failed:', error);
                    return;
                }
            } else {
                if (this.moduleLoader) {
                    try {
                        this.moduleLoader.load(location);
                        const RegisteredClass = classRegistry.get(className);
                        if (RegisteredClass) {
                            moduleInstance = new RegisteredClass();
                        } else {
                            throw new Error(`Client module '${className}' not found in registry.`);
                        }
                    } catch (error) {
                        console.error('Client-side module loading failed:', error);
                        return;
                    }
                }
            }
            
            if (moduleInstance) {
                node.set(moduleInstance);
            }
        }
    }

    // DOM integration
    $(selector) {
        if (!IS_CLIENT) {
            console.warn("DOM selector '$' called in non-browser environment.");
            return null;
        }

        const elements = Array.from(document.querySelectorAll(selector));
        if (elements.length === 0) return null;

        const wrapElement = (el) => {
            const node = createNode();
            node.type('html');
            node.__value.dom = el;
            node.set({
                tag: el.tagName.toLowerCase(),
                id: el.id,
                class: el.className,
                text: el.innerText
            });
            return node;
        };

        const nodes = elements.map(wrapElement);
        return nodes.length === 1 ? nodes[0] : nodes;
    }

    // CSS-like querying
    $$$(selector) {
        return queryEngine(this.root, selector);
    }

    // Utility methods
    register(classObj, name) {
        classRegistry.set(name || classObj.name, classObj);
        return this;
    }

    createNode(parentId, path) {
        return createNode(parentId, path);
    }

    select(selector) {
        return this.$$$(selector);
    }

    query(selector) {
        return this.$$$(selector);
    }

    // Serialization
    wrap() {
        return this.root.wrap();
    }

    expand(data) {
        return this.root.expand(data);
    }

    // Configuration
    fx(config = {}) {
        const processedConfig = this.processConfig(config);
        
        return new Proxy(this, {
            get: (target, prop) => {
                if (prop in target) {
                    const value = target[prop];
                    if (typeof value === 'function') {
                        return (...args) => this.context.runAsync(() => value.apply(target, args), processedConfig);
                    }
                    return value;
                }
                return target.root[prop];
            }
        });
    }

    processConfig(config) {
        if (typeof config !== 'object' || config === null) {
            config = { sq: config };
        }
        return {
            sq: config.sq ?? 0,
            retry: config.retry ?? 0,
            cache: config.cache ?? 1,
            cb: config.cb,
            sqcb: config.sqcb,
            ...config
        };
    }

    // Manifest loading
    async loadManifest(manifestObj, prefix = '') {
        for (const [key, value] of Object.entries(manifestObj)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            
            if (typeof value === 'function') {
                const loadedValue = await this.context.await(value());
                await this.loadManifest(loadedValue, fullKey);
            } else if (typeof value === 'object' && value !== null && !value.type) {
                let current = this.manifestObj;
                const parts = fullKey.split('.');
                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i];
                    if (i === parts.length - 1) {
                        current[part] = value;
                    } else {
                        current[part] = current[part] || {};
                        current = current[part];
                    }
                }
                await this.loadManifest(value, fullKey);
            } else {
                let current = this.manifestObj;
                const parts = fullKey.split('.');
                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i];
                    if (i === parts.length - 1) {
                        current[part] = value;
                    } else {
                        current[part] = current[part] || {};
                        current = current[part];
                    }
                }
                
                const resource = await this.createResource(value, fullKey);
                if (resource !== null) {
                    this.resources[fullKey] = resource;
                }
            }
        }
    }

    async createResource(config, fullKey) {
        if (typeof config !== 'object' || config === null || !config.type) {
            return null;
        }

        try {
            const ResourceClass = await this.resourceFactory(config.type);
            if (!ResourceClass) {
                console.error(`Resource class not found for type: ${config.type}`);
                return null;
            }
            return new ResourceClass(config, this.context);
        } catch (error) {
            console.error(`Error creating resource for ${fullKey}:`, error);
            return null;
        }
    }

    // Helper methods
    set(key, value) {
        return this.$$(key, value);
    }

    get(key, defaultValue) {
        const node = this.$$(key);
        return node ? node.val(defaultValue) : defaultValue;
    }

    data(key, value) {
        if (arguments.length === 1) {
            return this.get(key);
        }
        return this.set(key, value);
    }

    async waitForAll(timeout) {
        return this.context.waitForAll(timeout);
    }
}

// Helper function for adding effects
function $effect(node, effectFunction) {
    node.__effects.push(effectFunction);
    return node;
}

// Create and export the FX instance
const fx = FX.getInstance();

// Global exports (optional - can be removed if not desired)
if (typeof globalThis !== 'undefined') {
    globalThis.$$ = fx.$$;
    globalThis.$ = fx.$;
    globalThis.$$$ = fx.$$$;
    globalThis.$effect = $effect;
}

export { fx, FX, $effect };
export default fx;
