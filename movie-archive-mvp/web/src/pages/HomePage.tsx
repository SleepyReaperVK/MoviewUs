import { useMemo, useState } from "react";
import { useMovies } from "../hooks/useMovies";
import { Navbar, Sidebar, LazyMovieCard, FilterChips, LoadingSpinner, AddMovieModal, MovieDetailModal } from "../components";
import { createMovie, updateMovie, deleteMovie } from "../services/api";
import type { User, Status, MovieRow } from "../types";

interface HeaderProps {
  users: User[];
  userId: number | null;
  onUserChange: (uid: number | null) => void;
  genres: string[];
  activeGenre: string | null;
  onGenreChange: (genre: string | null) => void;
}

function Header({ users, userId, onUserChange, genres, activeGenre, onGenreChange }: HeaderProps) {
  return (
    <div className="mb-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Discover Movies</h2>
          <p className="text-slate-500 mt-1">Browse the movies in your archive.</p>
        </div>
        <div className="relative inline-block text-left group">
          <select
            value={userId ?? ""}
            onChange={(e) => onUserChange(e.target.value ? Number(e.target.value) : null)}
            className="inline-flex items-center justify-center gap-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All users</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <FilterChips genres={genres} activeGenre={activeGenre} onGenreChange={onGenreChange} />
    </div>
  );
}

export default function HomePage({ dark, onToggleDark }: { dark: boolean; onToggleDark: () => void }) {
  const { users, userId, setUserId, movies, loading, refetch } = useMovies();
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [detailMovie, setDetailMovie] = useState<MovieRow | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  /* Derive unique sorted genres from all movies */
  const allGenres = useMemo(() => {
    const set = new Set<string>();
    movies.forEach((m) => m.genres?.forEach((g) => set.add(g)));
    return Array.from(set).sort();
  }, [movies]);

  /* Filter movies by search query + active genre (client-side) */
  const filteredMovies = useMemo(() => {
    let result = movies;

    // Search filter (title, genres, plot — case-insensitive)
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

    // Genre filter
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
    // Update detail view with fresh data
    setDetailMovie((prev) => (prev ? { ...prev, ...data } : null));
  }

  async function handleDeleteMovie(movieId: number) {
    await deleteMovie(movieId);
    setDetailMovie(null);
    refetch();
  }

  return (
    <>
      <Navbar
        users={users}
        onAddClick={() => setShowAddModal(true)}
        dark={dark}
        onToggleDark={onToggleDark}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
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

      <div className="flex pt-16 sm:pt-20 max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 gap-8">
        <Sidebar />

      <main className="flex-1 py-8 w-full">
        <Header
          users={users}
          userId={userId}
          onUserChange={setUserId}
          genres={allGenres}
          activeGenre={activeGenre}
          onGenreChange={setActiveGenre}
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
          {filteredMovies.length > 0 ? (
            filteredMovies.map((m) => (
              <LazyMovieCard key={m.id} movie={m} onClick={() => setDetailMovie(m)} />
            ))
          ) : (
            <div className="col-span-full text-center text-slate-500 py-12">
              {loading ? "Loading movies..." : "No movies yet."}
            </div>
          )}
        </div>

        <LoadingSpinner visible={loading} />
      </main>
      </div>
    </>
  );
}
