# SQLite Converter

Monorepo that powers **SQLite Converter**, a web application for previewing the structure and contents of uploaded SQLite databases. The frontend (Angular) offers the upload experience, while the backend (Bun + Elysia) validates and introspects the database, returning metadata and a sample of table rows.

## Features

- 🔄 Drag-and-drop SQLite database upload with rich feedback
- 🧠 Automatic validation (file type, size, SQLite header, table count, row limits)
- 📊 Table summaries with row counts, column names, and preview data
- 🧱 Bun runtime, Elysia server, and SQLite bindings for fast conversions
- 🚀 Docker-ready backend plus Firebase hosting for the Angular UI

## Repo structure

```
.
├── back-end/      # Bun + Elysia API that performs SQLite inspection
├── front-end/     # Angular application served via Firebase Hosting
├── bun.lock       # Workspace lockfile (Bun)
├── package.json   # Nx-style workspace manifest referencing both apps
└── nx.json        # Nx workspace configuration
```

Each app also has its own `README.md` with framework-specific commands.

## Prerequisites

- [Node.js 20+](https://nodejs.org/) and npm
- [Bun 1.1+](https://bun.sh/) for backend development and workspace installs
- [Firebase CLI](https://firebase.google.com/docs/cli) (optional) for frontend hosting emulation

## Installing dependencies

```bash
# from repo root
bun install
```

The Bun workspace installs backend dependencies under `back-end/` and frontend dependencies under `front-end/`. If you prefer npm for the Angular app, run `npm install` inside `front-end/` after the workspace install.

## Running locally

### Backend (Bun + Elysia)

```bash
cd back-end
bun run index.ts   # or: bun --watch run index.ts for development
```

Key environment variables:

| Variable              | Default | Description                                                                           |
| --------------------- | ------- | ------------------------------------------------------------------------------------- |
| `PORT`                | `3000`  | Port Elysia listens on                                                                |
| `RAILWAY_ENVIRONMENT` | unset   | When set (e.g., in Railway/GCP), temp files are written to `/tmp`; otherwise `./temp` |

API surface:

| Method | Path       | Description                                                                                              |
| ------ | ---------- | -------------------------------------------------------------------------------------------------------- |
| `POST` | `/convert` | Accepts `{ file: File }`. Validates the SQLite DB, inspects tables, and returns metadata + sampled rows. |

### Frontend (Angular)

```bash
cd front-end
npm start            # ng serve on http://localhost:4200
```

Useful scripts: `npm run build`, `npm run test`, `npm run e2e`.

The Angular app expects the backend to be reachable at `http://localhost:3000` during development. Deployed hosting targets `https://sqliteconverter.web.app` and `https://sqliteconverter.firebaseapp.com`, which are also allowed origins server-side.

## Docker & deployment

The backend ships with a multi-stage Bun → distroless Dockerfile (`back-end/Dockerfile`). To build and run it locally:

```bash
cd back-end
# Build
docker build -t sqlite-converter-backend .
# Run
docker run -p 8080:8080 -e PORT=8080 sqlite-converter-backend
```

The resulting image compiles the Bun app to a single binary (`dist/index`) and runs it in a distroless Debian 12 container—ideal for Cloud Build or Cloud Run.

The frontend is configured for Firebase Hosting (`front-end/.firebase` and `firebase.json`). Deploy using the Firebase CLI once you authenticate and select the project.

## Testing & quality

- Angular unit tests: `npm run test` inside `front-end/`
- Backend relies on runtime validation/logging; consider adding Bun test suites under `back-end/` for regression coverage.
- `nx.json` lets you extend the workspace with additional targets (lint, format, e2e) as the project grows.

## Additional resources

- [Bun Documentation](https://bun.sh/docs)
- [Elysia Framework](https://elysiajs.com/)
- [Angular CLI Overview](https://angular.dev/tools/cli)
- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)

Feel free to open issues or PRs if you’d like to contribute improvements to the converter or its deployment tooling.
