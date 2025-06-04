# Digital Cabinet Relay - Comprehensive Design Document

## 1. Overview

The DCR is a fullstack, extensible orchestration engine designed to:

* Import Postman collections and expose them as modular, managed endpoints
* Integrate and communicate with arbitrary sub-APIs (microservices) via HTTP, WebSocket (WS), and RPC
* Apply a declarative lifecycle execution model to each request and DB operation
* Store configuration, permission, and user data in a persistent database
* Log all activities, errors, and metadata to SQLite, with scheduled export to S3
* Visualize runtime and flow graphs via a D3-based dashboard frontend
* Support runtime configuration overrides, caching, retries, auth, and webhooks at every phase

The system is designed for **runtime flexibility**, **multi-tech interoperability**, and **developer observability**.

---

## 2. Technology Stack

| Layer         | Technology                      | Notes                                         |
| ------------- | ------------------------------- | --------------------------------------------- |
| Web Framework | Hono (Node.js + TypeScript)     | Fast, ESM-friendly web server with WS support |
| ORM           | Drizzle ORM                     | Type-safe, SQLite & Postgres compatible       |
| DB (runtime)  | SQLite (local), Postgres (prod) | Logs + Users + Endpoint definitions           |
| Validation    | Zod                             | Shared schema between frontend/backend        |
| Config        | `.env` + hierarchical `.json`   | Global + API-level + Endpoint-level overrides |
| Frontend      | Vite + React + ShadCN           | Dashboard, dark/light mode, D3 visualizer     |
| Visualization | D3.js                           | Flow diagram of request lifecycles            |
| State Sharing | WebSocket, HTTP, RPC (custom)   | For real-time communication and fallback      |
| Logging       | Configurable (SQLite, PG, MySQL, File) + Archival (S3, FTP, Local) | Driver-based, typed, with lifecycle & archival |
| Auth          | JWT / API key / per-endpoint    | Pluggable in lifecycle hooks                  |

---

## 3. `.env` Structure

```ini
# Main Database
DATABASE_URL="sqlite:///./data/dcr.db"

# Orchestrator Mode
ORCHESTRATOR_MODE=dev # dev, prod, test

# AWS Credentials (used for S3 log archiving and potentially other AWS services)
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
S3_REGION=your_s3_region # e.g., us-east-1

# Log Archiving & Storage Configuration
LOG_STORAGE_DRIVER=s3 # s3, ftp, archive
LOG_STORAGE_INTERVAL=7 # In days, how long to keep logs locally before archiving
LOG_STORAGE_ZIP_OPTION=zipPerLog # zipPerLog, zipAllTogether, none

# S3 Specific Log Storage
S3_BUCKET_NAME=your_dcr_archived_logs_bucket
S3_STORAGE_PREFIX=logs/production/ # Optional prefix within the bucket

# FTP Specific Log Storage
FTP_HOST=your_ftp_host
FTP_PORT=21
FTP_USER=your_ftp_user
FTP_PASSWORD=your_ftp_password
FTP_REMOTE_PATH=/dcr_archived_logs/

# Archive (Local Filesystem) Specific Log Storage
LOG_STORAGE_ARCHIVE_PATH=/mnt/dcr_archived_logs/
```

---

## 4. Config Hierarchy

### 4.1 Orchestrator Config (`config/orchestrator.json`)

```json
{
  "logLevel": "debug",
  "defaultRetries": 3,
  "defaultCacheTtl": 300,
  "lifecycle": {
    "beforeRequest": ["auth", "cache", "log"],
    "request": ["fetch"],
    "afterRequest": ["log", "webhook"]
  }
}
```

### 4.2 API Config (`apis/salesforce/config.json`)

```json
{
  "auth": {
    "type": "oauth2",
    "tokenUrl": "https://login.salesforce.com/oauth2/token"
  },
  "baseUrl": "https://api.salesforce.com/v1"
}
```

### 4.3 Endpoint Config (`apis/salesforce/endpoints/getUsers.json`)

### 4.4 Logging and Archiving Strategy

The DCR employs a flexible and configurable logging system for both main orchestrator/API operations and for archiving logs to long-term storage.

#### 4.4.1 Main Logging System

The primary logging system is designed to be adaptable to different database backends and file-based outputs.

*   **Log Drivers**: Each defined log type can specify a driver. Supported drivers include:
    *   `mysql`: For logging to a MySQL database.
    *   `postgresql`: For logging to a PostgreSQL database.
    *   `sqlite`: Default for local/runtime logs before archiving (uses the main `DATABASE_URL` or a separate one).
    *   `file`: For simple file-based logging (e.g., rotating log files).
*   **Log Classification/Types**: Logs will be categorized (e.g., `application`, `security`, `request_lifecycle`, `database_query`, `external_api_call`) to allow for granular configuration, filtering, and routing to different drivers or storage.
*   **Configuration**:
    *   Main logging configuration (default driver, log levels per type, driver-specific settings) will reside in `config/orchestrator.json`.
    *   This configuration is inherited by sub-APIs, which can override parts of it in their respective API-level or endpoint-level `config.json` files.
    *   Example `orchestrator.json` addition for logging:
        ```json
        {
          // ... existing orchestrator config (logLevel, defaultRetries, etc.) ...
          "logging": {
            "defaultDriver": "sqlite", 
            "logTypes": {
              "application": { "driver": "file", "level": "info" },
              "request_lifecycle": { "driver": "sqlite", "level": "debug" },
              "security": { "driver": "mysql", "level": "warn" }
            },
            "drivers": {
              "sqlite": {
                // Uses main DATABASE_URL by default if not specified
                // "connectionString": "sqlite:///./data/dcr_audit_logs.db" 
              },
              "file": {
                "basePath": "./logs/", // Base directory for log files
                "maxSizeMB": 10,      // Max size per log file before rotation
                "maxFiles": 7         // Number of rotated files to keep
              },
              "mysql": {
                "connectionString": "mysql://user:pass@host:port/dbname_logs"
              },
              "postgresql": {
                "connectionString": "postgresql://user:pass@host:port/dbname_logs"
              }
            }
          }
        }
        ```

#### 4.4.2 Log Archiving and Long-Term Storage

Logs, especially those initially stored in transient systems like SQLite or local files, will be periodically archived to a more permanent storage location based on their age.

*   **Storage Drivers**: Configured via `LOG_STORAGE_DRIVER` environment variable or within the orchestrator config (e.g., `logging.archival.driver`).
    *   `s3`: Amazon S3.
    *   `ftp`: FTP/SFTP server.
    *   `archive`: Local filesystem archive (moving files to a different directory).
*   **Archival Interval**: Configured via `LOG_STORAGE_INTERVAL` (e.g., `7` for 7 days). Logs older than this interval are targeted for archiving.
*   **Compression Options**: Configured via `LOG_STORAGE_ZIP_OPTION`.
    *   `zipPerLog`: Each individual log source/file (e.g., a daily rotated file, or logs for a specific endpoint if stored separately) is zipped.
    *   `zipAllTogether`: All logs qualifying for an archival run are consolidated into a single zip archive.
    *   `none`: Logs are transferred/moved without compression.
*   **Driver-Specific Configuration**: Primarily managed via `.env` variables (as shown in Section 3) and potentially referenced or overridden in the orchestrator config.
    *   **S3**: Requires `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`, `S3_REGION`, and an optional `S3_STORAGE_PREFIX`.
    *   **FTP**: Requires `FTP_HOST`, `FTP_PORT`, `FTP_USER`, `FTP_PASSWORD`, and `FTP_REMOTE_PATH`.
    *   **Archive (Local Filesystem)**: Requires `LOG_STORAGE_ARCHIVE_PATH`.

```json
{
  "method": "GET",
  "path": "/users",
  "authOverride": "none",
  "cacheTtl": 600,
  "lifecycle": {
    "beforeRequest": ["cache", "log"],
    "request": ["http"],
    "afterRequest": ["log", "webhook"]
  },
  "webhooks": {
    "onSuccess": "https://hooks.site/ok",
    "onError": "https://hooks.site/fail"
  }
}
```

---

## 5. Database Schema (Drizzle ORM)

### Tables

* `users`: { id, email, passwordHash, role }
* `permissions`: { userId, apiName, endpointPath, verb, allowed }
* `apis`: { id, name, baseUrl, type, configJson }
* `endpoints`: { id, apiId, path, method, configJson }
* `logs`: { id, timestamp, endpointId, phase, success, message, metadataJson }
* `webhooks`: { id, endpointId, phase, statusCode, url }
* `cache`: { key, valueJson, expiresAt }
* `retry_schedule`: { requestId, endpointId, nextTry, attempts, status }

---

## 6. Lifecycle Execution Model

### Request Lifecycle

1. `beforeRequest`

   * Auth check (JWT, API key, OAuth2)
   * Cache lookup
   * Log intent
2. `request`

   * HTTP request
   * WS message
   * Local RPC call
3. `afterRequest`

   * Log response
   * Webhook emission (by response code)
   * Cache update (if applicable)

### ORM Lifecycle

1. `beforeExecute`

   * Input validation
   * Cache read
2. `execute`

   * Drizzle query or raw SQL
3. `afterExecute`

   * Log result
   * Webhook (success/failure)
   * Retry trigger (if enabled)

---

## 7. Logging

* All phases (`beforeRequest`, `afterExecute`, etc.) log to SQLite
* Log format:

```ts
{
  id: number,
  timestamp: string,
  endpointId: number,
  phase: 'beforeRequest' | 'execute' | 'afterExecute',
  success: boolean,
  message: string,
  metadataJson: object
}
```

* Export to S3 every 24h:

  * Cron job runs daily
  * Uploads logs from exactly 7 days ago

---

## 8. Sub-API / Postman Mapping

### Supported Input:

* Postman v2.1 collections
* OpenAPI 3.1 (future)
* Manual `.json` config for custom sub-APIs

### Mapping:

| Postman Element | AOC Equivalent           |
| --------------- | ------------------------ |
| Collection      | API registration         |
| Request URL     | Endpoint path + method   |
| Auth            | Lifecycle `auth`         |
| Tests / Scripts | Lifecycle `afterRequest` |

---

## 9. Communication Protocols

| Protocol  | Use                                   | Fallback                   |
| --------- | ------------------------------------- | -------------------------- |
| HTTP      | RESTful endpoints                     | Retry, failover via config |
| WebSocket | Live dashboard feed, long-running ops | Auto-reconnect             |
| RPC       | Local sub-api exec                    | HTTP fallback              |

All protocols are routed through lifecycle hooks and use shared logging.

---

## 10. Retry & Scheduling

Each request config can include:

```json
"retry": {
  "count": 3,
  "backoff": "exponential",
  "initialDelay": 1000
}
```

If request fails, it’s queued in `retry_schedule` with timestamped `nextTry`.

---

## 11. Dashboard UI (React + ShadCN)

### Pages

* Dashboard: Live D3 visualization of endpoints
* Logs: Table viewer with filters
* Users: Admin panel with permission editor
* Endpoints: Config + lifecycle management
* Sub-API Registry: Add/edit APIs + upload Postman
* Webhooks: Attach URL per phase & status code

### Features

* Dark/light mode toggle (ShadCN + Tailwind)
* D3 graph nodes per endpoint + lifecycle stage
* Pinning of logs + cache hits to graph points
* WebSocket-based live updates
* Manual trigger of retries

---

## 12. Summary

The AOC system provides a complete backend orchestration and visualization suite for managing APIs, Postman imports, lifecycle processing, retries, logs, and more. It combines speed (Hono), safety (Zod + Drizzle), extensibility (sub-APIs), and observability (D3 dashboard), and is deployable on AWS EC2 with full config-driven runtime behavior.