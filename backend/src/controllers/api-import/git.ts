import { Context, Hono } from "hono";
import { GitService } from "../../services/git.service.js";

export function createGitRouter(gitService: GitService) {
  const router = new Hono();

  // Endpoint to get Git history for an API
  router.get("/history/:apiSlug", async (c: Context) => {
    try {
      const { apiSlug } = c.req.param();
      
      // Get Git history for the API
      const history = await gitService.getCommitHistory(apiSlug);
      
      return c.json({
        success: true,
        data: {
          history
        }
      });
    } catch (error: any) {
      console.error("Git history error:", error);
      return c.json({
        success: false,
        error: error.message || "Failed to get Git history",
      }, 400);
    }
  });

  // Endpoint to get Git diff for a commit
  router.get("/diff/:apiSlug/:commitId", async (c: Context) => {
    try {
      const { apiSlug, commitId } = c.req.param();
      
      // Get the diff for the specified commit
      const diff = await gitService.getDiff(apiSlug, commitId);
      
      return c.json({
        success: true,
        data: {
          diff
        }
      });
    } catch (error: any) {
      console.error("Git diff error:", error);
      return c.json({
        success: false,
        error: error.message || "Failed to get Git diff",
      }, 400);
    }
  });

  return router;
}
