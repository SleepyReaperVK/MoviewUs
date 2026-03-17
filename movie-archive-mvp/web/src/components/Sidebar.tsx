export default function Sidebar() {
  return (
    <aside className="w-64 hidden lg:flex flex-col gap-8 py-8 sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pr-2">
      {/* Discover */}
      <div className="space-y-3">
        <h3 className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Discover</h3>
        <nav className="flex flex-col gap-1">
          <a
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-primary/10 to-transparent text-primary font-semibold border-l-4 border-primary shadow-sm"
            href="#"
          >
            <span className="material-symbols-outlined filled">explore</span>
            <span>Popular</span>
          </a>
          <a
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all group"
            href="#"
          >
            <span className="material-symbols-outlined group-hover:text-secondary transition-colors">calendar_month</span>
            <span>Now Playing</span>
          </a>
        </nav>
      </div>
    </aside>
  );
}
