# smartsoft001 starter

One entity, the whole loop, on `@smartsoft001/full-stack@2.191.0`: an Angular frontend on
`@smartsoft001/crud-shell-angular` with a list page, an item page and a login, and a NestJS API on
`@smartsoft001/crud-shell-nestjs`, `@smartsoft001/mongo` and `@smartsoft001/auth-shell-nestjs`. It
is the smallest application that still uses the framework end to end, as a workspace of its own.

This repository is generated. The `Publish` workflow of the framework repository writes it from
`docs/examples/app` on every release, pins it to the packages of that release, installs, builds and
tests the result from a clean clone, and pushes one commit per release. Fix the application in the
framework repository and the next release regenerates the starter; a change made here is
overwritten. The application is explained line by line on the Example application page:
https://framework.smartflow.biz.pl/docs/example-app

## Prerequisites

- Node.js 22.12 or newer (26 is what CI uses) and npm 10 or newer
- Docker with Compose (`docker compose version`)

## Run it

```bash
npm install

# 1. MongoDB and the API on http://localhost:3000/api
./run.sh up

# 2. The frontend on http://localhost:4200 (proxies /api to the container)
./run.sh web
```

3. Open http://localhost:4200 and sign in with `admin@example.com` / `change-me`, the user the API
   seeds on its first start.

What you will see: the login page, then an empty **Notes** list. **Add** opens the generated form
(a required title and a rich-text body), **Add** on that page saves the note and returns to the
list, and the arrow on a row opens the note read-only, where **Edit** turns it into the form again
and **Save** writes the change. **Remove** on a row deletes it. Every screen is generated from the
`@Field` decorators on the model and the `CrudFullConfig` object; the app itself is two pages of
code.

The API needs no configuration to start. To change ports, the database name, the JWT secret or the
seeded user, copy `.env.example` to `.env` next to `docker-compose.yml`; Compose reads it and passes
the values to the container. Without Docker, start MongoDB yourself and run the API with the same
variables in the shell: `npx nx serve api`.

## Tests

```bash
# Jest: the model, the API services, the Angular services and pages
./run.sh test

# Playwright, against MongoDB on localhost:27017 (the API and the frontend are started for you)
./run.sh e2e
```

The Playwright suite sits behind `RUN_EXAMPLE_APP_E2E` so that a plain `nx run-many -t test` does
not require MongoDB; `./run.sh e2e` sets the variable, and the CI workflow in
`.github/workflows/ci.yml` sets it and provides the database. `npx nx e2e web-e2e` runs the suite
unconditionally.

`npx nx run-many -t lint` runs ESLint on every project, with the rules in `eslint.config.mjs`.

## What is where

| Path                                     | What it is                                                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `libs/model/src/lib/note.model.ts`       | The entity, decorated with `@Model` and `@Field`. Shared by both apps through the `@app/model` alias.                     |
| `apps/api/src/app/app.module.ts`         | The whole backend: TypeORM for the users, the auth module (`POST /api/token`), the CRUD module mounted under `/api/notes`. |
| `apps/api/src/app/users.seed.ts`         | Inserts the one user at startup so that login works at once.                                                              |
| `apps/api/src/config.ts`                 | The environment variables the API reads, with the defaults from `.env.example`.                                           |
| `apps/web/src/app/app.config.ts`         | The root providers the CRUD screens need: NgRx, `SharedModule`, `NgrxSharedModule`, translations and the JWT interceptor. |
| `apps/web/src/app/notes/notes.config.ts` | The `CrudFullConfig` that says what the notes screens can do.                                                             |
| `apps/web/src/app/notes/notes.module.ts` | `CrudModule.forFeature({ routing: true })`: the list, add and item routes.                                                |
| `apps/web/src/app/auth/`                 | The login page on `<smart-sign-in-form>`, the login service, the route guard and the interceptor that sends the token.    |
| `apps/web-e2e/src/`                      | Playwright: login, list, item page, against the running stack.                                                            |
| `docker-compose.yml`, `Dockerfile`       | MongoDB plus the API built from this repository.                                                                          |
| `run.sh`                                 | `up`, `web`, `test` and `e2e`: the commands above, in one script.                                                         |
| `eslint.config.mjs`                      | The ESLint rules every project extends: the Nx configs and the import order.                                              |
| `.github/workflows/ci.yml`               | Lint, build, Jest and the Playwright suite against a MongoDB service, on every push and pull request.                     |

## Upgrade

The framework ships its migrations with `@smartsoft001/core`, so an upgrade is the Nx one:

```bash
npx nx migrate @smartsoft001/core@<next>
npm install
npx nx migrate --run-migrations
```

The first command bumps every `@smartsoft001` package in `package.json` and writes
`migrations.json`, the second installs them, the third applies the migrations to the workspace.

## How the pieces fit

- The frontend calls `/api/...`; in development the dev server proxies that to port 3000
  (`apps/web/proxy.conf.json`), so there is no environment file on the frontend.
- Login is the OAuth password grant of `@smartsoft001/auth-shell-nestjs`: `POST /api/token` with the
  seeded username, the password and the `client_id` the API accepts. The returned JWT is stored by
  `AuthService` from `@smartsoft001/angular` and attached to every request by `AuthInterceptor`.
- The interceptor is registered under `HTTP_INTERCEPTORS`, not with `withInterceptors`.
  `CrudModule.forFeature` imports `SharedModule`, which re-exports `HttpClientModule`, so the lazily
  loaded notes route gets its own `HttpClient`; a functional interceptor at the root never reaches
  it, a DI one does.
- `MODEL_VALIDATORS_PROVIDER` has to be provided, even when the app adds no validators of its own:
  the form factory injects it without a default, and without it the generated form never renders.
- The CRUD routes come from one `@Controller('')` in `@smartsoft001/crud-shell-nestjs`; the API mounts
  it with NestJS's `RouterModule` under `notes`, which is why `apiUrl` in the frontend is `/api/notes`.
- Writes require the `admin` permission, reads `admin` or `user`; the seeded user has `admin`.
- The framework's stylesheets (Tailwind utilities under the `smart:` prefix) are the `styles.css` each
  UI package publishes: `node_modules/@smartsoft001/angular/styles.css` and
  `node_modules/@smartsoft001/crud-shell-angular/styles.css`, listed under `styles` of the web
  project's build in `apps/web/project.json`.
