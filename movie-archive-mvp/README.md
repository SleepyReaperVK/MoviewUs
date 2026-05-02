# movie-archive-mvp

Production is designed for an all-in Docker Compose stack: `caddy`, `web`, `api`, and `postgres`.

## Production architecture

```txt
Cloudflare DNS
	↓
Hetzner VPS
	↓
Caddy (80/443 public)
	├── carrotspops.mov          -> web
	└── api.carrotspops.mov      -> api
															 -> postgres (internal Docker network)
```

Only Caddy exposes public ports. Postgres is internal-only.

## 1) Server prerequisites (Ubuntu 24.04)

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y ca-certificates curl git ufw

curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

Log out/in once, then configure firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 2) DNS records

Point both A records to the VPS IP:

```txt
A  @    SERVER_IP
A  api  SERVER_IP
```

## 3) Configure environment

From the `movie-archive-mvp` folder:

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

```env
POSTGRES_DB=movies
POSTGRES_PASSWORD=REPLACE_WITH_STRONG_PASSWORD
DOMAIN=carrotspops.mov
API_DOMAIN=api.carrotspops.mov
```

## 4) Deploy

```bash
git pull
docker compose up -d --build
```

Check status and logs:

```bash
docker compose ps
docker compose logs -f caddy
docker compose logs -f api
```

Prisma migrations are run automatically before API startup (`npm run migrate:deploy`).

## 5) Verify

- `https://carrotspops.mov` serves frontend
- `https://api.carrotspops.mov/api/health` returns `{ "ok": true }`

## 6) Backups

Manual backup:

```bash
./db/backups/backup.sh
```

This creates `db/backups/movie_archive_YYYYmmdd_HHMMSS.sql.gz`.

Recommended: run daily via cron and copy backups to off-server storage.

## Local development

You can still run API and web directly with Node for development.

API:

```powershell
cd .\api
copy .env.example .env
npm install
npm run dev
```

Web:

```powershell
cd ..\web
npm install
npm run dev
```

By default, frontend uses `http://localhost:4000/api` in dev unless `VITE_API_URL` is set.
