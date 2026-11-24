# syntax=docker/dockerfile:1
# Build context: repository root  →  docker build -f apps/api/Dockerfile .

ARG NODE_VERSION=22-alpine

# ---- deps: install the whole workspace (incl. dev deps for compiling) ----
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
# Skip the in-memory MongoDB binary download — it is only used by the test suite.
ENV MONGOMS_DISABLE_POSTINSTALL=1
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --workspace=@mini-saas/shared --workspace=@mini-saas/api --include-workspace-root

# ---- build: compile shared + api to JavaScript ----
FROM deps AS build
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build -w @mini-saas/shared && npm run build -w @mini-saas/api

# ---- runtime: production deps + compiled output only ----
FROM node:${NODE_VERSION} AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --omit=dev --workspace=@mini-saas/api --ignore-scripts && npm cache clean --force
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/apps/api/dist apps/api/dist

USER node
WORKDIR /app/apps/api
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/api/v1/health || exit 1
CMD ["node", "dist/server.js"]
