// fx.mjs

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const manifest = {};
const fxRoot = createNode();

// --- FX Proxy handler ---
const handler = {
	get(target, key) {
		if (key === 'val') return (def) => fxRoot.val(undefined, def);
		if (key === 'get') return (def) => fxRoot.get(undefined, def);
		if (key === 'set') return (val, def) => fxRoot.set(val, def);
		if (key === 'api') return apiProxy;
		if (key === 'db') return dbProxy;
		if (key === '$get') return (path, def) => $(path, undefined, def).get();
		if (key === '$set') return (path, val, def) => $(path, val, def).set();
		if (key === '$val') return (path, def) => $(path, undefined, def).val(def);
		if (key === '$api') return apiProxy;
		if (key === '$db') return dbProxy;
		return $(key);
	},
	apply(target, thisArg, args) {
		return $(...args);
	}
};

const fx = new Proxy(function () {}, handler);
globalThis.fx = globalThis.$ = fx;

// --- Node structure ---
function createNode() {
	const node = {
		__value: undefined,
		__nodes: {},
		get(path, def) {
			if (path) return $(path, undefined, def).get();
			if (this.__value !== undefined) return this.__value;
			return this.__nodes;
		},
		set(val, def) {
			if (typeof val === 'object' && val !== null && val.constructor.name === 'Object') {
				this.__value = undefined;
				for (const [k, v] of Object.entries(val)) {
					this.__nodes[k] = wrap(v);
				}
			} else {
				this.__value = val;
			}
			return this.__value ?? def;
		},
		val(def) {
			return this.__value ?? def;
		}
	};
	return node;
}

function $(path, value, def) {
	if (!path) return fxRoot;
	const keys = path.split('.');
	let current = fxRoot;
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		if (!(key in current.__nodes)) {
			if (manifest[path]) {
				const imported = require(manifest[path]);
				current.__nodes[key] = wrap(imported);
				continue;
			}
			current.__nodes[key] = createNode();
		}
		current = current.__nodes[key];
	}
	if (value !== undefined) current.set(value, def);
	return current;
}

function wrap(val) {
	const node = createNode();
	node.set(val);
	return node;
}

const apiProxy = new Proxy({}, {
	get(_, method) {
		return (url, headers = {}, body = null, queryParams = {}) => {
			const res = { method, url, headers, body, queryParams, status: 'mock' };
			return wrap(res);
		};
	}
});

const dbProxy = new Proxy({}, {
	get(_, table) {
		return new Proxy({}, {
			get(_, action) {
				return (id) => {
					const result = { table, action, id, data: { id, name: 'Demo User' } };
					return wrap(result);
				};
			}
		});
	}
});

export default fx;
