## 5. Logging & Persistence

- [ ] 5.2 Schedule daily export to S3 (exactly 7 days old)
    - `backend/src/scheduler/index.ts`**: **Why?** This is where the cron job will be defined and scheduled to trigger the S3 export. You'll add a new scheduled task here.
    - `backend/src/scripts/archive-logs.ts`**: **Why?** This script currently contains the logic for archiving logs. It will need to be adapted or augmented to handle S3 export specifically. It shows how `LogManager` is used for archival.
    - `backend/src/logging/manager.ts`**: **Why?** The `LogManager` is responsible for coordinating log archiving. You might extend it to include S3-specific archiving logic or ensure it correctly calls the S3 export mechanism. The `archiveToS3` method is a placeholder here.
    - `backend/src/logging/drivers/base-driver.ts`**: **Why?** Reference for how log drivers are structured. You might create a new `s3-driver.ts` for fetching logs if they are directly written to S3, or for managing the export process if logs are first local.
    - `backend/src/logging/database.ts`**: **Why?** The `findOldLogs` function will be crucial for identifying which logs (stored in the primary DB) are older than 7 days and need to be exported to S3.
    - `backend/src/env.ts`**: **Why?** To define and load AWS S3 credentials (access key, secret key, bucket name, region) and S3 specific configurations like `S3_STORAGE_PREFIX`.
    - `backend/src/config.ts`**: **Why?** If any S3-specific configuration (beyond credentials) needs to be stored in `orchestrator.json`, this file manages that. The `logging.archival` section in `config.ts` and `orchestrator.json` will be relevant.
    - `docs/design.md`**: **Why?** Section 4.4 ("Logging and Archiving Strategy") and Section 3 (".env Structure") detail the S3 configuration and overall archival strategy.
    - `backend/src/logging/types.ts`**: **Why?** To define or use types related to S3 storage or archiving options if needed.

- [ ] 5.4 Implement logs viewer backend (with filters)
    - `backend/src/routes/dcr.ts`**: **Why?** This file already contains a basic `/logs` endpoint. You will expand this endpoint to accept filter parameters (e.g., date range, log level, source, message content) and query the database accordingly.
    - `backend/src/db/index.ts`**: **Why?** Provides the `db` instance for database querying.
    - `backend/src/db/schema.ts`**: **Why?** Defines the `logs` table schema, which you'll query. Understanding its columns is essential for filtering.
    - `backend/src/db/transactions.ts`**: **Why?** To wrap your database read queries with lifecycle hooks if necessary, or for consistent query execution.
    - `backend/src/logging/database.ts`**: **Why?** Contains `findOldLogs` which is an example of querying the logs table. You might adapt or create new query functions here based on filter requirements.
    - `backend/src/logging/types.ts`**: **Why?** Defines `LogEntry`, `LogLevel`, `LogPhase`, etc., which are relevant for understanding filterable fields.
    - `shared/schemas/index.ts`**: **Why?** The `logSchema` could be used to validate query parameters for the logs endpoint if you choose to implement strict validation.
