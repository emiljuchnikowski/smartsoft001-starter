import { defineConfig, devices } from 'playwright/test';

import { resolve } from 'node:path';

/**
 * The suite drives the real stack: the NestJS API on :3000 (against the
 * MongoDB from `docker compose up`) and the Angular dev server on :4200, both
 * started here so a single command runs the whole loop. `reuseExistingServer`
 * lets a developer keep `nx serve` running between runs.
 *
 * With `E2E_BASE_URL` set, the same suite runs against an application that is
 * already served at that address and starts nothing: the `demo` build, on
 * GitHub Pages or from `nx run web:serve-static:demo`,
 * which has no API to start (see support/app.ts).
 */
const workspaceRoot = resolve(__dirname, '../..');

const baseURL = process.env['E2E_BASE_URL'];

export default defineConfig({
  testDir: './src',
  fullyParallel: false,
  workers: 1,
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? 'line' : 'list',
  outputDir: resolve(workspaceRoot, 'dist/apps/web-e2e'),
  timeout: 60_000,
  use: {
    baseURL: baseURL ?? 'http://localhost:4200',
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
          command: 'npx nx serve web',
          cwd: workspaceRoot,
          url: 'http://localhost:4200',
          reuseExistingServer: !process.env['CI'],
          timeout: 240_000,
        },
      ],
});
