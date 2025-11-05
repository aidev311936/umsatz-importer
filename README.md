# Umsatz Importer

A two-part tool for managing Umsatz (revenue) import mappings. The backend exposes a lightweight HTTP API for managing mapping records and delegating AI-assisted suggestions. The frontend provides a dashboard for monitoring import jobs via the API.

## Project structure

```
.
├── backend/          # TypeScript API server (Node.js, PostgreSQL, optional OpenAI integration)
├── frontend/         # Static frontend dashboard written in TypeScript
└── README.md
```

### Backend layout

- `src/server.ts` – boots the HTTP server, wires routing, CORS, and graceful shutdown.
- `src/routes.ts` – declares REST routes for mappings, AI suggestions, and health checks.
- `src/db.ts` – configures the PostgreSQL pool using the `DATABASE_URL` environment variable.
- `src/mappingsRepo.ts` – persistence layer for CRUD operations on mapping records.
- `src/ai.ts` – integrates with the OpenAI Chat Completions API when enabled.

### Frontend layout

- `index.html` – entry document that mounts the dashboard.
- `src/main.ts` – renders summary widgets and fetches import job data from the backend.
- `styles.css` – shared styling for the dashboard.

## Prerequisites

- Node.js (see the `NODE_VERSION` environment variable for the exact version your deployment expects).
- npm.
- PostgreSQL database reachable via `DATABASE_URL`.
- Optional: OpenAI API access for AI suggestions.

## Environment variables

The application expects the following environment variables to be defined:

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | Yes | Port the backend HTTP server listens on. Defaults to `3001` if unset locally. |
| `NODE_VERSION` | Yes | Node.js runtime version required for both frontend and backend builds. |
| `DATABASE_URL` | Yes | PostgreSQL connection string used by the backend. |
| `CORS_ORIGIN` | Yes | Origin allowed to access the backend API. Configure your deployment platform to reflect your frontend host. |
| `OPENAI_API_KEY` | Yes | Token used to authenticate with the OpenAI API for AI-powered mapping suggestions. |
| `OPENAI_ASSISTANT_ID` | Yes | Identifier for the OpenAI assistant leveraged by the deployment. |
| `__API_BASE__` | No | Optional override for the frontend to point API calls to a different base URL during deployment. |

> **Note:** In development you can export these variables locally or place them in an `.env` file consumed by your process manager.

## Backend: install, build, and run

```bash
cd backend
npm install           # install TypeScript, ts-node, and runtime dependencies
npm run build         # compile TypeScript to dist/
PORT=3001 DATABASE_URL=postgres://... npm start
```

For iterative development, run the server with live TypeScript execution:

```bash
cd backend
npm run dev
```

The backend exposes REST endpoints such as `GET /mappings`, `POST /mappings`, `POST /ai/suggestions`, and `GET /health`.

## Frontend: install, build, and preview

The frontend is a static TypeScript project that emits browser-ready assets.

```bash
cd frontend
npm install       # installs TypeScript compiler
npm run build     # compiles to dist/main.js
```

Serve `index.html`, `styles.css`, and the compiled assets from any static hosting solution (e.g., `npm install -g serve && serve .`). When deploying behind a separate backend host, set `__API_BASE__` to rewrite API requests during your build or hosting configuration.

### Configuring the frontend API base URL

The frontend publishes `window.__API_BASE__` before the bundle executes by reading the `data-api-base` attribute on the inline script in `frontend/index.html`. At deployment time, configure your hosting platform to replace the `{{ API_BASE_URL }}` placeholder with the fully qualified backend origin. Two common approaches are:

- **Static hosts with build-time substitution:** e.g., on Netlify, Cloudflare Pages, or Vercel, define an environment variable such as `API_BASE_URL` and add a post-build step (`envsubst`, `sed`, templating plugin) that replaces the placeholder in `index.html` before uploading the assets.
- **Server-side templating:** if the file is served through Nginx, Apache, or another web server, use SSI, `envsubst`, or a small middleware to inject the runtime environment variable when responding with `index.html`.

If no substitution occurs, the dashboard falls back to same-origin requests and assumes the backend is reachable under the current host.

## Deployment guidance

1. Provision infrastructure for:
   - Node.js runtime matching `NODE_VERSION` for the backend.
   - PostgreSQL database accessible via `DATABASE_URL`.
   - Static asset hosting for the frontend (CDN, object storage, or web server).
2. Configure environment variables (`PORT`, `DATABASE_URL`, `CORS_ORIGIN`, `OPENAI_API_KEY`, `OPENAI_ASSISTANT_ID`, and optional `__API_BASE__`).
3. Build the backend (`npm run build`) and deploy `dist/` along with `package.json` to your Node hosting platform. Ensure the process manager runs `npm start`.
4. Build the frontend (`npm run build`) and upload `index.html`, `styles.css`, `public/` assets, and the `dist/` bundle to your static host.
5. Confirm that the frontend points to the deployed backend (either same origin or via `__API_BASE__`).
6. Validate the deployment by hitting `/health` on the backend and loading the dashboard.

For container-based deployments, bake the environment variables into your orchestrator and expose the configured `PORT`.
