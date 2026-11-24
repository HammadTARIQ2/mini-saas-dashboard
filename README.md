# Mini SaaS Dashboard

A full-stack project-management dashboard for listing, filtering, searching, adding, and editing projects. Each project tracks its **status**, **deadline**, **assigned team member**, and **budget**.

The repo is a TypeScript **monorepo**: a React + Tailwind frontend, an Express + MongoDB REST API, and a shared package that holds the types and validation rules used by both.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Available scripts](#available-scripts)
- [API reference](#api-reference)
- [Testing](#testing)
- [Running with Docker](#running-with-docker)
- [Deployment](#deployment)
- [Design decisions](#design-decisions)
- [Possible improvements](#possible-improvements)

---

## Features

**Core requirements**

- 📋 **Project table** with a responsive layout: a sortable table on desktop and a card list on mobile
- 🔎 **Search** across project name, description and assignee name (debounced)
- 🏷️ **Filter by status** (Active / On hold / Completed) using tabs that show live counts, plus a filter by assignee
- ➕ **Add / edit modal** with client-side validation; server-side validation errors are mapped back onto the matching form fields
- 🗄️ **REST API** with full CRUD, backed by MongoDB
- 🌱 **Data seeding** from [JSONPlaceholder](https://jsonplaceholder.typicode.com). It's deterministic, and it falls back to bundled data when offline

**Beyond the brief**

- 🔐 **JWT authentication**: register, log in, restore the session, protected routes and API endpoints, and rate limiting on credential endpoints
- 📊 **KPI cards** for total projects, active, overdue and total budget, computed by one MongoDB aggregation
- 🔗 **URL-synced state**: filters, search, sorting and page all live in the query string, so views can be shared, bookmarked and refreshed
- 📄 Server-side **pagination and sorting**
- 🗑️ Delete with a confirmation dialog, plus toast notifications
- ♿ Accessibility: labelled controls, `aria-invalid` / `aria-describedby` errors, focus-trapped dialogs, `aria-sort` on table headers
- ✅ **Automated tests**: API integration tests (in-memory MongoDB) and frontend component tests
- 🐳 **Docker** images and `docker-compose` for the full stack
- ⚙️ **GitHub Actions CI**: lint, format check, typecheck, test, build, Docker build

---

## Tech stack

| Layer    | Technology                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------- |
| Frontend | React 19, Vite, TypeScript, Tailwind CSS v4, TanStack Query, React Router, React Hook Form, Headless UI |
| Backend  | Node.js, Express 5, TypeScript, Mongoose, JSON Web Tokens, bcrypt, Helmet, pino                         |
| Shared   | Zod schemas and TypeScript types (`@mini-saas/shared`)                                                  |
| Database | MongoDB (MongoDB Atlas or local)                                                                        |
| Tooling  | npm workspaces, ESLint, Prettier, Vitest, Supertest, Testing Library, mongodb-memory-server             |
| DevOps   | Docker, docker-compose, nginx, GitHub Actions                                                           |

---

## Project structure

```
.
├── apps/
│   ├── api/                       # Express REST API
│   │   ├── src/
│   │   │   ├── config/            # env validation (Zod), database connection
│   │   │   ├── lib/               # logger, HttpError, JWT helpers
│   │   │   ├── middleware/        # auth guard, error + 404 handlers
│   │   │   ├── modules/           # feature modules (routes → controller → service → model)
│   │   │   │   ├── auth/
│   │   │   │   ├── projects/
│   │   │   │   ├── team-members/
│   │   │   │   └── health/
│   │   │   ├── routes/            # versioned router (/api/v1)
│   │   │   ├── seed/              # JSONPlaceholder-based seeder
│   │   │   ├── app.ts             # Express app factory (used by server + tests)
│   │   │   └── server.ts          # bootstrap + graceful shutdown
│   │   ├── tests/                 # integration tests (Vitest + Supertest)
│   │   └── Dockerfile
│   └── web/                       # React SPA
│       ├── src/
│       │   ├── components/        # reusable UI (Button, Modal, FormField…) + layout
│       │   ├── features/
│       │   │   ├── auth/          # provider, guards, login/register pages
│       │   │   └── projects/      # API client, queries, table, toolbar, modal, page
│       │   ├── hooks/
│       │   └── lib/               # fetch wrapper, query client, formatters
│       ├── nginx/                 # production nginx config (SPA + /api proxy)
│       └── Dockerfile
├── packages/
│   └── shared/                    # constants, Zod schemas, API wire types
├── .github/workflows/ci.yml
├── docker-compose.yml
└── package.json                   # npm workspaces + root scripts
```

The API follows a **layered, feature-module** structure:

- **Routes** declare the endpoints.
- **Controllers** parse and validate input with the shared Zod schemas.
- **Services** hold the business logic and data access.
- **Mappers** turn database documents into the public JSON shape.

---

## Getting started

### Prerequisites

- **Node.js 20+** (22 recommended; see `.nvmrc`) and npm 10+
- A **MongoDB** database: a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster, a local `mongod`, or Docker

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env   # optional, defaults work for local dev
```

Edit `apps/api/.env`:

| Variable         | Description                                             | Example                                                                    |
| ---------------- | ------------------------------------------------------- | -------------------------------------------------------------------------- |
| `MONGODB_URI`    | MongoDB connection string                               | `mongodb+srv://user:pass@cluster.mongodb.net/mini-saas`                    |
| `JWT_SECRET`     | Secret used to sign tokens (**at least 32 characters**) | `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | Token lifetime                                          | `1d`                                                                       |
| `PORT`           | API port                                                | `4000`                                                                     |
| `CORS_ORIGIN`    | Allowed browser origin(s), comma-separated              | `http://localhost:5173`                                                    |
| `LOG_LEVEL`      | pino log level                                          | `info`                                                                     |

> **MongoDB Atlas:** create a free cluster, add a database user, allow your IP under _Network Access_, then copy the connection string from _Connect → Drivers_. Add a database name to the path (for example `/mini-saas`).

### 3. Seed the database

```bash
npm run seed
```

The seeder fetches users and posts from JSONPlaceholder. Users become **team members** and post titles become **projects**. A seeded random generator assigns statuses, deadlines and budgets, so every run produces the same dataset. If JSONPlaceholder can't be reached, the seeder uses bundled fallback data.

> ⚠️ Seeding **resets** the `users`, `teammembers` and `projects` collections.

### 4. Start the dev servers

```bash
npm run dev
```

This runs the shared package (watch mode), the API at <http://localhost:4000/api/v1> and the web app at <http://localhost:5173> together. Vite proxies `/api` requests to the API, so no CORS setup is needed in development.

### Demo account

| Email               | Password     |
| ------------------- | ------------ |
| `demo@minisaas.dev` | `Demo@12345` |

You can also create your own account on the **Register** page.

---

## Available scripts

Run these from the repository root:

| Script              | Description                                           |
| ------------------- | ----------------------------------------------------- |
| `npm run dev`       | Start shared (watch), API and web in development mode |
| `npm run build`     | Production build of all packages                      |
| `npm start`         | Start the compiled API                                |
| `npm run seed`      | Reset the database and insert demo data               |
| `npm test`          | Run all API and web tests                             |
| `npm run typecheck` | Type-check every workspace                            |
| `npm run lint`      | Lint the whole repository                             |
| `npm run format`    | Format with Prettier                                  |

---

## API reference

Base URL: `/api/v1`. Every endpoint except `health` and `auth/register` / `auth/login` needs an `Authorization: Bearer <token>` header.

### Auth

| Method | Endpoint         | Body                        | Response              |
| ------ | ---------------- | --------------------------- | --------------------- |
| POST   | `/auth/register` | `{ name, email, password }` | `201 { token, user }` |
| POST   | `/auth/login`    | `{ email, password }`       | `200 { token, user }` |
| GET    | `/auth/me`       | —                           | `200 User`            |

### Projects

| Method | Endpoint          | Description                                          |
| ------ | ----------------- | ---------------------------------------------------- |
| GET    | `/projects`       | List projects (search, filter, sort, paginate)       |
| GET    | `/projects/stats` | Totals, budget sum, overdue count, per-status counts |
| GET    | `/projects/:id`   | Get one project                                      |
| POST   | `/projects`       | Create a project → `201` + `Location` header         |
| PATCH  | `/projects/:id`   | Partial update (only the fields you send change)     |
| DELETE | `/projects/:id`   | Delete → `204`                                       |

**Query parameters for `GET /projects`**

| Param       | Type                                                        | Default     |
| ----------- | ----------------------------------------------------------- | ----------- |
| `search`    | string, matched against name, description and assignee name | —           |
| `status`    | `active` \| `on_hold` \| `completed`                        | —           |
| `assignee`  | team member id                                              | —           |
| `page`      | integer ≥ 1                                                 | `1`         |
| `limit`     | integer 1–100                                               | `10`        |
| `sortBy`    | `name` \| `deadline` \| `budget` \| `status` \| `createdAt` | `createdAt` |
| `sortOrder` | `asc` \| `desc`                                             | `desc`      |

**Project payload**

```json
{
  "name": "Customer portal redesign",
  "description": "Optional, up to 1000 characters",
  "status": "active",
  "deadline": "2026-03-31",
  "assignee": "665f1c2e9b1e8a3d4c5b6a71",
  "budget": 25000
}
```

**List response**

```json
{
  "data": [
    {
      "id": "…",
      "name": "Customer portal redesign",
      "description": "…",
      "status": "active",
      "deadline": "2026-03-31T00:00:00.000Z",
      "budget": 25000,
      "assignee": { "id": "…", "name": "Leanne Graham", "email": "…", "role": "Engineer" },
      "createdAt": "…",
      "updatedAt": "…"
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 36, "totalPages": 4 }
}
```

### Other endpoints

| Method | Endpoint        | Description                                   |
| ------ | --------------- | --------------------------------------------- |
| GET    | `/team-members` | Team members who can be assigned              |
| GET    | `/health`       | Liveness/readiness check, including DB status |

### Errors

Every error uses the same envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": { "budget": ["Budget cannot be negative"] }
  }
}
```

| Status | Code                    | When                                                     |
| ------ | ----------------------- | -------------------------------------------------------- |
| 400    | `BAD_REQUEST`           | Malformed JSON                                           |
| 401    | `UNAUTHORIZED`          | Missing, invalid or expired token, or bad credentials    |
| 404    | `NOT_FOUND`             | Unknown route or resource                                |
| 409    | `CONFLICT`              | Duplicate email                                          |
| 422    | `VALIDATION_ERROR`      | Body or query failed validation                          |
| 429    | `TOO_MANY_REQUESTS`     | Too many login/register attempts                         |
| 500    | `INTERNAL_SERVER_ERROR` | Unexpected error (details are only logged on the server) |

---

## Testing

```bash
npm test
```

- **API** (`apps/api/tests`): integration tests with Vitest and Supertest against a real, in-memory MongoDB (`mongodb-memory-server`). They cover:
  - auth flows
  - CRUD
  - filtering, search (including regex-injection safety), sorting and pagination
  - stats aggregation
  - partial updates
  - validation and error responses

  The first run downloads a MongoDB binary.

- **Web** (`apps/web/src/**/*.test.ts(x)`): Vitest and Testing Library tests for the project form modal (validation, create payload, edit prefill, server error mapping) and the formatting helpers.

---

## Running with Docker

```bash
docker compose up --build -d
docker compose exec api npm run seed:prod
```

Open <http://localhost:8080>.

| Service | Description                                                               |
| ------- | ------------------------------------------------------------------------- |
| `mongo` | MongoDB 8 with a persistent volume                                        |
| `api`   | Multi-stage Node image (production deps only, non-root user, healthcheck) |
| `web`   | Static build served by nginx, which proxies `/api` to the API             |

To use **MongoDB Atlas** instead of the bundled database, create a root-level `.env` file with `MONGODB_URI=...` and `JWT_SECRET=...`. Docker Compose picks it up automatically.

---

## Deployment

The two apps deploy independently.

- **API** (Render, Railway, Fly.io…):
  - Build command: `npm ci && npm run build -w @mini-saas/shared && npm run build -w @mini-saas/api`
  - Start command: `npm start`
  - Or deploy `apps/api/Dockerfile` directly.
  - Set `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV=production` and `CORS_ORIGIN=<your frontend URL>`.
- **Web** (Vercel, Netlify…):
  - Build command: `npm run build -w @mini-saas/shared && npm run build -w @mini-saas/web`
  - Output directory: `apps/web/dist`
  - Set `VITE_API_URL=https://<your-api-host>/api/v1`.
  - Add an SPA rewrite so every path serves `index.html`.

---

## Design decisions

- **Monorepo with a shared package.** The Zod schemas and TypeScript types are defined once in `@mini-saas/shared`. The API validates requests with them and the frontend uses the same types and limits, so the two sides can't drift apart.
- **Validation at the edge.** Controllers parse `req.body` and `req.query` with Zod, so services only ever receive typed, valid data. Mongoose schema rules act as a second line of defence.
- **Express 5.** Async errors in handlers reach the central error middleware automatically, so no `asyncHandler` wrappers are needed.
- **Team members as a collection.** The assignee is a reference to a `TeamMember` document rather than a free-text string. This keeps assignment consistent, powers the assignee dropdown and filter, and lets search match assignee names.
- **Deadlines are calendar dates.** They're stored at UTC midnight and formatted in UTC on the client, so a deadline never shows as the previous day in negative-offset time zones.
- **Safe search.** User input is regex-escaped before it's used in a MongoDB `$regex` query, which prevents ReDoS and query injection.
- **Server state lives in TanStack Query.** It handles caching, background refetching and "keep previous data" pagination. Mutations invalidate the list and stats queries together.
- **JWT in `localStorage` with a Bearer header.** This keeps the API stateless and simple to deploy across origins. An httpOnly refresh-token cookie would be the next step for a production system (see below).

---

## Possible improvements

- Refresh tokens (httpOnly cookie) and token revocation
- Role-based access control (for example, only owners or admins can delete)
- Team-member management UI
- Optimistic updates for edits and deletes
- End-to-end tests with Playwright
- OpenAPI/Swagger documentation generated from the Zod schemas
