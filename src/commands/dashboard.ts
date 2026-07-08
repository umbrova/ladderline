import { findWorkspaceRoot } from "../core/workspace.js";
import { createDashboardServer } from "../dashboard/server.js";
import { LadderlineError } from "../core/errors.js";

export function runDashboard(options: { port?: string }): void {
  try {
    const workspace = findWorkspaceRoot();
    const port = options.port ? parseInt(options.port, 10) : 4200;

    const app = createDashboardServer(workspace);
    app.listen(port, () => {
      console.log(`✓ Dashboard running at http://localhost:${port}`);
    });
  } catch (err) {
    if (err instanceof LadderlineError) {
      console.error(`✗ ${err.message}`);
      if (err.suggestion) console.error(`  ${err.suggestion}`);
      process.exitCode = 1;
      return;
    }
    throw err;
  }
}