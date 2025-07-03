# FX Runtime - A Comprehensive Guide

## 1. Overview

**FX** is a dynamic, isomorphic, and composable runtime object that serves as the core data structure and execution context for the Digital Cabinet Relay (DCR) system. It is globally accessible via `$$` or `fx`.

The fundamental unit of the FX system is a **node**. Everything is a node, forming a hierarchical tree structure similar to a file system or the DOM. This design allows for unparalleled flexibility, introspection, and interoperability.

### Core Principles

*   **Everything is a Node:** From a simple string value to a complex API request context, every piece of data is an `fx` node.
*   **Dynamic by Default:** Nodes and paths are created on-the-fly as they are accessed. `$$('a.b.c')` automatically creates the `a`, `b`, and `c` nodes if they don't exist.
*   **Reactivity:** Nodes can be "watched." Any change to a node's value will notify all of its watchers, enabling real-time updates and reactive programming patterns.
*   **Isomorphism:** `fx.js` is designed to run in both Node.js (backend) and the browser (frontend), with environment-specific features handled gracefully.
*   **Data-Defined Execution:** `fx` nodes can describe a process (a "Process Definition Graph"). A separate service, the `ProcessRunner`, can execute this graph, making the system's logic fully dynamic and configurable.

---

## 2. Global Accessors

The FX system is exposed through three global accessors:

### `$$` (The Main Accessor)

This is the primary way to interact with the FX tree.

*   **Get a node:** `const userNode = $$('data.users.user1');`
*   **Set a value:** `$$('data.users.user1.name', 'Alice');`
*   **Get a value:** `const name = $$('data.users.user1.name').val(); // "Alice"`
*   **Call a function on a node:** `$$('utils.myFunction', [arg1, arg2]);`

### `$` (DOM Selector - Client-Side Only)

Acts like a jQuery selector, finding DOM elements and wrapping them in reactive `fx` nodes.

*   **Select an element:** `const inputNode = $('input#username');`
*   **Two-Way Binding:**
    *   Get DOM value: `const currentValue = inputNode.val();`
    *   Set DOM value: `inputNode.set('new-username');` (This updates the `<input>` element's value).
    *   DOM events on the input will automatically update `inputNode`.

### `$$$` (Graph Query Selector)

Queries the internal `fx` node graph using a CSS-attribute-like syntax.

*   **Find all nodes of a certain type:** `const allUserNodes = $$$('[__type="User"]');`
*   **Find all nodes in a failed state:** `const failedSteps = $$$('[__state="failed"]');`

---

## 3. The `fx` Node API

When you get a node (e.g., `const myNode = $$('path')`), it has several built-in methods:

### `.set(value)`

Sets the value of the node. The node intelligently guesses the type (`str`, `num`, `json`, class instance).
```javascript
$$('config.retries').set(3); // __type becomes 'num'
$$('user.data').set({ name: 'Bob' }); // __type becomes 'json', sub-nodes 'name' created
```

### `.val(defaultValue)`

Retrieves the primary value of the node, based on its `__type`.
```javascript
const retries = $$('config.retries').val(); // Returns the number 3
```

### `.type(newType)`

Gets or sets the primary type of the node.
```javascript
$$('config.timeout').type('str'); // The node will now return its value as a string.
```

### `.watch(callback)`

Registers a callback function to be executed whenever the node's value changes. The callback receives `(newValue, oldValue, node)`. Returns an `unwatch` function.
```javascript
const unwatch = $$('status').watch((newStatus) => {
    console.log(`Status changed to: ${newStatus}`);
});
// To stop listening:
unwatch();
```

### `.flow(name, processFn)` & `.execute(name, ...args)`

Defines and executes a named process on the node. The function is bound to the node (`this` refers to the node).
```javascript
$$('greeter').flow('sayHello', function(name) {
    this.message.set(`Hello, ${name}`);
});
await $$('greeter').execute('sayHello', 'World');
```

### `.wrap()` & `.expand(data)`

Handles serialization and hydration.

*   **.wrap():** Converts the entire `fx` node tree (from the current node down) into a clean, serializable JSON object. This is used for saving to the database.
*   **.expand(data):** Takes a JSON object (the output of `.wrap()`) and reconstructs the `fx` node tree from it, including instantiating any registered classes. This is used to hydrate a node from a saved definition.

### `.inherit(protoNode)`

Sets up prototypal inheritance from another `fx` node. If a property is not found on the current node, the lookup will continue up the prototype chain.

```javascript
const baseConfig = $$('config.base');
baseConfig.timeout.set(5000);

const userApiConfig = $$('config.userApi').inherit(baseConfig);
console.log(userApiConfig.timeout.val()); // 5000
```

---

## 4. Isomorphic Module & Class Loading

FX can load and instantiate classes, making it a powerful tool for dependency injection and plugins.

1.  **Register a Class:** Make a class known to the FX system.
    ```javascript
    class JwtVerifier { /* ... */ }
    fx.register(JwtVerifier); // Registers with name "JwtVerifier"
    ```

2.  **Define it in a Manifest:** Create a node that describes where to find the module.
    ```javascript
    $$('__modules.jwt', {
        location: './plugins/auth/jwt.js', // Path for require()
        export: 'JwtVerifier',             // The exported name
        type: 'JwtVerifier'                // The registered class name
    });
    ```

3.  **Instantiate Dynamically:** Use the `@` syntax to create an instance.
    ```javascript
    const myVerifier = $$('verifiers.prod@jwt');
    // `myVerifier` is now an instance of the JwtVerifier class.
    ```

This works on both the server (using a synchronous `require` helper) and the client (using a blocking Web Worker), providing a unified way to manage dependencies.
```