// fx-jsx.js
/**
 * @file fx-jsx.js
 * @description FX JSX Parser with Native Reactivity
 */

class FXLogger {
    static log(level, message, data = {}) {
        console.log(`[FX-JSX:${level.toUpperCase()}]`, message, data);
    }
    static error(message, error) { this.log('error', message, { error }); }
    static warn(message, data) { this.log('warn', message, data); }
    static info(message, data) { this.log('info', message, data); }
}

/**
 * @class FXJSXParser
 * @description Simple but powerful JSX parser
 */
class FXJSXParser {
    constructor() {
        this.tokens = [];
        this.position = 0;
    }

    parse(jsxString) {
        try {
            this.tokens = this.tokenize(jsxString);
            this.position = 0;
            return this.parseElement();
        } catch (error) {
            FXLogger.error('JSX parsing failed', error);
            throw error;
        }
    }

    tokenize(jsx) {
        const tokens = [];
        let i = 0;
        
        while (i < jsx.length) {
            const char = jsx[i];
            
            if (char === '<') {
                const tagResult = this.parseTag(jsx, i);
                tokens.push(tagResult.token);
                i = tagResult.newPosition;
            } else if (char === '{') {
                const exprResult = this.parseExpression(jsx, i);
                tokens.push(exprResult.token);
                i = exprResult.newPosition;
            } else if (char.trim()) {
                const textResult = this.parseText(jsx, i);
                if (textResult.token.value.trim()) {
                    tokens.push(textResult.token);
                }
                i = textResult.newPosition;
            } else {
                i++;
            }
        }
        
        return tokens;
    }

    parseTag(jsx, start) {
        let i = start + 1; // Skip '<'
        let tagName = '';
        let attributes = [];
        let selfClosing = false;
        let closing = false;
        
        // Check if closing tag
        if (jsx[i] === '/') {
            closing = true;
            i++;
        }
        
        // Parse tag name
        while (i < jsx.length && jsx[i] !== ' ' && jsx[i] !== '>' && jsx[i] !== '/') {
            tagName += jsx[i];
            i++;
        }
        
        // Skip whitespace
        while (jsx[i] === ' ') i++;
        
        // Parse attributes (if not closing tag)
        if (!closing) {
            while (i < jsx.length && jsx[i] !== '>' && jsx[i] !== '/') {
                const attrResult = this.parseAttribute(jsx, i);
                attributes.push(attrResult.attribute);
                i = attrResult.newPosition;
                
                // Skip whitespace
                while (jsx[i] === ' ') i++;
            }
        }
        
        // Check for self-closing
        if (jsx[i] === '/') {
            selfClosing = true;
            i++;
        }
        
        // Skip '>'
        i++;
        
        return {
            token: {
                type: closing ? 'closing-tag' : 'opening-tag',
                tagName,
                attributes,
                selfClosing
            },
            newPosition: i
        };
    }

    parseAttribute(jsx, start) {
        let i = start;
        let name = '';
        let value = null;
        
        // Parse attribute name
        while (i < jsx.length && jsx[i] !== '=' && jsx[i] !== ' ' && jsx[i] !== '>' && jsx[i] !== '/') {
            name += jsx[i];
            i++;
        }
        
        // Skip whitespace
        while (jsx[i] === ' ') i++;
        
        // Parse value if present
        if (jsx[i] === '=') {
            i++; // Skip '='
            while (jsx[i] === ' ') i++; // Skip whitespace
            
            if (jsx[i] === '"' || jsx[i] === "'") {
                // String value
                const quote = jsx[i];
                i++; // Skip opening quote
                value = '';
                while (i < jsx.length && jsx[i] !== quote) {
                    value += jsx[i];
                    i++;
                }
                i++; // Skip closing quote
            } else if (jsx[i] === '{') {
                // Expression value
                const exprResult = this.parseExpression(jsx, i);
                value = exprResult.token;
                i = exprResult.newPosition;
            }
        }
        
        return {
            attribute: { name, value },
            newPosition: i
        };
    }

    parseExpression(jsx, start) {
        let i = start + 1; // Skip '{'
        let expression = '';
        let braceCount = 1;
        
        while (i < jsx.length && braceCount > 0) {
            if (jsx[i] === '{') {
                braceCount++;
            } else if (jsx[i] === '}') {
                braceCount--;
            }
            
            if (braceCount > 0) {
                expression += jsx[i];
            }
            i++;
        }
        
        return {
            token: {
                type: 'expression',
                value: expression.trim()
            },
            newPosition: i
        };
    }

    parseText(jsx, start) {
        let i = start;
        let text = '';
        
        while (i < jsx.length && jsx[i] !== '<' && jsx[i] !== '{') {
            text += jsx[i];
            i++;
        }
        
        return {
            token: {
                type: 'text',
                value: text
            },
            newPosition: i
        };
    }

    parseElement() {
        const elements = [];
        
        while (this.position < this.tokens.length) {
            const token = this.tokens[this.position];
            
            if (token.type === 'opening-tag') {
                const element = this.parseCompleteElement();
                elements.push(element);
            } else if (token.type === 'text') {
                elements.push({
                    type: 'text',
                    content: token.value
                });
                this.position++;
            } else if (token.type === 'expression') {
                elements.push({
                    type: 'expression',
                    content: token.value
                });
                this.position++;
            } else {
                this.position++;
            }
        }
        
        return elements.length === 1 ? elements[0] : { type: 'fragment', children: elements };
    }

    parseCompleteElement() {
        const openingTag = this.tokens[this.position];
        this.position++;
        
        if (openingTag.selfClosing) {
            return {
                type: 'element',
                tagName: openingTag.tagName,
                attributes: openingTag.attributes,
                children: []
            };
        }
        
        const children = [];
        
        while (this.position < this.tokens.length) {
            const token = this.tokens[this.position];
            
            if (token.type === 'closing-tag' && token.tagName === openingTag.tagName) {
                this.position++;
                break;
            } else if (token.type === 'opening-tag') {
                children.push(this.parseCompleteElement());
            } else if (token.type === 'text') {
                children.push({
                    type: 'text',
                    content: token.value
                });
                this.position++;
            } else if (token.type === 'expression') {
                children.push({
                    type: 'expression',
                    content: token.value
                });
                this.position++;
            } else {
                this.position++;
            }
        }
        
        return {
            type: 'element',
            tagName: openingTag.tagName,
            attributes: openingTag.attributes,
            children
        };
    }
}

/**
 * @class FXJSXRenderer
 * @description Renders JSX to reactive DOM with FX integration
 */
class FXJSXRenderer {
    constructor(fx) {
        $$fx = $root('fx');
        this.componentRegistry = new Map();
        this.elementRegistry = new WeakMap();
        this.watchers = new Map();
    }

    registerComponent(name, component) {
        this.componentRegistry.set(name, component);
        FXLogger.info(`JSX Component registered: ${name}`);
    }

    render(jsxElement, container, context = {}) {
        try {
            const element = this.renderElement(jsxElement, context);
            
            if (container) {
                if (typeof container === 'string') {
                    container = document.querySelector(container);
                }
                container.appendChild(element);
            }
            
            return element;
        } catch (error) {
            FXLogger.error('JSX rendering failed', error);
            throw error;
        }
    }

    renderElement(jsxElement, context) {
        switch (jsxElement.type) {
            case 'element':
                return this.renderHTMLElement(jsxElement, context);
            case 'text':
                return this.renderText(jsxElement, context);
            case 'expression':
                return this.renderExpression(jsxElement, context);
            case 'fragment':
                return this.renderFragment(jsxElement, context);
            default:
                return document.createTextNode('');
        }
    }

    renderHTMLElement(jsxElement, context) {
        const { tagName, attributes, children } = jsxElement;
        
        // Check if it's a custom component
        if (this.componentRegistry.has(tagName)) {
            return this.renderComponent(tagName, attributes, children, context);
        }
        
        // Create HTML element
        const element = document.createElement(tagName);
        
        // Set attributes with reactivity
        attributes.forEach(attr => {
            this.setReactiveAttribute(element, attr, context);
        });
        
        // Render children
        children.forEach(child => {
            const childElement = this.renderElement(child, context);
            if (childElement) {
                element.appendChild(childElement);
            }
        });
        
        return element;
    }

    renderComponent(componentName, attributes, children, context) {
        const ComponentClass = this.componentRegistry.get(componentName);
        
        // Build props from attributes
        const props = {};
        attributes.forEach(attr => {
            if (attr.value && attr.value.type === 'expression') {
                props[attr.name] = this.evaluateExpression(attr.value.value, context);
            } else {
                props[attr.name] = attr.value;
            }
        });
        
        // Create component instance
        const component = new ComponentClass(props, children);
        
        // Create FX node for component state
        const nodePath = `jsx.components.${componentName}.${Date.now()}`;
        $$componentNode = $root(nodePath);
        component.$$node = $$componentNode;
        
        // Set up component state reactivity
        if (component.state) {
            Object.keys(component.state).forEach(key => {
                $$componentNode[key] = component.state[key];
            });
        }
        
        // Render component
        const jsxResult = component.render();
        const element = this.renderElement(jsxResult, { ...context, component });
        
        // Set up reactivity watchers
        this.setupComponentReactivity(component, element, context);
        
        return element;
    }

    renderText(jsxElement, context) {
        return document.createTextNode(jsxElement.content);
    }

    renderExpression(jsxElement, context) {
        const value = this.evaluateExpression(jsxElement.content, context);
        const textNode = document.createTextNode(String(value));
        
        // Set up reactivity for expressions
        this.setupExpressionReactivity(jsxElement.content, textNode, context);
        
        return textNode;
    }

    renderFragment(jsxElement, context) {
        const fragment = document.createDocumentFragment();
        
        jsxElement.children.forEach(child => {
            const element = this.renderElement(child, context);
            if (element) {
                fragment.appendChild(element);
            }
        });
        
        return fragment;
    }

    setReactiveAttribute(element, attr, context) {
        const { name, value } = attr;
        
        if (value && value.type === 'expression') {
            // Reactive attribute
            const updateAttribute = () => {
                const newValue = this.evaluateExpression(value.value, context);
                
                if (name === 'className') {
                    element.className = newValue;
                } else if (name.startsWith('on')) {
                    // Event handler
                    const eventName = name.slice(2).toLowerCase();
                    element.addEventListener(eventName, newValue);
                } else {
                    element.setAttribute(name, newValue);
                }
            };
            
            updateAttribute();
            this.setupExpressionReactivity(value.value, updateAttribute, context);
        } else {
            // Static attribute
            if (name === 'className') {
                element.className = value || '';
            } else {
                element.setAttribute(name, value || '');
            }
        }
    }

    setupExpressionReactivity(expression, updateFn, context) {
        // Extract FX paths from expression
        const fxPaths = this.extractFXPaths(expression);
        
        fxPaths.forEach(path => {
            const node = $root(path);
            const watcher = node.watch(() => {
                if (typeof updateFn === 'function') {
                    updateFn();
                } else {
                    // updateFn is a text node
                    const newValue = this.evaluateExpression(expression, context);
                    updateFn.textContent = String(newValue);
                }
            });
            
            // Store watcher for cleanup
            if (!this.watchers.has(path)) {
                this.watchers.set(path, new Set());
            }
            this.watchers.get(path).add(watcher);
        });
    }

    setupComponentReactivity(component, element, context) {
        if (!component.$$node) return;
        
        // Watch component state changes
        component.$$node.watch(() => {
            // Re-render component
            const newJsxResult = component.render();
            const newElement = this.renderElement(newJsxResult, { ...context, component });
            
            // Replace element in DOM
            if (element.parentNode) {
                element.parentNode.replaceChild(newElement, element);
            }
        });
    }

    extractFXPaths(expression) {
        // Simple regex to find FX node references
        const pathRegex = /\$\$(\w+(?:\.\w+)*)/g;
        const paths = [];
        let match;
        
        while ((match = pathRegex.exec(expression)) !== null) {
            paths.push(match[1]);
        }
        
        return paths;
    }

    evaluateExpression(expression, context) {
        try {
            // Build evaluation context
            const evalContext = {
                ...context,
                // Add FX node accessors
                ...this.buildFXContext()
            };
            
            const func = new Function(...Object.keys(evalContext), `return ${expression}`);
            return func(...Object.values(evalContext));
        } catch (error) {
            FXLogger.error('Expression evaluation failed', error);
            return '';
        }
    }

    buildFXContext() {
        // Create context with FX node accessors
        return new Proxy({}, {
            get(target, prop) {
                if (prop.startsWith('$$')) {
                    const path = prop.slice(2);
                    return $root(path);
                }
                return target[prop];
            }
        });
    }
}

/**
 * @class FXJSXComponent
 * @description Base class for FX JSX components
 */
class FXJSXComponent {
    constructor(props = {}, children = []) {
        this.props = props;
        this.children = children;
        this.state = {};
        this.$$node = null;
    }

    setState(updates) {
        if (this.$$node) {
            Object.keys(updates).forEach(key => {
                this.$$node[key] = updates[key];
            });
        }
        Object.assign(this.state, updates);
    }

    render() {
        // Override in subclasses
        return { type: 'text', content: 'Override render() method' };
    }
}

/**
 * @class FXJSXEngine
 * @description Main JSX engine
 */
class FXJSXEngine {
    constructor(fx) {
        $$fx = $root('fx');
        this.parser = new FXJSXParser();
        this.renderer = new FXJSXRenderer(fx);
        
        this.initGlobals();
        FXLogger.info('FX JSX Engine initialized');
    }

    initGlobals() {
        if (typeof globalThis !== 'undefined') {
            globalThis.jsx = this;
            globalThis.FXJSXComponent = FXJSXComponent;
        }
    }

    // Transform and render JSX
    render(jsxString, container, context = {}) {
        const parsed = this.parser.parse(jsxString);
        return this.renderer.render(parsed, container, context);
    }

    // Register component
    component(name, componentClass) {
        this.renderer.registerComponent(name, componentClass);
    }

    // Template literal helper
    jsx(strings, ...expressions) {
        let result = strings[0];
        
        for (let i = 0; i < expressions.length; i++) {
            result += `{${expressions[i]}}${strings[i + 1]}`;
        }
        
        return this.render(result);
    }
}

// Export plugin factory
export default function(fx, options) {
    return new FXJSXEngine(fx, options);
}