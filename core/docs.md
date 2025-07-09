### 1. FX Core Framework Documentation (`fx.js`)

# FX Core Framework

**`fx.js`** is the heart of the FX framework, a powerful reactive data graph system designed with a universal plugin architecture. It provides a centralized, proxy-based interface for creating, managing, and reacting to data changes throughout an application.

---

### Core Concepts

#### 1. The Global `$$` Proxy
The entire framework is accessed through a single global proxy, `$$`. This proxy is the entry point for all operations. You don't interact with different objects for different tasks; you simply use `$$`.

-   **Node Access:** `$$('app.user.name')` gets a node.
-   **Node Creation/Setting:** `$$('app.user.name', 'John')` sets a value, creating nodes as needed.
-   **Plugin Loading:** `$$('prefix@/path/to/plugin.js').plugin()` loads and registers a plugin.

#### 2. The Node System
FX organizes data in a tree-like structure of "nodes." Each node is a JavaScript object with special properties:
-   `__id`: A unique identifier.
-   `__nodes`: An object containing child nodes.
-   `__value`: An object storing the node's actual value, often in multiple type-casted formats (e.g., `num`, `str`).
-   `__type`: The primary data type of the node (e.g., 'str', 'num', 'json', or a custom class name).
-   `__watchers`: A `Set` of callback functions to execute when the node's value changes.

#### 3. Value-First Traversal
When you access a path like `fx.app.user.name`, FX follows a specific lookup order at each step:
1.  **Instance Properties:** If the current node is an instance of a class, it checks for properties or methods on that instance first.
2.  **JSON Value:** If the node is of type `json`, it checks for a key within its `__value.json` object.
3.  **Child Nodes:** It checks for a child node in `__nodes`.

This allows you to seamlessly mix structured data and object-oriented behavior.

#### 4. Reactivity with `.watch()`
Reactivity is opt-in. To react to changes in a node, you attach a listener using the `.watch()` method.

```javascript
// Watch for changes to the user's name
const unwatch = $$('app.user.name').watch((newValue, oldValue) => {
    console.log(`User name changed from "${oldValue}" to "${newValue}"`);
});

// This will trigger the watcher
$$('app.user.name', 'Jane');

// To clean up, call the returned function
unwatch();
```

#### 5. The Universal Plugin System
FX's plugin system is designed for simplicity and power. It uses a synchronous loader, meaning you can load and use a plugin in one go without `async/await`.

```javascript
// Load and configure a plugin in one line
const myPlugin = $$('myplugin@/plugins/my-plugin.js').plugin({
    global: '$myplugin', // Optional: make it globally accessible as $myplugin
    prefix: 'myplugin',  // Optional: make it accessible as $$.myplugin
    options: { /* plugin-specific config */ }
});
```

---

### API Reference

#### The `$$` Main Accessor
-   `$$(path)`: Retrieves a proxy to the node at the specified `path`.
-   `$$(path, value)`: Sets the `value` of the node at `path`. If `value` is an array `[arg1, arg2]`, it will attempt to call the node's function with those arguments.
-   `$$('prefix@path').plugin(config)`: Loads a plugin from `path`.

#### Node Proxy Methods
When you get a node proxy via `$$(path)`, it has several built-in methods:
-   `.val()`: Gets the node's value.
-   `.val(newValue)`: Sets the node's value and returns the node proxy for chaining.
-   `.set(newValue)`: Same as `.val(newValue)`.
-   `.watch(callback)`: Adds a watcher to the node. Returns a function to unregister the watcher.
-   `.type()`: Gets the node's `__type`.
-   `.inherit(className)`: Adds a class name to the node's prototype chain (`__proto`).
-   `.node()`: Returns the raw, underlying node object.

#### Global Helper Functions
For convenience, FX provides several global helper functions.
-   `$val(path, [value], [defaultValue])`: A global shortcut for `$$?.(path)?.val()`.
-   `$set(path, key, value)`: A global shortcut for `$$?.(path)?.set(key, value)`.
-   `$get(path, key, [defaultValue])`: A global shortcut for `$$?.(path)?.get?.(key, defaultValue)`.
-   `$has(path)`: Checks if a node exists at `path`.
-   `$if(path, callback)`: Executes the callback if the node at `path` exists.
-   `$root(path)`: Returns a node proxy for the given path. Useful for creating direct-access variables (e.g., `$user = $root('app.user')`).

---
### Full Usage Example

```javascript
// fx-usage-example.js
import fx from './fx.js';

// 1. Creating and accessing data
console.log('--- Data Manipulation ---');
fx.app.settings.theme = 'dark';
fx.app.user.name = 'Charl';
fx.app.user.email = 'charl@example.com';
fx.app.user.roles = ['admin', 'editor'];

// Use the proxy to get values
console.log('User Name:', fx.app.user.name); // Accesses the value directly
console.log('Theme:', $$('app.settings.theme').val()); // Using the .val() method

// 2. Reactivity with watchers
console.log('\n--- Reactivity ---');
const unwatchTheme = $$('app.settings.theme').watch(newTheme => {
    console.log(`Theme changed to: ${newTheme}`);
    // In a real app, you might update the UI here:
    // document.body.className = newTheme;
});

$$('app.settings.theme', 'light'); // Triggers the watcher
unwatchTheme(); // Stop watching for changes

// 3. Loading Plugins
console.log('\n--- Plugin System ---');
// This assumes a mock 'fx-api.js' plugin exists at this path
const api = $$('api@/plugins/fx-api.js').plugin({
    prefix: 'api',
    global: '$api',
    options: {
        baseURL: 'https://api.example.com'
    }
});
console.log('API Plugin loaded:', !!api);

// 4. Using Plugins
// The API plugin provides a synchronous-style interface
// const userData = $api.get('/users/1');
// console.log('User data placeholder:', userData);
// userData.watch(data => {
//     console.log('Received user data:', data);
//     fx.app.user.profile = data; // Store the result in the FX graph
// });

// 5. Using Helper Functions
console.log('\n--- Helper Functions ---');
$val('app.user.name', 'John Doe'); // Set a value
console.log('Current user name:', $val('app.user.name')); // Get a value
if ($has('app.user.email')) {
    console.log('User email exists.');
}

// Create a direct proxy to a node
const $user = $root('app.user');
console.log('Direct proxy email:', $user.email);
$user.email = 'john.doe@example.com';
console.log('Updated email:', fx.app.user.email);
```

***

### 2. FX DOM Plugin Documentation (`fx-dom.js`)

# FX DOM Plugin

**`fx-dom.js`** is a comprehensive plugin that bridges the FX data graph with the browser's DOM. It provides a powerful, chainable, and reactive API for all your DOM manipulation needs.

---

### Key Features

-   **Chainable API:** All methods return the reactive element, allowing for clean, chained commands.
-   **Two-Way Data Binding:** Seamlessly sync DOM element values (like inputs) with FX nodes.
-   **Form Handling:** Intelligently gets and sets values for inputs, textareas, selects, checkboxes, and radio buttons.
-   **Attribute & Style Control:** Full control over attributes, classes, data attributes, and CSS styles.
-   **Event Handling:** Simple `.on()` and `.off()` methods for event management.
-   **Dynamic Content:** Load HTML from a server, with optional XSLT transformations.
-   **Advanced Reactivity:** Create multi-element bindings and calculated values that react to changes in the FX graph.

---

### API Reference

#### Selecting Elements
The plugin is typically registered with the global `$` prefix.

-   `$(selector)`: Selects one or more elements. Returns a single reactive element if one is found, or an array of them if multiple are found.

#### Value & Content
-   `.val()`: Gets the value of a form element.
-   `.val(newValue)`: Sets the value of a form element.
-   `.html()`: Gets the `innerHTML`.
-   `.html(newContent)`: Sets the `innerHTML`.
-   `.text()`: Gets the `textContent`.
-   `.text(newContent)`: Sets the `textContent`.

#### Attributes & Properties
-   `.attr(name)`: Gets an attribute's value.
-   `.attr(name, value)`: Sets an attribute.
-   `.removeAttr(name)`: Removes an attribute.
-   `.data(name)`: Gets a `data-*` attribute.
-   `.data(name, value)`: Sets a `data-*` attribute.
-   `.addClass(name)`
-   `.removeClass(name)`
-   `.toggleClass(name)`
-   `.hasClass(name)`: Returns boolean.
-   `.css(name)`: Gets a computed style property.
-   `.css(name, value)`: Sets a style property.
-   `.css({ prop1: val1, ... })`: Sets multiple style properties.

#### Events & Visibility
-   `.on(event, handler)`
-   `.off(event, handler)`
-   `.trigger(event, [data])`
-   `.show()` / `.hide()` / `.toggle()`

#### Reactivity
-   `.bindTo(fxPath)`: Creates a two-way binding between a DOM element (e.g., an input) and an FX node.
-   `$.createCalculatedBinding(dependencies, calculator, targetPath)`: Creates a new FX node at `targetPath` whose value is calculated based on other nodes.
-   `$.multiElementReactivity(fxPath, selectors, updater)`: Binds multiple DOM elements to a single FX node.

#### Dynamic Loading
-   `.loadHTML(url, [xsltUrl])`: Fetches HTML from a URL and injects it into the element. If `xsltUrl` is provided, it transforms the content first.

---
### Usage Examples

```html
<!-- index.html -->
<div id="app">
    <input type="text" id="name-input" placeholder="Your Name">
    <p>Hello, <span id="name-output"></span>!</p>

    <div id="content-area" style="border:1px solid #ccc; padding:10px; margin-top:10px;"></div>
</div>

<script type="module">
    import fx from './fx.js';
    const $ = fx.$$('dom@/plugins/fx-dom.js').plugin({ global: '$' });

    // 1. Basic Manipulation
    const nameInput = $('#name-input');
    nameInput.css({ border: '2px solid blue' }).attr('data-info', 'user-name');

    // 2. Two-Way Data Binding
    // Link the input field to an FX node
    nameInput.bindTo('user.name');

    // Link the output span to the same node
    const nameOutput = $('#name-output');
    fx.$$('user.name').watch(newName => {
        nameOutput.text(newName || 'World');
    });

    // Set an initial value in FX, which will update the input
    fx.user.name = 'Charl';

    // 3. Event Handling
    nameInput.on('focus', () => {
        console.log('Input focused!');
    });

    // 4. Dynamic Content Loading
    $('#content-area').loadHTML('/partials/welcome.html');
</script>
```

***

### 3. FX API Plugin Documentation (`fx-api.js`)

# FX API Plugin

**`fx-api.js`** is a complete HTTP client for the FX framework. It offers a clean, synchronous-style interface that simplifies asynchronous API calls by using "response placeholders." It supports all common HTTP methods, request/response interceptors, caching, and automatic retries.

---

### Core Concept: The Response Placeholder

When you make an API call (e.g., `api.get('/users')`), it **returns immediately** with a special placeholder object. This object is a proxy that will be populated with the response data once the request completes in the background.

You can interact with this placeholder in several ways:
-   **`.watch(callback)`:** The recommended FX way. The callback runs when the request is complete.
-   **`.then(onResolve, onReject)`:** It's a "thenable," so you can use it like a Promise.
-   **Direct Property Access:** In reactive contexts (like JSX), you can access properties directly (e.g., `response.name`). The UI will update when the data arrives.

---

### Key Features

-   **Synchronous-Style Interface:** No more `async/await` cluttering your main logic.
-   **Full HTTP Method Support:** `get`, `post`, `put`, `patch`, `delete`, `head`, `options`.
-   **Global Configuration:** Set a `baseURL`, default `headers`, `timeout`, and `retries`.
-   **Interceptors:** Add functions to modify requests before they are sent or responses after they are received.
-   **Response Caching:** Optional, time-based caching for GET requests to reduce network traffic.

---

### API Reference

#### Making Requests
Assuming the plugin is loaded as `api`:
-   `api.get(url, [config])`
-   `api.post(url, data, [config])`
-   `api.put(url, data, [config])`
-   `api.patch(url, data, [config])`
-   `api.delete(url, [config])`
-   `api.request(config)`: The underlying method for full control.

#### The Response Placeholder
-   `.watch((data, error) => { ... })`: React to the response.
-   `.loading`: A boolean property that is `true` while the request is in flight.
-   `.data`: The response body (once loaded).
-   `.status`: The HTTP status code.
-   `.headers`: The response headers.
-   `.error`: The error object, if the request failed.

#### Configuration
-   `api.setBaseURL(url)`
-   `api.setHeader(name, value)`
-   `api.setTimeout(ms)`
-   `api.setRetries(count)`
-   `api.addRequestInterceptor(func)`
-   `api.addResponseInterceptor(func)`
-   `api.enableCache([ttl])` / `api.disableCache()` / `api.clearCache()`

---

### Usage Example

```javascript
// Load the plugin
const api = $$('api@/plugins/fx-api.js').plugin({ prefix: 'api' });

// Configure it
api.setBaseURL('https://jsonplaceholder.typicode.com');
api.setHeader('X-Requested-With', 'FX-Framework');
api.enableCache(60000); // Cache GET requests for 1 minute

// 1. Simple GET Request
console.log('Fetching user...');
const userResponse = api.get('/users/1');

userResponse.watch((data, error) => {
    if (error) {
        console.error('Failed to fetch user:', error);
        return;
    }
    console.log('User data received:', data.name);
    // Store data in the FX graph
    $$('app.user', data);
});

// 2. POST Request
const newPost = {
    title: 'FX is Awesome',
    body: 'This is a post from the FX API plugin.',
    userId: 1
};

const postResponse = api.post('/posts', newPost);
postResponse.watch(data => {
    console.log('Created new post with ID:', data.id);
});

// 3. Using an Interceptor to add an Auth Token
api.addRequestInterceptor(config => {
    const token = 'my-secret-jwt-token';
    config.headers['Authorization'] = `Bearer ${token}`;
    console.log('Interceptor: Added auth header');
    return config; // Must return the modified config
});

// This request will now include the Authorization header
api.get('/todos/1');
```

***

### 4. FX ORM Plugin Documentation (`fx-orm.js`)

# FX ORM Plugin

**`fx-orm.js`** is a zero-boilerplate Object-Relational Mapper (ORM) for the FX framework. It is designed to make database interactions effortless with a synchronous-style API, fuzzy table name matching, and powerful CSS-style queries.

---

### Core Concepts

#### 1. Synchronous Interface & Reactive Results
Like the API plugin, the ORM provides a synchronous developer experience. When you query the database, it immediately returns a `ReactiveResult` placeholder. The query runs in the background, and the placeholder is populated with data when ready.

#### 2. Lazy Loading & Auto-Saving
`ReactiveResult` objects are smart:
-   **Lazy Loading:** Data is only fetched from the database when the object is first created.
-   **Auto-Saving:** If you modify a property on a `ReactiveResult` object, it is marked as "dirty" and automatically saved back to the database after a short delay.

#### 3. Fuzzy Table Matching
You don't need to remember exact table names. The ORM uses Levenshtein distance to find the closest match. For example, `$db('user')` will correctly match the `users` table.

#### 4. CSS-Style Queries
Select records using a familiar, CSS-like syntax.
-   `'#123'`: Select by ID.
-   `'.active'`: Select where `status = 'active'`.
-   `'[age>25]'`: Select with a condition.
-   `:limit(10)`: Add a `LIMIT` clause.
-   `:orderBy(name,desc)`: Add an `ORDER BY` clause.

---

### API Reference

#### Connecting
The ORM automatically connects if you provide connection options during plugin loading.
-   `orm.connect(connectionString)`: Manually connect to a database.

#### Querying
Assuming the plugin is loaded as `$db`:
-   `$db('tableName')` or `$db.tableName`: Returns a table proxy.
-   `$db('user').all()`: Selects all records.
-   `$db('user').select(query)`: Selects records using a CSS-style query.
-   `$db('user')[123]`: A shortcut to select by primary key.
-   `$db('user').create(data)`: Creates a new record.

#### The `ReactiveResult` Object
This is the object returned by all queries.
-   **Property Access:** `user.name` gets the name.
-   **Property Assignment:** `user.name = 'New Name'` updates the name and schedules an auto-save.
-   `.save()`: Manually trigger a save.
-   `.reload()`: Reload the data from the database.
-   `.delete()`: Delete the record(s) from the database.
-   `.toArray()`: Returns the data as a plain JavaScript array.

---
### Usage Example

```javascript
// 1. Load the ORM plugin with connection details
const $db = $$('db@/plugins/fx-orm.js').plugin({
    global: '$db',
    options: {
        type: 'postgres',
        database: 'myapp',
        username: 'user',
        password: 'pass'
    }
});

// 2. Querying for data (methods return immediately)
console.log('Fetching user with ID 1...');
const user = $db('user')[1]; // Fuzzy matches 'users' table, gets ID 1

// The 'user' object is a placeholder. You can watch it for data.
user.watch(data => {
    if (data) {
        console.log('Loaded user:', data.name);
    }
});

// 3. Updating a record (auto-saves)
setTimeout(() => {
    if (user.name) {
        console.log(`Updating user name from "${user.name}"...`);
        user.name = `Updated ${user.name}`;
        // No need to call save(), it happens automatically!
    }
}, 2000);

// 4. Creating a new record
console.log('Creating a new user...');
const newUser = $db.users.create({
    name: 'Jane Doe',
    email: 'jane@example.com',
    status: 'active'
});
// newUser is a placeholder that will be populated with the created record (including its new ID)

// 5. Using CSS-style queries
const activeUsers = $db.users.select('.active[age>30]:limit(5)');
activeUsers.watch(data => {
    if (data) {
        console.log(`Found ${data.length} active users over 30.`);
    }
});
```

***

### 5. FX JSX & ShadCN Plugins Documentation (`fx-jsx.js` & `fx-shadcn.js`)

# FX JSX Engine & ShadCN UI Library

This documentation covers two plugins that work together: `fx-jsx.js`, the reactive rendering engine, and `fx-shadcn.js`, a library of beautiful UI components built on top of it. Together, they provide a declarative and highly reactive way to build user interfaces that is more direct and often simpler than libraries like React.

---

## Part 1: FX JSX Engine (`fx-jsx.js`)

The JSX engine parses JSX-like syntax (as a string) and renders it into reactive DOM elements.

### Core Concepts

-   **Template Literals:** You write JSX inside standard JavaScript template literals.
-   **Native FX Reactivity:** Any FX node referenced inside an expression `{$$path.to.node}` will create a reactive binding. When the node changes, only the part of the DOM that depends on it will update.
-   **Custom Components:** You can create your own components by extending the `FXJSXComponent` base class.

### API Reference

-   `jsx.render(jsxString, containerSelector)`: Parses the JSX string and appends the result to the DOM element matching the selector.
-   `jsx.component(name, class)`: Registers a custom component class to be used as a tag in JSX.
-   `FXJSXComponent`: The base class for creating custom components. It provides `this.props`, `this.children`, and a `this.$$node` for managing component state within the FX graph.

---

## Part 2: FX ShadCN UI Library (`fx-shadcn.js`)

This plugin provides a suite of pre-built, beautifully styled components (like buttons, cards, inputs, and dialogs) that are fully integrated with the FX JSX engine.

### Setup

You must load both the JSX and ShadCN plugins.

```javascript
// Load JSX engine first
const jsx = $$('jsx@/plugins/fx-jsx.js').plugin({ global: 'jsx' });

// Load FX ShadCN components
const ui = $$('ui@/plugins/fx-shadcn.js').plugin({ global: 'ui' });
```

### Component Gallery

All component states are controlled by passing props, which can be reactive FX nodes.

#### `<Button>`
A versatile button component.
-   **Props:** `variant`, `size`, `loading`, `disabled`, `onClick`.
-   **Example:**
    ```javascript
    $$button = $root('ui.myButton');
    $$button.isLoading = false;

    jsx.render(`
        <Button
            loading={$$button.isLoading}
            onClick={() => $$button.isLoading = true}
        >
            Click Me
        </Button>
    `, '#container');
    ```

#### `<Input>`
A styled input field.
-   **Props:** `value`, `placeholder`, `type`, `disabled`, `error`, `onInput`.
-   **Example:**
    ```javascript
    $$form = $root('ui.myForm');
    $$form.name = '';

    jsx.render(`
        <Input
            placeholder="Enter your name"
            value={$$form.name}
            onInput={e => $$form.name = e.target.value}
        />
        <p>Hello, {$$form.name || 'stranger'}!</p>
    `, '#container');
    ```

#### `<Card>`, `<CardHeader>`, `<CardTitle>`, `<CardContent>`
Components for building content cards.
-   **Example:**
    ```javascript
    jsx.render(`
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle>Welcome to FX</CardTitle>
            </CardHeader>
            <CardContent>
                <p>This is a reactive card component.</p>
            </CardContent>
        </Card>
    `, '#container');
    ```

#### `<Dialog>`
A modal dialog component.
-   **Props:** `open`, `onClose`.
-   **Example:**
    ```javascript
    $$dialog = $root('ui.myDialog');
    $$dialog.isOpen = false;

    jsx.render(`
      <div>
        <Button onClick={() => $$dialog.isOpen = true}>Open Dialog</Button>
        <Dialog open={$$dialog.isOpen} onClose={() => $$dialog.isOpen = false}>
            <h2 class="text-lg font-semibold">Dialog Title</h2>
            <p>This is the dialog content.</p>
        </Dialog>
      </div>
    `, '#container');
    ```

#### `<Select>`
A dropdown select component.
-   **Props:** `value`, `options` (array of `{value, label}`), `onValueChange`.

#### `<Toast>` Utility
The plugin provides a global utility for showing toast notifications.
-   `ui.toast({ title, description, variant, duration })`
-   **Example:** `ui.toast({ title: 'Success!', description: 'Profile saved.', variant: 'default' });`

---

### Full Example: A Reactive Login Form

```html
<!-- index.html -->
<div id="login-form-container"></div>
<div id="toast-container"></div> <!-- ShadCN adds its own toast container -->

<script type="module">
    import fx from './fx.js';

    // Setup
    const jsx = $$('jsx@/plugins/fx-jsx.js').plugin({ global: 'jsx' });
    const ui = $$('ui@/plugins/fx-shadcn.js').plugin({ global: 'ui' });

    // Create FX nodes to hold the form state
    const $login = $root('forms.login');
    $login.email = '';
    $login.password = '';
    $login.isLoading = false;
    $login.error = '';

    // Define the login logic
    const handleLogin = () => {
        $login.isLoading = true;
        $login.error = '';

        // Simulate API call
        setTimeout(() => {
            if ($login.email === 'test@test.com' && $login.password === 'password') {
                ui.toast({ title: 'Login Successful', description: 'Welcome back!' });
            } else {
                $login.error = 'Invalid email or password.';
                ui.toast({ title: 'Login Failed', variant: 'destructive' });
            }
            $login.isLoading = false;
        }, 1500);
    };

    // Render the form using JSX
    jsx.render(`
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle>Login</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-1">
                    <label>Email</label>
                    <Input
                        type="email"
                        placeholder="user@example.com"
                        value={$login.email}
                        onInput={e => $login.email = e.target.value}
                    />
                </div>
                <div className="space-y-1">
                    <label>Password</label>
                    <Input
                        type="password"
                        value={$login.password}
                        onInput={e => $login.password = e.target.value}
                    />
                </div>
                {$login.error && (
                    <p className="text-sm text-red-500">{$login.error}</p>
                )}
                <Button
                    className="w-full"
                    loading={$login.isLoading}
                    onClick={handleLogin}
                >
                    Login
                </Button>
            </CardContent>
        </Card>
    `, '#login-form-container');
</script>
```

***

### 6. FX Components Plugin Documentation (`fx-components.js`)

# FX Components Plugin

**`fx-components.js`** is a powerful modular component system for FX. It allows you to define components in `.fxc` files, which can "morph" between different states (or types) based on changes in their underlying FX data node. It's designed for building complex, stateful UI elements that are decoupled from their presentation.

---

### Core Concepts

#### 1. `.fxc` File Structure
A component is defined in one or more `.fxc` files. These files use a custom tag-based syntax to separate different aspects of a component type.

-   **Metadata:** A YAML-like block at the top for global component settings (e.g., `--- \n key: value \n ---`).
-   **Type Blocks:** Sections for different component states, like `<type:active>`, `<type:success>`, or `<type:error>`.
-   **Content Sections:** Inside a type block, you can have `<template>`, `<style>`, and `<script>` sections.

**Example `fx-card.fxc`:**
```html
---
name: FX Card
style_scoped: true
morphing:
  $$this.isSuccess: success
  $$this.hasError: error
---
<type:default>
    <template>
        <div>
            <h3>{{ $$this.title }}</h3>
            <p>{{ $$this.message }}</p>
        </div>
    </template>
</type:default>

<type:success>
    <template>
        <div style="border-left: 4px solid green;">
            <h3>Success: {{ $$this.title }}</h3>
        </div>
    </template>
    <script>
        console.log('Morphed to success state!');
    </script>
</type:success>

<type:error>
    <template>
        <div style="border-left: 4px solid red;">
            <h3>Error: {{ $$this.title }}</h3>
            <p>Details: {{ $$this.errorDetails }}</p>
        </div>
    </template>
</type:error>
```

#### 2. Morphing
A component "morphs" by changing its `__type`. This can be triggered in two ways:
1.  **Declaratively:** Using `morphing` rules in the metadata. The component watches the specified FX node condition and automatically changes its type when the condition becomes true.
2.  **Programmatically:** By directly setting the type on the component's node (e.g., `$card.type('success')`).

When a component morphs, it updates its DOM structure, styles, and executes any associated scripts for the new type.

#### 3. Custom Elements
The plugin automatically defines a custom HTML element for each loaded component (e.g., `fx-card` for a component named `fx-card`). You can place these in your HTML and link them to an FX node via the `fx-path` attribute.

---

### API Reference

#### Loading and Managing Components
Assuming the plugin is loaded as `$comp`:
-   `$comp.load(name, [path])`: Asynchronously loads a component and its type-specific files from the file system.
-   `$comp.create(nodePath, componentName)`: Programmatically creates a component instance linked to an FX node without needing a DOM element.
-   `$comp.get(name)`: Retrieves the parsed component definition.
-   `$comp.list()`: Returns an array of loaded component names.

#### Morphing Node API
When a component is instantiated, it's represented by a `FXMorphingNode` which exposes methods on its corresponding FX node proxy:
-   `$myComponent.morph(newType)`: Manually triggers a morph to a new type.
-   `$myComponent.submit(endpoint)`: A helper for forms; wraps the component's data and submits it to an API endpoint.
-   `$myComponent.receive(data)`: A helper for forms; expands received data back into the component's FX node.

---
### Usage Example

#### 1. Define the Component Files
-   `/components/status-card/status-card.fxc` (as shown in the example above, but for a "status-card")
-   `/components/status-card/status-card.active.fxc` (can contain overrides for the 'active' type)

#### 2. Use in HTML and JavaScript

```html
<!-- index.html -->
<div id="status-container">
    <h2>API Status</h2>
    <status-card fx-path="api.status"></status-card>
</div>

<script type="module">
    import fx from './fx.js';

    // 1. Load the components plugin
    const $comp = $$('comp@/plugins/fx-components.js').plugin({ global: '$comp' });

    // 2. Load the component definition from the file system
    await $comp.load('status-card');

    // 3. Get a handle to the component's FX node
    const $status = $root('api.status');

    // 4. Set data on the node. The component will render this.
    $status.title = 'API Health';
    $status.message = 'All systems operational.';

    // 5. Trigger morphing by changing the state
    // The morphing rule `$$this.isSuccess: success` in the .fxc file will handle this.
    setTimeout(() => {
        $status.isSuccess = true;
    }, 3000);

    // Later, if an error occurs:
    setTimeout(() => {
        $status.isSuccess = false; // Reset first
        $status.hasError = true;
        $status.errorDetails = 'Upstream service timed out.';
    }, 6000);
</script>
```