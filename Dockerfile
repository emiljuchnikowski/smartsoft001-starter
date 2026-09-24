# Builds the API image of the starter.
#
# Build context: the starter root (see docker-compose.yml). The first stage
# installs the workspace and runs the Nx build, which bundles the app together
# with the @smartsoft001/* packages it imports and writes a package.json
# listing only the third-party runtime dependencies. The second stage installs
# exactly those and runs the bundle.
#
# Requires BuildKit (the default in Docker Desktop and Docker Engine 23+), which
# reads the Dockerfile.dockerignore next to this file.

FROM node:26-alpine AS build
WORKDIR /workspace

# Dependencies first, so a source change does not invalidate the install layer.
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund

COPY . .
RUN npx nx run api:build:production --skip-nx-cache \
  && npx nx run api:prune-lockfile --skip-nx-cache

FROM node:26-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /workspace/dist/apps/api ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund

EXPOSE 3000
CMD ["node", "main.js"]
