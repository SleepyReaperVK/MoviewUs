import { useEffect, useRef, useState } from "react";
import type { Status, IMDBTitle } from "../types";
import { searchIMDB, fetchIMDBDetail } from "../services/api";

interface AddMovieModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    year: number | null;
    endYear: number | null;
    status: Status;
    rating: number | null;
    notes: string;
    posterUrl: string | null;
    imdbId: string | null;
    genres: string[];
    plot: string | null;
    runtime: number | null;
    mediaType: string;
    imdbRating: number | null;
  }) => Promise<void>;
}

function formatRuntime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

const TYPE_LABELS: Record<string, string> = {
  movie: "Movie",
  tvSeries: "TV Series",
  tvMovie: "TV Movie",
  tvMiniSeries: "Mini Series",
};

export default function AddMovieModal({ open, onClose, onSubmit }: AddMovieModalProps) {
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [endYear, setEndYear] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>("WANT");
  const [rating, setRating] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // IMDB data captured on selection
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [imdbId, setImdbId] = useState<string | null>(null);
  const [genres, setGenres] = useState<string[]>([]);
  const [plot, setPlot] = useState<string | null>(null);
  const [runtime, setRuntime] = useState<number | null>(null);
  const [mediaType, setMediaType] = useState("movie");
  const [imdbRating, setImdbRating] = useState<number | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [genreInput, setGenreInput] = useState("");

  // IMDB autocomplete state
  const [suggestions, setSuggestions] = useState<IMDBTitle[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced IMDB search
  useEffect(() => {
    if (!title.trim() || title.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSearching(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchIMDB(title);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setHighlightIdx(-1);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [title]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!open) return null;

  function resetForm() {
    setTitle("");
    setYear("");
    setEndYear(null);
    setStatus("WANT");
    setRating("");
    setNotes("");
    setError("");
    setPosterUrl(null);
    setImdbId(null);
    setGenres([]);
    setPlot(null);
    setRuntime(null);
    setMediaType("movie");
    setImdbRating(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setHighlightIdx(-1);
    setGenreInput("");
  }

  async function handleSelect(item: IMDBTitle) {
    // Populate from search result immediately
    setTitle(item.primaryTitle);
    setYear(item.startYear ? String(item.startYear) : "");
    setEndYear(item.endYear ?? null);
    setPosterUrl(item.primaryImage?.url ?? null);
    setImdbId(item.id);
    setMediaType(item.type);
    if (item.rating?.aggregateRating) {
      setRating(String(Math.round(item.rating.aggregateRating)));
      setImdbRating(item.rating.aggregateRating);
    }
    setSuggestions([]);
    setShowSuggestions(false);

    // Fetch detail for genres, plot, runtime
    setLoadingDetail(true);
    try {
      const detail = await fetchIMDBDetail(item.id);
      if (detail) {
        if (detail.genres?.length) setGenres(detail.genres);
        if (detail.plot) {
          setPlot(detail.plot);
          setNotes(detail.plot); // auto-fill notes with plot
        }
        if (detail.runtimeSeconds) setRuntime(detail.runtimeSeconds);
        if (detail.rating?.aggregateRating) setImdbRating(detail.rating.aggregateRating);
      }
    } catch {
      // detail fetch failed, not critical
    } finally {
      setLoadingDetail(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && highlightIdx >= 0) {
      e.preventDefault();
      handleSelect(suggestions[highlightIdx]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({
        title: title.trim(),
        year: year ? Number(year) : null,
        endYear,
        status,
        rating: rating ? Number(rating) : null,
        notes: notes.trim(),
        posterUrl,
        imdbId,
        genres,
        plot,
        runtime,
        mediaType,
        imdbRating,
      });
      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add movie");
    } finally {
      setSubmitting(false);
    }
  }

  const yearDisplay = year
    ? endYear
      ? `${year}–${endYear}`
      : year
    : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-lg mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">movie_filter</span>
            Add New Title
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          {/* Poster preview + detail card */}
          {posterUrl && (
            <div className="flex items-start gap-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex-shrink-0 w-20 h-[120px] rounded-xl overflow-hidden shadow-soft bg-slate-200">
                <img src={posterUrl} alt={title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0 py-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-900 dark:text-white truncate">{title}</p>
                  <span className="flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary uppercase">
                    {TYPE_LABELS[mediaType] ?? mediaType}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 flex-wrap">
                  {yearDisplay && <span>{yearDisplay}</span>}
                  {runtime && (
                    <span className="flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      {formatRuntime(runtime)}
                    </span>
                  )}
                  {imdbRating && (
                    <span className="flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-amber-400 text-[14px]">star</span>
                      {imdbRating}
                    </span>
                  )}
                </div>
                {genres.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {genres.map((g) => (
                      <span
                        key={g}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}
                {imdbId && (
                  <a
                    href={`https://www.imdb.com/title/${imdbId}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
                  >
                    View on IMDB
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </a>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setPosterUrl(null);
                  setImdbId(null);
                  setGenres([]);
                  setPlot(null);
                  setRuntime(null);
                  setMediaType("movie");
                  setImdbRating(null);
                  setEndYear(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
                title="Remove selection"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          )}

          {/* Loading detail indicator */}
          {loadingDetail && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span>
              Fetching details from IMDB…
            </div>
          )}

          {/* Title with IMDB autocomplete */}
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Title <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                placeholder="Start typing to search IMDB..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder-slate-400 pr-9"
                autoFocus
                autoComplete="off"
              />
              {searching && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined animate-spin text-[16px] text-slate-400">progress_activity</span>
                </div>
              )}
            </div>

            {/* IMDB suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl"
              >
                {suggestions.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-primary/5 transition-colors ${
                      idx === highlightIdx ? "bg-primary/10" : ""
                    } ${idx === 0 ? "rounded-t-xl" : ""} ${
                      idx === suggestions.length - 1 ? "rounded-b-xl" : ""
                    }`}
                  >
                    {/* Poster thumbnail */}
                    <div className="flex-shrink-0 w-10 h-14 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                      {item.primaryImage?.url ? (
                        <img
                          src={item.primaryImage.url}
                          alt={item.primaryTitle}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-slate-400 text-[18px]">movie</span>
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {item.primaryTitle}
                        </p>
                        <span className="flex-shrink-0 text-[9px] font-semibold px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 uppercase">
                          {TYPE_LABELS[item.type] ?? item.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        {item.startYear && (
                          <span>
                            {item.startYear}
                            {item.endYear ? `–${item.endYear}` : ""}
                          </span>
                        )}
                        {item.rating && (
                          <span className="flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-amber-400 text-[14px]">star</span>
                            {item.rating.aggregateRating}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Year + Status row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Year
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2024"
                min={1888}
                max={2100}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              >
                <option value="WANT">Want to Watch</option>
                <option value="WATCHED">Watched</option>
              </select>
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Your Rating (1–10)
            </label>
            <input
              type="number"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              placeholder="—"
              min={1}
              max={10}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder-slate-400"
            />
          </div>

          {/* ── IMDB-sourced fields (all editable) ── */}

          {/* Type + IMDB Rating row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Type
              </label>
              <select
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              >
                <option value="movie">Movie</option>
                <option value="tvSeries">TV Series</option>
                <option value="tvMovie">TV Movie</option>
                <option value="tvMiniSeries">Mini Series</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                IMDB Rating
              </label>
              <input
                type="number"
                value={imdbRating ?? ""}
                onChange={(e) => setImdbRating(e.target.value ? Number(e.target.value) : null)}
                placeholder="—"
                min={0}
                max={10}
                step={0.1}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder-slate-400"
              />
            </div>
          </div>

          {/* End Year + Runtime row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                End Year
                <span className="text-xs text-slate-400 ml-1">(series)</span>
              </label>
              <input
                type="number"
                value={endYear ?? ""}
                onChange={(e) => setEndYear(e.target.value ? Number(e.target.value) : null)}
                placeholder="—"
                min={1888}
                max={2100}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Runtime
              </label>
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
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder-slate-400"
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
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder-slate-400"
                />
                <span className="text-xs text-slate-400 flex-shrink-0">m</span>
              </div>
            </div>
          </div>

          {/* Poster URL */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Poster URL
            </label>
            <input
              type="url"
              value={posterUrl ?? ""}
              onChange={(e) => setPosterUrl(e.target.value || null)}
              placeholder="https://..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder-slate-400"
            />
          </div>

          {/* Genres (tag editor) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Genres
            </label>
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
                    if (tag && !genres.includes(tag)) {
                      setGenres((prev) => [...prev, tag]);
                    }
                    setGenreInput("");
                  }
                }}
                placeholder="Type a genre and press Enter"
                className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder-slate-400"
              />
              <button
                type="button"
                onClick={() => {
                  const tag = genreInput.trim();
                  if (tag && !genres.includes(tag)) {
                    setGenres((prev) => [...prev, tag]);
                  }
                  setGenreInput("");
                }}
                className="px-3 py-2.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Plot */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Plot
            </label>
            <textarea
              value={plot ?? ""}
              onChange={(e) => setPlot(e.target.value || null)}
              rows={3}
              placeholder="Movie plot summary..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder-slate-400 resize-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any thoughts or links..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder-slate-400 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-primary to-secondary rounded-xl shadow-glow hover:shadow-lg disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {submitting ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                Saving…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">add</span>
                Add Title
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
