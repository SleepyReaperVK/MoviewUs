import { useCallback, useEffect, useState } from "react";
import type { MovieRow, Status } from "../types";

interface MovieDetailModalProps {
  movie: MovieRow | null;
  onClose: () => void;
  onSave: (movieId: number, data: Partial<MovieRow>) => Promise<void>;
  onDelete: (movieId: number) => Promise<void>;
}

const TYPE_LABELS: Record<string, string> = {
  movie: "Movie",
  tvSeries: "TV Series",
  tvMovie: "TV Movie",
  tvMiniSeries: "Mini Series",
};

function formatRuntime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export default function MovieDetailModal({ movie, onClose, onSave, onDelete }: MovieDetailModalProps) {
  const [imgSrc, setImgSrc] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // ── Editable fields ──
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [endYear, setEndYear] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>("WANT");
  const [rating, setRating] = useState("");
  const [notes, setNotes] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [plot, setPlot] = useState("");
  const [runtime, setRuntime] = useState<number | null>(null);
  const [mediaType, setMediaType] = useState("movie");
  const [imdbRating, setImdbRating] = useState<number | null>(null);
  const [genreInput, setGenreInput] = useState("");

  // Sync state whenever movie changes (opens)
  const syncFromMovie = useCallback((m: MovieRow) => {
    setTitle(m.title);
    setYear(m.year ? String(m.year) : "");
    setEndYear(m.endYear ?? null);
    setStatus(m.status);
    setRating(m.rating != null ? String(m.rating) : "");
    setNotes(m.notes ?? "");
    setPosterUrl(m.posterUrl ?? "");
    setGenres(m.genres ?? []);
    setPlot(m.plot ?? "");
    setRuntime(m.runtime ?? null);
    setMediaType(m.mediaType ?? "movie");
    setImdbRating(m.imdbRating ?? null);
    setGenreInput("");
    setImgSrc(m.posterUrl || `https://picsum.photos/seed/movie-${m.id}/400/600`);
    setEditing(false);
    setConfirmDelete(false);
  }, []);

  useEffect(() => {
    if (movie) syncFromMovie(movie);
  }, [movie, syncFromMovie]);

  if (!movie) return null;

  const fallbackSrc = `https://picsum.photos/seed/movie-${movie.id}/400/600`;

  function handleCancelEdit() {
    if (movie) syncFromMovie(movie);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(movie!.id, {
        title: title.trim(),
        year: year ? Number(year) : null,
        endYear,
        status,
        rating: rating ? Number(rating) : null,
        notes: notes.trim(),
        posterUrl: posterUrl.trim() || null,
        genres,
        plot: plot.trim() || null,
        runtime,
        mediaType,
        imdbRating,
      });
      setEditing(false);
    } catch {
      // stay in edit mode
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await onDelete(movie!.id);
    } finally {
      setSaving(false);
    }
  }

  const yearDisplay = year
    ? endYear
      ? `${year}–${endYear}`
      : year
    : "—";

  // ── VIEW MODE ──
  const viewContent = (
    <div className="flex-1 p-6 space-y-4 overflow-y-auto">
      {/* Title + Type badge */}
      <div>
        <div className="flex items-start gap-2 flex-wrap">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
            {movie.title}
          </h2>
          {movie.mediaType && movie.mediaType !== "movie" && (
            <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary uppercase mt-1">
              {TYPE_LABELS[movie.mediaType] ?? movie.mediaType}
            </span>
          )}
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-2 text-sm text-slate-500 flex-wrap">
          <span>{yearDisplay}</span>
          {movie.runtime && (
            <>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                {formatRuntime(movie.runtime)}
              </span>
            </>
          )}
          {movie.imdbRating && (
            <>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-0.5">
                <span className="material-symbols-outlined text-amber-400 text-[14px]">star</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{movie.imdbRating}</span>
                <span className="text-slate-400 text-xs">/ 10</span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Genres */}
      {movie.genres && movie.genres.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {movie.genres.map((g) => (
            <span
              key={g}
              className="text-xs font-medium px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            >
              {g}
            </span>
          ))}
        </div>
      )}

      {/* Status + Rating */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={async () => {
            const newStatus: Status = movie.status === "WATCHED" ? "WANT" : "WATCHED";
            await onSave(movie.id, { status: newStatus });
          }}
          className={`text-xs font-bold px-3 py-1 rounded-full uppercase cursor-pointer transition-colors ${
            movie.status === "WATCHED"
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
              : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50"
          }`}
          title={movie.status === "WATCHED" ? "Click to mark as Want to Watch" : "Click to mark as Watched"}
        >
          {movie.status === "WATCHED" ? "✓ Watched" : "★ Want to watch"}
        </button>
        {movie.rating != null && (
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-yellow-400 text-[16px]">star</span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {movie.rating}/10
            </span>
            <span className="text-xs text-slate-400 ml-0.5">your rating</span>
          </div>
        )}
      </div>

      {/* Plot / Notes */}
      {(movie.plot || movie.notes) && (
        <div className="space-y-2">
          {movie.plot && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Plot</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{movie.plot}</p>
            </div>
          )}
          {movie.notes && movie.notes !== movie.plot && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Notes</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{movie.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* IMDB link */}
      {movie.imdbId && (
        <a
          href={`https://www.imdb.com/title/${movie.imdbId}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          View on IMDB
          <span className="material-symbols-outlined text-[16px]">open_in_new</span>
        </a>
      )}

      {/* Action buttons (view mode) */}
      <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">edit</span>
          Edit
        </button>
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
            Delete
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-500 font-medium">Are you sure?</span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="px-3 py-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
            >
              Yes, delete
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Shared input class
  const inputCls =
    "w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder-slate-400";

  // ── EDIT MODE ──
  const editContent = (
    <div className="flex-1 p-6 space-y-4 overflow-y-auto">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-[20px]">edit</span>
        Edit Title
      </h3>

      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Title</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
      </div>

      {/* Year + End Year + Status */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Year</label>
          <input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="—" min={1888} max={2100} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">End Year</label>
          <input
            type="number"
            value={endYear ?? ""}
            onChange={(e) => setEndYear(e.target.value ? Number(e.target.value) : null)}
            placeholder="—"
            min={1888}
            max={2100}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className={inputCls}>
            <option value="WANT">Want to Watch</option>
            <option value="WATCHED">Watched</option>
          </select>
        </div>
      </div>

      {/* Type + Your Rating + IMDB Rating */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Type</label>
          <select value={mediaType} onChange={(e) => setMediaType(e.target.value)} className={inputCls}>
            <option value="movie">Movie</option>
            <option value="tvSeries">TV Series</option>
            <option value="tvMovie">TV Movie</option>
            <option value="tvMiniSeries">Mini Series</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Your Rating</label>
          <input type="number" value={rating} onChange={(e) => setRating(e.target.value)} placeholder="—" min={1} max={10} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">IMDB Rating</label>
          <input
            type="number"
            value={imdbRating ?? ""}
            onChange={(e) => setImdbRating(e.target.value ? Number(e.target.value) : null)}
            placeholder="—"
            min={0}
            max={10}
            step={0.1}
            className={inputCls}
          />
        </div>
      </div>

      {/* Runtime */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Runtime</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={runtime ? Math.floor(runtime / 3600) : ""}
            onChange={(e) => {
              const h = e.target.value ? Number(e.target.value) : 0;
              const prevMin = runtime ? Math.floor((runtime % 3600) / 60) : 0;
              const total = h * 3600 + prevMin * 60;
              setRuntime(total > 0 ? total : null);
            }}
            placeholder="0"
            min={0}
            max={99}
            className={inputCls}
          />
          <span className="text-xs text-slate-400 flex-shrink-0">h</span>
          <input
            type="number"
            value={runtime ? Math.floor((runtime % 3600) / 60) : ""}
            onChange={(e) => {
              const m = e.target.value ? Number(e.target.value) : 0;
              const prevH = runtime ? Math.floor(runtime / 3600) : 0;
              const total = prevH * 3600 + m * 60;
              setRuntime(total > 0 ? total : null);
            }}
            placeholder="0"
            min={0}
            max={59}
            className={inputCls}
          />
          <span className="text-xs text-slate-400 flex-shrink-0">m</span>
        </div>
      </div>

      {/* Poster URL */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Poster URL</label>
        <input type="url" value={posterUrl} onChange={(e) => setPosterUrl(e.target.value)} placeholder="https://..." className={inputCls} />
      </div>

      {/* Genres (tag editor) */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Genres</label>
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {genres.map((g) => (
              <span
                key={g}
                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary"
              >
                {g}
                <button
                  type="button"
                  onClick={() => setGenres((prev) => prev.filter((x) => x !== g))}
                  className="hover:text-red-500 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={genreInput}
            onChange={(e) => setGenreInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                const tag = genreInput.trim();
                if (tag && !genres.includes(tag)) setGenres((prev) => [...prev, tag]);
                setGenreInput("");
              }
            }}
            placeholder="Type genre + Enter"
            className={`flex-1 ${inputCls}`}
          />
          <button
            type="button"
            onClick={() => {
              const tag = genreInput.trim();
              if (tag && !genres.includes(tag)) setGenres((prev) => [...prev, tag]);
              setGenreInput("");
            }}
            className="px-3 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Plot */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Plot</label>
        <textarea value={plot} onChange={(e) => setPlot(e.target.value)} rows={3} placeholder="Plot summary..." className={`${inputCls} resize-none`} />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Your notes..." className={`${inputCls} resize-none`} />
      </div>

      {/* Save / Cancel */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={handleCancelEdit}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-primary to-secondary rounded-xl shadow-glow hover:shadow-lg disabled:opacity-50 transition-all"
        >
          {saving ? (
            <>
              <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
              Saving…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[16px]">save</span>
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-1.5 bg-black/30 backdrop-blur-md rounded-full text-white/80 hover:text-white hover:bg-black/50 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="flex flex-col sm:flex-row overflow-y-auto">
          {/* Poster */}
          <div className="flex-shrink-0 sm:w-64 w-full aspect-[2/3] sm:aspect-auto bg-slate-200 dark:bg-slate-800">
            <img
              src={imgSrc}
              alt={movie.title}
              className="w-full h-full object-cover"
              onError={() => setImgSrc(fallbackSrc)}
            />
          </div>

          {/* Content switches between view and edit */}
          {editing ? editContent : viewContent}
        </div>
      </div>
    </div>
  );
}
