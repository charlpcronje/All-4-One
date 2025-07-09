/**
 * @file fx.d.ts
 * @description TypeScript Declaration File for the complete FX Framework and its plugins.
 * @version 1.0.0
 */

//======================================================================
//  Core FX Framework Types (fx.js)
//======================================================================

/**
 * Represents a single node in the FX data graph.
 */
interface FXNode {
    __id: string;
    __parent_id: string | null;
    __nodes: Record<string, FXNode>;
    __value: {
      str?: string;
      num?: number;
      bool?: boolean;
      json?: object;
      [key: string]: any;
    };
    __type: string | null;
    __proto: string[];
    __effects: Function[];
    __watchers: Set<WatcherCallback>;
    __instances: Map<string, any>;
  }
  
  /**
   * Callback function for a node watcher.
   * @param newValue The new value of the node.
   * @param oldValue The previous value of the node.
   * @param node The raw FXNode object that changed.
   */
  type WatcherCallback = (newValue: any, oldValue: any, node: FXNode) => void;
  
  /**
   * The user-facing proxy for an FXNode, providing a chainable API.
   */
  interface FXNodeProxy {
    /** Gets the value of the node. */
    val(): any;
    /** Sets the value of the node and returns the proxy for chaining. */
    val(value: any): FXNodeProxy;
  
    /** Sets the value of the node. */
    set(value: any): FXNodeProxy;
  
    /** Gets the type of the node. */
    type(): string | null;
    /** Sets the type of the node. */
    type(newType: string): FXNodeProxy;
  
    /**
     * Adds a watcher to the node. The callback is executed when the node's value changes.
     * @returns A function to unregister the watcher.
     */
    watch(callback: WatcherCallback): () => void;
  
    /** Adds a class name to the node's prototype chain for behavior inheritance. */
    inherit(protoName: string): FXNodeProxy;
  
    /** Returns the raw, underlying FXNode object. */
    node(): FXNode;
    
    /** Returns a new proxy for the same node. */
    proxy(): FXNodeProxy;
  
    /** Allows accessing child nodes or their values directly. */
    [key: string]: FXNodeProxy | any;
  }
  
  /**
   * Configuration for loading a plugin.
   */
  interface PluginConfig {
    /** A global variable name to expose the plugin under. */
    global?: string;
    /** A prefix to access the plugin via `fx.prefix`. */
    prefix?: string;
    /** Plugin-specific options. */
    options?: Record<string, any>;
  }
  
  /**
   * The core FX class structure.
   */
  interface FXCore {
    root: FXNode;
    pluginManager: any; // In-depth typing for PluginManager is complex
    debug: boolean;
  
    /**
     * The main accessor function to get or set nodes.
     * @param path The dot-separated path to the node.
     * @param value The value to set. If an array, it's treated as arguments for a function call.
     */
    $$(path: string, value?: any): FXNodeProxy | undefined;
  
    /**
     * Queries the FX node graph using a simple selector.
     * @param selector A selector string (e.g., '*', '[__type="user"]').
     */
    '#'(selector: string): FXNodeProxy[];
  
    /**
     * Registers a class for use within the FX system.
     * @param classObj The class constructor.
     * @param name The name to register the class under.
     */
    register(classObj: new (...args: any[]) => any, name?: string): this;
  }
  
  /**
   * The main FX proxy object, which is both a function and an object.
   */
  interface FxProxy extends FXCore {
    /**
     * Gets a proxy to a node, or sets its value.
     * @param path The dot-separated path to the node.
     * @param value Optional value to set.
     */
    (path: string, value?: any): FXNodeProxy | undefined;
  
    /**
     * Special syntax for loading a plugin.
     * @param path The plugin path in the format `prefix@/path/to/plugin.js`.
     */
    (path: `${string}@${string}`): { plugin: (config?: PluginConfig) => any };
  
    /** Allows accessing top-level nodes directly, e.g., `fx.app.user`. */
    [key: string]: FXNodeProxy | any;
  }
  
  
  //======================================================================
  //  FX DOM Plugin Types (fx-dom.js)
  //======================================================================
  
  /**
   * A reactive wrapper around an HTMLElement.
   */
  interface ReactiveElement extends HTMLElement {
    /** Gets or sets the value of a form element. */
    val(value?: any): any | this;
  
    /** Gets or sets an attribute. */
    attr(name: string, value?: string): string | this;
    removeAttr(name: string): this;
  
    /** Gets or sets a data attribute. */
    data(name: string, value?: string): string | this;
    
    addClass(className: string): this;
    removeClass(className: string): this;
    toggleClass(className: string): this;
    hasClass(className: string): boolean;
  
    /** Gets or sets CSS properties. */
    css(property: string | Record<string, string>, value?: string): string | this;
  
    /** Attaches an event listener. */
    on(event: keyof HTMLElementEventMap, handler: (event: Event) => void): this;
    /** Detaches an event listener. */
    off(event: keyof HTMLElementEventMap, handler: (event: Event) => void): this;
    /** Dispatches an event. */
    trigger(event: string, data?: any): this;
    
    /** Gets or sets the innerHTML. */
    html(content?: string): string | this;
    /** Gets or sets the textContent. */
    text(content?: string): string | this;
  
    show(): this;
    hide(): this;
    toggle(): this;
  
    /** Binds the element's value to an FX node for two-way reactivity. */
    bindTo(fxPath: string): this;
  
    /** Loads HTML content from a URL, with optional XSLT transformation. */
    loadHTML(url: string, transform?: string): this;
  
    // Media element methods
    play(): this;
    pause(): this;
    poster(url?: string): string | this;
    addSource(src: string, type?: string): this;
  }
  
  /**
   * The FX DOM Plugin class.
   */
  interface FXDOMPlugin {
    /**
     * The main DOM selector.
     * @param selector A CSS selector string.
     * @returns A single ReactiveElement, an array of them, or null.
     */
    $(selector: string): ReactiveElement | ReactiveElement[] | null;
  
    /**
     * Creates a reactive binding between multiple FX nodes and a target node.
     * @param dependencies An array of FX node paths.
     * @param calculator A function that computes the new value.
     * @param targetPath The FX node path to store the result in.
     */
    createCalculatedBinding(dependencies: string[], calculator: (...values: any[]) => any, targetPath: string): void;
  
    /**
     * Makes multiple DOM elements react to changes in a single FX node.
     * @param fxPath The path of the source FX node.
     * @param selectors An array of CSS selectors for the target elements.
     * @param updater A function that updates each element.
     */
    multiElementReactivity(fxPath: string, selectors: string[], updater: (el: ReactiveElement, value: any) => void): void;
  }
  
  
  //======================================================================
  //  FX API Plugin Types (fx-api.js)
  //======================================================================
  
  /**
   * A placeholder for an API response that populates asynchronously.
   */
  interface ResponsePlaceholder<T = any> {
    /** True while the request is in flight. */
    readonly loading: boolean;
    /** The HTTP status code of the response. */
    readonly status: number | null;
    /** The response headers. */
    readonly headers: Record<string, string>;
    /** The response data, available once the request is complete. */
    readonly data: T | null;
    /** The error object if the request failed. */
    readonly error: Error | null;
  
    /**
     * Attaches a callback that runs when the request completes.
     * @param callback The function to execute with the response data and error.
     */
    watch(callback: (data: T | null, error: Error | null) => void): void;
  
    /**
     * Allows the placeholder to be used with `await` or `.then()`.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
    ): Promise<TResult1 | TResult2>;
  
    /**
     * Attaches a callback for only the rejection case.
     */
    catch<TResult = never>(
      onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null
    ): Promise<T | TResult>;
  
    /** Allows accessing properties of the data directly. */
    [key: string]: any;
  }
  
  /**
   * The FX API Plugin class.
   */
  interface FXAPIPlugin {
    get<T = any>(url: string, config?: object): ResponsePlaceholder<T>;
    post<T = any>(url: string, data: any, config?: object): ResponsePlaceholder<T>;
    put<T = any>(url: string, data: any, config?: object): ResponsePlaceholder<T>;
    patch<T = any>(url: string, data: any, config?: object): ResponsePlaceholder<T>;
    delete<T = any>(url: string, config?: object): ResponsePlaceholder<T>;
    head<T = any>(url: string, config?: object): ResponsePlaceholder<T>;
    options<T = any>(url: string, config?: object): ResponsePlaceholder<T>;
    request<T = any>(config: object): ResponsePlaceholder<T>;
  
    setHeader(name: string, value: string): this;
    setBaseURL(baseURL: string): this;
    setTimeout(timeout: number): this;
    setRetries(retries: number): this;
    addRequestInterceptor(interceptor: (config: object) => object | Promise<object>): this;
    addResponseInterceptor(interceptor: (response: object) => object | Promise<object>): this;
    enableCache(ttl?: number): this;
    disableCache(): this;
    clearCache(): this;
  }
  
  
  //======================================================================
  //  FX ORM Plugin Types (fx-orm.js)
  //======================================================================
  
  /**
   * A reactive proxy for a database record or a collection of records.
   */
  interface ReactiveResult<T = any> {
    /** Saves any changes back to the database. */
    save(): this;
    /** Reloads the data from the database. */
    reload(): this;
    /** Deletes the record(s) from the database. */
    delete(): this;
    /** Returns the data as a plain JavaScript array. */
    toArray(): T[];
    /** For collections, returns the number of records. */
    readonly length: number;
    /** Allows accessing record fields or array elements directly. */
    [key: string]: any;
  }
  
  /**
   * A proxy for a database table, providing query methods.
   */
  interface TableProxy {
    /** Selects all records from the table. */
    all(): ReactiveResult<any[]>;
    /** Selects records using a CSS-style query string. */
    select(query: string): ReactiveResult<any[] | any>;
    /** Creates a new record in the table. */
    create(data: object): ReactiveResult<any>;
    /** Finds a single record by its primary key. */
    find(id: string | number): ReactiveResult<any>;
    /** A shortcut to select a record by its primary key. */
    [id: string | number]: ReactiveResult<any>;
  }
  
  /**
   * The FX ORM Plugin, which is a callable proxy.
   */
  interface FXORMPluginProxy {
    /**
     * Accesses a table.
     * @param tableName The name of the table (fuzzy matched).
     */
    (tableName: string): TableProxy;
  
    /** Accesses a table via property access, e.g., `orm.users`. */
    [tableName: string]: TableProxy;
    
    connect(connectionString: string, options?: object): any;
  }
  
  
  //======================================================================
  //  FX JSX & UI Plugin Types (fx-jsx.js, fx-shadcn.js)
  //======================================================================
  
  /**
   * The base class for all custom JSX components.
   */
  declare abstract class FXJSXComponent {
    props: Record<string, any>;
    children: any[];
    state: Record<string, any>;
    $$node: FXNodeProxy;
    constructor(props: Record<string, any>, children: any[]);
    setState(updates: Record<string, any>): void;
    abstract render(): any;
  }
  
  /**
   * The FX JSX rendering engine.
   */
  interface FXJSXEngine {
    /**
     * Renders a JSX string into the DOM.
     * @param jsxString The string containing JSX syntax.
     * @param container A CSS selector for the container element.
     * @param context An optional context object.
     */
    render(jsxString: string, container?: string | HTMLElement, context?: object): HTMLElement | DocumentFragment;
    /**
     * Registers a custom component class for use in JSX.
     * @param name The tag name for the component.
     * @param componentClass The component class, which must extend `FXJSXComponent`.
     */
    component(name: string, componentClass: typeof FXJSXComponent): void;
  }
  
  interface ToastOptions {
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive';
    duration?: number;
  }
  
  /**
   * The FX ShadCN UI Plugin.
   */
  interface FXShadcnPlugin {
    /**
     * Displays a toast notification.
     */
    toast(options: ToastOptions): void;
  }
  
  
  //======================================================================
  //  FX Components Plugin Types (fx-components.js)
  //======================================================================
  
  /**
   * The main FX Components plugin class.
   */
  interface FXComponentsPlugin {
    /**
     * Loads a component definition from the file system.
     * @param name The name of the component to load.
     * @param path The base path to the component's directory.
     */
    load(name: string, path?: string): Promise<any>;
  
    /**
     * Programmatically creates a component instance tied to an FX node.
     * @param nodePath The path for the component's data in the FX graph.
     * @param componentName The name of the component to instantiate.
     */
    create(nodePath: string, componentName: string): any; // Returns FXMorphingNode
  
    /** Gets a loaded component definition. */
    get(name: string): any;
  
    /** Lists all loaded components. */
    list(): string[];
  }
  
  
  //======================================================================
  //  Global Declarations
  //======================================================================
  
  declare global {
    /** The main FX framework proxy object. */
    const $$: FxProxy;
  
    /** Global helper to get or set a value at a path. */
    function $val(path: string, value?: any, defaultValue?: any): any;
    /** Global helper to set a nested property on a node. */
    function $set(path: string, key: string, value: any): FXNodeProxy;
    /** Global helper to get a nested property from a node. */
    function $get(path: string, key: string, defaultValue?: any): any;
    /** Global helper to check a node's type. */
    function $type(path: string, interfaceName: string, defaultValue?: any): any;
    /** Global helper to check if a node exists. */
    function $has(path: string): boolean;
    /** Global helper for conditional execution if a node exists. */
    function $if(path: string, callback: (node: FXNodeProxy) => void): void;
    /** Global helper to get a direct proxy to a node. */
    function $root(path: string): FXNodeProxy;
    /** Global helper to add an effect to a node. */
    function $effect(node: FXNode, effectFunction: Function): FXNode;
    /** Global helper to query the FX node graph. */
    function '#'(selector: string): FXNodeProxy[];
    
    // --- Globals from Plugins ---
  
    /** Global DOM selector (from fx-dom.js). */
    const $: FXDOMPlugin['$'];
    /** Global API client (from fx-api.js). */
    const $api: FXAPIPlugin;
    /** Global ORM instance (from fx-orm.js). */
    const $db: FXORMPluginProxy;
    /** Global Components manager (from fx-components.js). */
    const $comp: FXComponentsPlugin;
    /** Global JSX engine (from fx-jsx.js). */
    const jsx: FXJSXEngine;
    /** Global UI utilities (from fx-shadcn.js). */
    const ui: FXShadcnPlugin;
  
    // --- ShadCN Component Classes for JSX ---
    class Button extends FXJSXComponent {}
    class Input extends FXJSXComponent {}
    class Card extends FXJSXComponent {}
    class CardHeader extends FXJSXComponent {}
    class CardTitle extends FXJSXComponent {}
    class CardContent extends FXJSXComponent {}
    class Dialog extends FXJSXComponent {}
    class Select extends FXJSXComponent {}
    class Badge extends FXJSXComponent {}
    class Toast extends FXJSXComponent {}
  }
  
  // Export the main `fx` object for module-based usage.
  export const fx: FxProxy;
  export { FXCore, FXNode, FXNodeProxy, FXAPIPlugin, FXDOMPlugin, FXORMPluginProxy, FXComponentsPlugin, FXJSXEngine, FXShadcnPlugin };
  export default fx;