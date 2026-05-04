import type { User, MovieRow, IMDBTitle, IMDBTitleDetail } from "../types";

export type ArchiveSnapshot = {
  exportedAt: string;
  version: number;
  users: object[];
  movies: object[];
  entries: object[];
};

const API_BASE =
  (import.meta.env.VITE_API_URL as string) || "http://localhost:4000/api";

const IMDB_SEARCH_URL = "https://api.imdbapi.dev/search/titles";
const IMDB_TITLE_URL = "https://api.imdbapi.dev/titles";

/** Fetch all users. */
export async function fetchUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/users`);
  if (!res.ok) throw new Error(`fetchUsers ${res.status}`);
  return res.json();
}

/** Create a new user. Throws with message on conflict (409) or bad input. */
export async function createUser(name: string, email: string): Promise<User> {
  const res = await fetch(`${API_BASE}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `createUser ${res.status}`);
  }
  return res.json();
}

/** Download the full archive as a JSON blob. */
export async function exportArchive(): Promise<void> {
  const res = await fetch(`${API_BASE}/export`);
  if (!res.ok) throw new Error(`export ${res.status}`);
  const blob = await res.blob();
  const cd = res.headers.get("Content-Disposition") ?? "";
  const nameMatch = cd.match(/filename="?([^"]+)"?/);
  const filename = nameMatch?.[1] ?? "archive.json";
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/** Upload and apply an archive JSON file. */
export async function importArchive(snapshot: ArchiveSnapshot): Promise<{ imported: { users: number; movies: number; entries: number } }> {
  const res = await fetch(`${API_BASE}/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(snapshot),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `import ${res.status}`);
  }
  return res.json();
}

/** Fetch movies for the given user id. */
export async function fetchMovies(userId: number): Promise<MovieRow[]> {
  const res = await fetch(`${API_BASE}/movies?userId=${userId}`);
  if (!res.ok) throw new Error(`fetchMovies ${res.status}`);
  return res.json();
}

/** Create a new movie + entry for the given user. */
export async function createMovie(payload: {
  userId: number;
  title: string;
  year?: number | null;
  endYear?: number | null;
  status?: "WANT" | "WATCHED";
  rating?: number | null;
  notes?: string;
  posterUrl?: string | null;
  imdbId?: string | null;
  genres?: string[];
  plot?: string | null;
  runtime?: number | null;
  mediaType?: string;
  imdbRating?: number | null;
}): Promise<MovieRow> {
  const res = await fetch(`${API_BASE}/movies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`createMovie ${res.status}`);
  return res.json();
}

/** Search IMDB for titles matching a query string (movies + TV). */
export async function searchIMDB(query: string): Promise<IMDBTitle[]> {
  if (!query.trim()) return [];
  const res = await fetch(
    `${IMDB_SEARCH_URL}?query=${encodeURIComponent(query.trim())}`
  );
  if (!res.ok) return [];
  const data = await res.json();
  const allowed = new Set(["movie", "tvSeries", "tvMovie", "tvMiniSeries"]);
  return (data.titles ?? [])
    .filter((t: IMDBTitle) => allowed.has(t.type))
    .slice(0, 8);
}

/** Fetch full detail for a single IMDB title (genres, plot, runtime). */
export async function fetchIMDBDetail(imdbId: string): Promise<IMDBTitleDetail | null> {
  try {
    const res = await fetch(`${IMDB_TITLE_URL}/${imdbId}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/** Update an existing movie + entry. */
export async function updateMovie(
  movieId: number,
  payload: {
    userId: number;
    title?: string;
    year?: number | null;
    endYear?: number | null;
    status?: "WANT" | "WATCHED";
    rating?: number | null;
    notes?: string;
    posterUrl?: string | null;
    imdbId?: string | null;
    genres?: string[];
    plot?: string | null;
    runtime?: number | null;
    mediaType?: string;
    imdbRating?: number | null;
  }
): Promise<void> {
  const res = await fetch(`${API_BASE}/movies/${movieId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`updateMovie ${res.status}`);
}

/** Delete a movie by id. */
export async function deleteMovie(movieId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/movies/${movieId}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`deleteMovie ${res.status}`);
}
