# Shared Dockerfile for all NestJS backend services.
# Build with: docker build --build-arg SERVICE=admin-service --build-arg PORT=4001 .
#
# Valid SERVICE values: admin-service | auth-service | corporate-service | student-service

# ── Base ──────────────────────────────────────────────────────────────────────
# node:20-slim (Debian) is intentional — Alpine's musl breaks native addons
# like `sharp` (admin-service) and `canvas` (student-service).
FROM node:20-slim AS base

# ── Install dependencies ───────────────────────────────────────────────────────
# We copy the lock file to pin exact versions (a fresh install resolved pg-boss
# to 12.18.1 which is incompatible with the existing student-service code).
# --legacy-peer-deps mirrors how the project was originally installed locally
# and silences the @langchain/core peer-dep conflict.
# The nested module structure from the lock file is handled by copying the full
# /app directory from deps into builder (see COPY --from=deps below).
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY patch-pgboss.js ./
COPY shared/package.json ./shared/
COPY admin-service/package.json ./admin-service/
COPY auth-service/package.json ./auth-service/
COPY corporate-service/package.json ./corporate-service/
COPY student-service/package.json ./student-service/

# --legacy-peer-deps mirrors how this project was originally installed locally.
# Without it, npm 10 strict peer-dep checking fails on @langchain/core version
# conflicts between admin-service's dependencies.
# Skipping the lock file (see COPY above) forces a fresh resolution so npm can
# hoist packages to the workspace root instead of nesting them per-service.
RUN npm install --legacy-peer-deps

# ── Build ─────────────────────────────────────────────────────────────────────
FROM base AS builder
ARG SERVICE
WORKDIR /app

# Copy the ENTIRE deps layer so we get root node_modules AND any service-specific
# nested ones that dedupe couldn't fully hoist.
COPY --from=deps /app ./

# Overlay actual source files from the build context.
# .dockerignore excludes **/node_modules so the deps layer stays intact.
COPY . .

# Apply the pgboss compatibility patch
RUN node patch-pgboss.js

# Build shared entities first so services can resolve @originbi/shared-entities
RUN cd shared && npm run build

# Build the target service.
# Use the absolute path to the nest binary — npm 10's `npx nest` does not
# traverse up to the workspace root's node_modules/.bin from a subdirectory.
RUN cd ${SERVICE} && /app/node_modules/.bin/nest build

# Merge any packages that are still nested under the service directory into the
# workspace root node_modules so the runner only needs one copy.
# -rn = recursive, no-clobber (root versions are preserved on conflict).
RUN if [ -d /app/${SERVICE}/node_modules ]; then \
      cp -rn /app/${SERVICE}/node_modules/. /app/node_modules/; \
    fi

# ── Runtime ───────────────────────────────────────────────────────────────────
FROM node:20-slim AS runner
ARG SERVICE
ARG PORT=4001

ENV NODE_ENV=production
ENV PORT=${PORT}

WORKDIR /app

# Unified node_modules: hoisted packages + anything merged in from service subdirs
COPY --from=builder /app/node_modules ./node_modules

# Shared entities (the @originbi/shared-entities workspace symlink resolves here)
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/shared/package.json ./shared/package.json

# Compiled service output
COPY --from=builder /app/${SERVICE}/dist ./dist
COPY --from=builder /app/${SERVICE}/package.json ./

EXPOSE ${PORT}

CMD ["node", "dist/main.js"]
