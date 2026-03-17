import type { User } from "../types";

interface NavbarProps {
  users: User[];
  onAddClick?: () => void;
  dark: boolean;
  onToggleDark: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function Navbar({ users, onAddClick, dark, onToggleDark, searchQuery, onSearchChange }: NavbarProps) {
  return (
    <nav className="fixed top-0 z-50 w-full glass transition-all duration-300">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-22">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <a className="flex items-center gap-[23px] group" href="#">
              <img
                src="/carrotspopcorn.png"
                alt="Carrots and Popcorn"
                className="h-14 sm:h-16 w-auto drop-shadow-md relative top-[3vh]"
                style={{ transform: "scale3d(2, 2, 2)" }}
              />
              <h1 className="text-lg sm:text-xl font-bold tracking-tight leading-tight">
                <span className="text-orange-500 carrots-text">Carrots</span>
                <span className="text-black dark:text-black"> and </span>
                <span className="popcorn-text">Popcorn</span>
              </h1>
            </a>
          </div>

          {/* Search & profile */}
          <div className="flex items-center gap-4 sm:gap-6 flex-1 justify-end">
            <div className="hidden sm:flex max-w-md w-full relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">search</span>
              </div>
              <input
                className="block w-full pl-10 pr-3 py-2.5 border-none rounded-2xl bg-slate-100 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-slate-700 transition-all placeholder-slate-400 text-slate-900 dark:text-white"
                placeholder="Search movies, collections, users..."
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={onAddClick}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary to-secondary rounded-2xl shadow-glow hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add
            </button>

            {/* Light / Dark mode toggle */}
            <button
              type="button"
              onClick={onToggleDark}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary hover:bg-primary/10 rounded-full transition-all"
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              <span className="material-symbols-outlined text-[22px]">
                {dark ? "light_mode" : "dark_mode"}
              </span>
            </button>

            <div className="flex items-center gap-2">
              <button className="p-2 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-full transition-colors relative">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 size-2 bg-secondary rounded-full border-2 border-white" />
              </button>

              <div className="ml-2 size-9 sm:size-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 p-[2px] cursor-pointer hover:shadow-glow transition-shadow">
                <div className="w-full h-full rounded-full bg-white overflow-hidden relative" data-alt="User Avatar">
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
      </div>
    </nav>
  );
}
