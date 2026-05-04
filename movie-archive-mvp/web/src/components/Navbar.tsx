import type { User } from "../types";

interface NavbarProps {
  users: User[];
  onAddClick?: () => void;
  dark: boolean;
  onToggleDark: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onExport?: () => void;
  onImport?: () => void;
}

export default function Navbar({ users, onAddClick, dark, onToggleDark, searchQuery, onSearchChange, onExport, onImport }: NavbarProps) {
  return (
    <nav className="fixed top-0 z-50 w-full glass transition-all duration-300">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Single flex row: brand (flex-1) | actions (flex-shrink-0) */}
        <div className="flex items-center justify-between gap-3 h-16 sm:h-20">

          {/* Brand — flex-1 so it takes space but never overlaps actions */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <a className="flex items-center gap-3 group shrink-0" href="#">
              <img
                src="/carrotspopcorn.png"
                alt="Carrots and Popcorn"
                className="h-10 sm:h-12 w-auto drop-shadow-md"
              />
            </a>
            <h1 className="text-base sm:text-lg font-bold tracking-tight leading-tight hidden xs:block truncate">
              <span className="text-orange-500 carrots-text">Carrots</span>
              <span className="text-black dark:text-black"> and </span>
              <span className="popcorn-text">Popcorn</span>
            </h1>
          </div>

          {/* Right actions — flex-shrink-0 so they never compress or overlap brand */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Search — hidden on small screens */}
            <div className="hidden sm:flex max-w-xs w-full relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors text-[20px]">search</span>
              </div>
              <input
                className="block w-full pl-9 pr-3 py-2 border-none rounded-2xl bg-slate-100 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-slate-700 transition-all placeholder-slate-400 text-slate-900 dark:text-white"
                placeholder="Search movies…"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>

            {/* Add button */}
            <button
              type="button"
              onClick={onAddClick}
              className="nav-icon-btn flex items-center gap-1 px-3 sm:px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-primary to-secondary rounded-2xl shadow-glow hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span className="hidden sm:inline">Add</span>
            </button>

            {/* Export */}
            {onExport && (
              <button
                type="button"
                onClick={onExport}
                className="nav-icon-btn text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary hover:bg-primary/10 rounded-full transition-all"
                title="Export archive"
                aria-label="Export archive as JSON"
              >
                <span className="material-symbols-outlined text-[22px]">download</span>
              </button>
            )}

            {/* Import */}
            {onImport && (
              <button
                type="button"
                onClick={onImport}
                className="nav-icon-btn text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary hover:bg-primary/10 rounded-full transition-all"
                title="Import archive"
                aria-label="Import archive JSON"
              >
                <span className="material-symbols-outlined text-[22px]">upload</span>
              </button>
            )}

            {/* Dark mode toggle */}
            <button
              type="button"
              onClick={onToggleDark}
              className="nav-icon-btn text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary hover:bg-primary/10 rounded-full transition-all"
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              <span className="material-symbols-outlined text-[22px]">
                {dark ? "light_mode" : "dark_mode"}
              </span>
            </button>

            {/* Notifications */}
            <button
              className="nav-icon-btn text-slate-500 hover:text-primary hover:bg-primary/10 rounded-full transition-colors relative"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              <span className="absolute top-2 right-2 size-2 bg-secondary rounded-full border-2 border-white dark:border-slate-900" aria-hidden="true" />
            </button>

            {/* Avatar */}
            <div className="size-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 p-[2px] cursor-pointer hover:shadow-glow transition-shadow shrink-0">
              <div className="w-full h-full rounded-full bg-white overflow-hidden">
                <img
                  alt="User"
                  className="object-cover w-full h-full"
                  src={
                    users[0]
                      ? `https://picsum.photos/seed/user-${users[0].id}/80/80`
                      : "https://picsum.photos/seed/user/80/80"
                  }
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile search bar — full width below nav row */}
      <div className="sm:hidden px-4 pb-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
          </div>
          <input
            className="block w-full pl-9 pr-3 py-2 border-none rounded-2xl bg-slate-100 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-slate-700 transition-all placeholder-slate-400 text-slate-900 dark:text-white"
            placeholder="Search movies…"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
    </nav>
  );
}
