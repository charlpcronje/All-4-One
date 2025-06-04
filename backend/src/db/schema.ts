import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, primaryKey } from 'drizzle-orm/sqlite-core';

// Users table
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['admin', 'user'] }).notNull().default('user'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

// Permissions table
export const permissions = sqliteTable('permissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  resource: text('resource').notNull(),
  action: text('action').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

// APIs table
export const apis = sqliteTable('apis', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  baseUrl: text('base_url'),
  type: text('type', { enum: ['http', 'websocket', 'rpc'] }).notNull().default('http'),
  config: text('config').notNull(),
  configHash: text('config_hash').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

// Endpoints table
export const endpoints = sqliteTable('endpoints', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  apiId: integer('api_id').notNull().references(() => apis.id),
  path: text('path').notNull(),
  method: text('method').notNull(),
  description: text('description'),
  version: text('version').notNull().default('v1'),
  config: text('config').notNull(),
  configHash: text('config_hash').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

// Logs table
export const logs = sqliteTable('logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  timestamp: text('timestamp').default(sql`CURRENT_TIMESTAMP`),
  endpointId: integer('endpoint_id').references(() => endpoints.id),
  phase: text('phase', {
    enum: ['beforeRequest', 'request', 'afterRequest', 'beforeExecute', 'execute', 'afterExecute']
  }).notNull(),
  success: integer('success', { mode: 'boolean' }).notNull(),
  message: text('message').notNull(),
  metadataJson: text('metadata_json')
});

// Webhooks table
export const webhooks = sqliteTable('webhooks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  endpointId: integer('endpoint_id').notNull().references(() => endpoints.id),
  phase: text('phase', {
    enum: ['beforeRequest', 'request', 'afterRequest', 'beforeExecute', 'execute', 'afterExecute']
  }).notNull(),
  statusCode: integer('status_code'),
  url: text('url').notNull()
});

// Cache table
export const cache = sqliteTable('cache', {
  key: text('key').primaryKey(),
  valueJson: text('value_json').notNull(),
  expiresAt: integer('expires_at').notNull()
});

// Retry schedule table
export const retrySchedule = sqliteTable('retry_schedule', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  requestId: text('request_id').notNull().unique(),
  endpointId: integer('endpoint_id').references(() => endpoints.id),
  nextTry: integer('next_try').notNull(),
  attempts: integer('attempts').notNull().default(0),
  status: text('status', { enum: ['pending', 'processing', 'completed', 'failed'] }).notNull().default('pending')
});

// Imported collections table (stores raw collections that can be selectively imported)
export const collections = sqliteTable('collections', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  type: text('type').notNull(), // e.g., "postman", "openapi"
  rawData: text('raw_data').notNull(), // Original raw collection data
  configHash: text('config_hash').notNull(),
  ownerId: integer('owner_id').references(() => users.id).notNull(), // User who imported the collection
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Collection shares table (tracks which users have access to which collections)
export const collectionShares = sqliteTable(
  'collection_shares',
  {
    collectionId: integer('collection_id').references(() => collections.id).notNull(),
    userId: integer('user_id').references(() => users.id).notNull(),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.collectionId, table.userId] }),
    };
  }
);

// Active endpoints table (tracks which endpoints have been activated from collections)
export const activeEndpoints = sqliteTable('active_endpoints', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  collectionId: integer('collection_id').references(() => collections.id).notNull(),
  endpointId: integer('endpoint_id').references(() => endpoints.id).notNull(),
  activatedBy: integer('activated_by').references(() => users.id).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  activatedAt: text('activated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});
