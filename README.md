# MoviewUs

A multi-user movie archive. Add movies, track watch status and ratings, share lists across users.

**Stack:** React 19 + TypeScript · Node/Express · PostgreSQL 16 · Caddy · Docker Compose

---

## Local Development

**Requirements:** Docker Desktop

```bash
cd movie-archive-mvp

cp .env.example .env
# Edit .env — set any POSTGRES_PASSWORD value

docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API | http://localhost:4000/api/health |

After code changes, rebuild only what changed:
```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build web
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build api
```

---

## Production Deploy

**Requirements:** VPS with Docker + Compose, domain DNS A record pointing to server IP.

```bash
# On the server
git clone <repo> /opt/carrotspops
cd /opt/carrotspops/movie-archive-mvp

cp .env.example .env
nano .env   # set POSTGRES_PASSWORD, DOMAIN, API_DOMAIN

docker compose up -d --build
```

Caddy provisions TLS automatically via Let's Encrypt.

**Update:**
```bash
git pull
docker compose up -d --build web api
```

---

## Environment Variables

File: `movie-archive-mvp/.env`

| Variable | Example | Description |
|---|---|---|
| `POSTGRES_DB` | `movies` | Database name |
| `POSTGRES_PASSWORD` | `secret` | Postgres password |
| `DOMAIN` | `carrotspops.mov` | Frontend domain |
| `API_DOMAIN` | `api.carrotspops.mov` | API domain |

---

## Project Structure

```
movie-archive-mvp/
├── api/                  Node/Express REST API
│   ├── index.js          All routes
│   └── prisma/           Schema + migrations
├── web/                  React frontend (Vite)
│   └── src/
│       ├── components/   Navbar, MovieCard, Modals, FilterChips…
│       ├── hooks/        useMovies — central state
│       ├── pages/        HomePage
│       └── services/     api.ts — all fetch calls
├── db/backups/           backup.sh helper
├── docker-compose.yml    Production stack
├── docker-compose.local.yml  Local overrides (ports, no Caddy)
├── Caddyfile             Reverse proxy config
└── EXPLAIN.md            Architecture deep-dive for developers
```

---

## API Routes

| Method | Route | Description |
|---|---|---|
| GET | `/api/health` | Liveness check |
| GET | `/api/users` | List users |
| POST | `/api/users` | Create user `{name, email}` |
| GET | `/api/movies?userId=N` | Movies for a user |
| POST | `/api/movies` | Add movie + entry |
| PATCH | `/api/movies/:id` | Update status / rating / notes |
| DELETE | `/api/movies/:id` | Delete movie |
| GET | `/api/export` | Download full archive as JSON |
| POST | `/api/import` | Restore archive from JSON |

---

## Features

- **Multi-user** — each user has independent watch status and ratings for every movie
- **IMDB lookup** — search by title, auto-fill poster, genres, plot, runtime, rating
- **Export / Import** — one-click full database backup and restore as JSON
- **Dark mode** — persisted via `localStorage`
- **Mobile-friendly** — responsive layout, 44px touch targets, safe-area support
- **Offline-safe** — static frontend, API healthcheck, Postgres volume persists data across restarts

See [EXPLAIN.md](movie-archive-mvp/EXPLAIN.md) for schema, data flow, and container internals.
 
