// fx-components.js
/**
 * @file fx-components.js
 * @description Clean FX Components Plugin with File System Support
 */

class FXLogger {
    static log(level, message, data = {}) {
        console.log(`[FX-COMP:${level.toUpperCase()}]`, message, data);
    }
    static error(message, error) { this.log('error', message, { error }); }
    static warn(message, data) { this.log('warn', message, data); }
    static info(message, data) { this.log('info', message, data); }
}

/**
 * @class FXCFileParser
 * @description Enhanced parser for .fxc files with better syntax
 */
class FXCFileParser {
    static parse(content, filePath) {
        try {
            const parsed = {
                metadata: this.parseMetadata(content),
                types: new Map(),
                globalSections: this.parseGlobalSections(content)
            };
            
            // Parse type-specific sections
            this.parseTypeSections(content, parsed.types);
            
            return parsed;
        } catch (error) {
            FXLogger.error(`Failed to parse FXC file: ${filePath}`, error);
            throw error;
        }
    }

    static parseMetadata(content) {
        const metadataMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (!metadataMatch) return {};
        
        try {
            // Simple YAML-like parser
            const lines = metadataMatch[1].split('\n');
            const metadata = {};
            let currentKey = null;
            
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) continue;
                
                if (line.startsWith('  ') && currentKey) {
                    // Nested value
                    const [key, value] = trimmed.split(':').map(s => s.trim());
                    if (!metadata[currentKey]) metadata[currentKey] = {};
                    metadata[currentKey][key] = this.parseValue(value);
                } else {
                    // Top-level key
                    const [key, value] = trimmed.split(':').map(s => s.trim());
                    currentKey = key;
                    metadata[key] = value ? this.parseValue(value) : {};
                }
            }
            
            return metadata;
        } catch (error) {
            FXLogger.warn('Failed to parse metadata, using defaults');
            return {};
        }
    }

    static parseValue(value) {
        if (!value) return null;
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (/^\d+$/.test(value)) return parseInt(value);
        if (/^\d*\.\d+$/.test(value)) return parseFloat(value);
        return value;
    }

    static parseGlobalSections(content) {
        const sections = {};
        
        // Parse global sections (not type-specific)
        const globalSectionRegex = /<(style|script|template|morphing|api)(?:\s+([^>]*))?>([^]*?)<\/\1>/g;
        let match;
        
        while ((match = globalSectionRegex.exec(content)) !== null) {
            const [, sectionType, attrs, sectionContent] = match;
            sections[sectionType] = {
                content: sectionContent.trim(),
                attributes: this.parseAttributes(attrs || '')
            };
        }
        
        return sections;
    }

    static parseTypeSections(content, typesMap) {
        // Parse type:name:section syntax
        const typeSectionRegex = /<type:([^:>]+)(?::([^>]+))?(?:\s+([^>]*))?>([^]*?)<\/type:\1(?::\2)?>/g;
        let match;
        
        while ((match = typeSectionRegex.exec(content)) !== null) {
            const [, typeName, sectionType = 'template', attrs, sectionContent] = match;
            
            if (!typesMap.has(typeName)) {
                typesMap.set(typeName, {});
            }
            
            const typeConfig = typesMap.get(typeName);
            typeConfig[sectionType] = {
                content: sectionContent.trim(),
                attributes: this.parseAttributes(attrs || '')
            };
        }
        
        // Also parse type:name blocks
        const typeBlockRegex = /<type:([^>]+)>([^]*?)<\/type:\1>/g;
        while ((match = typeBlockRegex.exec(content)) !== null) {
            const [, typeName, blockContent] = match;
            
            if (!typesMap.has(typeName)) {
                typesMap.set(typeName, {});
            }
            
            // Parse inner sections within type block
            const innerSections = this.parseGlobalSections(blockContent);
            Object.assign(typesMap.get(typeName), innerSections);
        }
    }

    static parseAttributes(attrString) {
        const attrs = {};
        const attrRegex = /(\w+)=["']([^"']+)["']/g;
        let match;
        
        while ((match = attrRegex.exec(attrString)) !== null) {
            attrs[match[1]] = match[2];
        }
        
        return attrs;
    }
}

/**
 * @class FXComponentLoader
 * @description Handles loading components from file system
 */
class FXComponentLoader {
    constructor(fx) {
        $$fx = $root('fx');  // Use helper syntax
        this.componentsPath = '/components';
        this.cache = new Map();
    }

    async loadComponent(name, basePath = null) {
        const componentPath = basePath || `${this.componentsPath}/${name}`;
        
        try {
            // Load main component file
            const mainFile = await this.loadFile(`${componentPath}/${name}.fxc`);
            const component = FXCFileParser.parse(mainFile, `${name}.fxc`);
            
            // Load type-specific files
            await this.loadTypeFiles(name, componentPath, component);
            
            this.cache.set(name, component);
            return component;
            
        } catch (error) {
            FXLogger.error(`Failed to load component: ${name}`, error);
            throw error;
        }
    }

    async loadTypeFiles(componentName, componentPath, component) {
        const typeFiles = await this.getTypeFiles(componentPath);
        
        for (const typeFile of typeFiles) {
            const match = typeFile.match(/([^.]+)\.([^.]+)\.fxc$/);
            if (match && match[1] === componentName) {
                const typeName = match[2];
                const typeContent = await this.loadFile(`${componentPath}/${typeFile}`);
                const typeParsed = FXCFileParser.parse(typeContent, typeFile);
                
                // Merge type-specific content
                if (!component.types.has(typeName)) {
                    component.types.set(typeName, {});
                }
                
                const typeConfig = component.types.get(typeName);
                Object.assign(typeConfig, typeParsed.globalSections);
                
                // Add metadata
                typeConfig.metadata = typeParsed.metadata;
            }
        }
    }

    async getTypeFiles(componentPath) {
        // In real implementation, would read directory
        // For now, return mock list
        return [
            'fx-card.active.fxc',
            'fx-card.success.fxc',
            'fx-card.error.fxc'
        ];
    }

    async loadFile(path) {
        if ($$fx.moduleLoader) {
            return $$fx.moduleLoader.loadSync(path);
        } else {
            const response = await fetch(path);
            return await response.text();
        }
    }
}

/**
 * @class FXMorphingNode
 * @description Enhanced morphing node with wrap/expand support
 */
class FXMorphingNode {
    constructor(fx, nodePath, componentDef) {
        $$fx = $root('fx');
        $$this = $root(nodePath);  // Component's own node
        
        this.nodePath = nodePath;
        this.componentDef = componentDef;
        this.element = null;
        this.watchers = new Set();
        
        this.setupMorphing();
        this.setupAPI();
    }

    setupMorphing() {
        // Watch for type changes
        $$this.watch((newValue, oldValue, node) => {
            if (node.__type && this.componentDef.types.has(node.__type)) {
                this.morph(node.__type);
            }
        });
        
        // Setup morphing rules from metadata
        const morphingRules = this.componentDef.metadata.morphing || {};
        Object.keys(morphingRules).forEach(condition => {
            this.watchCondition(condition, morphingRules[condition]);
        });
    }

    setupAPI() {
        const apiConfig = this.componentDef.globalSections.api;
        if (!apiConfig) return;
        
        // Add submit method using wrap()
        $$this.submit = (endpoint) => {
            const wrapped = $$this.wrap();  // Use FX's wrap method
            return this.submitToAPI(endpoint || apiConfig.defaultEndpoint, wrapped);
        };
        
        // Add receive method using expand()
        $$this.receive = (data) => {
            $$this.expand(data);  // Use FX's expand method
            return this;
        };
    }

    async submitToAPI(endpoint, data) {
        try {
            FXLogger.info(`Submitting to: ${endpoint}`);
            
            const api = $$fx.pluginManager.getByPrefix('api');
            if (api) {
                const response = api.post(endpoint, data);
                response.watch((responseData, error) => {
                    if (!error) {
                        $$this.receive(responseData);
                    }
                });
                return response;
            } else {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const responseData = await response.json();
                $$this.receive(responseData);
                return responseData;
            }
        } catch (error) {
            FXLogger.error('API submission failed', error);
            throw error;
        }
    }

    morph(newType) {
        const typeConfig = this.componentDef.types.get(newType);
        if (!typeConfig) {
            FXLogger.warn(`Type not found: ${newType}`);
            return;
        }

        FXLogger.info(`Morphing to: ${newType}`);
        
        // Add to prototype chain
        $$this.inherit(newType);
        $$this.type(newType);
        
        // Update DOM if element exists
        if (this.element) {
            this.updateElement(typeConfig);
        }
        
        // Execute morph callback
        if (typeConfig.script) {
            this.executeScript(typeConfig.script.content, newType);
        }
    }

    updateElement(typeConfig) {
        if (typeConfig.template) {
            const rendered = this.renderTemplate(typeConfig.template.content);
            this.element.innerHTML = rendered;
        }
        
        if (typeConfig.style) {
            this.injectStyles(typeConfig.style.content, typeConfig.style.attributes);
        }
    }

    renderTemplate(template) {
        const context = this.buildRenderContext();
        return template.replace(/\{\{(.+?)\}\}/g, (match, expr) => {
            try {
                const func = new Function(...Object.keys(context), `return ${expr}`);
                return func(...Object.values(context));
            } catch (error) {
                FXLogger.error('Template render error', error);
                return match;
            }
        });
    }

    buildRenderContext() {
        return {
            $$this: $$this,
            node: $$this,
            // Add component type accessors
            ...Array.from(this.componentDef.types.keys()).reduce((acc, typeName) => {
                acc[typeName] = this.getTypeProxy(typeName);
                return acc;
            }, {})
        };
    }

    getTypeProxy(typeName) {
        const typeConfig = this.componentDef.types.get(typeName);
        return {
            template: typeConfig?.template?.content,
            style: typeConfig?.style?.content,
            script: typeConfig?.script?.content,
            user: typeConfig?.metadata?.user || {}
        };
    }

    executeScript(scriptContent, typeName) {
        try {
            const context = this.buildRenderContext();
            const func = new Function('$$this', 'this', ...Object.keys(context), scriptContent);
            func.call(this, $$this, this, ...Object.values(context));
        } catch (error) {
            FXLogger.error(`Script execution failed for type: ${typeName}`, error);
        }
    }

    injectStyles(css, attributes) {
        const scoped = attributes.scoped === 'true' || this.componentDef.metadata.style_scoped;
        const styleId = `fx-comp-${this.nodePath.replace(/\./g, '-')}`;
        
        if (scoped) {
            // Scope CSS to this component
            css = css.replace(/([^{}]+){/g, (match, selector) => {
                return `[data-fx-comp="${this.nodePath}"] ${selector.trim()} {`;
            });
            
            if (this.element) {
                this.element.setAttribute('data-fx-comp', this.nodePath);
            }
        }
        
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = css;
            document.head.appendChild(style);
        }
    }

    watchCondition(condition, targetType) {
        // Simple condition watching - can be enhanced
        const pathMatch = condition.match(/\$\$this\.(\w+)/g);
        if (pathMatch) {
            pathMatch.forEach(path => {
                const cleanPath = path.replace('$$this.', '');
                $root(`${this.nodePath}.${cleanPath}`).watch(() => {
                    if (this.evaluateCondition(condition)) {
                        this.morph(targetType);
                    }
                });
            });
        }
    }

    evaluateCondition(condition) {
        try {
            const context = this.buildRenderContext();
            const func = new Function(...Object.keys(context), `return ${condition}`);
            return func(...Object.values(context));
        } catch (error) {
            FXLogger.error('Condition evaluation failed', error);
            return false;
        }
    }
}

/**
 * @class FXComponentsPlugin
 * @description Main components plugin
 */
class FXComponentsPlugin {
    constructor(fx, options = {}) {
        $$fx = $root('fx');
        this.options = options;
        this.name = 'components';
        this.version = '2.0.0';
        this.description = 'Modular morphing component system';
        
        this.loader = new FXComponentLoader(fx);
        this.components = new Map();
        this.instances = new Map();
        
        this.initGlobals();
        FXLogger.info('FX Components plugin initialized');
    }

    initGlobals() {
        if (typeof globalThis !== 'undefined') {
            globalThis.$comp = this;
        }
    }

    async load(name, path = null) {
        try {
            const component = await this.loader.loadComponent(name, path);
            this.components.set(name, component);
            this.defineCustomElement(name, component);
            
            FXLogger.info(`Component loaded: ${name}`);
            return component;
        } catch (error) {
            FXLogger.error(`Failed to load component: ${name}`, error);
            throw error;
        }
    }

    defineCustomElement(name, componentDef) {
        const elementName = `fx-${name}`;
        
        if (customElements.get(elementName)) {
            FXLogger.warn(`Element already defined: ${elementName}`);
            return;
        }

        const ComponentElement = class extends HTMLElement {
            constructor() {
                super();
                this.morphingNode = null;
            }

            connectedCallback() {
                this.initComponent();
            }

            disconnectedCallback() {
                this.cleanup();
            }

            initComponent() {
                const nodePath = this.getAttribute('fx-path') || 
                                `components.${name}.${this.id || Date.now()}`;
                
                this.morphingNode = new FXMorphingNode($$fx, nodePath, componentDef);
                this.morphingNode.element = this;
                
                // Apply initial effects
                const effects = componentDef.metadata.effects || {};
                Object.keys(effects).forEach(event => {
                    if (event === 'onMount') {
                        this.executeEffect(effects[event]);
                    }
                });
                
                // Setup bindings
                const bindings = componentDef.metadata.bindings || {};
                this.setupBindings(bindings);
                
                // Initial morph to default type
                const defaultType = componentDef.metadata.type || Array.from(componentDef.types.keys())[0];
                if (defaultType) {
                    this.morphingNode.morph(defaultType);
                }
            }

            setupBindings(bindings) {
                Object.keys(bindings).forEach(localProp => {
                    const fxPath = bindings[localProp].replace('$.', '');
                    const sourceNode = $root(fxPath);
                    
                    sourceNode.watch((newValue) => {
                        $root(`${this.morphingNode.nodePath}.${localProp}`).val(newValue);
                    });
                });
            }

            executeEffect(effect) {
                if (effect.startsWith('$')) {
                    // Built-in effect
                    const effectName = effect.slice(1);
                    switch (effectName) {
                        case 'scrollIntoView':
                            this.scrollIntoView({ behavior: 'smooth' });
                            break;
                        case 'remove':
                            this.addEventListener('click', () => this.remove());
                            break;
                    }
                } else {
                    // Custom effect - execute as function
                    try {
                        const func = new Function('element', 'component', effect);
                        func(this, this.morphingNode);
                    } catch (error) {
                        FXLogger.error('Effect execution failed', error);
                    }
                }
            }

            cleanup() {
                if (this.morphingNode) {
                    this.morphingNode.watchers.forEach(w => w());
                }
            }
        };

        customElements.define(elementName, ComponentElement);
    }

    create(nodePath, componentName) {
        const componentDef = this.components.get(componentName);
        if (!componentDef) {
            throw new Error(`Component not found: ${componentName}`);
        }
        
        const morphingNode = new FXMorphingNode($$fx, nodePath, componentDef);
        this.instances.set(nodePath, morphingNode);
        
        return morphingNode;
    }

    get(name) {
        return this.components.get(name);
    }

    list() {
        return Array.from(this.components.keys());
    }
}

// Export plugin factory
export default function(fx, options) {
    return new FXComponentsPlugin(fx, options);
}