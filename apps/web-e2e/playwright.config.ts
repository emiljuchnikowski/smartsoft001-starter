import { defineConfig, devices } from 'playwright/test';

import { resolve } from 'node:path';

/**
 * The suite drives the real stack: the NestJS API on :3000 (against the
 * MongoDB from `docker compose up`) and a frontend's dev server, both started
 * here so a single command runs the whole loop. `reuseExistingServer` lets a
 * developer keep `nx serve` running between runs. A run owns port 3000 and
 * the frontend's port, so the e2e targets set `parallelism: false` in
 * project.json and Nx never starts one next to another task.
 *
 * With `E2E_BASE_URL` set, the same suite runs against an application that is
 * already served at that address and starts nothing: a `demo` build, on
 * GitHub Pages or from the frontend's `serve-static:demo` target, which has
 * no API to start (see support/app.ts).
 */
const workspaceRoot = resolve(__dirname, '../..');

/** The frontend the suite drives: the dev server of the `web` project. */
const frontend = {
  serve: 'npx nx serve web',
  url: 'http://localhost:4200',
};

const outputDir = resolve(workspaceRoot, 'dist/apps/web-e2e');

const baseURL = process.env['E2E_BASE_URL'];

export default defineConfig({
  testDir: './src',
  fullyParallel: false,
  workers: 1,
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? 'line' : 'list',
  outputDir,
  timeout: 60_000,
  use: {
    baseURL: baseURL ?? frontend.url,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: baseURL
    ? []
    : [
        {
          command:
            'npx nx run api:build:development && node dist/apps/api/main.js',
          cwd: workspaceRoot,
          url: 'http://localhost:3000/api/notes',
          reuseExistingServer: !process.env['CI'],
          timeout: 240_000,
        },
        {
          command: frontend.serve,
          cwd: workspaceRoot,
          url: frontend.url,
          reuseExistingServer: !process.env['CI'],
          timeout: 240_000,
          // A dev server that is an nx:run-commands target (`vite`) runs in a
          // process group of its own. Playwright's default SIGKILL ends Nx
          // and leaves that server holding the port; SIGTERM lets Nx stop it
          // first.
          gracefulShutdown: { signal: 'SIGTERM', timeout: 10_000 },
        },
      ],
});
