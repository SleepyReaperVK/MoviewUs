# Project Internals

---

## Containers

Four services defined in `docker-compose.yml`:

| Service | Image | Role | Exposed |
|---|---|---|---|
| `postgres` | postgres:16 | Database | internal only |
| `api` | custom (Node) | REST API | internal only |
| `web` | custom (Nginx) | Static frontend | internal only |
| `caddy` | caddy:2.10 | Reverse proxy + TLS | :80, :443 |

All services share one internal network (`app_net`). Only Caddy faces the internet.

```
Browser → Caddy :443
             ├── carrotspops.mov      → web:80
             └── api.carrotspops.mov  → api:4000
```

---

## Local Setup

**Requirements:** Docker Desktop running.

```bash
# 1. Copy env file
cp .env.example .env
# Edit .env — set a POSTGRES_PASSWORD (any string is fine locally)

# 2. Start everything (Caddy is skipped locally)
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build

# 3. Open
#   Frontend:  http://localhost:3000
#   API:       http://localhost:4000/api/health
```

`docker-compose.local.yml` does three things:
- Exposes api on `0.0.0.0:4000` and web on `0.0.0.0:3000`
- Overrides `VITE_API_URL` to `http://localhost:4000/api`
- Puts Caddy in the `production` profile so it doesn't start

After code changes, rebuild only what changed:
```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build web
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build api
```

**Postgres password mismatch?** The volume stores the password from when it was first created. If you change `POSTGRES_PASSWORD` in `.env` after that, run:
```bash
docker exec movie-archive-mvp-postgres-1 psql -U postgres -c "ALTER USER postgres PASSWORD 'your-new-password';"
```

---

## Cloud Setup

**Requirements:** VPS with Docker + Docker Compose installed. Domain DNS A record pointing to the server IP.

```bash
# On the server
git clone <repo> /opt/carrotspops
cd /opt/carrotspops/movie-archive-mvp

cp .env.example .env
nano .env   # set real POSTGRES_PASSWORD, DOMAIN, API_DOMAIN

docker compose up -d --build
```

Caddy automatically provisions TLS via Let's Encrypt on first start.

**Deploy updates:**
```bash
git pull
docker compose up -d --build web api   # only rebuilds changed services
```

**Check status:**
```bash
docker compose ps          # all containers + health
docker compose logs api    # api logs
docker compose logs caddy  # tls / proxy logs
```

---

## Database Schema

Three tables:

```
User
  id        — primary key
  email     — unique
  name
  createdAt

Movie
  id
  title, year, endYear
  posterUrl, imdbId
  genres[]  — postgres string array
  plot, runtime, mediaType, imdbRating
  createdAt

MovieEntry          ← join table between User and Movie
  userId  → User.id
  movieId → Movie.id
  status  — WANT | WATCHED
  rating  — 1–10 (optional)
  notes
  watchedAt
  ── unique(userId, movieId)  ── one row per user per movie
```

**Key idea:** `Movie` is shared across all users. Each user's personal watch status lives in `MovieEntry`. Two users can both have the same movie with different statuses/ratings.

---

## Backend (`api/index.js`)

Node.js + Express, ESM modules. Talks to Postgres via Prisma ORM.

| Method | Route | What it does |
|---|---|---|
| GET | `/api/health` | Liveness check |
| GET | `/api/users` | List all users |
| POST | `/api/users` | Create user `{name, email}` → 409 if email taken |
| GET | `/api/movies?userId=N` | All movies with that user's entry flattened in |
| POST | `/api/movies` | Create movie + entry for a user |
| PATCH | `/api/movies/:id` | Update entry (status, rating, notes) |
| DELETE | `/api/movies/:id` | Delete movie + all its entries |
| GET | `/api/export` | Dump whole DB as JSON download |
| POST | `/api/import` | Upsert users/movies/entries from JSON snapshot |

Startup sequence (inside container):
```
prisma generate → prisma migrate deploy → node index.js
```
Migrations run automatically on every container start — safe to re-run.

---

## Frontend (`web/src/`)

React 19 + TypeScript + Vite. Built to static files, served by Nginx.

**State lives in one hook — `useMovies.ts`:**
- Loads users on mount
- Loads movies when `userId` changes
- Exposes: `users`, `userId`, `setUserId`, `movies`, `loading`, `refetch`, `addUser`, `handleExport`, `handleImport`

**Component tree:**
```
App
└── HomePage
    ├── Navbar          — search, add movie, export/import, dark mode
    ├── Sidebar         — decorative
    └── main
        ├── Header      — user selector + inline add-user form + genre chips
        └── MovieGrid / EmptyState
            └── LazyMovieCard → MovieDetailModal (edit/delete)
```

**Data flow for "add a movie":**
```
User fills AddMovieModal
→ createMovie() in services/api.ts  (POST /api/movies)
→ refetch() in useMovies.ts         (GET /api/movies?userId=N)
→ movies state updates → grid re-renders
```

**API base URL** is injected at Docker build time via `VITE_API_URL` build arg. Changing it requires a `--build web`.

**Export/Import flow:**
- Export: `GET /api/export` → browser downloads JSON blob
- Import: user picks file → parsed in browser → `POST /api/import` → state refresh
