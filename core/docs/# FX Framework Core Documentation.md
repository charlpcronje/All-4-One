# FX Framework Core Documentation

## Overview

FX is a revolutionary reactive framework that provides native reactivity without virtual DOM. It uses a unique node-based system where changes to nodes automatically update the UI.

## Core Concepts

### 1. FX Nodes
Every piece of data in FX is stored in nodes that can hold multiple types and automatically notify watchers when changed.

```javascript
// Node structure
{
  __id: 'unique-id',
  __parent_id: 'parent-id',
  __nodes: {},           // Child nodes
  __value: {},           // Values by type
  __type: 'current-type',
  __proto: [],           // Prototype chain
  __effects: [],         // Effect functions
  __watchers: Set(),     // Change watchers
  __instances: Map()     // Class instances
}
```

### 2. Multi-Type Nodes
Unlike other frameworks, FX nodes can store multiple types simultaneously:

```javascript
$$user.name = "John";        // Sets as string
$$user.name = 42;            // Adds number type
$$user.name = new User();    // Adds class instance

// Access different types
$$user.name.val();            // Current active type
$$user.name.type('str').val(); // *
$$user.name.type('num').val(); // *
$$user.name.__instances.get('User') // * I don't know what this is for? Why have this?
```

## Core API

### Global Functions

#### `$$(path, value?)`
Main accessor function for FX nodes.

```javascript
// Get node
const userNode = $$('user');  // *

// Set value
$$('user.name', 'John');

// Chain operations
$$('user.profile').set({name: 'John', age: 30}); // * this will create 2 sub-nodes, make sure to state that
```

#### `$root(path)`
Creates direct access to FX nodes using helper syntax.

```javascript
// Create direct reference
$$user = $root('user.profile'); // * Do we still need to do this? 

// Now use directly
$$user.name = 'John';
$$user.age = 30;
$$user.save();   // * What does save mean here?
```

#### `$val(path, value?, default?)`
Get/set values with optional defaults.

```javascript
// Get with default
const userName = $val('user.name', undefined, 'Anonymous');

// Set value
$val('user.name', 'John');

// Get current value
const currentName = $val('user.name');
```

#### `$set(path, key, value)` & `$get(path, key, default?)`
Set/get specific properties on nodes.

```javascript
// Set property
$set('user', 'name', 'John');
$set('user', 'age', 30);

// Get property with default
const userName = $get('user', 'name', 'Anonymous');
const userAge = $get('user', 'age', 0);
```

#### `$has(path)` & `$if(path, callback)`
Check existence and conditional execution.

```javascript
// Check if node exists
if ($has('user.profile')) {
    console.log('User has profile');
}

// Execute if exists
$if('user.email', (email) => {
    console.log('User email:', email);
});
```

## Node Methods

### `.val(value?)`
Get or set the primary value of a node.

```javascript
const user = $$('user');

// Set value
user.val({name: 'John', age: 30}); 

// Get value
const userData = user.val();
```

### `.set(value)`
Set a value and return the node for chaining.

```javascript
$$('user')
  .set({name: 'John'})
  .set('Active status'); // * Why does this change type, if it is because it is setting it is a sting and it use to be json, then state that. Becaue what I see should happen here is the $$("user") should now have a sub-node. So $$("user.name") ==  "John"; The second .set in the chain should have still referenced $$("user") not $$("user.name") and the $$("user").val() == "Active User"; and $$("user").type() == "str"; and $$("user.name") == "John"; or $$("user.name").val() == "John"; $$("user.name").type() == "str"
```

### `.type(newType?)`
Get or set the active type of a node.

```javascript
// Get current type
const currentType = $$('user').type(); // * State here what the default type would have been

// Set type (morphs the node)
$$('user').type('premium-user');  // * What would this even mean?
```

### `.watch(callback)`
Watch for changes to the node.

```javascript
// Watch for changes
const unwatch = $$('user.name').watch((newValue, oldValue, node) => {    // * Do we still use watch? What is the benefits?
    console.log(`Name changed from ${oldValue} to ${newValue}`);
});

// Stop watching
unwatch(); // * Why would someone unwatch something?
```

### `.inherit(protoName)`
Add a prototype to the node's prototype chain.

```javascript
// Add to prototype chain
$$('user').inherit('Saveable').inherit('Validatable'); // * explain where Saveable and Validarte comes from

// Now has methods from both prototypes
$$('user').save();
$$('user').validate();
```

### `.wrap()` & `.expand(data)`
Serialize and deserialize node data.

```javascript
// Serialize for API
const userData = $$('user').wrap(); // * first give $$("user") the data. ie $$("user",{user: "John", age: 30});
// Sends: {name: 'John', age: 30, _path: 'user', _type: 'object'}   //* would it be __path and __type and where does __path even come from?

// Deserialize from API  // * This would be JSON if it came from an API not object
$$('user').expand({
    name: 'John Updated',
    age: 31,
    lastLogin: new Date()
});
```

## Reactivity System

### Automatic UI Updates
Changes to FX nodes automatically update connected DOM elements.

```javascript
// Set up reactive binding
$$user = $root('user');  // * does $root('user'); actually make it reactive, I thought it is always reactive?
$$user.name = 'John';

// Any UI element bound to user.name updates automatically
// No manual re-rendering needed!

// Change triggers updates
$$user.name = 'Jane'; // UI updates instantly
```

### Multi-Element Reactivity
One FX node can update multiple UI elements simultaneously.

```javascript
// Multiple elements can bind to same node
$$status = $root('app.status');

// All these elements update when status changes
// Header status indicator
// Sidebar status badge  
// Footer status text

$$status.value = 'online'; // All update at once! // * Where does .value come from?
```

### Calculated Values
Set up reactive calculations between nodes.

```javascript
// Auto-calculate when dependencies change
$$cart = $root('cart');
$$cart.items = [{price: 10, qty: 2}, {price: 5, qty: 3}];

$$cart.watch(() => { // * eplain this example
    const total = $$cart.items.reduce((sum, item) => 
        sum + (item.price * item.qty), 0
    );
    $$cart.total = total;
});

// When items change, total updates automatically
$$cart.items.push({price: 15, qty: 1}); // total recalculates
```

## Plugin System

### Loading Plugins
FX uses a synchronous plugin loading system.

```javascript
// Load plugin with configuration
const api = $$('api@/plugins/fx-api.js').plugin({
    global: '$api',        // Available as global $api
    prefix: 'api',         // Available as fx.api
    options: {
        baseURL: 'https://api.example.com',
        timeout: 5000
    }
});

// Use immediately - no async/await needed
const userData = $api.get('/users/123');
```

### Plugin Registration Patterns
```javascript
// Method 1: With global access
$$('dom@/plugins/fx-dom.js').plugin({
    global: '$',           // Creates global $() function
    prefix: 'dom'          // Creates fx.dom
});

// Method 2: Local instance
const orm = $$('db@/plugins/fx-orm.js').plugin({
    options: {
        database: 'myapp',
        type: 'postgres'
    }
});

// Method 3: Multiple configurations
$$('cache@/plugins/fx-cache.js').plugin({
    global: '$cache',
    options: { maxSize: 1000, ttl: 300000 }
});
```

## Advanced Features

### Effects System
Add side effects that trigger on node changes.

```javascript
// Add effect to node //* we need better syntax for this
$effect($$('user'), (event, node, key, value) => {
    if (event === 'after.set' && key === 'name') {
        console.log('User name updated:', value);
        // Auto-save to server
        $api.post('/users/update', node.wrap());
    }
});
```

### Node Querying
Query nodes using CSS-like selectors.

```javascript
// Find all nodes of specific type  //* We need better syntax for this, we never speak about __type and now the dev is supposed to understand. It should maybe, fx("#"), what is this? $$$() is for css type selectors. and I asked for #("selector") not fx("#") weird 
const userNodes = fx('#')('[__type="user"]');

// Find all nodes (wildcard)
const allNodes = fx('#')('*');

// Custom queries
const activeUsers = fx('#')('[__type="user"][status="active"]');
```

### Cross-Node Communication
Nodes can communicate through shared state.

```javascript
// Set up shared communication channel
$$events = $root('app.events');

// Publisher
$$events.publish = (event, data) => { // * What is publish? I hate this syntax
    $$events[event] = {data, timestamp: Date.now()}; // * bad syntax
};

// Subscriber  
$$events.watch((newValue, oldValue, node) => {  // .watch is not supposed to be a thing any more, this very bad syntax
    // Handle all events
    Object.keys(newValue).forEach(eventType => {
        if (eventType !== 'publish') {
            handleEvent(eventType, newValue[eventType]);
        }
    });
});

// Usage
$$events.publish('user-login', {userId: 123});
$$events.publish('data-updated', {table: 'users'});
```

## Performance Considerations

### Efficient Updates
FX only updates what actually changed.

```javascript
// Only name field updates, not entire object
$$user.name = 'Updated Name';

// Batch updates for efficiency
$$user.val({
    name: 'New Name',
    email: 'new@email.com',
    lastLogin: new Date()
}); // Single update event 
```

### Memory Management // * No dev wants to worry about memory management
```javascript
// Clean up watchers when done
const unwatch = $$('data').watch(callback);
// Later...
unwatch(); // Prevents memory leaks

// Nodes are garbage collected when no references exist
let tempNode = $$('temp.data');
tempNode = null; // Node can be GC'd if no other references
```

### Debugging
```javascript
// Enable debug mode
fx.debug = true;

// Monitor node changes
$$('user').watch((newVal, oldVal, node) => { // * hate this syntax again
    console.log('Node changed:', {
        path: 'user',
        old: oldVal,
        new: newVal,
        type: node.__type
    });
});
```

## Best Practices

### 1. Use Helper Syntax
```javascript
// ✅ Good - Direct access
$$user = $root('user.profile');
$$user.name = 'John';

// ❌ Verbose
$$('user.profile.name', 'John');
```

### 2. Group Related Data
```javascript
// ✅ Good - Logical grouping
$$auth = $root('auth');
$$auth.user = {name: 'John', role: 'admin'};
$$auth.token = 'jwt-token';
$$auth.expires = new Date();

// ❌ Scattered
$$('user.name', 'John');
$$('token', 'jwt-token');
$$('expires', new Date());
```

### 3. Use Descriptive Paths
```javascript
// ✅ Good - Clear hierarchy
$$('ui.header.user.avatar');
$$('api.cache.users.list');
$$('forms.registration.validation.errors');

// ❌ Unclear
$$('data1.thing.stuff');
```

### 4. Clean Up Resources
```javascript
// ✅ Good - Clean up watchers
const cleanup = [];
cleanup.push($$('user').watch(userHandler));
cleanup.push($$('data').watch(dataHandler));

// When component unmounts
cleanup.forEach(fn => fn());
```

This covers the core FX framework. The reactive node system, helper functions, and plugin architecture provide a powerful foundation that's simpler and more efficient than traditional frameworks.

