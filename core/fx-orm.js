/**
 * @file fx-orm.js
 * @description FX ORM Plugin - Zero-Boilerplate Database Access
 * 
 * Features:
 * - Fuzzy table matching via Levenshtein distance
 * - CSS-style database selectors
 * - Reactive database mirroring
 * - Automatic lazy loading and saving
 * - Zero configuration required
 */

/**
 * @class LevenshteinMatcher
 * @description Fuzzy string matching for table names
 */
class LevenshteinMatcher {
    static distance(a, b) {
        const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
        
        for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
        
        for (let j = 1; j <= b.length; j++) {
            for (let i = 1; i <= a.length; i++) {
                const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1,
                    matrix[j - 1][i] + 1,
                    matrix[j - 1][i - 1] + indicator
                );
            }
        }
        
        return matrix[b.length][a.length];
    }

    static similarity(a, b) {
        const maxLength = Math.max(a.length, b.length);
        if (maxLength === 0) return 100;
        return ((maxLength - this.distance(a, b)) / maxLength) * 100;
    }

    static findBestMatch(query, tables, threshold = 90) {
        let bestMatch = null;
        let bestScore = 0;
        
        const normalizedQuery = this.normalize(query);
        
        for (const table of tables) {
            const normalizedTable = this.normalize(table);
            
            if (normalizedQuery === normalizedTable) {
                return { table, score: 100, exact: true };
            }
            
            const score = this.similarity(normalizedQuery, normalizedTable);
            if (score > bestScore && score >= threshold) {
                bestMatch = { table, score, exact: false };
                bestScore = score;
            }
            
            if (normalizedTable.includes(normalizedQuery) || normalizedQuery.includes(normalizedTable)) {
                const substringScore = Math.max(score, 85);
                if (substringScore > bestScore) {
                    bestMatch = { table, score: substringScore, exact: false };
                    bestScore = substringScore;
                }
            }
        }
        
        return bestMatch;
    }

    static normalize(str) {
        return str
            .toLowerCase()
            .replace(/s$/, '')
            .replace(/ies$/, 'y')
            .replace(/es$/, '')
            .replace(/_/g, '')
            .replace(/-/g, '')
            .trim();
    }
}

/**
 * @class DatabaseQueryParser
 * @description Parse CSS-style database queries
 */
class DatabaseQueryParser {
    static parse(query) {
        const result = {
            action: 'select',
            conditions: [],
            limit: null,
            offset: null,
            orderBy: null,
            includes: []
        };

        const actionMatch = query.match(/^(select|update|delete|insert|find|get)/i);
        if (actionMatch) {
            result.action = actionMatch[1].toLowerCase();
        }

        const idMatch = query.match(/["']#([^"']+)["']/);
        if (idMatch) {
            result.conditions.push({
                field: 'id',
                operator: '=',
                value: this.parseValue(idMatch[1])
            });
        }

        const classMatch = query.match(/["']\.([^"']+)["']/);
        if (classMatch) {
            result.conditions.push({
                field: 'status',
                operator: '=',
                value: classMatch[1]
            });
        }

        const attrMatches = query.matchAll(/\[([^=><*^$!~]+)([=><*^$!~]+)([^\]]+)\]/g);
        for (const match of attrMatches) {
            const [, field, operator, value] = match;
            result.conditions.push({
                field: field.trim(),
                operator: this.normalizeOperator(operator),
                value: this.parseValue(value.replace(/['"]/g, ''))
            });
        }

        const pseudoMatches = query.matchAll(/:([a-zA-Z]+)(?:\(([^)]+)\))?/g);
        for (const match of pseudoMatches) {
            const [, pseudo, value] = match;
            switch (pseudo) {
                case 'first':
                    result.limit = 1;
                    break;
                case 'last':
                    result.limit = 1;
                    result.orderBy = { field: 'id', direction: 'desc' };
                    break;
                case 'limit':
                    result.limit = parseInt(value, 10);
                    break;
                case 'offset':
                    result.offset = parseInt(value, 10);
                    break;
                case 'orderBy':
                    const [field, direction = 'asc'] = value.split(',');
                    result.orderBy = { field: field.trim(), direction: direction.trim() };
                    break;
                case 'includes':
                    result.includes = value.split(',').map(s => s.trim());
                    break;
            }
        }

        return result;
    }

    static normalizeOperator(operator) {
        const operators = {
            '=': '=', '!=': '!=', '>': '>', '<': '<', '>=': '>=', '<=': '<=',
            '^=': 'LIKE', '$=': 'LIKE', '*=': 'LIKE', '~=': 'IN'
        };
        return operators[operator] || '=';
    }

    static parseValue(value) {
        if (/^\d+$/.test(value)) return parseInt(value, 10);
        if (/^\d*\.\d+$/.test(value)) return parseFloat(value);
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (value === 'null') return null;
        return value;
    }
}

/**
 * @class DatabaseConnector
 * @description Manages database connections - SYNCHRONOUS INTERFACE
 */
class DatabaseConnector {
    constructor(fx) {
        this.fx = fx;
        this.connections = new Map();
        this.adapters = new Map();
        this.registerAdapters();
    }

    registerAdapters() {
        // Register database adapters
        this.adapters.set('postgres', PostgresAdapter);
        this.adapters.set('mysql', MySQLAdapter);
        this.adapters.set('sqlite', SQLiteAdapter);
        this.adapters.set('mongodb', MongoAdapter);
    }

    // SYNCHRONOUS connection method - handles async internally
    connect(connectionString, options = {}) {
        const connectionId = options.name || 'default';
        const dbType = this.detectDatabaseType(connectionString);
        
        const AdapterClass = this.adapters.get(dbType);
        if (!AdapterClass) {
            throw new Error(`Unsupported database type: ${dbType}`);
        }

        const adapter = new AdapterClass(connectionString, options);
        
        // Connect synchronously from user perspective
        adapter.connectSync();  // Adapter handles async internally

        this.connections.set(connectionId, {
            adapter,
            type: dbType,
            options
        });

        console.log(`FX[ORM]: Connected to ${dbType} database (${connectionId})`);
        return adapter;  // Return immediately
    }

    detectDatabaseType(connectionString) {
        if (connectionString.startsWith('postgres://') || connectionString.startsWith('postgresql://')) {
            return 'postgres';
        }
        if (connectionString.startsWith('mysql://')) {
            return 'mysql';
        }
        if (connectionString.startsWith('sqlite://') || connectionString.includes('.db')) {
            return 'sqlite';
        }
        if (connectionString.startsWith('mongodb://')) {
            return 'mongodb';
        }
        throw new Error('Unable to detect database type from connection string');
    }

    getConnection(connectionId = 'default') {
        const connection = this.connections.get(connectionId);
        if (!connection) {
            throw new Error(`No connection found with ID: ${connectionId}`);
        }
        return connection;
    }
}

/**
 * @class BaseAdapter
 * @description Base database adapter class - SYNCHRONOUS INTERFACE
 */
class BaseAdapter {
    constructor(connectionString, options) {
        this.connectionString = connectionString;
        this.options = options;
        this.connection = null;
        this.tables = [];
        this.syncQueue = [];
        this.isConnected = false;
    }

    // Synchronous connect from user perspective
    connectSync() {
        console.log('FX[ORM]: Establishing connection...');
        
        // Start async connection in background
        this.connect().then(() => {
            this.isConnected = true;
            this.processSyncQueue();
        }).catch(error => {
            console.error('FX[ORM]: Connection failed:', error);
        });
        
        // Return immediately - connection happens in background
        console.log('FX[ORM]: Connection initiated');
    }

    // Process queued operations once connected
    processSyncQueue() {
        while (this.syncQueue.length > 0) {
            const operation = this.syncQueue.shift();
            operation();
        }
    }

    // Queue operation if not connected, execute immediately if connected
    queueOrExecute(operation) {
        if (this.isConnected) {
            return operation();
        } else {
            // Return placeholder that will be populated when connection is ready
            const placeholder = this.createPlaceholder();
            this.syncQueue.push(() => {
                const result = operation();
                this.populatePlaceholder(placeholder, result);
            });
            return placeholder;
        }
    }

    createPlaceholder() {
        // Create a placeholder object that can be populated later
        const placeholder = {
            _isPlaceholder: true,
            _populated: false,
            _data: null,
            _watchers: []
        };

        return new Proxy(placeholder, {
            get(target, key) {
                if (key.startsWith('_')) {
                    return target[key];
                }
                
                if (!target._populated) {
                    // Return undefined for unpopulated data
                    return undefined;
                }
                
                return target._data[key];
            },
            
            set(target, key, value) {
                if (key.startsWith('_')) {
                    target[key] = value;
                    return true;
                }
                
                if (!target._populated) {
                    console.warn('FX[ORM]: Setting value on unpopulated placeholder');
                    return false;
                }
                
                target._data[key] = value;
                return true;
            }
        });
    }

    populatePlaceholder(placeholder, data) {
        placeholder._data = data;
        placeholder._populated = true;
        // Notify any watchers
        placeholder._watchers.forEach(watcher => watcher(data));
    }

    async connect() {
        throw new Error('connect() must be implemented by adapter');
    }

    async executeQuery(query, params = []) {
        throw new Error('executeQuery() must be implemented by adapter');
    }
}

/**
 * @class PostgresAdapter
 * @description PostgreSQL database adapter
 */
class PostgresAdapter extends BaseAdapter {
    async connect() {
        // Mock implementation - would use 'pg' package in real implementation
        console.log('FX[ORM]: PostgreSQL adapter connected (mock)');
        this.tables = await this.discoverTables();
    }

    async discoverTables() {
        // Mock table discovery
        return ['users', 'user_profiles', 'user_settings', 'orders', 'order_items', 'products', 'categories'];
    }

    async executeQuery(sql, params = []) {
        console.log('FX[ORM]: Executing PostgreSQL query:', sql, params);
        return this.mockQueryResult(sql);
    }

    mockQueryResult(sql) {
        if (sql.includes('users') && sql.includes('id = 1')) {
            return {
                id: 1,
                name: 'John Doe',
                email: 'john@example.com',
                age: 30,
                status: 'active',
                created_at: new Date('2024-01-01')
            };
        }
        
        return [
            { id: 1, name: 'John Doe', email: 'john@example.com', age: 30, status: 'active' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25, status: 'active' },
            { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 35, status: 'inactive' }
        ];
    }
}

/**
 * @class MySQLAdapter
 * @description MySQL database adapter
 */
class MySQLAdapter extends BaseAdapter {
    async connect() {
        console.log('FX[ORM]: MySQL adapter connected (mock)');
        this.tables = await this.discoverTables();
    }

    async discoverTables() {
        return ['users', 'user_profiles', 'orders', 'products'];
    }

    async executeQuery(sql, params = []) {
        console.log('FX[ORM]: Executing MySQL query:', sql, params);
        return this.mockQueryResult(sql);
    }

    mockQueryResult(sql) {
        return [
            { id: 1, name: 'MySQL User', email: 'mysql@example.com', status: 'active' }
        ];
    }
}

/**
 * @class SQLiteAdapter
 * @description SQLite database adapter
 */
class SQLiteAdapter extends BaseAdapter {
    async connect() {
        console.log('FX[ORM]: SQLite adapter connected (mock)');
        this.tables = await this.discoverTables();
    }

    async discoverTables() {
        return ['users', 'orders', 'products'];
    }

    async executeQuery(sql, params = []) {
        console.log('FX[ORM]: Executing SQLite query:', sql, params);
        return this.mockQueryResult(sql);
    }

    mockQueryResult(sql) {
        return [
            { id: 1, name: 'SQLite User', email: 'sqlite@example.com', status: 'active' }
        ];
    }
}

/**
 * @class MongoAdapter
 * @description MongoDB database adapter
 */
class MongoAdapter extends BaseAdapter {
    async connect() {
        console.log('FX[ORM]: MongoDB adapter connected (mock)');
        this.tables = await this.discoverTables();
    }

    async discoverTables() {
        return ['users', 'orders', 'products'];
    }

    async executeQuery(query, options = {}) {
        console.log('FX[ORM]: Executing MongoDB query:', query, options);
        return this.mockQueryResult(query);
    }

    mockQueryResult(query) {
        return [
            { _id: '507f1f77bcf86cd799439011', name: 'Mongo User', email: 'mongo@example.com', status: 'active' }
        ];
    }
}

/**
 * @class ReactiveResult
 * @description Reactive database result with auto-save - COMPLETELY SYNCHRONOUS INTERFACE
 */
class ReactiveResult {
    constructor(orm, tableName, query, connectionId) {
        this.orm = orm;
        this.tableName = tableName;
        this.query = query;
        this.connectionId = connectionId;
        this.data = null;
        this.loaded = false;
        this.loading = false;
        this.dirty = false;

        // Start lazy loading immediately but don't block
        this.startLazyLoad();

        return new Proxy(this, {
            get: (target, key) => this.handleGet(target, key),
            set: (target, key, value) => this.handleSet(target, key, value)
        });
    }

    handleGet(target, key) {
        // Internal properties
        if (key.startsWith('_') || ['orm', 'tableName', 'query', 'connectionId', 'data', 'loaded', 'loading', 'dirty'].includes(key)) {
            return target[key];
        }

        // Methods
        if (key === 'save') return () => this.saveSync();
        if (key === 'reload') return () => this.reloadSync();
        if (key === 'delete') return () => this.deleteSync();
        if (key === 'toArray') return () => Array.isArray(this.data) ? [...this.data] : [this.data];
        if (key === 'first') return () => Array.isArray(this.data) ? this.data[0] : this.data;
        if (key === 'last') return () => Array.isArray(this.data) ? this.data[this.data.length - 1] : this.data;
        if (key === 'length') return Array.isArray(this.data) ? this.data.length : (this.data ? 1 : 0);

        // Access data - returns immediately, even if still loading
        if (this.data) {
            if (Array.isArray(this.data)) {
                return this.data[key];
            } else {
                return this.data[key];
            }
        }

        // Return undefined if data not loaded yet
        return undefined;
    }

    handleSet(target, key, value) {
        // Don't intercept internal properties
        if (key.startsWith('_') || ['orm', 'tableName', 'query', 'connectionId', 'data', 'loaded', 'loading', 'dirty'].includes(key)) {
            target[key] = value;
            return true;
        }

        // Update data if available
        if (this.data) {
            if (Array.isArray(this.data)) {
                if (typeof key === 'number' || /^\d+$/.test(key)) {
                    this.data[key] = value;
                }
            } else {
                this.data[key] = value;
            }
            
            this.dirty = true;
            this.scheduleAutoSave();
        }

        return true;
    }

    // Non-blocking lazy load
    startLazyLoad() {
        if (this.loading || this.loaded) return;
        
        this.loading = true;
        
        // Load in background without blocking
        setTimeout(() => {
            this.lazyLoadAsync().then(() => {
                this.loading = false;
                this.loaded = true;
                console.log('FX[ORM]: Data loaded in background for', this.tableName);
            }).catch(error => {
                this.loading = false;
                console.error('FX[ORM]: Background loading failed:', error);
            });
        }, 0);
    }

    async lazyLoadAsync() {
        try {
            console.log('FX[ORM]: Loading data for', this.tableName);
            
            const connection = this.orm.connector.getConnection(this.connectionId);
            const sql = this.buildSQL();
            
            this.data = await connection.adapter.executeQuery(sql);
            
        } catch (error) {
            console.error('FX[ORM]: Failed to load data:', error);
            throw error;
        }
    }

    buildSQL() {
        let sql = `SELECT * FROM ${this.tableName}`;
        
        if (this.query.conditions.length > 0) {
            const whereClause = this.query.conditions
                .map(c => `${c.field} ${c.operator} '${c.value}'`)
                .join(' AND ');
            sql += ` WHERE ${whereClause}`;
        }
        
        if (this.query.orderBy) {
            sql += ` ORDER BY ${this.query.orderBy.field} ${this.query.orderBy.direction.toUpperCase()}`;
        }
        
        if (this.query.limit) {
            sql += ` LIMIT ${this.query.limit}`;
        }
        
        if (this.query.offset) {
            sql += ` OFFSET ${this.query.offset}`;
        }
        
        return sql;
    }

    scheduleAutoSave() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        
        this.saveTimeout = setTimeout(() => {
            this.saveAsync();
        }, 1000);
        
        console.log('FX[ORM]: Auto-save scheduled for', this.tableName);
    }

    // Synchronous save interface
    saveSync() {
        if (!this.dirty) return this;
        
        // Start save in background
        this.saveAsync().catch(error => {
            console.error('FX[ORM]: Save failed:', error);
        });
        
        console.log('FX[ORM]: Save initiated for', this.tableName);
        return this;  // Return immediately
    }

    async saveAsync() {
        if (!this.dirty) return;
        
        try {
            console.log('FX[ORM]: Saving changes to', this.tableName);
            
            const connection = this.orm.connector.getConnection(this.connectionId);
            
            if (Array.isArray(this.data)) {
                for (const item of this.data) {
                    if (item.id) {
                        await connection.adapter.update(this.tableName, item, { id: item.id });
                    } else {
                        await connection.adapter.insert(this.tableName, item);
                    }
                }
            } else if (this.data) {
                if (this.data.id) {
                    await connection.adapter.update(this.tableName, this.data, { id: this.data.id });
                } else {
                    await connection.adapter.insert(this.tableName, this.data);
                }
            }
            
            this.dirty = false;
            console.log('FX[ORM]: Changes saved successfully');
            
        } catch (error) {
            console.error('FX[ORM]: Failed to save changes:', error);
            throw error;
        }
    }

    reloadSync() {
        this.loaded = false;
        this.data = null;
        this.startLazyLoad();
        return this;
    }

    deleteSync() {
        // Start delete in background
        this.deleteAsync().catch(error => {
            console.error('FX[ORM]: Delete failed:', error);
        });
        
        console.log('FX[ORM]: Delete initiated for', this.tableName);
        return this;
    }

    async deleteAsync() {
        try {
            console.log('FX[ORM]: Deleting from', this.tableName);
            
            const connection = this.orm.connector.getConnection(this.connectionId);
            
            if (Array.isArray(this.data)) {
                for (const item of this.data) {
                    if (item.id) {
                        await connection.adapter.delete(this.tableName, { id: item.id });
                    }
                }
            } else if (this.data && this.data.id) {
                await connection.adapter.delete(this.tableName, { id: this.data.id });
            }
            
            this.data = null;
            this.loaded = false;
            
            console.log('FX[ORM]: Deletion completed');
            
        } catch (error) {
            console.error('FX[ORM]: Failed to delete:', error);
            throw error;
        }
    }
}

/**
 * @class FXORMPlugin
 * @description Main ORM plugin class - COMPLETELY SYNCHRONOUS INTERFACE
 */
class FXORMPlugin {
    constructor(fx, options = {}) {
        this.fx = fx;
        this.options = options;
        this.name = 'orm';
        this.version = '1.0.0';
        this.description = 'Zero-boilerplate ORM with fuzzy table matching and CSS-style queries';
        
        this.connector = new DatabaseConnector(fx);
        this.resultCache = new Map();
        
        console.log('FX[ORM]: ORM plugin initialized');
        
        // Auto-connect if connection options provided - SYNCHRONOUS
        if (options.database || options.connectionString) {
            this.autoConnect();
        }
    }

    // SYNCHRONOUS auto-connect
    autoConnect() {
        try {
            let connectionString;
            
            if (this.options.connectionString) {
                connectionString = this.options.connectionString;
            } else {
                // Build connection string from options
                const { database, username, password, host = 'localhost', port, type = 'postgres' } = this.options;
                
                switch (type) {
                    case 'postgres':
                        connectionString = `postgresql://${username}:${password}@${host}:${port || 5432}/${database}`;
                        break;
                    case 'mysql':
                        connectionString = `mysql://${username}:${password}@${host}:${port || 3306}/${database}`;
                        break;
                    case 'sqlite':
                        connectionString = `sqlite://${database}`;
                        break;
                    case 'mongodb':
                        connectionString = `mongodb://${username}:${password}@${host}:${port || 27017}/${database}`;
                        break;
                    default:
                        throw new Error(`Unsupported database type: ${type}`);
                }
            }
            
            this.connect(connectionString);  // No await - synchronous interface
            
        } catch (error) {
            console.error('FX[ORM]: Auto-connect failed:', error);
        }
    }

    // SYNCHRONOUS connect interface
    connect(connectionString, options = {}) {
        return this.connector.connect(connectionString, options);  // No await needed
    }

    /**
     * @method table
     * @description Access table with fuzzy matching - SYNCHRONOUS
     * @param {string} tableName - Table name (fuzzy matched)
     * @param {string} connectionId - Connection ID
     * @returns {Object} Table proxy
     */
    table(tableName, connectionId = 'default') {
        const self = this;
        
        return new Proxy({}, {
            get(target, method) {
                if (method === 'select') {
                    return (query = 'select("*")') => self.select(tableName, query, connectionId);
                }
                
                if (method === 'find') {
                    return (query) => self.select(tableName, `find("${query}")`, connectionId);
                }
                
                if (method === 'where') {
                    return (conditions) => self.select(tableName, `select("*") [${conditions}]`, connectionId);
                }
                
                if (method === 'first') {
                    return () => self.select(tableName, 'select("*"):first', connectionId);
                }
                
                if (method === 'last') {
                    return () => self.select(tableName, 'select("*"):last', connectionId);
                }
                
                if (method === 'all') {
                    return () => self.select(tableName, 'select("*")', connectionId);
                }
                
                if (method === 'create') {
                    return (data) => self.create(tableName, data, connectionId);
                }
                
                // Direct ID access: table[1] -> select("#1")
                if (typeof method === 'string' && /^\d+$/.test(method)) {
                    return self.select(tableName, `select("#${method}")`, connectionId);
                }
                
                return undefined;
            }
        });
    }

    // SYNCHRONOUS select - returns immediately
    select(tableName, query = 'select("*")', connectionId = 'default') {
        // Find best matching table
        const connection = this.connector.getConnection(connectionId);
        const tableMatch = LevenshteinMatcher.findBestMatch(tableName, connection.adapter.tables || [tableName]);
        
        if (!tableMatch) {
            console.warn(`FX[ORM]: No exact table match for "${tableName}", using as-is`);
            // Use the provided name if no fuzzy match found
            var matchedTable = tableName;
        } else {
            var matchedTable = tableMatch.table;
            console.log('FX[ORM]: Table matched', { 
                query: tableName, 
                matched: tableMatch.table, 
                score: tableMatch.score 
            });
        }

        // Parse CSS-style query
        const parsedQuery = DatabaseQueryParser.parse(query);
        
        // Create cache key
        const cacheKey = `${matchedTable}:${JSON.stringify(parsedQuery)}:${connectionId}`;
        
        if (!this.resultCache.has(cacheKey)) {
            this.resultCache.set(cacheKey, new ReactiveResult(
                this,
                matchedTable,
                parsedQuery,
                connectionId
            ));
        }

        return this.resultCache.get(cacheKey);  // Return immediately
    }

    // SYNCHRONOUS create
    create(tableName, data, connectionId = 'default') {
        const connection = this.connector.getConnection(connectionId);
        const tableMatch = LevenshteinMatcher.findBestMatch(tableName, connection.adapter.tables || [tableName]);
        
        const matchedTable = tableMatch ? tableMatch.table : tableName;

        console.log('FX[ORM]: Creating record in', matchedTable);
        
        // Start creation in background, return placeholder
        const placeholder = { ...data, _creating: true };
        
        // Execute create asynchronously
        connection.adapter.insert(matchedTable, data).then(result => {
            Object.assign(placeholder, result);
            placeholder._creating = false;
            console.log('FX[ORM]: Record created successfully');
        }).catch(error => {
            console.error('FX[ORM]: Create failed:', error);
            placeholder._error = error;
            placeholder._creating = false;
        });
        
        return placeholder;  // Return immediately
    }

    // Direct table access - enables fx.orm('users') syntax
    call(tableName, connectionId) {
        return this.table(tableName, connectionId);
    }

    // Enable function-like access
    valueOf() {
        return this.call.bind(this);
    }

    toString() {
        return this.call.bind(this);
    }

    // Make it callable
    [Symbol.toPrimitive]() {
        return this.call.bind(this);
    }
}

// Proxy wrapper to make the plugin callable
function createORMProxy(ormInstance) {
    return new Proxy(ormInstance, {
        apply(target, thisArg, args) {
            return target.table(...args);
        },
        
        get(target, prop) {
            if (prop in target) {
                return target[prop];
            }
            
            // Direct table access: orm.users
            return target.table(prop);
        }
    });
}

// Export as callable function that creates the proxy
export default function(fx, options) {
    const ormInstance = new FXORMPlugin(fx, options);
    return createORMProxy(ormInstance);
}

