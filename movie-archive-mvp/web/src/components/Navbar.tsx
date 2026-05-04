import { useRef, useState } from "react";
import type { User } from "../types";
import type { AlertPayload } from "../hooks/useAlert";
import { useDismissibleLayer } from "../hooks/useDismissibleLayer";

interface NavbarProps {
  users: User[];
  onAddClick?: () => void;
  dark: boolean;
  onToggleDark: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onExport?: () => void;
  onImport?: () => void;
  notifications: AlertPayload[];
  onDismissNotification: (index: number) => void;
}

export default function Navbar({
  users, onAddClick, dark, onToggleDark, searchQuery, onSearchChange,
  onExport, onImport, notifications, onDismissNotification,
}: NavbarProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useDismissibleLayer(profileMenuRef, isProfileMenuOpen, () => setIsProfileMenuOpen(false));
  useDismissibleLayer(notificationsRef, isNotificationsOpen, () => setIsNotificationsOpen(false));

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

          {/* Search & actions */}
          <div className="flex items-center gap-4 sm:gap-6 flex-1 justify-end">

            {/* Search — hidden on small screens */}
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

            {/* Add button */}
            <button
              type="button"
              onClick={onAddClick}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary to-secondary rounded-2xl shadow-glow hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add
            </button>

            {/* Dark mode toggle */}
            <button
              type="button"
              onClick={onToggleDark}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary hover:bg-primary/10 rounded-full transition-all"
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              <span className="material-symbols-outlined text-[22px]">
                {dark ? "light_mode" : "dark_mode"}
              </span>
            </button>

            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                data-testid="notifications-trigger"
                className="p-2 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-full transition-colors relative"
                aria-label="Open notifications"
                aria-haspopup="dialog"
                aria-expanded={isNotificationsOpen}
                aria-controls="notifications-panel"
                onClick={() => setIsNotificationsOpen((o) => !o)}
              >
                <span className="material-symbols-outlined text-[22px]">notifications</span>
                {notifications.length > 0 && (
                  <span
                    className="absolute top-2 right-2 size-2 bg-secondary rounded-full border-2 border-white dark:border-slate-900"
                    aria-hidden="true"
                  />
                )}
              </button>

              {isNotificationsOpen && (
                <div
                  id="notifications-panel"
                  data-testid="notifications-panel"
                  role="dialog"
                  aria-label="Notifications"
                  className="absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-24px)] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-lg"
                >
                  <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Notifications</h3>
                  {notifications.length > 0 ? (
                    <ul className="space-y-2">
                      {notifications.map((n, i) => (
                        <li key={i} className="flex items-start gap-2 rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{n.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.text}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onDismissNotification(i)}
                            aria-label="Dismiss notification"
                            className="shrink-0 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No notifications available.</p>
                  )}
                </div>
              )}
            </div>

            {/* Profile + dropdown */}
            <div className="flex items-center gap-2">
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  data-testid="profile-menu-trigger"
                  aria-label="Open profile menu"
                  aria-haspopup="menu"
                  aria-expanded={isProfileMenuOpen}
                  aria-controls="profile-menu"
                  onClick={() => setIsProfileMenuOpen((o) => !o)}
                  className="ml-2 size-9 sm:size-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 p-[2px] cursor-pointer hover:shadow-glow transition-shadow"
                >
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
                </button>

                {isProfileMenuOpen && (
                  <div
                    id="profile-menu"
                    data-testid="profile-menu"
                    role="menu"
                    className="absolute right-0 top-12 z-50 w-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 shadow-lg"
                  >
                    {onImport && (
                      <button
                        type="button"
                        role="menuitem"
                        data-testid="profile-menu-import"
                        onClick={() => { onImport(); setIsProfileMenuOpen(false); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">upload</span>
                        Import movies
                      </button>
                    )}
                    {onExport && (
                      <button
                        type="button"
                        role="menuitem"
                        data-testid="profile-menu-export"
                        onClick={() => { onExport(); setIsProfileMenuOpen(false); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        Export movies
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </nav>
  );
}
