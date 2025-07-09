/**
 * @file fx-dom.js
 * @description Complete FX DOM Plugin with Reactive HTML Elements
 * 
 * Features:
 * - Reactive form elements (input, select, checkbox, radio)
 * - Attribute manipulation (class, data, style)
 * - Event handling
 * - Media elements (video, audio) 
 * - HTML loading and XSLT transformation
 * - Multi-element reactivity
 * - Calculated values
 */

/**
 * @class FXDOMPlugin
 * @description Complete DOM manipulation with reactive binding
 */
class FXDOMPlugin {
    constructor(fx, options = {}) {
        this.fx = fx;
        this.options = options;
        this.name = 'dom';
        this.version = '1.0.0';
        this.description = 'Complete DOM manipulation with reactive elements';
        
        this.elementRegistry = new WeakMap();
        this.selectorCache = new Map();
        this.xsltCache = new Map();
        
        console.log('FX[DOM]: DOM plugin initialized');
    }

    /**
     * @method $
     * @description Main DOM selector with reactive binding
     * @param {string} selector - CSS selector
     * @returns {*} Reactive DOM element(s)
     */
    $(selector) {
        // Check cache first
        if (this.selectorCache.has(selector)) {
            return this.selectorCache.get(selector);
        }

        const elements = Array.from(document.querySelectorAll(selector));
        
        if (elements.length === 0) {
            console.warn(`FX[DOM]: No elements found for selector: ${selector}`);
            return null;
        }

        const reactiveElements = elements.map(el => this.createReactiveElement(el));
        const result = reactiveElements.length === 1 ? reactiveElements[0] : reactiveElements;
        
        // Cache the result
        this.selectorCache.set(selector, result);
        
        return result;
    }

    /**
     * @method createReactiveElement
     * @description Create a reactive wrapper for DOM element
     * @param {HTMLElement} element - DOM element to wrap
     * @returns {Proxy} Reactive element proxy
     */
    createReactiveElement(element) {
        // Check if already wrapped
        if (this.elementRegistry.has(element)) {
            return this.elementRegistry.get(element);
        }

        const reactiveElement = new Proxy(element, {
            get: (target, key) => this.handleElementGet(target, key),
            set: (target, key, value) => this.handleElementSet(target, key, value)
        });

        this.elementRegistry.set(element, reactiveElement);
        return reactiveElement;
    }

    /**
     * @method handleElementGet
     * @description Handle property access on reactive elements
     * @param {HTMLElement} target - DOM element
     * @param {string} key - Property key
     * @returns {*} Property value or method
     */
    handleElementGet(target, key) {
        // Native DOM properties and methods
        if (key in target) {
            const value = target[key];
            return typeof value === 'function' ? value.bind(target) : value;
        }

        // Custom reactive methods
        switch (key) {
            case 'val':
                return (value) => {
                    if (arguments.length === 0) {
                        return this.getElementValue(target);
                    } else {
                        this.setElementValue(target, value);
                        return this.createReactiveElement(target);
                    }
                };

            case 'attr':
                return (name, value) => {
                    if (arguments.length === 1) {
                        return target.getAttribute(name);
                    } else {
                        target.setAttribute(name, value);
                        return this.createReactiveElement(target);
                    }
                };

            case 'removeAttr':
                return (name) => {
                    target.removeAttribute(name);
                    return this.createReactiveElement(target);
                };

            case 'data':
                return (name, value) => {
                    if (arguments.length === 1) {
                        return target.dataset[name];
                    } else {
                        target.dataset[name] = value;
                        return this.createReactiveElement(target);
                    }
                };

            case 'addClass':
                return (className) => {
                    target.classList.add(className);
                    return this.createReactiveElement(target);
                };

            case 'removeClass':
                return (className) => {
                    target.classList.remove(className);
                    return this.createReactiveElement(target);
                };

            case 'toggleClass':
                return (className) => {
                    target.classList.toggle(className);
                    return this.createReactiveElement(target);
                };

            case 'hasClass':
                return (className) => target.classList.contains(className);

            case 'css':
                return (property, value) => {
                    if (arguments.length === 1) {
                        if (typeof property === 'object') {
                            // Set multiple styles
                            Object.assign(target.style, property);
                            return this.createReactiveElement(target);
                        } else {
                            // Get style
                            return getComputedStyle(target)[property];
                        }
                    } else {
                        // Set single style
                        target.style[property] = value;
                        return this.createReactiveElement(target);
                    }
                };

            case 'on':
                return (event, handler) => {
                    target.addEventListener(event, handler);
                    return this.createReactiveElement(target);
                };

            case 'off':
                return (event, handler) => {
                    target.removeEventListener(event, handler);
                    return this.createReactiveElement(target);
                };

            case 'trigger':
                return (event, data = {}) => {
                    const customEvent = new CustomEvent(event, { detail: data });
                    target.dispatchEvent(customEvent);
                    return this.createReactiveElement(target);
                };

            case 'html':
                return (content) => {
                    if (arguments.length === 0) {
                        return target.innerHTML;
                    } else {
                        target.innerHTML = content;
                        return this.createReactiveElement(target);
                    }
                };

            case 'text':
                return (content) => {
                    if (arguments.length === 0) {
                        return target.textContent;
                    } else {
                        target.textContent = content;
                        return this.createReactiveElement(target);
                    }
                };

            case 'show':
                return () => {
                    target.style.display = '';
                    return this.createReactiveElement(target);
                };

            case 'hide':
                return () => {
                    target.style.display = 'none';
                    return this.createReactiveElement(target);
                };

            case 'toggle':
                return () => {
                    target.style.display = target.style.display === 'none' ? '' : 'none';
                    return this.createReactiveElement(target);
                };

            // Media element methods
            case 'play':
                return () => {
                    if (target.play) target.play();
                    return this.createReactiveElement(target);
                };

            case 'pause':
                return () => {
                    if (target.pause) target.pause();
                    return this.createReactiveElement(target);
                };

            case 'poster':
                return (url) => {
                    if (arguments.length === 0) {
                        return target.poster;
                    } else {
                        target.poster = url;
                        return this.createReactiveElement(target);
                    }
                };

            case 'addSource':
                return (src, type) => {
                    const source = document.createElement('source');
                    source.src = src;
                    if (type) source.type = type;
                    target.appendChild(source);
                    return this.createReactiveElement(target);
                };

            case 'loadHTML':
                return (url, transform = null) => {
                    this.loadHTMLContent(target, url, transform);
                    return this.createReactiveElement(target);
                };

            case 'bindTo':
                return (fxPath) => {
                    this.bindElementToFXPath(target, fxPath);
                    return this.createReactiveElement(target);
                };

            default:
                // Check for form field names
                if (target.tagName === 'FORM') {
                    const field = target.elements[key];
                    if (field) {
                        return this.createReactiveElement(field);
                    }
                }
                
                return undefined;
        }
    }

    /**
     * @method handleElementSet
     * @description Handle property setting on reactive elements
     * @param {HTMLElement} target - DOM element
     * @param {string} key - Property key
     * @param {*} value - Value to set
     * @returns {boolean} Success status
     */
    handleElementSet(target, key, value) {
        // Handle special cases
        switch (key) {
            case 'class':
                target.className = value;
                return true;
            
            case 'text':
                target.textContent = value;
                return true;
                
            case 'html':
                target.innerHTML = value;
                return true;
                
            default:
                // For form elements, set value intelligently
                if (this.isFormElement(target)) {
                    this.setElementValue(target, value);
                    return true;
                }
                
                // For form fields by name
                if (target.tagName === 'FORM') {
                    const field = target.elements[key];
                    if (field) {
                        this.setElementValue(field, value);
                        return true;
                    }
                }
                
                // Set as attribute
                target.setAttribute(key, value);
                return true;
        }
    }

    /**
     * @method getElementValue
     * @description Get value from any form element type
     * @param {HTMLElement} element - Form element
     * @returns {*} Element value
     */
    getElementValue(element) {
        switch (element.type) {
            case 'checkbox':
                return element.checked;
            case 'radio':
                return element.checked ? element.value : null;
            case 'number':
            case 'range':
                return parseFloat(element.value) || 0;
            case 'file':
                return element.files;
            default:
                if (element.tagName === 'SELECT' && element.multiple) {
                    return Array.from(element.selectedOptions).map(opt => opt.value);
                }
                return element.value || element.textContent;
        }
    }

    /**
     * @method setElementValue
     * @description Set value on any form element type
     * @param {HTMLElement} element - Form element
     * @param {*} value - Value to set
     */
    setElementValue(element, value) {
        switch (element.type) {
            case 'checkbox':
                element.checked = Boolean(value);
                break;
            case 'radio':
                element.checked = (element.value === String(value));
                break;
            case 'file':
                // Can't set file input values
                console.warn('FX[DOM]: Cannot set value on file input');
                break;
            default:
                if (element.tagName === 'SELECT' && element.multiple && Array.isArray(value)) {
                    Array.from(element.options).forEach(option => {
                        option.selected = value.includes(option.value);
                    });
                } else {
                    element.value = String(value);
                }
        }

        // Trigger change event
        element.dispatchEvent(new Event('change', { bubbles: true }));
    }

    /**
     * @method isFormElement
     * @description Check if element is a form element
     * @param {HTMLElement} element - Element to check
     * @returns {boolean} Is form element
     */
    isFormElement(element) {
        return ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(element.tagName);
    }

    /**
     * @method bindElementToFXPath
     * @description Bind element to FX node path for two-way reactivity
     * @param {HTMLElement} element - DOM element
     * @param {string} fxPath - FX node path
     */
    bindElementToFXPath(element, fxPath) {
        const fxNode = this.fx.resolvePath(fxPath, this.fx.root);
        if (!fxNode) {
            console.warn(`FX[DOM]: FX path not found: ${fxPath}`);
            return;
        }

        // FX -> DOM: Update element when FX value changes
        fxNode.__watchers.add((newValue) => {
            this.setElementValue(element, newValue);
        });

        // DOM -> FX: Update FX when element changes
        element.addEventListener('change', () => {
            const value = this.getElementValue(element);
            this.fx.set(fxNode, value);
        });

        element.addEventListener('input', () => {
            const value = this.getElementValue(element);
            this.fx.set(fxNode, value);
        });

        // Initial sync
        const currentValue = this.fx.val(fxNode);
        if (currentValue !== undefined) {
            this.setElementValue(element, currentValue);
        }
    }

    /**
     * @method loadHTMLContent
     * @description Load HTML content from server with optional XSLT transformation
     * @param {HTMLElement} target - Target element
     * @param {string} url - URL to load
     * @param {string} transform - XSLT stylesheet URL (optional)
     */
    loadHTMLContent(target, url, transform = null) {
        // Start loading in background
        fetch(url)
            .then(response => response.text())
            .then(html => {
                if (transform) {
                    return this.applyXSLTTransform(html, transform);
                }
                return html;
            })
            .then(processedHTML => {
                target.innerHTML = processedHTML;
                
                // Make new elements reactive
                const newElements = target.querySelectorAll('*');
                newElements.forEach(el => this.createReactiveElement(el));
                
                console.log('FX[DOM]: HTML content loaded and made reactive');
            })
            .catch(error => {
                console.error('FX[DOM]: Failed to load HTML content:', error);
            });
    }

    /**
     * @method applyXSLTTransform
     * @description Apply XSLT transformation to XML/HTML content
     * @param {string} xmlContent - XML content to transform
     * @param {string} xsltURL - XSLT stylesheet URL
     * @returns {Promise<string>} Transformed HTML
     */
    async applyXSLTTransform(xmlContent, xsltURL) {
        try {
            // Check cache first
            if (this.xsltCache.has(xsltURL)) {
                const xsltDoc = this.xsltCache.get(xsltURL);
                return this.performXSLTTransform(xmlContent, xsltDoc);
            }

            // Load XSLT stylesheet
            const xsltResponse = await fetch(xsltURL);
            const xsltText = await xsltResponse.text();
            
            const parser = new DOMParser();
            const xsltDoc = parser.parseFromString(xsltText, 'application/xml');
            
            // Cache the XSLT document
            this.xsltCache.set(xsltURL, xsltDoc);
            
            return this.performXSLTTransform(xmlContent, xsltDoc);

        } catch (error) {
            console.error('FX[DOM]: XSLT transformation failed:', error);
            return xmlContent; // Return original content on failure
        }
    }

    /**
     * @method performXSLTTransform
     * @description Perform the actual XSLT transformation
     * @param {string} xmlContent - XML content
     * @param {Document} xsltDoc - XSLT document
     * @returns {string} Transformed HTML
     */
    performXSLTTransform(xmlContent, xsltDoc) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');
        
        const xsltProcessor = new XSLTProcessor();
        xsltProcessor.importStylesheet(xsltDoc);
        
        const resultDoc = xsltProcessor.transformToFragment(xmlDoc, document);
        
        // Convert result to HTML string
        const serializer = new XMLSerializer();
        return serializer.serializeToString(resultDoc);
    }

    /**
     * @method createCalculatedBinding
     * @description Create calculated value that updates when dependencies change
     * @param {Array<string>} dependencies - FX paths that this calculation depends on
     * @param {Function} calculator - Function that calculates the value
     * @param {string} targetPath - FX path to store the result
     */
    createCalculatedBinding(dependencies, calculator, targetPath) {
        const updateCalculation = () => {
            try {
                const values = dependencies.map(path => {
                    const node = this.fx.resolvePath(path, this.fx.root);
                    return node ? this.fx.val(node) : undefined;
                });
                
                const result = calculator(...values);
                this.fx.setPath(targetPath, result, this.fx.root);
                
            } catch (error) {
                console.error('FX[DOM]: Calculation error:', error);
            }
        };

        // Watch all dependencies
        dependencies.forEach(path => {
            const node = this.fx.resolvePath(path, this.fx.root);
            if (node) {
                node.__watchers.add(updateCalculation);
            }
        });

        // Initial calculation
        updateCalculation();
    }

    /**
     * @method multiElementReactivity
     * @description Make multiple elements react to a single FX variable
     * @param {string} fxPath - FX node path
     * @param {Array<string>} selectors - CSS selectors for elements
     * @param {Function} updater - Function to update each element
     */
    multiElementReactivity(fxPath, selectors, updater) {
        const fxNode = this.fx.resolvePath(fxPath, this.fx.root);
        if (!fxNode) {
            console.warn(`FX[DOM]: FX path not found: ${fxPath}`);
            return;
        }

        // Get all elements
        const elements = selectors.flatMap(selector => 
            Array.from(document.querySelectorAll(selector))
        );

        // Update function
        const updateElements = (newValue) => {
            elements.forEach(element => {
                try {
                    updater(this.createReactiveElement(element), newValue);
                } catch (error) {
                    console.error('FX[DOM]: Multi-element update error:', error);
                }
            });
        };

        // Watch for changes
        fxNode.__watchers.add(updateElements);

        // Initial update
        const currentValue = this.fx.val(fxNode);
        if (currentValue !== undefined) {
            updateElements(currentValue);
        }
    }
}

// Export as function that creates instance
export default function(fx, options) {
    return new FXDOMPlugin(fx, options);
}

