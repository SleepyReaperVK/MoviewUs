import { useMemo, useRef, useState } from "react";
import { useMovies } from "../hooks/useMovies";
import { useAlert } from "../hooks/useAlert";
import { Navbar, Sidebar, LazyMovieCard, FilterChips, LoadingSpinner, AddMovieModal, MovieDetailModal, AlertModal } from "../components";
import { createMovie, updateMovie, deleteMovie } from "../services/api";
import type { ArchiveSnapshot } from "../services/api";
import type { User, Status, MovieRow } from "../types";

interface HeaderProps {
  users: User[];
  userId: number | null;
  onUserChange: (uid: number | null) => void;
  onAddUser: (name: string, email: string) => Promise<unknown>;
  genres: string[];
  activeGenre: string | null;
  onGenreChange: (genre: string | null) => void;
}

function Header({ users, userId, onUserChange, onAddUser, genres, activeGenre, onGenreChange }: HeaderProps) {
  const [showAddUser, setShowAddUser] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;
    setAdding(true);
    setAddError("");
    try {
      await onAddUser(newName.trim(), newEmail.trim());
      setNewName("");
      setNewEmail("");
      setShowAddUser(false);
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : "Failed to add user");
    } finally {
      setAdding(false);
    }
  }

  function openAdd() {
    setShowAddUser(true);
    setAddError("");
    setTimeout(() => nameRef.current?.focus(), 50);
  }

  return (
    <div className="mb-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="page-title">Discover Movies</h2>
          <p className="page-subtitle">Browse the movies in your archive.</p>
        </div>
        <div className="flex flex-col gap-2 min-w-[180px]">
          <select
            value={userId ?? ""}
            onChange={(e) => onUserChange(e.target.value ? Number(e.target.value) : null)}
            className="inline-flex items-center justify-center gap-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All users</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          {!showAddUser ? (
            <button
              onClick={openAdd}
              className="text-xs text-primary hover:text-primary/80 font-medium text-left px-1 transition-colors"
            >
              + Add person
            </button>
          ) : (
            <form onSubmit={handleAddUser} className="flex flex-col gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <input
                ref={nameRef}
                type="text"
                placeholder="Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                type="email"
                placeholder="Email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                className="px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {addError && <p className="text-xs text-red-500">{addError}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold text-white bg-primary hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {adding ? "Adding…" : "Add"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddUser(false); setAddError(""); }}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      <FilterChips genres={genres} activeGenre={activeGenre} onGenreChange={onGenreChange} />
    </div>
  );
}

export default function HomePage({ dark, onToggleDark }: { dark: boolean; onToggleDark: () => void }) {
  const { users, userId, setUserId, movies, loading, refetch, addUser, handleExport, handleImport } = useMovies();
  const { pushAlert, dismissAlert } = useAlert();
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [detailMovie, setDetailMovie] = useState<MovieRow | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const importInputRef = useRef<HTMLInputElement>(null);

  /* Derive unique sorted genres from all movies */
  const allGenres = useMemo(() => {
    const set = new Set<string>();
    movies.forEach((m) => m.genres?.forEach((g) => set.add(g)));
    return Array.from(set).sort();
  }, [movies]);

  /* Filter movies by search query + active genre (client-side) */
  const filteredMovies = useMemo(() => {
    let result = movies;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.genres?.some((g) => g.toLowerCase().includes(q)) ||
          m.plot?.toLowerCase().includes(q) ||
          m.notes?.toLowerCase().includes(q)
      );
    }
    if (activeGenre) {
      result = result.filter((m) => m.genres?.includes(activeGenre));
    }
    return result;
  }, [movies, searchQuery, activeGenre]);

  async function handleAddMovie(data: {
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
  }) {
    if (!userId) throw new Error("Select a user first");
    await createMovie({ userId, ...data });
    refetch();
  }

  async function handleSaveMovie(movieId: number, data: Partial<MovieRow>) {
    if (!userId) throw new Error("Select a user first");
    await updateMovie(movieId, { userId, ...data });
    refetch();
    setDetailMovie((prev) => (prev ? { ...prev, ...data } : null));
  }

  async function handleDeleteMovie(movieId: number) {
    await deleteMovie(movieId);
    setDetailMovie(null);
    refetch();
  }

  function triggerImport() {
    importInputRef.current?.click();
  }

  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const snapshot = JSON.parse(text) as ArchiveSnapshot;
      await handleImport(snapshot);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Import failed");
    } finally {
      e.target.value = "";
    }
  }

  return (
    <>
      {/* Hidden import file input */}
      <input
        ref={importInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={onImportFile}
      />

      <Navbar
        users={users}
        onAddClick={() => setShowAddModal(true)}
        dark={dark}
        onToggleDark={onToggleDark}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onExport={handleExport}
        onImport={triggerImport}
      />

      <AddMovieModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddMovie}
      />

      <MovieDetailModal
        movie={detailMovie}
        onClose={() => setDetailMovie(null)}
        onSave={handleSaveMovie}
        onDelete={handleDeleteMovie}
      />

      <AlertModal alert={pushAlert} onDismiss={dismissAlert} />

      <div className="flex pt-16 sm:pt-20 max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 gap-8">
        <Sidebar />

        <main className="flex-1 py-8 w-full min-w-0">
          <Header
            users={users}
            userId={userId}
            onUserChange={setUserId}
            onAddUser={addUser}
            genres={allGenres}
            activeGenre={activeGenre}
            onGenreChange={setActiveGenre}
          />

          {loading ? (
            <LoadingSpinner visible={loading} />
          ) : filteredMovies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
              {filteredMovies.map((m) => (
                <LazyMovieCard key={m.id} movie={m} onClick={() => setDetailMovie(m)} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state__glow" aria-hidden="true" />
              <img
                src="/bears/bear_1_top_left.png"
                alt=""
                className="empty-state__illustration"
                width={200}
                height={160}
              />
              <p className="empty-state__title">No movies yet</p>
              <p className="empty-state__subtitle">
                {searchQuery || activeGenre
                  ? "No results match your current filters."
                  : "Start your archive by adding the first movie."}
              </p>
              {!searchQuery && !activeGenre && (
                <button
                  className="mt-4 flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary to-secondary rounded-2xl shadow-glow hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                  onClick={() => setShowAddModal(true)}
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Add your first movie
                </button>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
