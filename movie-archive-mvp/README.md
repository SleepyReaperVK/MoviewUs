# movie-archive-mvp — Quick Start

This folder contains the API and web frontend for the Movie Archive MVP. The following quick-start assumes you have Docker and Node.js installed and you're on Windows PowerShell.

## Start the database
Open PowerShell in the `movie-archive-mvp` folder and run:

```powershell
docker compose up -d
```

This starts a PostgreSQL 16 container with these defaults (see `docker-compose.yml`):
- user: `postgres`
- password: `postgres`
- db: `movies`
- host port: `5433` -> container `5432`

## Configure the API
Copy the example env and edit if you changed DB ports/credentials:

```powershell
cd .\api
copy .env.example .env
# Then edit .env if needed (Notepad, VS Code, etc.)
```

The default `DATABASE_URL` in `.env.example` is:
```
postgres://postgres:postgres@localhost:5433/movies
```

## Install deps and run services
In separate terminals run the API and web dev servers.

API:
```powershell
cd .\api
npm install
npm run dev
```

Web (Vite + React):
```powershell
cd ..\web
npm install
npm run dev
```

By default the frontend will call `http://localhost:4000/api`. To override (for example when running the API on a different host), set `VITE_API_URL` before starting the web dev server, e.g.: `VITE_API_URL=http://localhost:4000/api npm run dev`.

## Verify
- API health: `GET http://localhost:4000/api/health` should return `{ "ok": true }`.
- Frontend: open the Vite URL printed in the terminal (usually http://localhost:5173).

## Notes
- If you plan to generate a Prisma client locally, the repository currently does not include the Prisma schema. If you have schema/migrations, run `npx prisma generate` and `npx prisma migrate dev` as needed.
