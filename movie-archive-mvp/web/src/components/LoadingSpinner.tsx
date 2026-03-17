interface LoadingSpinnerProps {
  visible: boolean;
}

export default function LoadingSpinner({ visible }: LoadingSpinnerProps) {
  if (!visible) return null;

  return (
    <div className="flex justify-center items-center py-12 mt-8">
      <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading movies...</span>
      </div>
    </div>
  );
}
