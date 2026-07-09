import { findWorkspaceRoot } from "../core/workspace.js";
import { createDashboardServer } from "../dashboard/server.js";
import { printSuccess, printErrorAndSetExitCode } from "./output.js";

export function runDashboard(options: { port?: string }): void {
  try {
    const workspace = findWorkspaceRoot();
    const port = options.port ? parseInt(options.port, 10) : 4200;

    const app = createDashboardServer(workspace);
    app.listen(port, () => {
      printSuccess(`Dashboard running at http://localhost:${port}`);
    });
  } catch (err) {
    printErrorAndSetExitCode(err);
  }
}