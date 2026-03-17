import type { User, MovieRow, IMDBTitle, IMDBTitleDetail } from "../types";

const API_BASE =
  (import.meta.env.VITE_API_URL as string) || "http://localhost:4000/api";

const IMDB_SEARCH_URL = "https://api.imdbapi.dev/search/titles";
const IMDB_TITLE_URL = "https://api.imdbapi.dev/titles";

/** Fetch all demo users. */
export async function fetchUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/users`);
  if (!res.ok) throw new Error(`fetchUsers ${res.status}`);
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
