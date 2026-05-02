#!/usr/bin/env sh
set -eu

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
STAMP="$(date +%Y%m%d_%H%M%S)"
OUT_DIR="${PROJECT_DIR}/db/backups"
OUT_FILE="${OUT_DIR}/movie_archive_${STAMP}.sql.gz"

mkdir -p "${OUT_DIR}"

cd "${PROJECT_DIR}"
docker compose exec -T postgres pg_dump -U postgres "${POSTGRES_DB:-movies}" | gzip > "${OUT_FILE}"

echo "Backup created: ${OUT_FILE}"
