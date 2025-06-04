-- Migration: 0000_initial_schema
-- Created at: 2025-06-02T18:17:00

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'user', 'manager')) NOT NULL DEFAULT 'user',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create apis table
CREATE TABLE IF NOT EXISTS apis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  base_url TEXT,
  type TEXT CHECK (type IN ('http', 'websocket', 'rpc')) NOT NULL DEFAULT 'http',
  config_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create endpoints table
CREATE TABLE IF NOT EXISTS endpoints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  api_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  method TEXT NOT NULL,
  description TEXT,
  config_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (api_id) REFERENCES apis(id)
);

-- Create logs table
CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
  endpoint_id INTEGER,
  phase TEXT CHECK (
    phase IN ('beforeRequest', 'request', 'afterRequest', 'beforeExecute', 'execute', 'afterExecute')
  ) NOT NULL,
  success INTEGER NOT NULL DEFAULT 1,
  message TEXT NOT NULL,
  metadata_json TEXT,
  FOREIGN KEY (endpoint_id) REFERENCES endpoints(id)
);

-- Create webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint_id INTEGER NOT NULL,
  phase TEXT CHECK (
    phase IN ('beforeRequest', 'request', 'afterRequest', 'beforeExecute', 'execute', 'afterExecute')
  ) NOT NULL,
  status_code INTEGER,
  url TEXT NOT NULL,
  FOREIGN KEY (endpoint_id) REFERENCES endpoints(id)
);

-- Create cache table
CREATE TABLE IF NOT EXISTS cache (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

-- Create retry_schedule table
CREATE TABLE IF NOT EXISTS retry_schedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL UNIQUE,
  endpoint_id INTEGER,
  next_try INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) NOT NULL DEFAULT 'pending',
  FOREIGN KEY (endpoint_id) REFERENCES endpoints(id)
);
