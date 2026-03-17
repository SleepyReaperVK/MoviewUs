import { HomePage } from "./pages";
import { useSunTheme } from "./hooks/useSunTheme";

export default function App() {
  const { dark, toggle } = useSunTheme();

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display min-h-screen flex flex-col overflow-x-hidden selection:bg-primary/20 selection:text-primary">
      {/* Bear background overlay */}
      <div className="bear-bg" aria-hidden="true" />
      <HomePage dark={dark} onToggleDark={toggle} />
    </div>
  );
}
