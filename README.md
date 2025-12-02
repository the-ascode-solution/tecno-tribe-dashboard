# Tecno Survey Dashboard

A React + Express dashboard tailored for TECNO survey data. The UI has been redesigned to match a crisp white & electric-blue palette, offers responsive analytics views, and exposes administrative controls for reviewing and exporting survey submissions backed by PostgreSQL.

![Dashboard brand](./docs/brand.png)

## Features

- **Secure admin access** – Simple session-gated login with single-session enforcement.
- **Collection browser** – Paginated table previews of every public schema table returned by PostgreSQL.
- **Analytics hub**
  - Daily submission trends table sized for quick scanning.
  - Gender-distribution table with coordinated pie chart legend.
  - Inline hints when data fields are missing.
- **Theme toggle** – Light (sun) vs. dark (crescent) modes with persisted preference.
- **CSV/XLSX export** – One-click export of the current collections via `xlsx`.
- **Responsive layout** – Grid-based cards adapt to desktop and tablet breakpoints.

## Tech stack

| Layer | Choices |
| --- | --- |
| Frontend | React 19 (CRA), modern CSS, SVG icons |
| Backend | Express 5, `pg` connection pool, CORS-enabled REST endpoints |
| Database | PostgreSQL (Neon-hosted by default) |
| Tooling | dotenv, concurrently, XLSX export helpers |

## Project structure

```
e:\tecno dashboard
├── src/            # React app (App.js houses most logic)
├── public/
├── server.js       # Express API + Postgres connector
├── package.json
├── .env.example    # (create this locally from README instructions)
└── README.md
```

## Getting started

1. **Install prerequisites**
   - Node.js 20+
   - npm 10+
   - Access to a PostgreSQL database containing the survey tables.
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Configure environment** – Create an `.env` file at the repo root:
   ```ini
   # Required
   DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require
   ADMIN_EMAIL=admin@tecnotribe.site
   ADMIN_PASSWORD=!password$123*

   # Optional overrides
   SERVER_PORT=5000
   SESSION_TTL_MS=3600000
   ```
   > The React client references the Express server through CRA's proxy, so no `REACT_APP_*` variables are needed today.
4. **Run the stack**
   - Start only the frontend: `npm start`
   - Start only the API: `npm run server`
   - Run both concurrently (recommended during development):
     ```bash
     npm run dev
     ```
5. **Build for production**
   ```bash
   npm run build
   ```

## UI customization notes

- **Branding** – Top-left wordmark reads `TECNO SURVEY Dashboard`. Update `src/App.js` if branding changes again.
- **Color palette** – CSS variables live in `src/App.css`; light mode is constrained to white + `#0363F9`, while dark mode leans on deep navy backgrounds.
- **Gender visualization** – Colors map to specific labels (blue = male, pink = female, green = prefer not to say). Additional labels fall back to the rotating palette defined in `PIE_COLORS`.

## Backend endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET /api/health` | Simple readiness probe. |
| `POST /api/login` | Validates credentials, issues temporary session token (single active session enforced). |
| `POST /api/logout` | Clears the current session token. |
| `POST /api/session/check` | Verifies that a token is still valid. |
| `GET /api/data` | Lists every `public` table, its row count, and returns full table contents as JSON aggregates. |

## Development tips

1. **Data volume** – `/api/data` currently returns every row in each table. Consider adding pagination or limits before shipping to production datasets.
2. **Session rules** – Only one client can be logged in at a time. Adjust this logic in `server.js` if multi-session support is required.
3. **Exports** – The file name pattern `TecnoSurvey-dashboard-<timestamp>.xlsx` is controlled inside `src/App.js` if you want to refine it.
4. **Styling** – The dashboard relies solely on CSS (no Tailwind). Keep new styles consistent with the variable-driven system in `App.css`.

## Testing

The project retains CRA's default testing setup. To execute the suite:

```bash
npm test
```

Writing component-level tests with `@testing-library/react` is encouraged for future PRs (table rendering, theme toggle persistence, etc.).

## Deployment

1. Build the frontend (`npm run build`).
2. Host the static assets (Netlify, Vercel, S3/CloudFront, etc.).
3. Deploy `server.js` to any Node-compatible environment (Render, Fly.io, traditional VPS). Ensure the same `.env` is provided and that CORS origins include your frontend host.
4. Update any DNS/SSL records as needed.

## License

Internal TECNO tooling – contact the project owners before sharing outside the organization.
