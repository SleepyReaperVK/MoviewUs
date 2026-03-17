import { useEffect, useRef, useState } from "react";

interface FilterChipsProps {
  genres: string[];
  activeGenre: string | null;
  onGenreChange: (genre: string | null) => void;
}

const VISIBLE_COUNT = 5;

const chipBase =
  "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap";
const chipActive = `${chipBase} bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg hover:shadow-xl`;
const chipInactive = `${chipBase} bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary hover:text-primary shadow-sm`;

export default function FilterChips({ genres, activeGenre, onGenreChange }: FilterChipsProps) {
  const [showMore, setShowMore] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const visibleGenres = genres.slice(0, VISIBLE_COUNT);
  const overflowGenres = genres.slice(VISIBLE_COUNT);
  const hasOverflow = overflowGenres.length > 0;

  // Is the active genre hidden inside the overflow?
  const activeInOverflow = activeGenre ? overflowGenres.includes(activeGenre) : false;

  // Close dropdown on outside click
  useEffect(() => {
    if (!showMore) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowMore(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMore]);

  return (
    <div className="flex items-center gap-3 pb-4 scrollbar-hide mask-fade-right flex-wrap relative z-20">
      {/* "All" chip */}
      <button
        onClick={() => onGenreChange(null)}
        className={activeGenre === null ? chipActive : chipInactive}
      >
        <span className="material-symbols-outlined text-[18px]">apps</span>
        All
      </button>

      {/* Visible genre chips */}
      {visibleGenres.map((g) => (
        <button
          key={g}
          onClick={() => onGenreChange(activeGenre === g ? null : g)}
          className={activeGenre === g ? chipActive : chipInactive}
        >
          {g}
        </button>
      ))}

      {/* Overflow dropdown */}
      {hasOverflow && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowMore((prev) => !prev)}
            className={`${activeInOverflow ? chipActive : chipInactive} gap-1`}
          >
            {activeInOverflow ? activeGenre : `+${overflowGenres.length} more`}
            <span
              className={`material-symbols-outlined text-[18px] transition-transform ${showMore ? "rotate-180" : ""}`}
            >
              expand_more
            </span>
          </button>

          {showMore && (
            <div className="absolute top-full left-0 mt-2 z-50 min-w-[180px] max-h-64 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1">
              {overflowGenres.map((g) => (
                <button
                  key={g}
                  onClick={() => {
                    onGenreChange(activeGenre === g ? null : g);
                    setShowMore(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    activeGenre === g
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
