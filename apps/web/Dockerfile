# syntax=docker/dockerfile:1
# Build context: repository root  →  docker build -f apps/web/Dockerfile .

ARG NODE_VERSION=22-alpine

FROM node:${NODE_VERSION} AS build
WORKDIR /app
ENV MONGOMS_DISABLE_POSTINSTALL=1
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --workspace=@mini-saas/shared --workspace=@mini-saas/web --include-workspace-root

COPY packages/shared packages/shared
COPY apps/web apps/web

# Relative by default so nginx can proxy /api to the API container.
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build -w @mini-saas/shared && npm run build -w @mini-saas/web

FROM nginx:1.27-alpine AS runtime
COPY apps/web/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
