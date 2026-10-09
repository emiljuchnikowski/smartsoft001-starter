/**
 * Runs the Playwright suite from the `test` target, so `nx run-many -t test`
 * (what CI and the commit hook run) picks it up like every other project.
 *
 * The suite needs a running MongoDB and starts the API and the frontend by
 * itself, which a plain unit-test run must not require. It therefore runs only
 * when `RUN_EXAMPLE_APP_E2E=1` is set, and says so loudly otherwise instead of
 * pretending to pass silently. The pull request workflow sets the variable and
 * provides MongoDB; locally, start `docker compose up` in the starter root and
 * run `RUN_EXAMPLE_APP_E2E=1 npx nx test web-e2e`, or call
 * `npx nx e2e web-e2e` to run it unconditionally.
 */
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(here, '../..');
// The project whose `test` target ran the script, for the message below: in
// the monorepo, one e2e project per frontend runs it.
const project =
  process.env['NX_TASK_TARGET_PROJECT'] ?? 'web-e2e';

if (process.env['RUN_EXAMPLE_APP_E2E'] !== '1') {
  console.log(
    `${project}: SKIPPED. Set RUN_EXAMPLE_APP_E2E=1 with MongoDB ` +
      'running on localhost:27017 to run the Playwright suite (see README.md).',
  );
  process.exit(0);
}

const result = spawnSync(
  'npx',
  [
    'playwright',
    'test',
    '--config',
    'apps/web-e2e/playwright.config.ts',
  ],
  { cwd: workspaceRoot, stdio: 'inherit', shell: process.platform === 'win32' },
);

process.exit(result.status ?? 1);
