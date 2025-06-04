import { Hono } from "hono";
import path from "path";

// Import services
import { GitService } from "../services/git.service.js";
import { ConfigFileService } from "../services/config-fs.service.js";
import { ImportValidatorService } from "../services/import-validator.service.js";

// Import modular routers
import { createValidateRouter } from "./api-import/validate.js";
import { createImportRouter } from "./api-import/import.js";
import { createShareRouter } from "./api-import/share.js";
import { createActivateRouter } from "./api-import/activate.js";
import { createGitRouter } from "./api-import/git.js";

// Initialize service instances
const gitService = new GitService();
const configFileService = new ConfigFileService();
const importValidatorService = new ImportValidatorService();

// Create main app instance
const app = new Hono();

// Mount modular routers

// Validate router - handles collection validation
const validateRouter = createValidateRouter(importValidatorService);
app.route("/validate", validateRouter);

// Legacy endpoint - redirect upload to import
app.post("/upload", async (c) => {
  console.warn("Legacy /upload endpoint called, redirecting to /import");
  return c.redirect("/api/import");
});

// Git router - handles Git history and diff operations
const gitRouter = createGitRouter(gitService);
app.route("/git", gitRouter);

// Share router - handles collection sharing
const shareRouter = createShareRouter();
app.route("/share", shareRouter);

// Activate router - handles endpoint activation
const activateRouter = createActivateRouter();
app.route("/activate", activateRouter);

// Import router - handles collection import
const importRouter = createImportRouter(importValidatorService, configFileService, gitService);
app.route("/import", importRouter);

export default app;
