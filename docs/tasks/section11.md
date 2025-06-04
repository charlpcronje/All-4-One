## 11. Deployment Prep

- [ ] 11.1 Dockerize backend + frontend**
    - New File: `backend/Dockerfile`**: **Why?** To define the build and runtime environment for the backend Node.js/Hono application.
    - New File: `frontend/Dockerfile`**: **Why?** To define the build process for the Vite/React frontend (e.g., `npm run build`) and serve the static assets (e.g., using Nginx or a simple static server).
    - New File: `docker-compose.yml` (at project root)**: **Why?** To orchestrate the backend, frontend, and potentially a database (like Postgres for production-like testing) for local development and testing of the containerized setup.

- [ ] 11.2 Setup production-ready `.env` and config**
    - `backend/.env.example`**: **Why?** This file serves as the template. You will create a production `.env` file based on this, filling in actual production values (database URLs, JWT secrets, AWS keys, etc.).
    - `backend/config/orchestrator.json`**: **Why?** Review and adjust default settings for production (e.g., `logLevel` to 'info' or 'warn', secure `jwtSecret` if not solely in .env, sensible `defaultRetries` and `defaultCacheTtl`). Consider a `orchestrator.prod.json` if overrides are needed.
    - `backend/src/env.ts`**: **Why?** Ensure all environment variables required for production (especially S3 keys, production database URL, JWT_SECRET) are defined in the `envSchema` and properly validated.
    - `backend/src/config.ts`**: **Why?** Review how configurations are loaded and merged, ensuring it behaves correctly in a production environment (e.g., file paths, overrides).

- [ ] 11.3 Add system healthcheck endpoint (`/status`)**
    - `backend/src/routes/api.ts`**: **Why?** The `/health` endpoint already exists.
    - `backend/src/routes/dcr.ts`**: **Why?** The `/status` endpoint exists and provides more details like DB status, uptime, and memory. This task involves reviewing these endpoints, ensuring they check all critical dependencies (database, cache, any external services the DCR relies on directly), and return appropriate status codes for monitoring tools.

- [ ] 11.4 Deploy on AWS EC2, attach S3 bucket**
    - `backend/.env` (Production version)**: **Why?** This file on the EC2 instance will contain the S3 bucket name and AWS credentials for the log archiving feature.
    - `backend/src/scripts/archive-logs.ts`**: **Why?** The S3 archiving logic within this script will be used.
    - `backend/src/logging/manager.ts`**: **Why?** The `archiveToS3` method needs to be fully implemented.
    - `Dockerfile`s (from Task 11.1)**: **Why?** These will be used to build the images deployed to EC2.
    - (New) Deployment Scripts (e.g., shell scripts, Ansible playbooks, Terraform configs)**: **Why?** These would be created to automate the deployment process to EC2, configure the environment, and set up S3 bucket policies if needed. Not directly in the codebase but essential for this task.

This should give a comprehensive mapping of tasks to the relevant parts of your codebase!