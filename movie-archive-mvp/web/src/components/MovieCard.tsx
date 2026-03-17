import { useEffect, useState } from "react";
import type { MovieRow } from "../types";

interface MovieCardProps {
  movie: MovieRow;
  onClick?: () => void;
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

export default function MovieCard({ movie, onClick }: MovieCardProps) {
  const fallbackSrc = `https://picsum.photos/seed/movie-${movie.id}/400/600`;
  const [imgSrc, setImgSrc] = useState(movie.posterUrl || fallbackSrc);

  // Sync image when movie data changes (e.g. after refetch)
  useEffect(() => {
    setImgSrc(movie.posterUrl || fallbackSrc);
  }, [movie.posterUrl, fallbackSrc]);

  const yearDisplay = movie.year
    ? movie.endYear
      ? `${movie.year}–${movie.endYear}`
      : String(movie.year)
    : "—";

  return (
    <div className="group cursor-pointer" onClick={onClick}>
      <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-soft group-hover:shadow-glow group-hover:-translate-y-2 transition-all duration-300 bg-slate-200">
        {/* Rating badge */}
        <div className="absolute top-3 right-3 z-10 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1">
          <span className="material-symbols-outlined text-yellow-400 text-[14px]">star</span>
          <span className="text-white text-xs font-bold">{movie.rating ?? "—"}</span>
        </div>

        {/* Type badge (top-left) */}
        {movie.mediaType && movie.mediaType !== "movie" && (
          <div className="absolute top-3 left-3 z-10 bg-primary/80 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10">
            <span className="text-white text-[10px] font-bold uppercase">
              {TYPE_LABELS[movie.mediaType] ?? movie.mediaType}
            </span>
          </div>
        )}

        {/* Poster */}
        <img
          alt={`${movie.title} poster`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          src={imgSrc}
          onError={() => setImgSrc(fallbackSrc)}
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          {/* Genre tags on hover */}
          {movie.genres?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {movie.genres.slice(0, 3).map((g) => (
                <span
                  key={g}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white border border-white/10"
                >
                  {g}
                </span>
              ))}
            </div>
          )}
          <div className="w-full py-2 bg-primary text-white text-sm font-semibold rounded-lg shadow-lg text-center">
            View Details
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="mt-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight truncate group-hover:text-primary transition-colors">
          {movie.title}
        </h3>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2 text-sm text-slate-500">
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
          </div>
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
            {movie.status}
          </span>
        </div>
      </div>
    </div>
  );
}
