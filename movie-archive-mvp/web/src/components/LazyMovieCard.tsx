import { useInView } from "../hooks/useInView";
import MovieCard from "./MovieCard";
import type { MovieRow } from "../types";

interface LazyMovieCardProps {
  movie: MovieRow;
  onClick?: () => void;
}

/**
 * Wraps MovieCard with Intersection Observer–based lazy rendering.
 * Shows a lightweight skeleton placeholder until the card scrolls
 * within 200px of the viewport, then renders the real MovieCard.
 */
export default function LazyMovieCard({ movie, onClick }: LazyMovieCardProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin: "200px", once: true });

  if (!inView) {
    return (
      <div ref={ref} className="animate-pulse">
        {/* Poster skeleton */}
        <div className="aspect-[2/3] rounded-2xl bg-slate-200 dark:bg-slate-800" />
        {/* Text skeleton */}
        <div className="mt-3 space-y-2">
          <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    );
  }

  return <MovieCard movie={movie} onClick={onClick} />;
}
