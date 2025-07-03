# FX-WC: A Declarative, Data-Driven UI Architecture

## 1. Overview

FX-WC is a powerful architectural pattern for creating dynamic, reactive, and truly decoupled user interfaces. It leverages the core principles of the `fx.js` framework and standard Web Components to create a seamless bridge between application state and the rendered view.

The core principle is: **UI components are declarative views of an underlying `fx` data node.** The `fx` graph acts as the single source of truth, and the UI automatically reacts to any changes within that graph.

## 2. Core Concepts

*   **FX Node as ViewModel:** Each UI component is driven by a dedicated `fx` node. This node encapsulates the component's state, properties, and configuration.
*   **Web Component as View:** The visual representation and user interaction logic are encapsulated within a standard, framework-agnostic Web Component.
*   **Prototypal Inheritance:** New component instances are not created from scratch. Instead, they `inherit` from a pre-defined "template" or "prototype" `fx` node. This allows for efficient creation, shared defaults, and powerful dynamic updates to all instances by modifying the single template.
*   **Declarative Binding:** The link between an `fx` data node and its visual Web Component counterpart is established declaratively through a special `__type` convention.

## 3. The Architecture

The architecture consists of three main parts: defining templates, instantiating components, and the reactive two-way data flow.

### 3.1. Defining Component Templates

All reusable components are first defined as template nodes within a dedicated `wc.templates` namespace in the `fx` graph.

A template holds the default structure and data for a component.

**Example: Defining a "Counter" Component Template**
```javascript
// Get the node for our new template
const counterTemplate = $$('wc.templates.counter');

// Set its default data representation using the 'json' type
counterTemplate.type('json').set({
    label: 'Default Counter',
    count: 0
});
```

### 3.2. Registering and Instantiating Components

**Registration:**
A Web Component class must be registered with both the browser's `customElements` registry and a new `fx.registerWC()` method. `fx.registerWC(tagName, class)` links the component's tag name to its constructor.

**Instantiation:**
When a UI needs an instance of a component, a new `fx` node is created and linked to the template via prototypal inheritance.

```javascript
// Get the node for our new instance
const myCounterInstance = $$('ui.page.myFirstCounter');

// Inherit all properties and behaviors from the template
myCounterInstance.inherit($$('wc.templates.counter'));

// Set the __type to trigger the Web Component binding
myCounterInstance.type('WC:counter-component'); // 'counter-component' is the registered tag name
```

The `fx` runtime will automatically perform the following actions when `type('WC:...')` is called:
1.  Parse the tag name (`counter-component`).
2.  Look up its constructor in the `fx` Web Component registry.
3.  Create an instance: `const element = new CounterComponent()`.
4.  Inject the `fx` node into the element: `element.fx = myCounterInstance`.
5.  Store the element itself as the value for the `WC:counter-component` type on the `fx` node.

### 3.3. Two-Way Data Binding

The connection between the `fx` node and the Web Component is a closed, reactive loop.

**A. Data to View (fx Node -> WC):**
The Web Component is responsible for rendering its state by reading from its injected `fx` node. It uses `node.watch()` to automatically re-render whenever the data changes.

```javascript
// Inside the Web Component's connectedCallback()
this.fx.watch(() => this.render());
this.render();

render() {
  const count = this.fx.count.val(); // Reads from its own state or inherits from the prototype
  this.shadowRoot.querySelector('.count').textContent = count;
}
```

**B. View to Data (WC -> fx Node):**
The Web Component never modifies its own view directly. It modifies the data on its `fx` node, which in turn triggers the `watch`er to re-render the view.

```javascript
// Inside the Web Component's event listener
this.shadowRoot.querySelector('button').addEventListener('click', () => {
    const currentCount = this.fx.count.val();
    // This is the key: update the data model. The view will react automatically.
    this.fx.count.set(currentCount + 1);
});
```

## 4. The `wc` Bridge Property

To provide an "escape hatch" for direct manipulation (e.g., for animations or focus), each `fx` node can have a special `wc` property.

*   `myCounterInstance.wc.val()` would return the actual `<counter-component>` DOM element instance.

This allows for imperative control when necessary, without breaking the declarative data flow for state management.

## 5. Benefits

*   **Extreme Decoupling:** Business logic interacts only with the `fx` data graph, remaining completely unaware of the UI implementation.
*   **Reusability:** Templates provide a powerful and efficient way to reuse component definitions.
*   **Dynamic UI Composition:** Entire user interfaces can be defined as JSON (via `.wrap()` and `.expand()`) and materialized at runtime.
*   **Centralized State Management:** The `fx` graph is the single source of truth, eliminating state synchronization problems.
*   **Framework Agnostic:** This pattern is built on Web Standards and can be used within any framework (React, Vue, Svelte) or without one.
