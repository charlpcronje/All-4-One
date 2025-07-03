# 📦 `fx-components` Design Document

## 🔧 Overview

**`fx-components`** is a framework for building dynamic, fully declarative Web Components using FXNodes as the reactive state layer. Instead of defining behavior imperatively in JavaScript, components are declared using `.fxc` files, which contain:

* Structured XML or FX DSL
* A minimal or optional JavaScript behavior section
* Optional XSLT-powered transformations for templating
* Fully deterministic, Promise-free hydration

---

## ✨ Core Goals

| Goal                              | Description                                                        |
| --------------------------------- | ------------------------------------------------------------------ |
| Declarative structure             | All component logic is described in a single `.fxc` file           |
| FXNode-first hydration            | Components hydrate into FXNodes, ready for reactivity and logic    |
| Synchronous runtime               | No Promises; loading and rendering are deterministic               |
| Dynamic insertion                 | Components can be added *anytime*, not just at page load           |
| DOM-binding via XSLT              | XSLT used as a structural compiler: injects FX binding boilerplate |
| Minimal JS footprint              | Most components don't need JS; if they do, it's clean and optional |
| WebWorker-powered loading (Scout) | Resource fetching runs off-thread using `Scout` for async loading  |

---

## 📁 `.fxc` File Structure

```fxc
---
name: Card
props: [title, content]
fx_proto: CardProto
fx_id: cardInstance
---

--- fx
{
  "__value": {
    "title": "Hello World",
    "content": "This card is powered by FX"
  },
  "__proto": "CardProto"
}
--- template
<fx-card>
  <fx-text path="title"/>
  <fx-text path="content"/>
</fx-card>
--- script
export default {
  mounted(node) {
    console.log("Card mounted:", node.val());
  }
}
```

---

## ⚙️ Component Lifecycle

### 1. Load `.fxc` file

Via `fx-loader` or a `<fx-xml>` web component (runtime or pre-bundled)

### 2. Parse sections

Split on `---` markers into:

* frontmatter (YAML-like)
* fx (JSON)
* template (HTML/XML or FX DSL)
* script (optional JS)
* style (optional)

### 3. Transform

Template is passed to XSLT (if applicable), injecting:

* DOM bindings
* FXNode awareness
* Event handlers

### 4. Hydrate

* DOM is inserted into shadow root
* FXNode is created via `expand()`
* Node is registered at `$$(fx_id)`

### 5. Bind

Any references like `fx.component.name` work *immediately*.

---

## 🧠 Runtime Stack

| Layer           | Role                                         |
| --------------- | -------------------------------------------- |
| `.fxc` file     | Source of truth                              |
| `Scout`         | WebWorker-powered file preloader             |
| `fx-loader`     | In-browser loader for `.fxc`, XML, XSL       |
| `XSLTProcessor` | Native transformation of template structure  |
| `expand()`      | Creates FXNode tree from DOM                 |
| `$$()`          | Proxy interface to access reactive node tree |

---

## 🔌 Web Component Example: `<fx-xml>`

```html
<fx-xml src="/components/card.xml" xslt="/fx/fx-core.xsl" fx-id="card1"></fx-xml>
```

Internally:

```js
connectedCallback() {
  Scout.fetchSync(this.src, this.xslt)
    .then(({ xml, xsl }) => {
      const result = transform(xml, xsl);
      const fxNode = expand(result);
      $$(this.getAttribute("fx-id")).set(fxNode);
    });
}
```

---

## 📦 File: `scout.js`

Handles all resource loading off-thread:

* Runs in WebWorker
* Uses sync XHR
* Shares data via `SharedArrayBuffer` and Atomics
* Guarantees all transforms are ready before expand()

---

## 🧩 FX-Specific Tags (used in XML template)

| Tag                                          | Behavior                               |
| -------------------------------------------- | -------------------------------------- |
| `<fx-text path="foo.bar"/>`                  | Inserts value and binds FXNode to span |
| `<fx-if test="user.loggedIn">...</fx-if>`    | Conditional render                     |
| `<fx-each path="items">...</fx-each>`        | Loop over FXNode array                 |
| `<fx-bind attr="value" path="form.name"/>`   | 2-way binding to inputs                |
| `<fx-on event="click" action="someMethod"/>` | Event dispatch                         |

These are compiled into real DOM + JS via XSLT and hydrated by `expand()`.

---

## 📁 Project Structure

```
fx/
├── components/
│   └── card.fxc
├── core/
│   ├── fx-core.xsl       # Base XSLT bindings
│   ├── fx-xml.js         # Web component loader
│   ├── scout.js          # Worker-powered loader
│   ├── scout-worker.js   # Runs in separate thread
│   └── fx-loader.js      # Entry point parser
```

---

## 🚦 Future Ideas

* `fx-style` block with scoped CSS
* `.fxlib` shared libraries of prebuilt FXNode types
* `fx-compose` for combining components
* Hot-reload dev server with live-rehydration
* Graph-based FXNode debugger

---

## ✅ Summary

**`fx-components`** is a declarative, promise-free, dynamically injectable component format powered by FXNode and native browser tech. It combines XML, XSLT, FXNode state, and scoped component logic into one elegant file format that can be injected, bound, and dot-accessed in real time with zero JS boilerplate.
